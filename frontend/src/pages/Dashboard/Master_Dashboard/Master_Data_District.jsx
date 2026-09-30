import React, { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import DataTable from 'react-data-table-component/dist/index.es.js'
import { useGetDistrictSelectedDataQuery, useUpdateDistrictDataMutation, useUpdateCertificateVerfiedStatusMutation } from '../../../redux-slice/vacancyApiSlice'
import * as XLSX from 'xlsx'
import { toast } from 'react-toastify'
import { Modal, Button, Form } from 'react-bootstrap'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Candidate Preference mapping (defined outside component to avoid initialization issues)
const candidateOptionMap = {
    0: 'Not Selected',
    1: 'JEE',
    2: 'NEET'
};

const Master_Data_District = () => {

    const userInfo = useSelector((state) => state.auth?.userInfo);
    const userDistrictCode = userInfo?.D_Code;

    console.log('District Code for selected data:', userDistrictCode, 'Full User Info:', userInfo);

    const { data, isLoading, error, refetch } = useGetDistrictSelectedDataQuery(
        userDistrictCode ? { Centre_Code: userDistrictCode } : undefined,
        { skip: !userDistrictCode }
    );
    const [updateDistrictData, { isLoading: isUpdating }] = useUpdateDistrictDataMutation();
    const [updateCertificateVerifiedStatus] = useUpdateCertificateVerfiedStatusMutation();

    console.log('Fetched District Data:', data);
    
    const [searchText, setSearchText] = useState("");
    const [selectedStudentStatus, setSelectedStudentStatus] = useState(1); // 1: Model School (default)
    const [showModal, setShowModal] = useState(false);
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const [showPrintConfirmModal, setShowPrintConfirmModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [rowToPrint, setRowToPrint] = useState(null);
    const [formData, setFormData] = useState({});
    const [remarks, setRemarks] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    
    // Initialize preferences dynamically based on candidateOptionMap
    const initializePreferences = () => {
        const prefs = {};
        const count = Object.keys(candidateOptionMap).filter(key => key !== '0').length;
        for (let i = 1; i <= count; i++) {
            prefs[`preference_${i}`] = null;
        }
        return prefs;
    };
    
    const [candidatePreferences, setCandidatePreferences] = useState(initializePreferences());
    const [candidateStatus, setCandidateStatus] = useState(0); // Default to Select Status
    const [uploadedFiles, setUploadedFiles] = useState({
        birthCertificate: null,
        communityCertificate: null,
        aadharCard: null,
        otherCertificate: null
    });

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

    // Get number of preferences dynamically (excluding 'Not Selected')
    const getPreferenceCount = () => {
        return Object.keys(candidateOptionMap).filter(key => key !== '0').length;
    };

    // Handle opening modal with selected record
    const handleEditClick = (row) => {
        setSelectedRecord(row);
        setFormData({
            Emis_No: row.Emis_No || '',
            udise_code: row.udise_code || '',
            district_name: row.district_name || '',
            school_name: row.school_name || '',
            name: row.name || '',
            father_name: row.father_name || '',
            com: row.com || 0,
            sex: row.sex || 0,
            pstm: row.pstm || 0,
            dob: row.dob || '',
            Zone_Name_Jee: row.Zone_Name_Jee || '',
            Zone_Name_Neet: row.Zone_Name_Neet || '',
            ph: row.ph || 0,
            Disability_Name: row.Disability_Name || 'None'
        });
        setCandidateStatus(row.candidate_status !== undefined && row.candidate_status !== null ? row.candidate_status : 0);
        // Load preferences dynamically
        const loadedPrefs = {};
        const count = Object.keys(candidateOptionMap).filter(key => key !== '0').length;
        for (let i = 1; i <= count; i++) {
            loadedPrefs[`preference_${i}`] = row[`preference_${i}`] || null;
        }
        setCandidatePreferences(loadedPrefs);
        setRemarks(row.remarks || '');
        setShowModal(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRecord(null);
        setFormData({});
        setCandidateStatus(0);
        setCandidatePreferences(initializePreferences());
        setUploadedFiles({
            birthCertificate: null,
            communityCertificate: null,
            aadharCard: null,
            otherCertificate: null
        });
        setRemarks("");
        setValidationErrors({});
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Handle preference selection with combo box
    const handlePreferenceChange = (preferenceNum, examType) => {
        // Check if the same option is already selected in any other preference
        const isAlreadySelected = Object.entries(candidatePreferences).some(
            ([key, value]) => key !== `preference_${preferenceNum}` && value === examType && examType !== '' && examType !== null
        );
        
        if (isAlreadySelected) {
            toast.warning(`${examType} is already selected in another preference. Please choose a different option.`);
            return;
        }
        
        setCandidatePreferences(prev => ({
            ...prev,
            [`preference_${preferenceNum}`]: examType === '' ? null : examType
        }));
        // Clear validation error
        if (validationErrors.preferences) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.preferences;
                return newErrors;
            });
        }
    };

    // Handle file upload
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setUploadedFiles(prev => ({
                ...prev,
                [name]: files[0]
            }));
            
            // Clear validation error for this file field
            if (validationErrors[name]) {
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        }
    };

    // Validate form data
    const validateForm = () => {
        const errors = {};
        
        // Validate required text fields
        if (!formData.name || formData.name.trim() === '') {
            errors.name = 'Student name is required';
        }
        if (!formData.father_name || formData.father_name.trim() === '') {
            errors.father_name = 'Father name is required';
        }
        
        // Validate community
        if (!formData.com || parseInt(formData.com) === 0) {
            errors.com = 'Community is required';
        }
        
        // Validate gender
        if (!formData.sex || parseInt(formData.sex) === 0) {
            errors.sex = 'Gender is required';
        }
        
        // Validate medium
        if (!formData.pstm || parseInt(formData.pstm) === 0) {
            errors.pstm = 'Medium is required';
        }
        
        // Validate date of birth
        if (!formData.dob || formData.dob.trim() === '') {
            errors.dob = 'Date of Birth is required';
        }
        
        // Validate disability status
        if (formData.ph === undefined || formData.ph === null || formData.ph === '') {
            errors.ph = 'Disability status is required';
        }
        
        // Validate disability name if PH is selected
        if (parseInt(formData.ph) === 1 && (!formData.Disability_Name || formData.Disability_Name.trim() === '' || formData.Disability_Name === 'None')) {
            errors.Disability_Name = 'Disability name is required when disability status is Yes';
        }
        
        // Validate candidate preferences - only required if candidate is Present
        if (candidateStatus === 1) {
            // Preference 1 is mandatory
            if (!candidatePreferences.preference_1 || candidatePreferences.preference_1 === '') {
                errors.preferences = 'Preference 1 is mandatory when candidate is Present';
            } else {
                // Check for sequential preference filling (no gaps)
                const prefCount = getPreferenceCount();
                let foundEmpty = false;
                for (let i = 1; i <= prefCount; i++) {
                    const currentPref = candidatePreferences[`preference_${i}`];
                    if (!currentPref || currentPref === '') {
                        foundEmpty = true;
                    } else if (foundEmpty) {
                        // Found a filled preference after an empty one
                        errors.preferences = `Please fill preferences sequentially. Preference ${i} cannot be filled before Preference ${i - 1}`;
                        break;
                    }
                }
            }
        }
        
        // Validate file uploads
        if (!uploadedFiles.birthCertificate && !formData.birth_certificate_path) {
            errors.birthCertificate = 'Birth certificate is required';
        }
        if (!uploadedFiles.communityCertificate && !formData.community_certificate_path) {
            errors.communityCertificate = 'Community certificate is required';
        }
        // Aadhar card is optional - no validation required
        
        return errors;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            toast.error('Please fill in all required fields');
            return;
        }
        
        try {
            const formDataToSend = new FormData();
            
            // Append text fields
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            
            // Append candidate status
            formDataToSend.append('candidate_status', candidateStatus);
            
            // Append preferences - send values if Present, send empty strings to clear if not Present
            const prefCount = Object.keys(candidateOptionMap).filter(key => key !== '0').length;
            for (let i = 1; i <= prefCount; i++) {
                if (candidateStatus === 1) {
                    formDataToSend.append(`preference_${i}`, candidatePreferences[`preference_${i}`] || '');
                } else {
                    // Send empty string to clear old preference data in backend
                    formDataToSend.append(`preference_${i}`, '');
                }
            }
            
            // Append remarks
            formDataToSend.append('remarks', remarks);
            
            // Append files
            if (uploadedFiles.birthCertificate) {
                formDataToSend.append('birthCertificate', uploadedFiles.birthCertificate);
            }
            if (uploadedFiles.communityCertificate) {
                formDataToSend.append('communityCertificate', uploadedFiles.communityCertificate);
            }
            if (uploadedFiles.aadharCard) {
                formDataToSend.append('aadharCard', uploadedFiles.aadharCard);
            }
            if (uploadedFiles.otherCertificate) {
                formDataToSend.append('otherCertificate', uploadedFiles.otherCertificate);
            }
            
            const response = await updateDistrictData(formDataToSend).unwrap();
            toast.success(response?.message || 'Data updated successfully');
            handleCloseModal();
        } catch (error) {
            toast.error(error?.data?.message || 'Failed to update data');
        }
    };

    // Filter data based on student status and search
    const filteredData = useMemo(() => {
        if (!data?.data) return [];
        
        let filtered = data.data;
        
        // Filter out records where statFlg is 'Y' (already printed)
        filtered = filtered.filter(item => item.statFlg !== 'Y');
        
        // Filter by Student Status
        if (selectedStudentStatus) {
            filtered = filtered.filter(item => 
                item.Student_Status === parseInt(selectedStudentStatus)
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
        
        return filtered;
    }, [data, selectedStudentStatus, searchText]);

    // Define columns for DataTable
    const columns = [
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
        {
            name: 'Candidate Status',
            selector: row => {
                if (!row.candidate_status || row.candidate_status === 0) return '';
                const statusMap = {
                    1: 'Present',
                    2: 'Not Eligible',
                    3: 'Not Willing',
                    4: 'Absent'
                };
                return statusMap[row.candidate_status] || '';
            },
            sortable: true,
            wrap: true,
            width: '130px',
            cell: (row) => {
                if (!row.candidate_status || row.candidate_status === 0) {
                    return <span style={{ color: '#9ca3af' }}>-</span>;
                }
                const statusMap = {
                    1: { label: 'Present', bg: '#dcfce7', color: '#15803d' },
                    2: { label: 'Not Eligible', bg: '#fef3c7', color: '#a16207' },
                    3: { label: 'Not Willing', bg: '#fee2e2', color: '#b91c1c' },
                    4: { label: 'Absent', bg: '#e5e7eb', color: '#4b5563' }
                };
                const status = statusMap[row.candidate_status];
                if (!status) return <span style={{ color: '#9ca3af' }}>-</span>;
                return (
                    <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        backgroundColor: status.bg,
                        color: status.color,
                        display: 'inline-block'
                    }}>
                        {status.label}
                    </span>
                );
            }
        },
        {
            name: 'Candidate Preferences',
            selector: row => {
                // Only show preferences if candidate status is Present (1)
                if (row.candidate_status !== 1) {
                    return '-';
                }
                const prefs = [];
                for (let i = 1; i <= 6; i++) {
                    if (row[`preference_${i}`]) {
                        prefs.push(row[`preference_${i}`]);
                    }
                }
                return prefs.join(', ') || '-';
            },
            sortable: true,
            wrap: true,
            width: '200px',
            cell: (row) => {
                // Only show preferences if candidate status is Present (1)
                if (row.candidate_status !== 1) {
                    return <span style={{ color: '#9ca3af' }}>-</span>;
                }
                const prefs = [];
                for (let i = 1; i <= 6; i++) {
                    if (row[`preference_${i}`]) {
                        prefs.push(row[`preference_${i}`]);
                    }
                }
                if (prefs.length === 0) {
                    return <span style={{ color: '#9ca3af' }}>-</span>;
                }
                return (
                    <div style={{ 
                        padding: '4px 0',
                        fontSize: '0.85rem',
                        lineHeight: '1.4'
                    }}>
                        {prefs.map((pref, index) => (
                            <div key={index} style={{ marginBottom: '2px' }}>
                                <span style={{
                                    fontWeight: '600',
                                    color: '#4a5568',
                                    marginRight: '4px'
                                }}>{index + 1}.</span>
                                <span style={{ color: '#6b7280' }}>{pref}</span>
                            </div>
                        ))}
                    </div>
                );
            }
        },
        {
            name: 'Action',
            cell: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        variant="primary"
                        onClick={() => handleEditClick(row)}
                        title="Edit Candidate"
                        style={{
                            padding: '5px 5px',
                            fontSize: '10px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <i className="bi bi-pencil-square"></i>
                        <span>Edit</span>
                    </Button>
                    {row.candidate_status > 0 && (
                        <Button
                            variant="danger"
                            onClick={() => handlePrintClick(row)}
                            title="Print Candidate Card"
                            style={{
                                padding: '5px 5px',
                                fontSize: '10px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <i className="bi bi-printer"></i>
                            <span>Print</span>
                        </Button>
                    )}
                </div>
            ),
            width: '130px',
            ignoreRowClick: true,
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
            'House Address': row.HOUSE_ADDRESS || '',
            'Candidate Status': (() => {
                const statusMap = { 1: 'Present', 2: 'Not Eligible', 3: 'Not Willing', 4: 'Absent' };
                return statusMap[row.candidate_status] || '-';
            })(),
            'Candidate Preferences': (() => {
                // Only show preferences if candidate status is Present (1)
                if (row.candidate_status !== 1) {
                    return '-';
                }
                const prefs = [];
                for (let i = 1; i <= 6; i++) {
                    if (row[`preference_${i}`]) {
                        prefs.push(`${i}. ${row[`preference_${i}`]}`);
                    }
                }
                return prefs.join(', ') || '-';
            })()
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
            { wch: 30 },  // House Address
            { wch: 18 },  // Candidate Status
            { wch: 35 }   // Candidate Preferences
        ];
        worksheet['!cols'] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'District Verified Data');

        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `District_Verified_Data_${timestamp}.xlsx`;

        XLSX.writeFile(workbook, filename);
    };

    // Handle print button click - show confirmation modal
    const handlePrintClick = (row) => {
        setRowToPrint(row);
        setShowPrintConfirmModal(true);
    };

    // Proceed with PDF generation after confirmation
    const proceedWithPrint = async () => {
        setShowPrintConfirmModal(false);
        if (rowToPrint) {
            await generateSingleCandidatePDF(rowToPrint);
            setRowToPrint(null);
        }
    };

    // Generate PDF for a single candidate (2 cards per page - landscape A4)
    const generateSingleCandidatePDF = async (row) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = 210; // A4 portrait width
        const pageHeight = 297; // A4 portrait height
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);

        // Get candidate preferences
        const prefs = [];
        for (let i = 1; i <= 6; i++) {
            if (row[`preference_${i}`]) {
                prefs.push(`${i}. ${row[`preference_${i}`]}`);
            }
        }
        const preferencesText = prefs.length > 0 ? prefs.join(', ') : 'Not Selected';

        // Get candidate status
        const statusMap = { 1: 'Present', 2: 'Not Eligible', 3: 'Not Willing', 4: 'Absent' };
        const statusText = statusMap[row.candidate_status] || 'Not Selected';

        let yPos = 25;
        
        // Title/Heading
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('CANDIDATE INFORMATION', pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 15;
        
        // Draw outer border
        doc.setLineWidth(0.8);
        doc.rect(margin, yPos - 5, contentWidth, 200);
        
        yPos += 10;
        
        // Content
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        // EMIS No
        doc.setFont('helvetica', 'bold');
        doc.text('EMIS No:', margin + 10, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(row.Emis_No || '', margin + 60, yPos);
        yPos += 12;
        
        // Student Name
        doc.setFont('helvetica', 'bold');
        doc.text('Student Name:', margin + 10, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(row.name || '', margin + 60, yPos);
        yPos += 12;
        
        // Father Name
        doc.setFont('helvetica', 'bold');
        doc.text('Father Name:', margin + 10, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(row.father_name || '', margin + 60, yPos);
        yPos += 12;
        
        // DOB
        doc.setFont('helvetica', 'bold');
        doc.text('Date of Birth:', margin + 10, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(row.dob || '', margin + 60, yPos);
        yPos += 12;
        
        // Community
        doc.setFont('helvetica', 'bold');
        doc.text('Community:', margin + 10, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(getCommunityName(row.com), margin + 60, yPos);
        yPos += 12;
        
        // Gender
        doc.setFont('helvetica', 'bold');
        doc.text('Gender:', margin + 10, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(getGenderName(row.sex), margin + 60, yPos);
        yPos += 12;
        
        // School Name
        doc.setFont('helvetica', 'bold');
        doc.text('School:', margin + 10, yPos);
        doc.setFont('helvetica', 'normal');
        const schoolText = row.school_name || '';
        const schoolLines = doc.splitTextToSize(schoolText, contentWidth - 70);
        doc.text(schoolLines, margin + 60, yPos);
        yPos += (schoolLines.length * 6) + 12;
        
        // Candidate Status
        doc.setFont('helvetica', 'bold');
        doc.text('Candidate Status:', margin + 10, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(statusText, margin + 60, yPos);
        yPos += 15;
        
        // Candidate Preferences
        doc.setFont('helvetica', 'bold');
        doc.text('Preferences:', margin + 10, yPos);
        doc.setFont('helvetica', 'normal');
        const prefLines = doc.splitTextToSize(preferencesText, contentWidth - 70);
        doc.text(prefLines, margin + 60, yPos);
        
        // Signature Section
        yPos = 240; // Fixed position for signatures
        
        // Draw signature lines
        doc.setLineWidth(0.3);
        
        // Candidate Signature (left side)
        const leftLineStart = margin + 10;
        const leftLineEnd = margin + 70;
        const leftCenter = leftLineStart + (leftLineEnd - leftLineStart) / 2;
        doc.line(leftLineStart, yPos - 10, leftLineEnd, yPos - 10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Candidate Signature', leftCenter, yPos, { align: 'center' });
        
        // Head Master Signature (right side)
        const rightLineStart = pageWidth - margin - 70;
        const rightLineEnd = pageWidth - margin - 10;
        const rightCenter = rightLineStart + (rightLineEnd - rightLineStart) / 2;
        doc.line(rightLineStart, yPos - 10, rightLineEnd, yPos - 10);
        doc.text('Head Master Signature', rightCenter, yPos, { align: 'center' });

        const filename = `Candidate_${row.Emis_No}_${row.name.replace(/\s+/g, '_')}.pdf`;
        doc.save(filename);
        
        // Update statFlg to 'Y' after PDF generation
        try {
            await updateCertificateVerifiedStatus({
                Emis_No: row.Emis_No,
                udise_code: row.udise_code
            }).unwrap();
            
            toast.success(`PDF generated for ${row.name}!`);
            
            // Refetch data to update the table
            await refetch();
        } catch (error) {
            console.error('Error updating certificate verification status:', error);
            toast.warning(`PDF generated but failed to update status: ${error?.data?.message || 'Unknown error'}`);
        }
    };

    // Generate PDF with duplicate content (2 cards per page - landscape A4) - for all candidates
    const generatePDF = () => {
        if (filteredData.length === 0) {
            toast.warning('No data available to generate PDF');
            return;
        }

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = 297; // A4 landscape width
        const pageHeight = 210; // A4 landscape height
        const cardWidth = pageWidth / 2; // Split page into two equal parts
        const margin = 10;
        const contentWidth = cardWidth - (margin * 2);

        filteredData.forEach((row, index) => {
            // Add new page for each record
            if (index > 0) {
                doc.addPage();
            }

            // Get candidate preferences
            const prefs = [];
            for (let i = 1; i <= 6; i++) {
                if (row[`preference_${i}`]) {
                    prefs.push(`${i}. ${row[`preference_${i}`]}`);
                }
            }
            const preferencesText = prefs.length > 0 ? prefs.join(', ') : 'Not Selected';

            // Get candidate status
            const statusMap = { 1: 'Present', 2: 'Not Eligible', 3: 'Not Willing', 4: 'Absent' };
            const statusText = statusMap[row.candidate_status] || 'Not Selected';

            // Function to draw card content
            const drawCard = (xOffset) => {
                let yPos = 20;
                
                // Title/Heading
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('CANDIDATE INFORMATION', xOffset + margin + (contentWidth / 2), yPos, { align: 'center' });
                
                yPos += 15;
                
                // Draw border
                doc.setLineWidth(0.5);
                doc.rect(xOffset + margin, yPos - 5, contentWidth, 130);
                
                // Content
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                
                // EMIS No
                doc.setFont('helvetica', 'bold');
                doc.text('EMIS No:', xOffset + margin + 5, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(row.Emis_No || '', xOffset + margin + 50, yPos);
                yPos += 8;
                
                // Student Name
                doc.setFont('helvetica', 'bold');
                doc.text('Student Name:', xOffset + margin + 5, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(row.name || '', xOffset + margin + 50, yPos);
                yPos += 8;
                
                // Father Name
                doc.setFont('helvetica', 'bold');
                doc.text('Father Name:', xOffset + margin + 5, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(row.father_name || '', xOffset + margin + 50, yPos);
                yPos += 8;
                
                // DOB
                doc.setFont('helvetica', 'bold');
                doc.text('Date of Birth:', xOffset + margin + 5, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(row.dob || '', xOffset + margin + 50, yPos);
                yPos += 8;
                
                // Community
                doc.setFont('helvetica', 'bold');
                doc.text('Community:', xOffset + margin + 5, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(getCommunityName(row.com), xOffset + margin + 50, yPos);
                yPos += 8;
                
                // School Name
                doc.setFont('helvetica', 'bold');
                doc.text('School:', xOffset + margin + 5, yPos);
                doc.setFont('helvetica', 'normal');
                const schoolText = row.school_name || '';
                const schoolLines = doc.splitTextToSize(schoolText, contentWidth - 40);
                doc.text(schoolLines, xOffset + margin + 50, yPos);
                yPos += (schoolLines.length * 5) + 8;
                
                // Candidate Status
                doc.setFont('helvetica', 'bold');
                doc.text('Candidate Status:', xOffset + margin + 5, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(statusText, xOffset + margin + 50, yPos);
                yPos += 10;
                
                // Candidate Preferences
                doc.setFont('helvetica', 'bold');
                doc.text('Preferences:', xOffset + margin + 5, yPos);
                doc.setFont('helvetica', 'normal');
                const prefLines = doc.splitTextToSize(preferencesText, contentWidth - 40);
                doc.text(prefLines, xOffset + margin + 50, yPos);
                
                // Signature Section
                yPos = 155; // Fixed position for signatures
                
                // Candidate Signature
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('Candidate Signature', xOffset + margin + 15, yPos);
                // Signature line
                doc.setLineWidth(0.3);
                doc.line(xOffset + margin + 10, yPos - 15, xOffset + margin + 50, yPos - 15);
                
                // Head Master Signature
                doc.text('Head Master Signature', xOffset + margin + contentWidth - 50, yPos);
                // Signature line
                doc.line(xOffset + margin + contentWidth - 55, yPos - 15, xOffset + margin + contentWidth - 15, yPos - 15);
            };

            // Draw left card (first copy)
            drawCard(0);
            
            // Draw vertical line in the middle
            doc.setLineWidth(0.3);
            doc.setLineDash([2, 2]);
            doc.line(pageWidth / 2, 10, pageWidth / 2, pageHeight - 10);
            doc.setLineDash([]);
            
            // Draw right card (second copy - duplicate)
            drawCard(pageWidth / 2);
        });

        const timestamp = new Date().toISOString().slice(0, 10);
        doc.save(`Candidate_Cards_${timestamp}.pdf`);
        toast.success('PDF generated successfully!');
    };

    if (isLoading) {
        return <div className="text-center p-4">Loading...</div>;
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3">
                <p>Error: {error?.data?.message || 'Failed to load district verified data'}</p>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="card">
                <div className="card-header bg-success text-white">
                    <h4 className="mb-0">District Verified Data</h4>
                </div>
                <div className="card-body">
                    {/* Student Status Filter and Actions */}
                    <div className="mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0" style={{ whiteSpace: 'nowrap' }}>
                                <strong>Student Status:</strong>
                            </label>
                            <div className="btn-group" role="group">
                                <button
                                    type="button"
                                    className={`btn ${selectedStudentStatus === 1 ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setSelectedStudentStatus(1)}
                                    style={{
                                        fontWeight: selectedStudentStatus === 1 ? '600' : '500',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Model School
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${selectedStudentStatus === 2 ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setSelectedStudentStatus(2)}
                                    style={{
                                        fontWeight: selectedStudentStatus === 2 ? '600' : '500',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Government School
                                </button>
                            </div>
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="badge bg-info text-dark py-2 px-3 fs-6 fw-bold">
                                Total: {filteredData.length} records
                            </span>
                        {/* <button 
                            className="btn btn-danger"
                            onClick={generatePDF}
                            disabled={filteredData.length === 0}
                            style={{
                                padding: '10px 20px',
                                fontSize: '15px',
                                fontWeight: '500',
                                borderRadius: '8px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <i className="bi bi-file-earmark-pdf me-2"></i>
                            Generate PDF Cards
                        </button> */}
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

                    {/* Search */}
                    <div className="mb-3 row">
                        <div className="col-md-6">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by EMIS, UDISE, School, Student Name..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
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
                            <p>No verified records available{searchText ? ' matching your search' : ''}.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <Modal 
                show={showModal} 
                onHide={handleCloseModal} 
                size="xl" 
                centered
                backdrop="static"
                style={{ zIndex: 1050 }}
            >
                <Modal.Header 
                    closeButton 
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderBottom: 'none',
                        padding: '25px 35px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    className="border-0"
                >
                    <Modal.Title style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                        <i className="bi bi-pencil-square me-3" style={{ fontSize: '1.6rem' }}></i>
                        Update Student Record
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body style={{ 
                        padding: '35px 40px', 
                        backgroundColor: '#f0f2f5',
                        maxHeight: '75vh',
                        overflowY: 'auto'
                    }}>
                        {/* Personal Information Section */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '25px',
                            marginBottom: '25px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            border: '1px solid #e3e6f0'
                        }}>
                            <div className="mb-4" style={{
                                display: 'flex',
                                alignItems: 'center',
                                paddingBottom: '12px',
                                borderBottom: '3px solid #667eea'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    marginRight: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-person-badge" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                                </div>
                                <h5 style={{ 
                                    color: '#2d3748', 
                                    fontWeight: '700',
                                    margin: 0,
                                    fontSize: '1.25rem'
                                }}>
                                    Personal Information
                                </h5>
                            </div>
                            
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-hash me-2 text-primary"></i>
                                            EMIS No <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="Emis_No"
                                            value={formData.Emis_No || ''}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid #e2e8f0',
                                                backgroundColor: '#f7fafc',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                fontWeight: '500',
                                                color: '#718096'
                                            }}
                                        />
                                    </Form.Group>
                                </div>
                                
                                <div className="col-md-4">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-person-fill me-2 text-success"></i>
                                            Student Name <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={formData.name || ''}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter student's full name"
                                            isInvalid={!!validationErrors.name}
                                            style={{
                                                borderRadius: '10px',
                                                border: validationErrors.name ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: validationErrors.name ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                            onFocus={(e) => {
                                                if (!validationErrors.name) {
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }
                                            }}
                                            onBlur={(e) => {
                                                if (!validationErrors.name) {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                                }
                                            }}
                                        />
                                        {validationErrors.name && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block', marginTop: '6px', fontSize: '0.85rem' }}>
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {validationErrors.name}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </div>
                                
                                <div className="col-md-4">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-person me-2 text-primary"></i>
                                            Father Name <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="father_name"
                                            value={formData.father_name || ''}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter father's full name"
                                            isInvalid={!!validationErrors.father_name}
                                            style={{
                                                borderRadius: '10px',
                                                border: validationErrors.father_name ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: validationErrors.father_name ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                            onFocus={(e) => {
                                                if (!validationErrors.father_name) {
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }
                                            }}
                                            onBlur={(e) => {
                                                if (!validationErrors.father_name) {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                                }
                                            }}
                                        />
                                        {validationErrors.father_name && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block', marginTop: '6px', fontSize: '0.85rem' }}>
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {validationErrors.father_name}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </div>

                                <div className="col-md-3">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-people-fill me-2 text-warning"></i>
                                            Community <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Select
                                            name="com"
                                            value={formData.com || 0}
                                            onChange={handleInputChange}
                                            isInvalid={!!validationErrors.com}
                                            style={{
                                                borderRadius: '10px',
                                                border: validationErrors.com ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: validationErrors.com ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e2e8f0';
                                                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                            }}
                                        >
                                            <option value="0">Others</option>
                                            <option value="1">SC</option>
                                            <option value="2">ST</option>
                                            <option value="3">MBC</option>
                                            <option value="4">BC</option>
                                            <option value="5">OC</option>
                                            <option value="6">SCA</option>
                                            <option value="7">BCM</option>
                                        </Form.Select>
                                        {validationErrors.com && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '0.85rem', marginTop: '6px', color: '#ef4444' }}>
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {validationErrors.com}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </div>
                                
                                <div className="col-md-3">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-gender-ambiguous me-2 text-danger"></i>
                                            Gender <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Select
                                            name="sex"
                                            value={formData.sex || 0}
                                            onChange={handleInputChange}
                                            isInvalid={!!validationErrors.sex}
                                            style={{
                                                borderRadius: '10px',
                                                border: validationErrors.sex ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: validationErrors.sex ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e2e8f0';
                                                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                            }}
                                        >
                                            <option value="0">Others</option>
                                            <option value="1">Male</option>
                                            <option value="2">Female</option>
                                        </Form.Select>
                                        {validationErrors.sex && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '0.85rem', marginTop: '6px', color: '#ef4444' }}>
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {validationErrors.sex}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </div>
                                
                                <div className="col-md-3">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-translate me-2 text-info"></i>
                                            Medium (PSTM) <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Select
                                            name="pstm"
                                            value={formData.pstm || 0}
                                            onChange={handleInputChange}
                                            isInvalid={!!validationErrors.pstm}
                                            style={{
                                                borderRadius: '10px',
                                                border: validationErrors.pstm ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: validationErrors.pstm ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e2e8f0';
                                                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                            }}
                                        >
                                            <option value="0">Others</option>
                                            <option value="1">Tamil</option>
                                            <option value="2">English</option>
                                        </Form.Select>
                                        {validationErrors.pstm && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '0.85rem', marginTop: '6px', color: '#ef4444' }}>
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {validationErrors.pstm}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </div>

                                <div className="col-md-3">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-calendar-event me-2 text-primary"></i>
                                            Date of Birth <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="dob"
                                            value={formData.dob || ''}
                                            onChange={handleInputChange}
                                            placeholder="DD-MM-YYYY"
                                            disabled
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid #e2e8f0',
                                                backgroundColor: '#f7fafc',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                fontWeight: '500',
                                                color: '#718096'
                                            }}
                                        />
                                    </Form.Group>
                                </div>
                                
                                <div className="col-md-2">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-universal-access me-2 text-danger"></i>
                                            Disability Status <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Select
                                            name="ph"
                                            value={formData.ph || 0}
                                            onChange={handleInputChange}
                                            isInvalid={!!validationErrors.ph}
                                            style={{
                                                borderRadius: '10px',
                                                border: validationErrors.ph ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: validationErrors.ph ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e2e8f0';
                                                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                            }}
                                        >
                                            <option value="0">No</option>
                                            <option value="1">Yes</option>
                                        </Form.Select>
                                        {validationErrors.ph && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '0.85rem', marginTop: '6px', color: '#ef4444' }}>
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {validationErrors.ph}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </div>

                                <div className="col-md-2">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-person-check-fill me-2" style={{ color: '#10b981' }}></i>
                                            Candidate Status <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Select
                                            value={candidateStatus}
                                            onChange={(e) => {
                                                const newStatus = parseInt(e.target.value);
                                                setCandidateStatus(newStatus);
                                                // Clear preferences if status changes from Present to anything else
                                                if (newStatus !== 1) {
                                                    setCandidatePreferences(initializePreferences());
                                                }
                                            }}
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e2e8f0';
                                                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                            }}
                                        >
                                            <option value="0">Select Status</option>
                                            <option value="1">Present</option>
                                            <option value="2">Not Eligible</option>
                                            <option value="3">Not Willing</option>
                                            <option value="4">Absent</option>
                                        </Form.Select>
                                    </Form.Group>
                                </div>

                                {candidateStatus === 1 && (
                                    <div className="col-md-8">
                                        <Form.Group>
                                            <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                                <i className="bi bi-mortarboard-fill me-2" style={{ color: '#8b5cf6' }}></i>
                                                Candidate Preferences <span className="text-danger">*</span>
                                            </Form.Label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {/* Dynamically render preferences based on candidateOptionMap */}
                                            {Array.from({ length: getPreferenceCount() }, (_, index) => index + 1).map((prefNum) => {
                                                const selectedOptions = Object.entries(candidatePreferences)
                                                    .filter(([key, value]) => key !== `preference_${prefNum}` && value)
                                                    .map(([, value]) => value);
                                                
                                                const preferenceColors = [
                                                    '#0369a1', '#be185d', '#059669', '#d97706', '#7c3aed', '#dc2626'
                                                ];
                                                
                                                return (
                                                    <div key={prefNum} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <span style={{ fontWeight: '600', fontSize: '0.92rem', minWidth: '105px', color: '#4a5568', textAlign: 'left' }}>
                                                            Preference {prefNum}:
                                                        </span>
                                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                                            <Form.Select
                                                                value={candidatePreferences[`preference_${prefNum}`] || ''}
                                                                onChange={(e) => handlePreferenceChange(prefNum, e.target.value)}
                                                                style={{
                                                                    borderRadius: '10px',
                                                                    border: '2px solid #e2e8f0',
                                                                    padding: '11px 16px',
                                                                    fontSize: '0.95rem',
                                                                    fontWeight: '500',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    color: candidatePreferences[`preference_${prefNum}`] ? '#4a5568' : '#9ca3af',
                                                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                                                }}
                                                                onFocus={(e) => {
                                                                    e.target.style.borderColor = '#667eea';
                                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                                }}
                                                                onBlur={(e) => {
                                                                    e.target.style.borderColor = '#e2e8f0';
                                                                    e.target.style.boxShadow = 'none';
                                                                }}
                                                            >
                                                                <option value="">Select Preference</option>
                                                                {Object.entries(candidateOptionMap).map(([key, value]) => {
                                                                    if (key === '0') return null;
                                                                    return (
                                                                        <option 
                                                                            key={key} 
                                                                            value={value}
                                                                            disabled={selectedOptions.includes(value)}
                                                                        >
                                                                            {value}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </Form.Select>
                                                        </div>
                                                        <div style={{
                                                            padding: '11px 20px',
                                                            borderRadius: '10px',
                                                            backgroundColor: '#ffffff',
                                                            border: '2px solid #e2e8f0',
                                                            minWidth: '160px',
                                                            maxWidth: '160px',
                                                            textAlign: 'center',
                                                            fontWeight: '700',
                                                            fontSize: '0.95rem',
                                                            color: candidatePreferences[`preference_${prefNum}`] ? preferenceColors[prefNum - 1] : '#9ca3af',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                                            letterSpacing: '0.3px'
                                                        }}>
                                                            {candidatePreferences[`preference_${prefNum}`] || 'Not Selected'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {validationErrors.preferences && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '0.85rem', marginTop: '6px', color: '#ef4444' }}>
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {validationErrors.preferences}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </div>
                                )}
                                
                                {parseInt(formData.ph) === 1 && (
                                    <div className="col-md-12">
                                        <Form.Group>
                                            <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                                <i className="bi bi-file-medical me-2 text-warning"></i>
                                                Disability Name <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="Disability_Name"
                                                value={formData.Disability_Name || ''}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter disability type/name"
                                                isInvalid={!!validationErrors.Disability_Name}
                                                style={{
                                                    borderRadius: '10px',
                                                    border: validationErrors.Disability_Name ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                    padding: '12px 16px',
                                                    fontSize: '0.95rem',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: validationErrors.Disability_Name ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                                }}
                                                onFocus={(e) => {
                                                    if (!validationErrors.Disability_Name) {
                                                        e.target.style.borderColor = '#667eea';
                                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    if (!validationErrors.Disability_Name) {
                                                        e.target.style.borderColor = '#e2e8f0';
                                                        e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                                    }
                                                }}
                                            />
                                            {validationErrors.Disability_Name && (
                                                <Form.Control.Feedback type="invalid" style={{ display: 'block', marginTop: '6px', fontSize: '0.85rem' }}>
                                                    <i className="bi bi-exclamation-circle me-1"></i>
                                                    {validationErrors.Disability_Name}
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* School & Zone Information Section */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '25px',
                            marginBottom: '25px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            border: '1px solid #e3e6f0'
                        }}>
                            <div className="mb-4" style={{
                                display: 'flex',
                                alignItems: 'center',
                                paddingBottom: '12px',
                                borderBottom: '3px solid #667eea'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    marginRight: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-building" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                                </div>
                                <h5 style={{ 
                                    color: '#2d3748', 
                                    fontWeight: '700',
                                    margin: 0,
                                    fontSize: '1.25rem'
                                }}>
                                    School & Zone Information
                                </h5>
                            </div>
                            
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
                                            District Name
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="district_name"
                                            value={formData.district_name || ''}
                                            onChange={handleInputChange}
                                            disabled
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid #e2e8f0',
                                                backgroundColor: '#f7fafc',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                fontWeight: '500',
                                                color: '#718096'
                                            }}
                                        />
                                    </Form.Group>
                                </div>
                                
                                <div className="col-md-4">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-bank me-2 text-success"></i>
                                            School Name
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="school_name"
                                            value={formData.school_name || ''}
                                            onChange={handleInputChange}
                                            disabled
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid #e2e8f0',
                                                backgroundColor: '#f7fafc',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                fontWeight: '500',
                                                color: '#718096'
                                            }}
                                        />
                                    </Form.Group>
                                </div>

                                <div className="col-md-2">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-geo me-2 text-info"></i>
                                            JEE Zone
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="Zone_Name_Jee"
                                            value={formData.Zone_Name_Jee || ''}
                                            onChange={handleInputChange}
                                            disabled
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid #e2e8f0',
                                                backgroundColor: '#f7fafc',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                fontWeight: '500',
                                                color: '#718096'
                                            }}
                                        />
                                    </Form.Group>
                                </div>
                                
                                <div className="col-md-2">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-geo me-2 text-warning"></i>
                                            NEET Zone
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="Zone_Name_Neet"
                                            value={formData.Zone_Name_Neet || ''}
                                            onChange={handleInputChange}
                                            disabled
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid #e2e8f0',
                                                backgroundColor: '#f7fafc',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                fontWeight: '500',
                                                color: '#718096'
                                            }}
                                        />
                                    </Form.Group>
                                </div>
                            </div>
                        </div>

                        {/* Document Upload Section */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '25px',
                            marginBottom: '25px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            border: '1px solid #e3e6f0'
                        }}>
                            <div className="mb-4" style={{
                                display: 'flex',
                                alignItems: 'center',
                                paddingBottom: '12px',
                                borderBottom: '3px solid #667eea'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    marginRight: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="bi bi-file-earmark-arrow-up" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                                </div>
                                <div>
                                    <h5 style={{ 
                                        color: '#2d3748', 
                                        fontWeight: '700',
                                        margin: 0,
                                        fontSize: '1.25rem'
                                    }}>
                                        Upload Documents
                                    </h5>
                                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: '4px 0 0 0' }}>
                                        <i className="bi bi-info-circle me-1"></i>
                                        Accepted: PDF, JPG, PNG (Max 5MB per file)
                                    </p>
                                </div>
                            </div>
                            
                            <div className="row g-4">
                                <div className="col-md-3">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                                            Photo Id Card / Aadhar Card<span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="file"
                                            name="birthCertificate"
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            isInvalid={!!validationErrors.birthCertificate}
                                            style={{
                                                borderRadius: '10px',
                                                border: validationErrors.birthCertificate ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: validationErrors.birthCertificate ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e2e8f0';
                                                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                            }}
                                        />
                                        {uploadedFiles.birthCertificate && (
                                            <small style={{ 
                                                display: 'block',
                                                marginTop: '8px',
                                                padding: '8px 12px',
                                                backgroundColor: '#d4edda',
                                                color: '#155724',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem'
                                            }}>
                                                <i className="bi bi-check-circle-fill me-2"></i>
                                                {uploadedFiles.birthCertificate.name}
                                            </small>
                                        )}
                                        {validationErrors.birthCertificate && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '0.85rem', marginTop: '6px', color: '#ef4444' }}>
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {validationErrors.birthCertificate}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </div>

                                <div className="col-md-3">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-file-earmark-person me-2 text-warning"></i>
                                            Community Certificate <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="file"
                                            name="communityCertificate"
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            isInvalid={!!validationErrors.communityCertificate}
                                            style={{
                                                borderRadius: '10px',
                                                border: validationErrors.communityCertificate ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: validationErrors.communityCertificate ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e2e8f0';
                                                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                            }}
                                        />
                                        {uploadedFiles.communityCertificate && (
                                            <small style={{ 
                                                display: 'block',
                                                marginTop: '8px',
                                                padding: '8px 12px',
                                                backgroundColor: '#d4edda',
                                                color: '#155724',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem'
                                            }}>
                                                <i className="bi bi-check-circle-fill me-2"></i>
                                                {uploadedFiles.communityCertificate.name}
                                            </small>
                                        )}
                                        {validationErrors.communityCertificate && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block', fontSize: '0.85rem', marginTop: '6px', color: '#ef4444' }}>
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {validationErrors.communityCertificate}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </div>

                                <div className="col-md-3">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-credit-card-2-front me-2 text-info"></i>
                                           Birth Certificate / Other Certificate <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="file"
                                            name="aadharCard"
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e2e8f0';
                                                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                            }}
                                        />
                                        {uploadedFiles.aadharCard && (
                                            <small style={{ 
                                                display: 'block',
                                                marginTop: '8px',
                                                padding: '8px 12px',
                                                backgroundColor: '#d4edda',
                                                color: '#155724',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem'
                                            }}>
                                                <i className="bi bi-check-circle-fill me-2"></i>
                                                {uploadedFiles.aadharCard.name}
                                            </small>
                                        )}
                                    </Form.Group>
                                </div>

                                <div className="col-md-3">
                                    <Form.Group>
                                        <Form.Label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            <i className="bi bi-file-earmark-medical me-2 text-danger"></i>
                                            Other Certificate (PH/Others)
                                        </Form.Label>
                                        <Form.Control
                                            type="file"
                                            name="otherCertificate"
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            style={{
                                                borderRadius: '10px',
                                                border: '2px solid #e2e8f0',
                                                padding: '12px 16px',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s ease',
                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#e2e8f0';
                                                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                            }}
                                        />
                                        {uploadedFiles.otherCertificate && (
                                            <small style={{ 
                                                display: 'block',
                                                marginTop: '8px',
                                                padding: '8px 12px',
                                                backgroundColor: '#d4edda',
                                                color: '#155724',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem'
                                            }}>
                                                <i className="bi bi-check-circle-fill me-2"></i>
                                            {uploadedFiles.otherCertificate.name}
                                            </small>
                                        )}
                                    </Form.Group>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer style={{ 
                        borderTop: '2px solid #e3e6f0', 
                        padding: '25px 40px',
                        backgroundColor: '#fafbfc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '15px'
                    }}>
                        <Button 
                            variant="warning"
                            onClick={() => setShowRemarksModal(true)}
                            disabled={isUpdating}
                            style={{
                                borderRadius: '10px',
                                padding: '12px 30px',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                border: 'none',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                if (!isUpdating) {
                                    e.target.style.backgroundColor = '#d97706';
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#f59e0b';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.3)';
                            }}
                        >
                            <i className="bi bi-chat-left-text me-2"></i>
                            Add Remarks
                        </Button>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <Button 
                                variant="light" 
                                onClick={handleCloseModal} 
                                disabled={isUpdating}
                                style={{
                                    borderRadius: '10px',
                                    padding: '12px 30px',
                                    fontWeight: '600',
                                    fontSize: '0.95rem',
                                    border: '2px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    color: '#4a5568',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isUpdating) {
                                        e.target.style.backgroundColor = '#f7fafc';
                                        e.target.style.borderColor = '#cbd5e0';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'white';
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isUpdating}
                                style={{
                                    background: isUpdating 
                                        ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '12px 35px',
                                    fontWeight: '700',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isUpdating 
                                        ? '0 4px 15px rgba(156, 163, 175, 0.3)' 
                                        : '0 4px 15px rgba(102, 126, 234, 0.4)',
                                    color: 'white',
                                    letterSpacing: '0.3px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isUpdating) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = isUpdating 
                                        ? '0 4px 15px rgba(156, 163, 175, 0.3)' 
                                        : '0 4px 15px rgba(102, 126, 234, 0.4)';
                                }}
                            >
                                {isUpdating ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" style={{ 
                                            width: '1rem', 
                                            height: '1rem',
                                            borderWidth: '2px'
                                        }}></span>
                                        Updating Record...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-circle-fill me-2" style={{ fontSize: '1.1rem' }}></i>
                                        Update Record
                                    </>
                                )}
                            </Button>
                        </div>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Remarks Modal */}
            <Modal 
                show={showRemarksModal} 
                onHide={() => setShowRemarksModal(false)} 
                size="lg" 
                centered
                backdrop="static"
                style={{ zIndex: 1060 }}
            >
                <Modal.Header 
                    closeButton 
                    style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        borderBottom: 'none',
                        padding: '20px 30px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    className="border-0"
                >
                    <Modal.Title style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                        <i className="bi bi-chat-left-text me-3" style={{ fontSize: '1.4rem' }}></i>
                        Add Remarks
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ 
                    padding: '30px', 
                    backgroundColor: '#f9fafb'
                }}>
                    <Form.Group>
                        <Form.Label style={{ 
                            fontWeight: '600', 
                            color: '#374151', 
                            fontSize: '1rem',
                            marginBottom: '12px'
                        }}>
                            <i className="bi bi-pencil-square me-2 text-warning"></i>
                            Enter your remarks about this student record
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={6}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Type your remarks here... (e.g., document verification status, special notes, corrections needed, etc.)"
                            style={{
                                borderRadius: '10px',
                                border: '2px solid #e5e7eb',
                                padding: '15px',
                                fontSize: '0.95rem',
                                resize: 'vertical',
                                transition: 'all 0.3s ease',
                                minHeight: '150px'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#f59e0b';
                                e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        {remarks && (
                            <small style={{ 
                                display: 'block',
                                marginTop: '8px',
                                color: '#6b7280',
                                fontSize: '0.85rem'
                            }}>
                                <i className="bi bi-info-circle me-1"></i>
                                Character count: {remarks.length}
                            </small>
                        )}
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{ 
                    borderTop: '2px solid #e5e7eb', 
                    padding: '20px 30px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <Button 
                        variant="light" 
                        onClick={() => setShowRemarksModal(false)}
                        style={{
                            borderRadius: '8px',
                            padding: '10px 25px',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            border: '2px solid #e5e7eb',
                            backgroundColor: 'white',
                            color: '#6b7280',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f3f4f6';
                            e.target.style.borderColor = '#d1d5db';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.borderColor = '#e5e7eb';
                        }}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => setShowRemarksModal(false)}
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 25px',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                            color: 'white'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)';
                        }}
                    >
                        <i className="bi bi-check-circle-fill me-2"></i>
                        Save Remarks
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Print Confirmation Modal */}
            <Modal 
                show={showPrintConfirmModal} 
                onHide={() => setShowPrintConfirmModal(false)} 
                size="md" 
                centered
                backdrop="static"
                style={{ zIndex: 1070 }}
            >
                <Modal.Header 
                    closeButton 
                    style={{
                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                        color: 'white',
                        borderBottom: 'none',
                        padding: '20px 30px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    className="border-0"
                >
                    <Modal.Title style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                        <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '1.4rem' }}></i>
                        Confirm Print Action
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ 
                    padding: '30px', 
                    backgroundColor: '#fff8f8'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderLeft: '4px solid #dc2626',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <h5 style={{ 
                            color: '#1f2937', 
                            fontWeight: '700',
                            marginBottom: '15px',
                            fontSize: '1.1rem'
                        }}>
                            <i className="bi bi-info-circle-fill me-2" style={{ color: '#dc2626' }}></i>
                            Important Notice
                        </h5>
                        <p style={{ 
                            color: '#4b5563',
                            fontSize: '0.95rem',
                            lineHeight: '1.6',
                            marginBottom: '12px'
                        }}>
                            Once you proceed with printing this candidate card, the following will occur:
                        </p>
                        <ul style={{
                            color: '#4b5563',
                            fontSize: '0.95rem',
                            lineHeight: '1.8',
                            paddingLeft: '25px',
                            marginBottom: '15px'
                        }}>
                            <li style={{ marginBottom: '8px' }}>
                                <strong>The record will be marked as "Printed"</strong> and moved to the archive.
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <strong>No further modifications</strong> can be made to this candidate's information.
                            </li>
                            <li>
                                The candidate will <strong>no longer appear in the editable data list</strong>.
                            </li>
                        </ul>
                        <div style={{
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            padding: '12px 15px',
                            marginTop: '15px'
                        }}>
                            <p style={{ 
                                color: '#991b1b',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                margin: 0
                            }}>
                                <i className="bi bi-shield-exclamation me-2"></i>
                                Please ensure all candidate information is correct before proceeding.
                            </p>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ 
                    borderTop: '2px solid #fee2e2', 
                    padding: '20px 30px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <Button 
                        variant="light" 
                        onClick={() => {
                            setShowPrintConfirmModal(false);
                            setRowToPrint(null);
                        }}
                        style={{
                            borderRadius: '8px',
                            padding: '10px 25px',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            border: '2px solid #e5e7eb',
                            backgroundColor: 'white',
                            color: '#6b7280',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f9fafb';
                            e.target.style.borderColor = '#d1d5db';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.borderColor = '#e5e7eb';
                        }}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        Cancel
                    </Button>
                    <Button 
                        variant="danger"
                        onClick={proceedWithPrint}
                        style={{
                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 25px',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
                            color: 'white'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)';
                        }}
                    >
                        <i className="bi bi-printer-fill me-2"></i>
                        Yes, Print Card
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default Master_Data_District