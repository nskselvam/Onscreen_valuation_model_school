import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import DataTable from 'react-data-table-component/dist/index.es.js'
import { useGetMasterDataQuery } from '../../../redux-slice/masterApiSlice'
import { useGetDistrictMasterDataQuery ,useDistrictSendDataMutation} from '../../../redux-slice/vacancyApiSlice'
import * as XLSX from 'xlsx'
import { toast } from 'react-toastify'

const Master_Data_Dashboard = () => {
    // Get user's district code from Redux state
    const { regulationInfo } = useSelector((state) => state.auth);
    const userDistrictCode = regulationInfo?.district || "00";
    
    const { data, isLoading, error, refetch } = useGetMasterDataQuery();
    const { data: districtMasterData, isLoading: isDistrictMasterDataLoading } = useGetDistrictMasterDataQuery();

    const [districtSendData] = useDistrictSendDataMutation();
    
    // Get unique district options
    const districtOptions = useMemo(() => {
        if (!districtMasterData) return [];
        
        // If user has access to all districts
        if (userDistrictCode === "00") {
            return districtMasterData;
        }
        
        // If user has specific district access
        return districtMasterData.filter(district => district.DCODE === userDistrictCode);
    }, [districtMasterData, userDistrictCode]);

    // Get initial district value based on user role
    const initialDistrict = useMemo(() => {
        if (userDistrictCode === "00") return "ALL";
        if (districtMasterData) {
            const userDistrict = districtMasterData.find(d => d.DCODE === userDistrictCode);
            return userDistrict?.DNAME || "ALL";
        }
        return "ALL";
    }, [districtMasterData, userDistrictCode]);
    
    const [searchText, setSearchText] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("ALL");
    const [selectedStudentStatus, setSelectedStudentStatus] = useState(1); // 1: Model School (default)
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [sendingData, setSendingData] = useState(false);
    const districtInitialized = useRef(false);

    // Community mapping
    const communityMap = {
        0: 'Others',
        1: 'SC',
        2: 'ST',
        3: 'MBC',
        4: 'BC',
        5: 'OC',
        6: 'SCA',
        7: 'BCM'
    };

    const getCommunityName = (code) => {
        return communityMap[code] || code;
    };

    // Gender mapping
    const genderMap = {
        0: 'Others',
        1: 'Male',
        2: 'Female'
    };

    const getGenderName = (code) => {
        return genderMap[code] || code;
    };

    // PSTM (Medium) mapping
    const pstmMap = {
        0: 'Others',
        1: 'Tamil',
        2: 'English'
    };

    const getPSTMName = (code) => {
        return pstmMap[code] || code;
    };

    // Handle individual row selection
    const handleRowSelect = (row) => {
        const rowId = row.Emis_No; // Use Emis_No as unique identifier
        const isSelected = selectedRows.some(selected => selected.Emis_No === rowId);
        if (isSelected) {
            setSelectedRows(selectedRows.filter(selected => selected.Emis_No !== rowId));
            setSelectAll(false);
        } else {
            setSelectedRows([...selectedRows, row]);
            // Check if all filtered items are now selected
            if (selectedRows.length + 1 === filteredData.length) {
                setSelectAll(true);
            }
        }
    };

    // Handle select all - only for filtered/visible data
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
            setSelectAll(false);
        } else {
            setSelectedRows([...filteredData]);
            setSelectAll(true);
        }
    };

    // Send selected data to backend
    const sendSelectedData = async () => {
        if (selectedRows.length === 0) {
            toast.warning('Please select at least one record');
            return;
        }

        setSendingData(true);
        console.log("Sending selected data to backend:", selectedRows);

        try {
            const response = await districtSendData(selectedRows).unwrap();
            toast.success(response?.message || 'Data sent successfully');   
            // Clear selections
            setSelectedRows([]);
            setSelectAll(false);
            // Refetch data to update the display immediately
            await refetch();
        } catch (error) {
            toast.error(error?.data?.message || 'Failed to send data');
        } finally {
            setSendingData(false);
        }
    };

    // Update selected district when initial district changes
    useEffect(() => {
        if (!districtInitialized.current && initialDistrict !== "ALL") {
            setSelectedDistrict(initialDistrict);
            districtInitialized.current = true;
        }
    }, [initialDistrict]);

    // Filter data based on student status, district and search
    // React Compiler will automatically memoize this
    let filteredData = [];
    if (data?.data) {
        let filtered = data.data;
        
        // Filter by Student Status
        if (selectedStudentStatus) {
            filtered = filtered.filter(item => 
                item.Student_Status === parseInt(selectedStudentStatus)
            );
        }
        
        // Filter by district (case-insensitive comparison)
        if (selectedDistrict !== "ALL") {
            filtered = filtered.filter(item => 
                item.district_name?.toUpperCase() === selectedDistrict.toUpperCase()
            );
        }
        
        // Filter by search text
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            filtered = filtered.filter(item => {
                return (
                    item.Emis_No?.toLowerCase().includes(searchLower) ||
                    item.udise_code?.toLowerCase().includes(searchLower) ||
                    item.district_name?.toLowerCase().includes(searchLower) ||
                    item.school_name?.toLowerCase().includes(searchLower) ||
                    item.name?.toLowerCase().includes(searchLower) ||
                    item.father_name?.toLowerCase().includes(searchLower) ||
                    item.Zone_Name_Jee?.toLowerCase().includes(searchLower) ||
                    item.Zone_Name_Neet?.toLowerCase().includes(searchLower)
                );
            });
        }
        
        filteredData = filtered;
    }

    // Define columns for DataTable
    const columns = [
        {
            name: (
                <input
                    type="checkbox"
                    checked={selectAll && filteredData.length > 0}
                    onChange={handleSelectAll}
                    disabled={filteredData.length === 0}
                />
            ),
            cell: (row) => (
                <input
                    type="checkbox"
                    checked={selectedRows.some(selected => selected.Emis_No === row.Emis_No)}
                    onChange={() => handleRowSelect(row)}
                />
            ),
            width: '60px',
            ignoreRowClick: true,
        },
        {
            name: 'S.No',
            selector: (row, index) => index + 1,
            sortable: true,
            width: '70px'
        },
        {
            name: 'EMIS No',
            selector: row => row.Emis_No,
            sortable: true,
            wrap: true,
            width: '120px'
        },
        {
            name: 'UDISE Code',
            selector: row => row.udise_code,
            sortable: true,
            wrap: true,
            width: '130px'
        },
        {
            name: 'District',
            selector: row => row.district_name,
            sortable: true,
            wrap: true,
            width: '120px'
        },
        {
            name: 'School Name',
            selector: row => row.school_name,
            sortable: true,
            wrap: true,
            width: '200px'
        },
        {
            name: 'Student Name',
            selector: row => row.name,
            sortable: true,
            wrap: true,
            width: '150px'
        },
        {
            name: 'Father Name',
            selector: row => row.father_name,
            sortable: true,
            wrap: true,
            width: '150px'
        },
        {
            name: 'Community',
            selector: row => getCommunityName(row.com),
            sortable: true,
            width: '100px'
        },
        {
            name: 'Gender',
            selector: row => getGenderName(row.sex),
            sortable: true,
            width: '80px'
        },
        {
            name: 'PSTM',
            selector: row => getPSTMName(row.pstm),
            sortable: true,
            width: '80px'
        },
        {
            name: 'DOB',
            selector: row => row.dob,
            sortable: true,
            width: '120px'
        },
        {
            name: 'Disability',
            selector: row => row.ph === 1 ? (row.Disability_Name || 'Yes') : 'No',
            sortable: true,
            wrap: true,
            width: '150px'
        },
        {
            name: 'JEE Zone',
            selector: row => row.Zone_Name_Jee,
            sortable: true,
            wrap: true,
            width: '120px'
        },
        {
            name: 'NEET Zone',
            selector: row => row.Zone_Name_Neet,
            sortable: true,
            wrap: true,
            width: '120px'
        },
        {
            name: 'Phone Number',
            selector: row => row.PHONE_NUMBER || '-',
            sortable: true,
            wrap: true,
            width: '130px'
        },
        {
            name: 'House Address',
            selector: row => row.HOUSE_ADDRESS || '-',
            sortable: true,
            wrap: true,
            width: '200px'
        },
    ];

    // Function to export data to Excel
    const exportToExcel = () => {
        const exportData = filteredData.map((row, index) => ({
            'S.No': index + 1,
            'EMIS No': row.Emis_No || '',
            'UDISE Code': row.udise_code || '',
            'District': row.district_name || '',
            'School Name': row.school_name || '',
            'Student Name': row.name || '',
            'Father Name': row.father_name || '',
            'Community': getCommunityName(row.com),
            'Gender': getGenderName(row.sex),
            'PSTM': getPSTMName(row.pstm),
            'DOB': row.dob || '',
            'Disability': row.ph === 1 ? (row.Disability_Name || 'Yes') : 'No',
            'JEE Zone': row.Zone_Name_Jee || '',
            'NEET Zone': row.Zone_Name_Neet || '',
            'Phone Number': row.PHONE_NUMBER || '',
            'House Address': row.HOUSE_ADDRESS || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        const columnWidths = [
            { wch: 8 },   // S.No
            { wch: 15 },  // EMIS No
            { wch: 15 },  // UDISE Code
            { wch: 15 },  // District
            { wch: 25 },  // School Name
            { wch: 20 },  // Student Name
            { wch: 20 },  // Father Name
            { wch: 12 },  // Community
            { wch: 10 },  // Gender
            { wch: 8 },   // PSTM
            { wch: 15 },  // DOB
            { wch: 15 },  // Disability
            { wch: 15 },  // JEE Zone
            { wch: 15 },  // NEET Zone
            { wch: 15 },  // Phone Number
            { wch: 30 }   // House Address
        ];
        worksheet['!cols'] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Data');

        const timestamp = new Date().toISOString().slice(0, 10);
        const districtName = selectedDistrict === "ALL" ? "All_Districts" : selectedDistrict.replace(/\s+/g, '_');
        const filename = `Master_Data_${districtName}_${timestamp}.xlsx`;

        XLSX.writeFile(workbook, filename);
    };

    if (isLoading || isDistrictMasterDataLoading) {
        return <div className="text-center p-4">Loading...</div>;
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3">
                <p>Error: {error?.data?.message || 'Failed to load master data'}</p>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">Master Data Dashboard</h4>
                </div>
                <div className="card-body">
                    {/* Student Status and Action Buttons in Same Row */}
                    <div className="mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0" style={{ whiteSpace: 'nowrap' }}>
                                <strong>Student Status:</strong>
                            </label>
                            <div className="btn-group" role="group">
                                <button
                                    type="button"
                                    className={`btn ${selectedStudentStatus === 1 ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => {
                                        setSelectedStudentStatus(1);
                                        setSelectedRows([]);
                                        setSelectAll(false);
                                    }}
                                    style={{
                                        fontWeight: selectedStudentStatus === 1 ? '600' : '500',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <i className="bi bi-building me-2"></i>
                                    Model School
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${selectedStudentStatus === 2 ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => {
                                        setSelectedStudentStatus(2);
                                        setSelectedRows([]);
                                        setSelectAll(false);
                                    }}
                                    style={{
                                        fontWeight: selectedStudentStatus === 2 ? '600' : '500',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <i className="bi bi-door-open me-2"></i>
                                    Government School
                                </button>
                            </div>
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                            {selectedRows.length > 0 && (
                                <span className="badge bg-warning text-dark py-2 px-3 fs-6 fw-bold">
                                    {selectedRows.length} selected
                                </span>
                            )}
                            <button 
                                className="btn shadow-lg"
                                onClick={sendSelectedData}
                                disabled={selectedRows.length === 0 || sendingData}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: '600',
                                    fontSize: '15px',
                                    padding: '10px 24px',
                                    borderRadius: '8px',
                                    transition: 'all 0.3s ease',
                                    opacity: selectedRows.length === 0 || sendingData ? '0.6' : '1',
                                    cursor: selectedRows.length === 0 || sendingData ? 'not-allowed' : 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedRows.length > 0 && !sendingData) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.5)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                                }}
                            >
                                {sendingData ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-patch-check-fill me-2" style={{ fontSize: '16px' }}></i>
                                        Certificate Verification
                                    </>
                                )}
                            </button>
                            <button 
                                className="btn btn-success"
                                onClick={exportToExcel}
                                disabled={filteredData.length === 0}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '15px',
                                    fontWeight: '500',
                                    borderRadius: '8px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                Export to Excel
                            </button>
                        </div>
                    </div>

                    {/* District Filter and Search in Same Row */}
                    <div className="mb-3 d-flex flex-wrap align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0" style={{ whiteSpace: 'nowrap' }}>
                                <strong>District:</strong>
                            </label>
                            <select 
                                className="form-select"
                                style={{ minWidth: '200px' }}
                                value={selectedDistrict}
                                onChange={(e) => {
                                    setSelectedDistrict(e.target.value);
                                    setSelectedRows([]);
                                    setSelectAll(false);
                                }}
                                disabled={userDistrictCode !== "00"}
                            >
                                {userDistrictCode === "00" && <option value="ALL">All Districts</option>}
                                {districtOptions.map((district) => (
                                    <option key={district.DCODE} value={district.DNAME}>
                                        {district.DNAME} ({district.DCODE})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-grow-1" style={{ maxWidth: '500px' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by EMIS, UDISE, School, Student Name..."
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    setSelectedRows([]);
                                    setSelectAll(false);
                                }}
                            />
                        </div>
                    </div>

                    {/* DataTable */}
                    {filteredData.length > 0 ? (
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 25, 50, 100]}
                            highlightOnHover
                            striped
                            responsive
                            dense
                            fixedHeader
                            fixedHeaderScrollHeight="500px"
                        />
                    ) : (
                        <div className="alert alert-warning text-center">
                            <h5>No Data Found</h5>
                            <p>No records available{searchText ? ' matching your search' : ''}.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Master_Data_Dashboard
