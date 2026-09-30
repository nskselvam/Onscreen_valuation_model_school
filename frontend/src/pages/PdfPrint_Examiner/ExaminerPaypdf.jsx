import React, { useState, useEffect } from 'react'
import { Card, Button, Form, Row, Col, Modal } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useSelector } from 'react-redux'
import { FaCalendarAlt, FaFileInvoiceDollar, FaSpinner, FaUniversity } from 'react-icons/fa'
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout'
import ExaminerBankModal from '../../components/modals/ExaminerBankModal'
import ExaminerPaymentModal from '../../components/modals/ExaminerPaymentModal_New'
import ChiefExaminerPaymentModal from '../../components/modals/ChiefExaminerPaymentModal_New'
import { useGetUserBankDetailsStaffQuery, useGetTadaAllowanceQuery, useGetCampusDetailsQuery, usePostBankDetailsIfscUpsertMutation } from '../../redux-slice/userDashboardSlice'
import { add, set } from 'date-fns'

const { VITE_Institution_No } = import.meta.env;


const ExaminerPaypdf = () => {
    const [fromDate, setFromDate] = useState(new Date(2025, 0, 1)); // 01-01-2025
    const [endDate, setEndDate] = useState(new Date()); // Current date
    const [dateRangeType, setDateRangeType] = useState('custom'); // 'today', 'week', 'month', 'custom'
    const [loading, setLoading] = useState(false);
    const [ExaminerAccount, setExaminerAccount] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showChiefPaymentModal, setShowChiefPaymentModal] = useState(false);
    const [showIfscModal, setShowIfscModal] = useState(false);
    const [ifscCode, setIfscCode] = useState('');
    const [ifscLoading, setIfscLoading] = useState(false);
    const [ifscError, setIfscError] = useState('');
    const [ifscBankData, setIfscBankData] = useState(null);
    const [ifscSaveLoading, setIfscSaveLoading] = useState(false);
    const [ifscSaveSuccess, setIfscSaveSuccess] = useState(false);
    const [valuationRecords, setValuationRecords] = useState([]);
    const [eligibilityChecked, setEligibilityChecked] = useState(false);
    const [daType, setDaType] = useState('0');
    const [datypetext, setDaTypeText] = useState('');
    const [daAmount, setDaAmount] = useState(0);
    const [daadditionalAmount, setDaAdditionalAmount] = useState(0);
    const [taType, setTaType] = useState('1');
    const [taAmount, setTaAmount] = useState(0);
    const [campId, setCampId] = useState('');
    const [campOfficerId, setCampOfficerId] = useState('');
    const [examinerType, setExaminerType] = useState('1');
    const [valuationType, setValuationType] = useState('1');
    const [campusName, setCampusName] = useState('');
    const [degreeName, setDegreeName] = useState('');
    const [noDays, setNoDays] = useState(0);
    const [errorRemarks, setErrorRemarks] = useState('');
    const [travellingFrom, setTravellingFrom] = useState('');
    const [travellingTo, setTravellingTo] = useState('');
    const [department, setDepartment] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [examinerTypeSelection, setExaminerTypeSelection] = useState('internal');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [missingFieldsList, setMissingFieldsList] = useState([]);
    const [bankDetails, setBankDetails] = useState({
        EMPLOYEE_NAME: '',
        BANK_ACCOUNT_NUMBER: '',
        BANK_NAME: '',
        IFSC: '',
        BRANCH: '',
        NATUREOFBANK: '',
        Type_Edit: true,
        Evaluator_Id: '',
        branchAddress: ''
    });

    // Open modal when ExaminerAccount is false on component load
    const userInfo = useSelector((state) => state.auth.userInfo);
    const userRole = userInfo?.selected_role || '';

    const [saveBankDetailsIfsc, { isLoading: isSavingBankDetails }] = usePostBankDetailsIfscUpsertMutation();

    const { data: bankDetailsStaffData, error: bankDetailsStaffError, isLoading: bankDetailsStaffLoading } = useGetUserBankDetailsStaffQuery(
        {
            "Eva_id": userInfo?.username
        }
    );
    const { data: tadaAllowanceData, error: tadaAllowanceError, isLoading: tadaAllowanceLoading } = useGetTadaAllowanceQuery(
        {
            "depcode": userInfo?.selected_course == "02" ? userInfo?.selected_course : "01"
        }
    );
    const { data: campusDetailsData, error: campusDetailsError, isLoading: campusDetailsLoading } = useGetCampusDetailsQuery(
            {
                "Campus_Id":VITE_Institution_No
            }
    );


    const CampID = userRole === '2' ? (userInfo?.Camp_id ? userInfo.Camp_id.split(',') : []) : (userInfo?.Camp_id_chief ? userInfo.Camp_id_chief.split(',') : []);
    const CampOfficeridExaminer = userRole === '2' ? (userInfo?.camp_offcer_id_examiner ? userInfo.camp_offcer_id_examiner.split(',') : []) : (userInfo?.camp_offcer_id_chief ? userInfo.camp_offcer_id_chief.split(',') : []);

    // const CampID = userRole == '2' ? (userInfo?.Camp_id ? userInfo.Camp_id.split(',').map(id => id.trim()) : []) : (userInfo?.Camp_id_chief ? userInfo.Camp_id_chief.split(',').map(id => id.trim()) : []);
    // const CampOfficeridExaminer = userRole == '2' ? (userInfo?.camp_offcer_id_examiner ? userInfo.camp_offcer_id_examiner.split(',').map(id => id.trim()) : []) : (userInfo?.camp_offcer_id_chief ? userInfo.camp_offcer_id_chief.split(',').map(id => id.trim()) : []);


    // Combine CampID and CampOfficeridExaminer into paired values with unique camp IDs (first occurrence)
    const campIdMap = new Map();
    CampID.forEach((campId, index) => {
        if (!campIdMap.has(campId)) {
            campIdMap.set(campId, CampOfficeridExaminer[index] || CampOfficeridExaminer[0] || '');
        }
    });
    
    const Camp_Details = Array.from(campIdMap.entries()).map(([campId, officerId]) => ({
        value: `${campId}-${officerId}`,
        campId: campId,
        campOfficerId: officerId,
        displayText: `${campId} - ${officerId}`
    }));



    // Fetch bank details from IFSC code
    const handleFetchIfscDetails = async () => {
        if (!ifscCode || ifscCode.length !== 11) {
            setIfscError('Please enter a valid 11-character IFSC code');
            return;
        }

        setIfscLoading(true);
        setIfscError('');
        setIfscBankData(null);

        try {
            // Using public IFSC API
            const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
            
            if (!response.ok) {
                throw new Error('IFSC code not found');
            }

            const data = await response.json();
            setIfscBankData(data);
        } catch (error) {
            setIfscError(error.message || 'Failed to fetch IFSC details');
        } finally {
            setIfscLoading(false);
        }
    };

    // Reset IFSC modal state when closed
    const handleCloseIfscModal = () => {
        setShowIfscModal(false);
        setIfscCode('');
        setIfscError('');
        setIfscBankData(null);
        setIfscSaveSuccess(false);
    };

    // Save bank details to database
    const handleSaveBankDetails = async () => {
        if (!ifscBankData) {
            setIfscError('No bank details to save');
            return;
        }

        setIfscSaveLoading(true);
        setIfscError('');

        try {
            const response = await saveBankDetailsIfsc({
                BANK: ifscBankData.BANK,
                IFSC: ifscBankData.IFSC,
                BRANCH: ifscBankData.BRANCH,
                ADDRESS: ifscBankData.ADDRESS,
                CITY: ifscBankData.CITY,
                DISTRICT: ifscBankData.DISTRICT,
                STATE: ifscBankData.STATE,
                CONTACT: ifscBankData.CONTACT || '',
                MICR: ifscBankData.MICR || ''
            }).unwrap();

            if (response.success) {
                setIfscSaveSuccess(true);
                setTimeout(() => {
                    setIfscSaveSuccess(false);
                }, 3000);
            }
        } catch (error) {
            console.error('Error saving bank details:', error);
            setIfscError(error.data?.message || 'Failed to save bank details');
        } finally {
            setIfscSaveLoading(false);
        }
    };

    // Set examiner type from userInfo
    useEffect(() => {
        if (userInfo?.selected_role) {
            setExaminerType(userInfo.selected_role);
        }
    }, [userInfo?.selected_role]);

    // Set initial campId and campOfficerId from combined data
    useEffect(() => {
        if (Camp_Details.length > 0 && !campId) {
            const firstItem = Camp_Details[0];
            setCampId(firstItem.campId);
            setCampOfficerId(firstItem.campOfficerId);
        }
    }, [Camp_Details.length]);

    // Set initial campus name from campusDetailsData
    useEffect(() => {
        if (campusDetailsData && campusDetailsData.length > 0 && !campusName) {
            setCampusName(campusDetailsData[0].campus_Name);
        }
    }, [campusDetailsData]);

    useEffect(() => {
        if (bankDetailsStaffData && bankDetailsStaffError === undefined) {
            setExaminerAccount(true);
            setBankDetails({ ...bankDetailsStaffData });
            setBankDetails({ ...bankDetailsStaffData, Type_Edit: true });
        } else if (bankDetailsStaffData && !bankDetailsStaffData.data) {
            setShowBankModal(true);
            setBankDetails({ ...bankDetails, Type_Edit: false, Evaluator_Id: userInfo ? userInfo.username : '' });
        } else if (bankDetailsStaffError) {
            setShowBankModal(true);
            setBankDetails({ ...bankDetails, Type_Edit: false, Evaluator_Id: userInfo ? userInfo.username : '' });
        }
    }, [bankDetailsStaffData, bankDetailsStaffError]);

    // Handle modal close
    const handleCloseModal = () => {
        setShowBankModal(false);
    };

    const handlePaymentCloseModal = () => {
        setShowPaymentModal(false);
    };

    const handleChiefPaymentCloseModal = () => {
        setShowChiefPaymentModal(false);
    };
    // Handle successful bank account submission
    const handleBankAccountSuccess = (updatedDetails) => {
        setExaminerAccount(true);
        setShowBankModal(false);

        // Update local bank details state with the new data
        if (updatedDetails) {
            setBankDetails({
                EMPLOYEE_NAME: updatedDetails.accountHolderName || updatedDetails.EMPLOYEE_NAME,
                BANK_ACCOUNT_NUMBER: updatedDetails.accountNumber || updatedDetails.BANK_ACCOUNT_NUMBER,
                BANK_NAME: updatedDetails.bankName || updatedDetails.BANK_NAME,
                IFSC: updatedDetails.ifscCode || updatedDetails.IFSC,
                BRANCH: updatedDetails.branchName || updatedDetails.BRANCH,
                NATUREOFBANK: updatedDetails.accountType || updatedDetails.NATUREOFBANK,
                BANK_ADDRESS: updatedDetails.branchAddress || updatedDetails.BANK_ADDRESS || '',
                Type_Edit: true,
                Evaluator_Id: updatedDetails.Evaluator_Id || userInfo?.username
            });
        }
    };

    // Format date to DD/MM/YYYY
    const formatDate = (date) => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Handle quick date range selection
    const handleQuickDateSelect = (type) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        setDateRangeType(type);
        
        switch(type) {
            case 'today':
                setFromDate(today);
                setEndDate(today);
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - 6); // Last 7 days including today
                setFromDate(weekStart);
                setEndDate(today);
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                setFromDate(monthStart);
                setEndDate(today);
                break;
            case 'custom':
                // Keep current dates
                break;
            default:
                break;
        }
    };


    // Handle report generation

    const dahandle = (e, value) => {
        setDaType(value);
        setDaTypeText(e.target.options[e.target.selectedIndex].text);

        const selectedDa = tadaAllowanceData.find(da => da.id.toString() === value);
        if (selectedDa) {
            const remuneration = parseFloat(selectedDa.accomodation_cost) || 0;
            const dearnessalowance = parseFloat(selectedDa.dearnessallowance) || 0;
            setDaAdditionalAmount(remuneration);
            setDaAmount(dearnessalowance);
        } else {
            setDaAdditionalAmount(0);
            setDaAmount(0);
        }
    };

    const handleeligibility = (e, checked) => {
        setEligibilityChecked(checked);
        if (!checked) {
            setDaType('0');
            setDaTypeText('');
            setDaAmount(0);
            setDaAdditionalAmount(0);
        }
    };
    const handleGenerateReport = () => {




        if (!fromDate || !endDate) {
            alert('Please select both From Date and End Date');
            return;
        }
        if (fromDate > endDate) {
            alert('From Date cannot be greater than End Date');
            return;
        }

        // Check if date range is within 30 days
        // Create dates at start of day to get accurate day count
        const startOfFromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        const startOfEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const diffTime = startOfEndDate - startOfFromDate;
        // Add 1 to include both start and end dates (inclusive count)
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays > 30) {
            setErrorRemarks(`Report can only be generated for a maximum of 30 days. You selected ${diffDays} days. Please select a date range within 30 days.`);
            return;
        }

        if (degreeName === '') {
            setErrorRemarks('Please Degree Name');
            return;
        }
        if (campusName === '' || campusName === 'Select Campus') {
            setErrorRemarks('Please select Campus');
            return;
        }
        
        // Validate examiner type selection is mandatory
        if (!examinerTypeSelection || examinerTypeSelection === '') {
            setErrorRemarks('Please select Examiner Type (Internal or External)');
            return;
        }
        
        if (eligibilityChecked === true) {
            if (daType === '0') {
                setErrorRemarks('Please select DA Type');
                return;
            }
            if (daAmount === 0 && daAdditionalAmount === 0) {
                setErrorRemarks('Selected DA Type has zero amount. Please select a valid DA Type.');
                return;
            }
        }

        // Validate travelling details if external examiner is selected
        if (!bankDetails.BANK_ACCOUNT_NUMBER || bankDetails.BANK_ACCOUNT_NUMBER.trim() === '') {
            setErrorRemarks('Bank Account Number is required. Please update your bank details.');
            return;
        }
        if (!bankDetails.BANK_NAME || bankDetails.BANK_NAME.trim() === '') {
            setErrorRemarks('Bank Name is required. Please update your bank details.');
            return;
        }
        if (!bankDetails.IFSC || bankDetails.IFSC.trim() === '') {
            setErrorRemarks('IFSC Code is required. Please update your bank details.');
            return;
        }
        if (!bankDetails.BRANCH || bankDetails.BRANCH.trim() === '') {
            setErrorRemarks('Branch Name is required. Please update your bank details.');
            return;
        }
        if (!bankDetails.EMPLOYEE_NAME || bankDetails.EMPLOYEE_NAME.trim() === '') {
            setErrorRemarks('Account Holder Name is required. Please update your bank details.');
            return;
        }
        if (examinerTypeSelection === 'external') {
            const missingFields = [];
            if (!travellingFrom || travellingFrom.trim() === '') {
                missingFields.push('Travelling From');
            }
            if (!travellingTo || travellingTo.trim() === '') {
                missingFields.push('Travelling To');
            }
            if (!department || department.trim() === '') {
                missingFields.push('Department');
            }
            if (!institutionName || institutionName.trim() === '') {
                missingFields.push('Institution Name');
            }
            
            if (missingFields.length > 0) {
                setMissingFieldsList(missingFields);
                setShowConfirmModal(true);
                return;
            }
        }

        // Validate bank details before generating payment



        // console.log('Date difference - From:', startOfFromDate, 'To:', startOfEndDate, 'Days:', diffDays);


        setNoDays(diffDays);

        // Show alert with selected dates
        // alert(`From Date: ${formatDate(fromDate)}\nEnd Date: ${formatDate(endDate)}`);

        setLoading(true);
       
        // TODO: Add API call for payment report generation
        if (userRole === '2') {
        setShowPaymentModal(true);
        } else if (userRole === '1') {
        setShowChiefPaymentModal(true);
        }
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    };

    // Custom input for DatePicker - shows full DD/MM/YYYY
    const CustomDateInput = React.forwardRef((props, ref) => {
        return (
            <div className="position-relative" style={{ cursor: 'pointer' }}>
                <Form.Control
                    {...props}
                    ref={ref}
                    type="text"
                    readOnly
                    style={{
                        cursor: 'pointer',
                        paddingRight: '40px',
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        padding: '12px 15px',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        minWidth: '150px',
                        letterSpacing: '1px'
                    }}
                    className="date-input-custom"
                />
                <FaCalendarAlt
                    style={{
                        position: 'absolute',
                        right: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6c63ff',
                        fontSize: '18px',
                        pointerEvents: 'none'
                    }}
                />
            </div>
        );
    });

    return (
        <>

            <style>
                {`
                    .react-datepicker-wrapper {
                        width: 100%;
                        display: block;
                    }
                    .react-datepicker__input-container {
                        width: 100%;
                        display: block;
                    }
                    .react-datepicker-popper {
                        position: absolute !important;
                    }
                    .date-input-custom:focus {
                        border-color: #17a2b8 !important;
                        box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.15) !important;
                    }
                    .date-input-custom:hover {
                        border-color: #17a2b8;
                    }
                    .react-datepicker {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        border: none;
                        border-radius: 12px;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
                    }
                    .react-datepicker__header {
                        background: linear-gradient(135deg, #87CEEB 0%, #17a2b8 100%);
                        border-bottom: none;
                        border-radius: 12px 12px 0 0;
                        padding: 15px;
                    }
                    .react-datepicker__current-month {
                        color: #fff;
                        font-weight: 600;
                        font-size: 16px;
                    }
                    .react-datepicker__day-name {
                        color: rgba(255, 255, 255, 0.9);
                        font-weight: 500;
                    }
                    .react-datepicker__day {
                        border-radius: 8px;
                        transition: all 0.2s ease;
                    }
                    .react-datepicker__day:hover {
                        background: #e0f7fa;
                        color: #17a2b8;
                    }
                    .react-datepicker__day--selected {
                        background: linear-gradient(135deg, #87CEEB 0%, #17a2b8 100%) !important;
                        color: #fff !important;
                        font-weight: 600;
                    }
                    .react-datepicker__day--keyboard-selected {
                        background: #e0f7fa;
                        color: #17a2b8;
                    }
                    .react-datepicker__navigation-icon::before {
                        border-color: #fff;
                    }
                    .react-datepicker__triangle {
                        display: none;
                    }
                    .react-datepicker-popper {
                        z-index: 9999 !important;
                    }
                    .payment-card {
                        border: none;
                        border-radius: 16px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        overflow: visible;
                        min-height: 400px;
                    }
                    .payment-card .card-body {
                        padding: 30px;
                        overflow: visible;
                        padding-bottom: 320px;
                    }
                    .generate-btn {
                        background: linear-gradient(135deg, #87CEEB 0%, #17a2b8 100%);
                        border: none;
                        border-radius: 10px;
                        padding: 14px 28px;
                        font-weight: 600;
                        font-size: 15px;
                        letter-spacing: 0.5px;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
                    }
                    .generate-btn:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(23, 162, 184, 0.4);
                        background: linear-gradient(135deg, #5bc0de 0%, #138496 100%);
                    }
                    .generate-btn:disabled {
                        background: #ccc;
                        box-shadow: none;
                    }
                    .date-label {
                        color: #333;
                        font-weight: 600;
                        font-size: 14px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .date-label-icon {
                        color: #17a2b8;
                    }
                `}
            </style>
            <UploadPageLayout
                mainTopic="Payment Generation Report"
                subTopic="Generate payment reports for completed valuations"
                cardTitle={ExaminerAccount ? "Payment Report" : "Bank Details"}
                cardHeaderButton={
                    ExaminerAccount && (
                        <Button
                            variant="light"
                            size="sm"
                            onClick={() => setShowIfscModal(true)}
                            className="d-flex align-items-center gap-2"
                            style={{
                                borderRadius: '10px',
                                fontWeight: '600',
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                            }}
                        >
                            <i className="bi bi-bank2" style={{ fontSize: '16px' }}></i>
                            <span style={{ letterSpacing: '0.5px' }}>Bank & IFSC Lookup</span>
                        </Button>
                    )
                }
                >

                {!ExaminerAccount ? (
                    <Card className="payment-card">
                        <Card.Body>
                            <Row className="align-items-end g-4">
                                <Col md={12} className="text-center">
                                    <h5>Please add your bank account details to generate payment reports.</h5>
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            setShowBankModal(true);
                                            setErrorRemarks('');
                                        }}
                                        className="mt-3 d-flex align-items-center gap-2 mx-auto"
                                        style={{
                                            background: 'linear-gradient(135deg, #87CEEB 0%, #17a2b8 100%)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            padding: '12px 25px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <FaUniversity />
                                        Add Bank Details
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                ) : (

                    <Card className="payment-card">
                        <Card.Body>

                            {(bankDetailsStaffData || bankDetails.BANK_ACCOUNT_NUMBER) && (
                                <Row className="mb-4">
                                    <Col md={12}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: '2px solid #90caf9'
                                        }}>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0" style={{ color: '#1976d2', fontWeight: 'bold' }}>
                                                    <FaUniversity className="me-2" />
                                                    Registered Bank Details
                                                </h6>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setShowBankModal(true);
                                                        setErrorRemarks('');
                                                    }}
                                                    style={{
                                                        borderRadius: '8px',
                                                        fontWeight: '600',
                                                        padding: '6px 16px'
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                            <Row>
                                                <Col md={6} className="mb-2">
                                                    <strong style={{ color: '#0d47a1' }}>Employee Name:</strong>
                                                    <span className="ms-2">{bankDetails.EMPLOYEE_NAME || 'N/A'}</span>
                                                </Col>
                                                <Col md={6} className="mb-2">
                                                    <strong style={{ color: '#0d47a1' }}>Account Number:</strong>
                                                    <span className="ms-2">{bankDetails.BANK_ACCOUNT_NUMBER || 'N/A'}</span>
                                                </Col>
                                                <Col md={6} className="mb-2">
                                                    <strong style={{ color: '#0d47a1' }}>Bank Name:</strong>
                                                    <span className="ms-2">{bankDetails.BANK_NAME || 'N/A'}</span>
                                                </Col>
                                                <Col md={6} className="mb-2">
                                                    <strong style={{ color: '#0d47a1' }}>IFSC Code:</strong>
                                                    <span className="ms-2">{bankDetails.IFSC || 'N/A'}</span>
                                                </Col>
                                                <Col md={6} className="mb-2">
                                                    <strong style={{ color: '#0d47a1' }}>Branch:</strong>
                                                    <span className="ms-2">{bankDetails.BRANCH || 'N/A'}</span>
                                                </Col>
                                                <Col md={6} className="mb-2">
                                                    <strong style={{ color: '#0d47a1' }}>Account Type:</strong>
                                                    <span className="ms-2">{bankDetails.NATUREOFBANK || 'N/A'}</span>
                                                </Col>
                                                <Col md={12} className="mb-2">
                                                    <strong style={{ color: '#0d47a1' }}>Bank Address:</strong>
                                                    <span className="ms-2">{bankDetails.BANK_ADDRESS || 'N/A'}</span>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                            <Row className="mb-4">
                                <Col>
                                    <h6 className="mb-3" style={{
                                        color: '#1976d2',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        borderBottom: '2px solid #e3f2fd',
                                        paddingBottom: '8px'
                                    }}>
                                        📅 Select Date Range & Configuration
                                    </h6>
                                    <h6 style={{ color: 'red' }}>{errorRemarks && errorRemarks}</h6>
                                </Col>
                            </Row>
                            <div style={{
                                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                                padding: '24px',
                                borderRadius: '12px',
                                border: '2px solid #81c784',
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
                                marginBottom: '20px'
                            }}>
                                {/* Quick Date Selection Buttons */}
                                <Row className="mb-4">
                                    <Col md={12}>
                                        <Form.Label className="date-label mb-3">
                                            ⚡ Quick Date Selection
                                        </Form.Label>
                                        <div className="d-flex gap-2 flex-wrap align-items-center justify-content-between">
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Button
                                                    variant={dateRangeType === 'today' ? 'primary' : 'outline-primary'}
                                                    size="sm"
                                                    onClick={() => handleQuickDateSelect('today')}
                                                    style={{
                                                        borderRadius: '8px',
                                                        fontWeight: '600',
                                                        padding: '8px 20px',
                                                        minWidth: '100px',
                                                        background: dateRangeType === 'today' ? 'linear-gradient(135deg, #87CEEB 0%, #17a2b8 100%)' : 'transparent',
                                                        border: dateRangeType === 'today' ? 'none' : '2px solid #17a2b8',
                                                        color: dateRangeType === 'today' ? 'white' : '#17a2b8',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    📅 Today
                                                </Button>
                                                <Button
                                                    variant={dateRangeType === 'week' ? 'primary' : 'outline-primary'}
                                                    size="sm"
                                                    onClick={() => handleQuickDateSelect('week')}
                                                    style={{
                                                        borderRadius: '8px',
                                                        fontWeight: '600',
                                                        padding: '8px 20px',
                                                        minWidth: '100px',
                                                        background: dateRangeType === 'week' ? 'linear-gradient(135deg, #87CEEB 0%, #17a2b8 100%)' : 'transparent',
                                                        border: dateRangeType === 'week' ? 'none' : '2px solid #17a2b8',
                                                        color: dateRangeType === 'week' ? 'white' : '#17a2b8',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    📆 This Week
                                                </Button>
                                                <Button
                                                    variant={dateRangeType === 'month' ? 'primary' : 'outline-primary'}
                                                    size="sm"
                                                    onClick={() => handleQuickDateSelect('month')}
                                                    style={{
                                                        borderRadius: '8px',
                                                        fontWeight: '600',
                                                        padding: '8px 20px',
                                                        minWidth: '100px',
                                                        background: dateRangeType === 'month' ? 'linear-gradient(135deg, #87CEEB 0%, #17a2b8 100%)' : 'transparent',
                                                        border: dateRangeType === 'month' ? 'none' : '2px solid #17a2b8',
                                                        color: dateRangeType === 'month' ? 'white' : '#17a2b8',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    🗓️ This Month
                                                </Button>
                                                <Button
                                                    variant={dateRangeType === 'custom' ? 'primary' : 'outline-primary'}
                                                    size="sm"
                                                    onClick={() => handleQuickDateSelect('custom')}
                                                    style={{
                                                        borderRadius: '8px',
                                                        fontWeight: '600',
                                                        padding: '8px 20px',
                                                        minWidth: '120px',
                                                        background: dateRangeType === 'custom' ? 'linear-gradient(135deg, #87CEEB 0%, #17a2b8 100%)' : 'transparent',
                                                        border: dateRangeType === 'custom' ? 'none' : '2px solid #17a2b8',
                                                        color: dateRangeType === 'custom' ? 'white' : '#17a2b8',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    🎯 Custom Range
                                                </Button>
                                            </div>
                                            <div className="d-flex gap-3 align-items-center">
                                                <Form.Check
                                                    type="radio"
                                                    label="Internal Examiner"
                                                    name="examinerType"
                                                    id="internalExaminer"
                                                    value="internal"
                                                    checked={examinerTypeSelection === 'internal'}
                                                    onChange={(e) => setExaminerTypeSelection(e.target.value)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <Form.Check
                                                    type="radio"
                                                    label="External Examiner"
                                                    name="examinerType"
                                                    id="externalExaminer"
                                                    value="external"
                                                    checked={examinerTypeSelection === 'external'}
                                                    onChange={(e) => setExaminerTypeSelection(e.target.value)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                
                                <Row className="align-items-end g-4">
                                    <Col md={3} style={{ position: 'relative' }}>
                                        <Form.Group>
                                            <Form.Label className="date-label">
                                                <FaCalendarAlt className="date-label-icon" />
                                                From Date
                                            </Form.Label>
                                            <DatePicker
                                                selected={fromDate}
                                                onChange={(date) => {
                                                    setFromDate(date);
                                                    setDateRangeType('custom');
                                                }}
                                                selectsStart
                                                startDate={fromDate}
                                                endDate={endDate}
                                                minDate={new Date(2025, 0, 1)}
                                                maxDate={endDate || new Date()}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="DD/MM/YYYY"
                                                customInput={<CustomDateInput />}
                                                showPopperArrow={false}
                                                showMonthDropdown
                                                showYearDropdown
                                                dropdownMode="select"
                                                popperPlacement="bottom-start"
                                                disabled={dateRangeType !== 'custom'}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3} style={{ position: 'relative' }}>
                                        <Form.Group>
                                            <Form.Label className="date-label">
                                                <FaCalendarAlt className="date-label-icon" />
                                                End Date
                                            </Form.Label>
                                            <DatePicker
                                                selected={endDate}
                                                onChange={(date) => {
                                                    setEndDate(date);
                                                    setDateRangeType('custom');
                                                }}
                                                selectsEnd
                                                startDate={fromDate}
                                                endDate={endDate}
                                                minDate={fromDate}
                                                maxDate={new Date()}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="DD/MM/YYYY"
                                                customInput={<CustomDateInput />}
                                                showPopperArrow={false}
                                                showMonthDropdown
                                                showYearDropdown
                                                dropdownMode="select"
                                                popperPlacement="bottom-start"
                                                disabled={dateRangeType !== 'custom'}
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="date-label" style={{ fontWeight: '600' }}>
                                                🏕️ Camp & Officer Details
                                            </Form.Label>
                                            <Form.Select
                                                value={`${campId}-${campOfficerId}`}
                                                onChange={(e) => {
                                                    const selectedValue = e.target.value;
                                                    const selectedItem = Camp_Details.find(item => item.value === selectedValue);
                                                    if (selectedItem) {
                                                        setCampId(selectedItem.campId);
                                                        setCampOfficerId(selectedItem.campOfficerId);
                                                    }
                                                }}
                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #e3f2fd',
                                                    padding: '12px 15px',
                                                    fontSize: '14px',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: '#fff',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}
                                                className="examiner-select"
                                                onFocus={(e) => e.target.style.borderColor = '#17a2b8'}
                                                onBlur={(e) => e.target.style.borderColor = '#e3f2fd'}
                                            >
                                                {Camp_Details.map((item, index) => (
                                                    <option key={index} value={item.value}>
                                                        {item.displayText}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                </Row>
                                <Row className="mt-4">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={{
                                                fontWeight: '600',
                                                color: '#2e7d32',
                                                fontSize: '13px',
                                                display: 'block',
                                                marginBottom: '8px'
                                            }}>
                                                🎓 Degree
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={degreeName}
                                                placeholder="Enter Degree"
                                                onChange={(e) => setDegreeName(e.target.value)}

                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #81c784',
                                                    padding: '12px 15px',
                                                    fontSize: '14px',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: '#fff',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#66bb6a'}
                                                onBlur={(e) => e.target.style.borderColor = '#81c784'}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={{
                                                fontWeight: '600',
                                                color: '#2e7d32',
                                                fontSize: '13px',
                                                display: 'block',
                                                marginBottom: '8px'
                                            }}>
                                                🏫 Campus Name
                                            </Form.Label>
                                            <Form.Select
                                                value={campusName}
                                                onChange={(e) => setCampusName(e.target.value)}
                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #81c784',
                                                    padding: '12px 15px',
                                                    fontSize: '14px',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: '#fff',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#66bb6a'}
                                                onBlur={(e) => e.target.style.borderColor = '#81c784'}
                                            >
                                                <option value="">Select Campus</option>
                                                {
                                                    campusDetailsData &&
                                                    campusDetailsData.map((campus, index) => (
                                                        <option key={index} value={campus.campus_Name}>
                                                            {campus.campus_Name}
                                                        </option>
                                                    ))
                                                }
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                </Row>

                            </div>

                            <Row className="mt-4">
                                <Col md={12} className="d-flex justify-content-center">
                                    <div style={{
                                        background: 'linear-gradient(135deg, #fff8e1 0%, #ffe082 100%)',
                                        padding: '16px 32px',
                                        borderRadius: '12px',
                                        border: '2px solid #ffd54f',
                                        boxShadow: '0 4px 12px rgba(255, 193, 7, 0.15)'
                                    }}>
                                        <Form.Group className="mb-0">
                                            <Form.Check
                                                type="checkbox"
                                                id="eligibility-checkbox"
                                                label="✓ Confirm DA / TA Eligibility"
                                                checked={eligibilityChecked}
                                                //onChange={(e) =>  setEligibilityChecked(e.target.checked)}
                                                onChange={(e) => {handleeligibility(e, e.target.checked)}}
                                                style={{
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    color: '#f57c00',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        </Form.Group>
                                    </div>
                                </Col>
                            </Row>

                            {eligibilityChecked && (
                                <>
                                <Row className="mt-4" style={{
                                    background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    border: '2px solid #ce93d8',
                                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.1)'
                                }}>
                                    <Col md={12} className="mb-3">
                                        <h6 style={{
                                            color: '#6a1b9a',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            fontSize: '15px',
                                            marginBottom: '16px'
                                        }}>
                                            💰 DA & TA Allowance Configuration
                                        </h6>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={{
                                                fontWeight: '600',
                                                color: '#6a1b9a',
                                                fontSize: '13px',
                                                textAlign: 'center',
                                                display: 'block',
                                                marginBottom: '8px'
                                            }}>
                                                📊 Dearness Allowance (DA)
                                            </Form.Label>
                                            <Form.Select
                                                value={daType}
                                                //onChange={(e) => setDaType(e.target.value)}
                                                onChange={(e) => dahandle(e, e.target.value)}
                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #ce93d8',
                                                    padding: '12px 15px',
                                                    fontSize: '14px',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: '#fff',
                                                    boxShadow: '0 2px 8px rgba(156, 39, 176, 0.1)'
                                                }}
                                                className="da-select"
                                                onFocus={(e) => e.target.style.borderColor = '#ab47bc'}
                                                onBlur={(e) => e.target.style.borderColor = '#ce93d8'}
                                            >
                                                <option value="0">Select DA Type</option>
                                                {

                                                    tadaAllowanceData?.map((daItem, index) => (
                                                        <option key={index} value={daItem.id}>
                                                            {(!daItem.remuneration_name || daItem.remuneration_name === "" || daItem.remuneration_name === "null") ? daItem.particulars_name : `${daItem.particulars_name} - ${daItem.remuneration_name}`}
                                                        </option>
                                                    ))
                                                }

                                                {/* <option value="1">Standard DA - 100%</option>
                                                <option value="2">Reduced DA - 75%</option>
                                                <option value="3">Half DA - 50%</option>
                                                <option value="4">Minimal DA - 25%</option> */}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label style={{
                                                fontWeight: '600',
                                                color: '#6a1b9a',
                                                fontSize: '13px',
                                                textAlign: 'center',
                                                // display: 'block',
                                                marginBottom: '8px'
                                            }}>
                                                 ₹  Additional Amount
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="₹ 0.00"
                                                value={daadditionalAmount}
                                                onChange={(e) => setDaAdditionalAmount(e.target.value)}
                                                // disabled
                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #ce93d8',
                                                    padding: '12px 15px',
                                                    fontSize: '14px',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: '#f5f5f5',
                                                    textAlign: 'center',
                                                    fontWeight: '600',
                                                    boxShadow: '0 2px 8px rgba(156, 39, 176, 0.1)',
                                                    cursor: 'not-allowed'
                                                }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label style={{
                                                fontWeight: '600',
                                                color: '#6a1b9a',
                                                fontSize: '13px',
                                                textAlign: 'center',
                                                // display: 'block',
                                                marginBottom: '8px'
                                            }}>
                                                ₹ Da Per Day
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="₹ 0.00"
                                                value={daAmount}
                                                onChange={(e) => setDaAmount(e.target.value)}
                                                // disabled
                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #ce93d8',
                                                    padding: '12px 15px',
                                                    fontSize: '14px',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: '#f5f5f5',
                                                    textAlign: 'center',
                                                    fontWeight: '600',
                                                    boxShadow: '0 2px 8px rgba(156, 39, 176, 0.1)',
                                                    cursor: 'not-allowed'
                                                }}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Travelling Details Section - Shows when DA value is 9 or External Examiner is selected */}
                                {(daType === '9' || examinerTypeSelection === 'external') && (
                                    <Row className="mt-3" style={{
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: '2px solid #81c784',
                                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
                                        backgroundColor: '#f9fbe7'
                                    }}>
                                        <Col md={12}>
                                            <h6 style={{
                                                fontWeight: '700',
                                                color: '#388e3c',
                                                fontSize: '15px',
                                                marginBottom: '16px'
                                            }}>
                                                🚗 Travelling Details
                                            </h6>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label style={{
                                                    fontWeight: '600',
                                                    color: '#388e3c',
                                                    fontSize: '13px',
                                                    marginBottom: '8px'
                                                }}>
                                                    📍 Travelling From
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter starting location"
                                                    value={travellingFrom}
                                                    onChange={(e) => setTravellingFrom(e.target.value)}
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #a5d6a7',
                                                        padding: '12px 15px',
                                                        fontSize: '14px',
                                                        transition: 'all 0.3s ease',
                                                        backgroundColor: '#fff',
                                                        boxShadow: '0 2px 8px rgba(56, 142, 60, 0.1)'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#66bb6a'}
                                                    onBlur={(e) => e.target.style.borderColor = '#a5d6a7'}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label style={{
                                                    fontWeight: '600',
                                                    color: '#388e3c',
                                                    fontSize: '13px',
                                                    marginBottom: '8px'
                                                }}>
                                                    📍 Travelling To
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter destination"
                                                    value={travellingTo}
                                                    onChange={(e) => setTravellingTo(e.target.value)}
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #a5d6a7',
                                                        padding: '12px 15px',
                                                        fontSize: '14px',
                                                        transition: 'all 0.3s ease',
                                                        backgroundColor: '#fff',
                                                        boxShadow: '0 2px 8px rgba(56, 142, 60, 0.1)'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#66bb6a'}
                                                    onBlur={(e) => e.target.style.borderColor = '#a5d6a7'}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label style={{
                                                    fontWeight: '600',
                                                    color: '#388e3c',
                                                    fontSize: '13px',
                                                    marginBottom: '8px'
                                                }}>
                                                    🏢 Department
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter department"
                                                    value={department}
                                                    onChange={(e) => setDepartment(e.target.value)}
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #a5d6a7',
                                                        padding: '12px 15px',
                                                        fontSize: '14px',
                                                        transition: 'all 0.3s ease',
                                                        backgroundColor: '#fff',
                                                        boxShadow: '0 2px 8px rgba(56, 142, 60, 0.1)'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#66bb6a'}
                                                    onBlur={(e) => e.target.style.borderColor = '#a5d6a7'}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label style={{
                                                    fontWeight: '600',
                                                    color: '#388e3c',
                                                    fontSize: '13px',
                                                    marginBottom: '8px'
                                                }}>
                                                    🏫 Institution Name
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter institution name"
                                                    value={institutionName}
                                                    onChange={(e) => setInstitutionName(e.target.value)}
                                                    style={{
                                                        borderRadius: '10px',
                                                        border: '2px solid #a5d6a7',
                                                        padding: '12px 15px',
                                                        fontSize: '14px',
                                                        transition: 'all 0.3s ease',
                                                        backgroundColor: '#fff',
                                                        boxShadow: '0 2px 8px rgba(56, 142, 60, 0.1)'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#66bb6a'}
                                                    onBlur={(e) => e.target.style.borderColor = '#a5d6a7'}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                )}

                                {/* <Col md={4}>
                                        <Form.Group>
                                            <Form.Label style={{
                                                fontWeight: '600',
                                                color: '#6a1b9a',
                                                fontSize: '13px',
                                                textAlign: 'center',
                                                display: 'block',
                                                marginBottom: '8px'
                                            }}>
                                                🚗 Travel Allowance (TA)
                                            </Form.Label>
                                            <Form.Select
                                                value={taType}
                                                onChange={(e) => setTaType(e.target.value)}
                                                disabled
                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #ce93d8',
                                                    padding: '12px 15px',
                                                    fontSize: '14px',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: '#fff',
                                                    boxShadow: '0 2px 8px rgba(156, 39, 176, 0.1)'
                                                }}
                                                className="ta-select"
                                                onFocus={(e) => e.target.style.borderColor = '#ab47bc'}
                                                onBlur={(e) => e.target.style.borderColor = '#ce93d8'}
                                            >
                                                <option value="1">Full TA - Long Distance</option>
                                                <option value="2">Standard TA - Medium</option>
                                                <option value="3">Local TA - Short Distance</option>
                                                <option value="4">Minimal TA - Campus</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label style={{
                                                fontWeight: '600',
                                                color: '#6a1b9a',
                                                fontSize: '13px',
                                                textAlign: 'center',
                                                display: 'block',
                                                marginBottom: '8px'
                                            }}>
                                                ₹ Amount
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="₹ 0.00"
                                                value={taAmount}
                                                onChange={(e) => setTaAmount(e.target.value)}
                                                disabled
                                                style={{
                                                    borderRadius: '10px',
                                                    border: '2px solid #ce93d8',
                                                    padding: '12px 15px',
                                                    fontSize: '14px',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: '#f5f5f5',
                                                    textAlign: 'center',
                                                    fontWeight: '600',
                                                    boxShadow: '0 2px 8px rgba(156, 39, 176, 0.1)',
                                                    cursor: 'not-allowed'
                                                }}
                                            />
                                        </Form.Group>
                                  </Col> 
                                </Row> */}
                                </>
                            )}

                            <Row className="mt-5">

                                <Col md={12}>
                                    <Button
                                        variant="primary"
                                        onClick={handleGenerateReport}
                                        disabled={loading || !fromDate || !endDate}
                                        className="w-100 generate-btn d-flex align-items-center justify-content-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="fa-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <FaFileInvoiceDollar />
                                                Generate Report
                                            </>
                                        )}
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                )}
            </UploadPageLayout>

            {/* ExaminerBankModal - Shows when ExaminerAccount is false */}
            <ExaminerBankModal
                show={showBankModal}
                onHide={handleCloseModal}
                onSuccess={handleBankAccountSuccess}
                bankDetails={bankDetails}
            />
            <ExaminerPaymentModal
                show={showPaymentModal}
                onHide={handlePaymentCloseModal}
                paymentData={{
                    fromDate: fromDate,
                    toDate: endDate,
                    campId: campId,
                    campOfficerId: campOfficerId,
                    eligibilityChecked: eligibilityChecked,
                    daAmount: daAmount,
                    taAmount: taAmount,
                    taType: taType,
                    daType: daType,
                    noDays: noDays,
                    additionalAmount: daadditionalAmount,
                    daTypeText: datypetext,
                    bankDetails: bankDetails,
                    examinerType: examinerType,
                    examinerTypeSelection: examinerTypeSelection === 'external' ? 2 : 1,
                    travellingFrom: travellingFrom,
                    travellingTo: travellingTo,
                    department: department,
                    institutionName: institutionName,
                    totalAmount: 0,
                    valuationRecords,
                    evaluatorName: userInfo?.name,
                    evaluatorId: userInfo?.username,
                    MobileNumber: userInfo?.Mobile_Number,
                    campusName: campusName,
                    degreeName: degreeName,
                    EmailId: userInfo?.Email_Id,

                }}
            />
            <ChiefExaminerPaymentModal
                show={showChiefPaymentModal}
                onHide={handleChiefPaymentCloseModal}
                paymentData={{
                    fromDate: fromDate,
                    toDate: endDate,
                    campId: campId,
                    campOfficerId: campOfficerId,
                    eligibilityChecked: eligibilityChecked,
                    daAmount: daAmount,
                    taAmount: taAmount,
                    taType: taType,
                    daType: daType,         
                    noDays: noDays,
                    additionalAmount: daadditionalAmount,
                    daTypeText: datypetext,
                    bankDetails: bankDetails,
                    examinerType: examinerType,
                    examinerTypeSelection: examinerTypeSelection === 'external' ? 2 : 1,
                    travellingFrom: travellingFrom,
                    travellingTo: travellingTo,
                    department: department,
                    institutionName: institutionName,
                    totalAmount: 0,
                    valuationRecords,
                    evaluatorName: userInfo?.name,
                    evaluatorId: userInfo?.username,
                    MobileNumber: userInfo?.Mobile_Number,
                    campusName: campusName,
                    degreeName: degreeName,
                    EmailId: userInfo?.Email_Id,
                }}
            />
            
            {/* IFSC Code Modal */}
            <Modal show={showIfscModal} onHide={handleCloseIfscModal} size="lg" centered>
                <Modal.Header 
                    closeButton 
                    style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderBottom: 'none',
                        padding: '20px 24px'
                    }}
                >
                    <Modal.Title style={{ fontWeight: '700', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="bi bi-bank2" style={{ fontSize: '24px' }}></i>
                        IFSC Code Lookup
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '32px', background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)' }}>
                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label style={{ 
                                fontWeight: '600', 
                                color: '#495057',
                                fontSize: '14px',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <i className="bi bi-credit-card-2-front" style={{ color: '#667eea' }}></i>
                                Enter IFSC Code <span style={{ color: '#dc3545' }}>*</span>
                            </Form.Label>
                            <div className="d-flex gap-3">
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., SBIN0001234"
                                    value={ifscCode}
                                    onChange={(e) => {
                                        setIfscCode(e.target.value.toUpperCase());
                                        setIfscError('');
                                    }}
                                    maxLength={11}
                                    style={{
                                        textTransform: 'uppercase',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        padding: '14px 18px',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '12px',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: '#fff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                    }}
                                    isInvalid={!!ifscError}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e0e0e0';
                                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                    }}
                                />
                                <Button
                                    onClick={handleFetchIfscDetails}
                                    disabled={ifscLoading || !ifscCode}
                                    style={{
                                        minWidth: '140px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '14px 24px',
                                        fontWeight: '600',
                                        fontSize: '15px',
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!ifscLoading && ifscCode) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                                    }}
                                >
                                    {ifscLoading ? (
                                        <>
                                            <FaSpinner className="spinner-border spinner-border-sm me-2" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-search me-2"></i>
                                            Search
                                        </>
                                    )}
                                </Button>
                            </div>
                            {ifscError && (
                                <div className="text-danger mt-3" style={{
                                    padding: '12px 16px',
                                    background: '#fff5f5',
                                    borderRadius: '8px',
                                    border: '1px solid #feb2b2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '18px' }}></i>
                                    <span style={{ fontWeight: '500' }}>{ifscError}</span>
                                </div>
                            )}
                            <Form.Text style={{ 
                                color: '#6c757d',
                                fontSize: '13px',
                                marginTop: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <i className="bi bi-info-circle"></i>
                                Enter 11-character IFSC code to fetch bank and branch details
                            </Form.Text>
                        </Form.Group>

                        {ifscBankData && (
                            <div 
                                className="mt-4" 
                                style={{
                                    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                                    padding: '24px',
                                    borderRadius: '16px',
                                    border: '2px solid #66bb6a',
                                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.2)',
                                    animation: 'fadeIn 0.4s ease-in-out'
                                }}
                            >
                                <h6 className="mb-4" style={{ 
                                    color: '#2e7d32', 
                                    fontWeight: '700',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <i className="bi bi-check-circle-fill" style={{ fontSize: '20px' }}></i>
                                    Bank Details Found
                                </h6>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            padding: '14px',
                                            borderRadius: '10px',
                                            height: '100%'
                                        }}>
                                            <strong style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="bi bi-building" style={{ color: '#667eea' }}></i>
                                                Bank Name:
                                            </strong>
                                            <div style={{ fontSize: '15px', color: '#212529', marginTop: '6px', fontWeight: '600' }}>
                                                {ifscBankData.BANK}
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            padding: '14px',
                                            borderRadius: '10px',
                                            height: '100%'
                                        }}>
                                            <strong style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="bi bi-hash" style={{ color: '#667eea' }}></i>
                                                IFSC Code:
                                            </strong>
                                            <div style={{ 
                                                fontSize: '16px', 
                                                color: '#212529', 
                                                marginTop: '6px', 
                                                fontWeight: '700',
                                                fontFamily: 'monospace',
                                                letterSpacing: '1px'
                                            }}>
                                                {ifscBankData.IFSC}
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            padding: '14px',
                                            borderRadius: '10px',
                                            height: '100%'
                                        }}>
                                            <strong style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="bi bi-shop" style={{ color: '#667eea' }}></i>
                                                Branch:
                                            </strong>
                                            <div style={{ fontSize: '15px', color: '#212529', marginTop: '6px', fontWeight: '500' }}>
                                                {ifscBankData.BRANCH}
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            padding: '14px',
                                            borderRadius: '10px',
                                            height: '100%'
                                        }}>
                                            <strong style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="bi bi-pin-map" style={{ color: '#667eea' }}></i>
                                                City:
                                            </strong>
                                            <div style={{ fontSize: '15px', color: '#212529', marginTop: '6px', fontWeight: '500' }}>
                                                {ifscBankData.CITY}
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            padding: '14px',
                                            borderRadius: '10px',
                                            height: '100%'
                                        }}>
                                            <strong style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="bi bi-geo-alt" style={{ color: '#667eea' }}></i>
                                                District:
                                            </strong>
                                            <div style={{ fontSize: '15px', color: '#212529', marginTop: '6px', fontWeight: '500' }}>
                                                {ifscBankData.DISTRICT}
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            padding: '14px',
                                            borderRadius: '10px',
                                            height: '100%'
                                        }}>
                                            <strong style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="bi bi-map" style={{ color: '#667eea' }}></i>
                                                State:
                                            </strong>
                                            <div style={{ fontSize: '15px', color: '#212529', marginTop: '6px', fontWeight: '500' }}>
                                                {ifscBankData.STATE}
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={12}>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            padding: '14px',
                                            borderRadius: '10px'
                                        }}>
                                            <strong style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="bi bi-geo" style={{ color: '#667eea' }}></i>
                                                Address:
                                            </strong>
                                            <div style={{ fontSize: '15px', color: '#212529', marginTop: '6px', lineHeight: '1.6' }}>
                                                {ifscBankData.ADDRESS}
                                            </div>
                                        </div>
                                    </Col>
                                    {(ifscBankData.CONTACT || ifscBankData.MICR) && (
                                        <>
                                            {ifscBankData.CONTACT && (
                                                <Col md={6}>
                                                    <div style={{
                                                        background: 'rgba(255, 255, 255, 0.7)',
                                                        padding: '14px',
                                                        borderRadius: '10px',
                                                        height: '100%'
                                                    }}>
                                                        <strong style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <i className="bi bi-telephone" style={{ color: '#667eea' }}></i>
                                                            Contact:
                                                        </strong>
                                                        <div style={{ fontSize: '15px', color: '#212529', marginTop: '6px', fontWeight: '500' }}>
                                                            {ifscBankData.CONTACT}
                                                        </div>
                                                    </div>
                                                </Col>
                                            )}
                                            {ifscBankData.MICR && (
                                                <Col md={6}>
                                                    <div style={{
                                                        background: 'rgba(255, 255, 255, 0.7)',
                                                        padding: '14px',
                                                        borderRadius: '10px',
                                                        height: '100%'
                                                    }}>
                                                        <strong style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <i className="bi bi-upc-scan" style={{ color: '#667eea' }}></i>
                                                            MICR Code:
                                                        </strong>
                                                        <div style={{ 
                                                            fontSize: '15px', 
                                                            color: '#212529', 
                                                            marginTop: '6px', 
                                                            fontWeight: '600',
                                                            fontFamily: 'monospace'
                                                        }}>
                                                            {ifscBankData.MICR}
                                                        </div>
                                                    </div>
                                                </Col>
                                            )}
                                        </>
                                    )}
                                </Row>
                            </div>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer style={{ 
                    backgroundColor: '#f8f9fa', 
                    borderTop: '2px solid #e9ecef',
                    padding: '20px 32px'
                }}>
                    {ifscSaveSuccess && (
                        <div className="text-success me-auto" style={{
                            padding: '10px 16px',
                            background: '#d4edda',
                            borderRadius: '8px',
                            border: '1px solid #c3e6cb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: '600'
                        }}>
                            <i className="bi bi-check-circle-fill" style={{ fontSize: '18px' }}></i>
                            Bank details saved successfully!
                        </div>
                    )}
                    <Button 
                        variant="secondary" 
                        onClick={handleCloseIfscModal}
                        style={{
                            borderRadius: '10px',
                            padding: '12px 24px',
                            fontWeight: '600',
                            border: 'none',
                            background: '#6c757d',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#5a6268';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#6c757d';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        Close
                    </Button>
                    {ifscBankData && (
                        <Button
                            onClick={handleSaveBankDetails}
                            disabled={ifscSaveLoading}
                            style={{
                                minWidth: '150px',
                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '12px 24px',
                                fontWeight: '600',
                                fontSize: '15px',
                                boxShadow: '0 4px 12px rgba(17, 153, 142, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!ifscSaveLoading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(17, 153, 142, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(17, 153, 142, 0.3)';
                            }}
                        >
                            {ifscSaveLoading ? (
                                <>
                                    <FaSpinner className="spinner-border spinner-border-sm me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-cloud-upload me-2"></i>
                                    Save Details
                                </>
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Confirmation Modal for Missing Fields */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: '0' }}>
                    <Modal.Title style={{ color: '#ff6b6b', fontWeight: '600' }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Missing Required Fields
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ paddingTop: '10px' }}>
                    <p style={{ fontSize: '15px', marginBottom: '15px' }}>
                        The following fields are empty for External Examiner:
                    </p>
                    <ul style={{ color: '#dc3545', fontWeight: '500' }}>
                        {missingFieldsList.map((field, index) => (
                            <li key={index}>{field}</li>
                        ))}
                    </ul>
                    <p style={{ fontSize: '15px', marginTop: '15px', fontWeight: '500' }}>
                        Do you want to continue without these details?
                    </p>
                </Modal.Body>
                <Modal.Footer style={{ borderTop: 'none', justifyContent: 'center', gap: '15px' }}>
                    <Button
                        variant="danger"
                        onClick={() => {
                            setShowConfirmModal(false);
                            setErrorRemarks('Please fill in the required fields: ' + missingFieldsList.join(', '));
                        }}
                        style={{
                            minWidth: '120px',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            fontWeight: '600'
                        }}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        No
                    </Button>
                    <Button
                        variant="success"
                        onClick={() => {
                            setShowConfirmModal(false);
                            setNoDays(Math.floor((new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) - new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())) / (1000 * 60 * 60 * 24)) + 1);
                            setLoading(true);
                            if (userRole === '2') {
                                setShowPaymentModal(true);
                            } else if (userRole === '1') {
                                setShowChiefPaymentModal(true);
                            }
                            setTimeout(() => {
                                setLoading(false);
                            }, 1000);
                        }}
                        style={{
                            minWidth: '120px',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            fontWeight: '600'
                        }}
                    >
                        <i className="bi bi-check-circle me-2"></i>
                        Yes, Continue
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default ExaminerPaypdf