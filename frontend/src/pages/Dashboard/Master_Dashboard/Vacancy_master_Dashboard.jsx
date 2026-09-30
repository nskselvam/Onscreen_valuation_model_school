import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import DataTable from 'react-data-table-component/dist/index.es.js'
import { useGetDistrictMasterDataQuery, useGetVacancyDataQuery } from '../../../redux-slice/vacancyApiSlice'
import * as XLSX from 'xlsx'

const Vacancy_master_Dashboard = () => {
    // Get user's district code from Redux state
    const { regulationInfo } = useSelector((state) => state.auth);
    const userDistrictCode = regulationInfo?.district || "00";
    
    // State for district filter
    const [selectedDistrict, setSelectedDistrict] = useState("ALL");
    const districtInitialized = useRef(false);
    
    // Determine which district to fetch data for
    // If user is admin (00), use selectedDistrict; otherwise use their district code
    const districtParam = userDistrictCode === "00" ? selectedDistrict : userDistrictCode;
 
    const { data: districtMasterData, isLoading: isDistrictMasterDataLoading, error: districtMasterDataError } = useGetDistrictMasterDataQuery();
    const { data: vacancyData, isLoading: isVacancyDataLoading, error: vacancyDataError } = useGetVacancyDataQuery(districtParam);
    
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
            return userDistrict?.DCODE || "ALL";
        }
        return "ALL";
    }, [districtMasterData, userDistrictCode]);

    // Update selected district when initial district changes
    useEffect(() => {
        if (!districtInitialized.current && initialDistrict !== "ALL") {
            setSelectedDistrict(initialDistrict);
            districtInitialized.current = true;
        }
    }, [initialDistrict]);

    // Define columns for DataTable
    const columns = [
        {
            name: 'S.No',
            selector: (row, index) => index + 1,
            sortable: true,
            width: '70px'
        },

        
          {
            name: 'Vacancy Type',
            selector: row => row.student_type,
            sortable: true,
            wrap: true,
            width: '200px'
        },

                  {
            name: 'Zone Name ',
            selector: row => row.Zone_Name,
            sortable: true,
            wrap: true,
            width: '200px'
        },

        {
            name: 'Category',
            selector: row => row.REM,
            sortable: true,
            wrap: true
        },
                {
            name: 'Gender',
            selector: row => row.REM1,
            sortable: true,
            wrap: true
        },
                        {
            name: 'Medium',
            selector: row => row.REM2,
            sortable: true,
            wrap: true
        },
                                {
            name: 'Physical Handicapped',
            selector: row => row.REM3,
            sortable: true,
            wrap: true
        },
        {
            name: 'Vacancy',
            selector: row => row.Vacancy,
            sortable: true,
            width: '100px'
        },
        {
            name: 'Filled Vacancy',
            selector: row => row.filledVacancy,
            sortable: true,
            width: '120px'
        },
    ];

    // Data is already filtered by backend based on districtParam, no need for frontend filtering
    const filteredData = useMemo(() => {
        return vacancyData || [];
    }, [vacancyData]);

    // Function to export data to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const exportData = filteredData.map((row, index) => ({
            'S.No': index + 1,
            'Vacancy Type': row.student_type || '',
            'Zone Name': row.Zone_Name || '',
            'Category': row.REM || '',
            'Gender': row.REM1 || '',
            'Medium': row.REM2 || '',
            'Physical Handicapped': row.REM3 || '',
            'Vacancy': row.Vacancy || 0,
            'Filled Vacancy': row.filledVacancy || 0
        }));

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Set column widths
        const columnWidths = [
            { wch: 8 },  // S.No
            { wch: 20 }, // Vacancy Type
            { wch: 20 }, // Zone Name
            { wch: 15 }, // Category
            { wch: 10 }, // Gender
            { wch: 15 }, // Medium
            { wch: 20 }, // Physical Handicapped
            { wch: 10 }, // Vacancy
            { wch: 15 }  // Filled Vacancy
        ];
        worksheet['!cols'] = columnWidths;

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Vacancy Data');

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 10);
        const districtName = selectedDistrict === "ALL" ? "All_Districts" : 
            districtOptions.find(d => d.DCODE === selectedDistrict)?.DNAME || selectedDistrict;
        const filename = `Vacancy_Master_${districtName}_${timestamp}.xlsx`;

        // Download file
        XLSX.writeFile(workbook, filename);
    };

    if (isDistrictMasterDataLoading || isVacancyDataLoading) {
        return <div className="text-center p-4">Loading...</div>;
    }

    if (districtMasterDataError || vacancyDataError) {
        return (
            <div className="alert alert-danger m-3">
                {districtMasterDataError && <p>District Master Error: {districtMasterDataError?.data?.message || 'Failed to load districts'}</p>}
                {vacancyDataError && <p>Vacancy Error: {vacancyDataError?.data?.message || 'Failed to load vacancy data'}</p>}
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">Vacancy Master Dashboard</h4>
                </div>
                <div className="card-body">
                    {/* District Filter */}
                    <div className="mb-3 row align-items-center">
                        <label className="col-sm-2 col-form-label">
                            <strong>Filter by District:</strong>
                        </label>
                        <div className="col-sm-4">
                            <select 
                                className="form-select"
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                disabled={userDistrictCode !== "00"}
                            >
                                {userDistrictCode === "00" && <option value="ALL">All Districts</option>}
                                {districtOptions.map((district) => (
                                    <option key={district.DCODE} value={district.DCODE}>
                                        {district.DNAME} ({district.DCODE})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-sm-4">
                            <span className="badge bg-info me-2">
                                Showing {filteredData.length} records
                            </span>
                            <button 
                                className="btn btn-success btn-sm"
                                onClick={exportToExcel}
                                disabled={filteredData.length === 0}
                            >
                                <i className="bi bi-file-earmark-excel me-1"></i>
                                Export to Excel
                            </button>
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
                            <p>No vacancy records available for the selected district.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Vacancy_master_Dashboard
