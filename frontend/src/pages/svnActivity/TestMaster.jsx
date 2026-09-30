import React, { useState } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Badge, Modal, Spinner, Alert } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaFileExcel, FaDatabase, FaImages } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { 
  useGetAllTestMastersQuery,
  useCreateTestMasterMutation,
  useUpdateTestMasterMutation,
  useDeleteTestMasterMutation,
  useDeleteTestMarksByTestCodeMutation,
  useDeleteDistrictTestDataMutation,
  useToggleDistrictImageStatusMutation
} from '../../redux-slice/testMasterApiSlice';
import { useGetDistrictDataQuery } from '../../redux-slice/GeneralGetSqlOperationApiSlice';
import { useGetAllTypeExamsQuery } from '../../redux-slice/typeExamApiSlice';
import { useGetImageCountsByDistrictQuery } from '../../redux-slice/imageUploadApiSlice';

// Custom styles for DatePicker and Table
const datePickerStyles = `
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__input-container {
    width: 100%;
  }
  .react-datepicker {
    font-family: inherit;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  }
  .react-datepicker__header {
    background-color: #2c5aa0;
    border-bottom: none;
    border-radius: 0.375rem 0.375rem 0 0;
  }
  .react-datepicker__current-month,
  .react-datepicker__day-name {
    color: white;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background-color: #2c5aa0;
    border-radius: 0.25rem;
  }
  .react-datepicker__day:hover {
    background-color: #e7f3ff;
    border-radius: 0.25rem;
  }
  .react-datepicker__day--today {
    font-weight: bold;
    color: #2c5aa0;
  }

  /* Fixed Column Styles */
  .rdt_Table {
    position: relative !important;
  }

  .rdt_TableBody {
    overflow-x: auto !important;
  }

  /* Fixed S.No Column - Header */
  .rdt_TableHeadRow > *:nth-child(1),
  .rdt_TableHeadRow > div:nth-child(1) {
    position: sticky !important;
    left: 0 !important;
    background-color: #f8f9fa !important;
    z-index: 5 !important;
    border-right: 2px solid #dee2e6 !important;
  }

  /* Fixed S.No Column - Body Cells */
  .rdt_TableBody .rdt_TableRow > *:nth-child(1),
  .rdt_TableBody .rdt_TableRow > div:nth-child(1),
  .rdt_TableRow > *:nth-child(1),
  .rdt_TableRow > div:nth-child(1) {
    position: sticky !important;
    left: 0 !important;
    background-color: #fff !important;
    z-index: 3 !important;
    border-right: 2px solid #dee2e6 !important;
  }

  /* Fixed Test Code Column - Header */
  .rdt_TableHeadRow > *:nth-child(2),
  .rdt_TableHeadRow > div:nth-child(2) {
    position: sticky !important;
    left: 70px !important;
    background-color: #f8f9fa !important;
    z-index: 5 !important;
    box-shadow: 2px 0 5px rgba(0,0,0,0.1) !important;
    border-right: 2px solid #dee2e6 !important;
  }

  /* Fixed Test Code Column - Body Cells */
  .rdt_TableBody .rdt_TableRow > *:nth-child(2),
  .rdt_TableBody .rdt_TableRow > div:nth-child(2),
  .rdt_TableRow > *:nth-child(2),
  .rdt_TableRow > div:nth-child(2) {
    position: sticky !important;
    left: 70px !important;
    background-color: #fff !important;
    z-index: 3 !important;
    box-shadow: 2px 0 5px rgba(0,0,0,0.1) !important;
    border-right: 2px solid #dee2e6 !important;
  }

  /* Hover effects */
  .rdt_TableBody .rdt_TableRow:hover > *:nth-child(1),
  .rdt_TableBody .rdt_TableRow:hover > *:nth-child(2),
  .rdt_TableBody .rdt_TableRow:hover > div:nth-child(1),
  .rdt_TableBody .rdt_TableRow:hover > div:nth-child(2),
  .rdt_TableRow:hover > *:nth-child(1),
  .rdt_TableRow:hover > *:nth-child(2),
  .rdt_TableRow:hover > div:nth-child(1),
  .rdt_TableRow:hover > div:nth-child(2) {
    background-color: #f1f3f5 !important;
  }

  /* Striped row support */
  .rdt_TableBody .rdt_TableRow:nth-child(odd) > *:nth-child(1),
  .rdt_TableBody .rdt_TableRow:nth-child(odd) > *:nth-child(2),
  .rdt_TableBody .rdt_TableRow:nth-child(odd) > div:nth-child(1),
  .rdt_TableBody .rdt_TableRow:nth-child(odd) > div:nth-child(2) {
    background-color: #f8f9fa !important;
  }

  .rdt_TableBody .rdt_TableRow:nth-child(even) > *:nth-child(1),
  .rdt_TableBody .rdt_TableRow:nth-child(even) > *:nth-child(2),
  .rdt_TableBody .rdt_TableRow:nth-child(even) > div:nth-child(1),
  .rdt_TableBody .rdt_TableRow:nth-child(even) > div:nth-child(2) {
    background-color: #fff !important;
  }

  /* Ensure fixed columns work on striped rows */
  .rdt_TableRow:nth-child(odd) > *:nth-child(1),
  .rdt_TableRow:nth-child(odd) > *:nth-child(2),
  .rdt_TableRow:nth-child(odd) > div:nth-child(1),
  .rdt_TableRow:nth-child(odd) > div:nth-child(2) {
    background-color: #f8f9fa !important;
  }

  .rdt_TableRow:nth-child(even) > *:nth-child(1),
  .rdt_TableRow:nth-child(even) > *:nth-child(2),
  .rdt_TableRow:nth-child(even) > div:nth-child(1),
  .rdt_TableRow:nth-child(even) > div:nth-child(2) {
    background-color: #fff !important;
  }
`;



const DataTable = DataTableBase.default || DataTableBase;

const TestMaster = () => {
  // Date formatting functions
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    // If already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // If in YYYY-MM-DD format (from date input), convert to DD-MM-YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    }
    
    // Try parsing as date object
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch {
      return dateString;
    }
    
    return dateString;
  };

  const stringToDate = (dateString) => {
    if (!dateString) return null;
    
    // If in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      return new Date(year, month - 1, day);
    }
    
    // If in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return new Date(year, month - 1, day);
    }
    
    // Try parsing as date
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch {
      return null;
    }
    
    return null;
  };

  const dateToString = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const { data: testMasterData, isLoading: isFetching, refetch } = useGetAllTestMastersQuery({});
  const [createTestMaster, { isLoading: isCreating }] = useCreateTestMasterMutation();
  const [updateTestMaster, { isLoading: isUpdating }] = useUpdateTestMasterMutation();
  const [deleteTestMaster, { isLoading: isDeleting }] = useDeleteTestMasterMutation();
  const [deleteTestMarks, { isLoading: isDeletingMarks }] = useDeleteTestMarksByTestCodeMutation();
  const [deleteDistrictData, { isLoading: isDeletingDistrictData }] = useDeleteDistrictTestDataMutation();
  const [toggleDistrictStatus] = useToggleDistrictImageStatusMutation();
  const { data: districtData, isLoading: isLoadingDistricts } = useGetDistrictDataQuery();
  const { data: typeExamData } = useGetAllTypeExamsQuery({});

  const [showModal, setShowModal] = useState(false);
  const [showImageStatusModal, setShowImageStatusModal] = useState(false);
  const [selectedImageStatusItem, setSelectedImageStatusItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTestCode, setDeleteTestCode] = useState(null);
  const [deleteOptions, setDeleteOptions] = useState({
    deleteResult: false,
    deleteQB: false,
    deleteQBMedium: false
  });
  const [showDistrictDeleteModal, setShowDistrictDeleteModal] = useState(false);
  const [selectedDistrictsForDelete, setSelectedDistrictsForDelete] = useState([]);
  const [districtDeleteOptions, setDistrictDeleteOptions] = useState({
    deleteResult: false,
    deleteQB: false,
    deleteQBMedium: false
  });
  
  // Fetch image counts when modal is opened
  const { data: imageCountsData } = useGetImageCountsByDistrictQuery(
    selectedImageStatusItem?.testcode,
    { skip: !selectedImageStatusItem?.testcode }
  );
  
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentItem, setCurrentItem] = useState({
    id: null,
    testcode: '',
    testdate: '',
    sessions: '',
    no_of_ques: '',
    type_of_exam: '',
    std: '',
    exam_desc: '',
    flg: '',
    checkflg: 'N',
    Img_Upload: 'N',
    Key_Upload: 'N',
    percentile_gen: 'N',
    Test_Name: '',
    test_districts: '',
    repeaters: 'N',
    image_upload_districts: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const testMasters = testMasterData?.data || [];
  const isLoading = isFetching || isCreating || isUpdating || isDeleting;
  
  // Convert district data to options for react-select
  const districtOptions = (districtData?.data || []).map(district => ({
    value: district.DCODE,
    label: `${district.DCODE} - ${district.DNAME}`
  }));

  // Helper function to get district names from codes
  const getDistrictNames = (districtCodesString) => {
    if (!districtCodesString) return '-';
    const codes = districtCodesString.split(',').map(code => code.trim());
    const districts = districtData?.data || [];
    const names = codes.map(code => {
      const district = districts.find(d => d.DCODE === code);
      return district ? district.DNAME : code;
    });
    return names.join(', ');
  };

  // Helper function to format session display
  const formatSessionDisplay = (sessionValue) => {
    if (sessionValue === '1' || sessionValue === 1) return 'FN';
    if (sessionValue === '2' || sessionValue === 2) return 'AN';
    return sessionValue || '-';
  };

  // Helper function to get type of exam description
  const getTypeExamDesc = (typeCode) => {
    if (!typeCode) return '-';
    const typeExams = typeExamData?.data || [];
    const typeExam = typeExams.find(t => t.type_of_exam_code === typeCode);
    return typeExam ? typeExam.type_of_exam_desc : typeCode;
  };

  // Helper function to format standard display
  const formatStandardDisplay = (std) => {
    if (!std) return '-';
    return `${std}th`;
  };

  // Export to Excel Function
  const exportToExcel = () => {
    if (!filteredTestMasters || filteredTestMasters.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const exportData = filteredTestMasters.map((item, index) => ({
      'S.No': index + 1,
      'Test Code': item.testcode || '-',
      'Repeaters': item.repeaters === 'Y' ? 'Yes' : 'No',
      'Test Name': item.Test_Name || '-',
      'Test Date': formatDateForDisplay(item.testdate),
      'Session': formatSessionDisplay(item.sessions),
      'No. of Questions': item.no_of_ques || '-',
      'Type of Exam': getTypeExamDesc(item.type_of_exam),
      'Standard': formatStandardDisplay(item.std),
      'Exam Description': item.exam_desc || '-',
      'Districts': getDistrictNames(item.test_districts || ''),
      'No. of Districts': item.test_districts ? item.test_districts.split(',').length : 0,
      'Test Status': item.checkflg === 'Y' ? 'Active' : 'Inactive',
      'Image Upload Status': item.Img_Upload === 'Y' ? 'Uploaded' : 'Pending',
      'Key Upload Status': item.Key_Upload === 'Y' ? 'Uploaded' : 'Pending',
      'Percentile Status': item.percentile_gen === 'Y' ? 'Generated' : 'Pending',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Masters');

    const fileName = `Test_Masters_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success('Excel file exported successfully!');
  };

  // Filter test masters based on search
  const filteredTestMasters = testMasters.filter(item => 
    item.testcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Test_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.testdate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const testMasterColumns = [
    {
      name: 'S.No',
      selector: (row, index) => index + 1,
      sortable: false,
      width: '70px',
      center: true,
      cell: (row, index) => <div style={{ textAlign: 'center' }}>{index + 1}</div>,
    },
    {
      name: 'Test Code',
      selector: (row) => row.testcode,
      sortable: true,
      width: '120px',
      cell: (row) => <Badge bg="primary">{row.testcode}</Badge>,
    },
    {
      name: 'Repeaters',
      selector: (row) => row.repeaters,
      sortable: true,
      width: '110px',
      cell: (row) => (
        row.repeaters === 'Y' ? (
          <Badge bg="success" pill>
            <FaCheckCircle className="me-1" />Yes
          </Badge>
        ) : (
          <Badge bg="secondary" pill>No</Badge>
        )
      ),
    },
    {
      name: 'Test Name',
      selector: (row) => row.Test_Name,
      sortable: true,
      minWidth: '200px',
      wrap: true,
      cell: (row) => <strong>{row.Test_Name}</strong>,
    },
    {
      name: 'Test Date',
      selector: (row) => row.testdate,
      sortable: true,
      width: '120px',
      cell: (row) => formatDateForDisplay(row.testdate),
    },
    {
      name: 'Sessions',
      selector: (row) => row.sessions,
      sortable: true,
      width: '100px',
      cell: (row) => <Badge bg="info">{formatSessionDisplay(row.sessions)}</Badge>,
    },
    {
      name: 'No. of Ques',
      selector: (row) => row.no_of_ques,
      sortable: true,
      right: true,
      width: '110px',
    },
    {
      name: 'Type',
      selector: (row) => row.type_of_exam,
      sortable: true,
      width: '180px',
      cell: (row) => getTypeExamDesc(row.type_of_exam),
    },
    {
      name: 'Std',
      selector: (row) => row.std,
      sortable: true,
      width: '90px',
      cell: (row) => formatStandardDisplay(row.std),
    },
    {
      name: 'Districts',
      selector: (row) => row.test_districts,
      sortable: false,
      minWidth: '220px',
      wrap: true,
      cell: (row) => (
        row.test_districts ? (
          <div>
            <Badge bg="secondary" pill className="me-1">
              {row.test_districts.split(',').length} districts
            </Badge>
            <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
              {getDistrictNames(row.test_districts).length > 50
                ? `${getDistrictNames(row.test_districts).substring(0, 50)}...`
                : getDistrictNames(row.test_districts)}
            </small>
          </div>
        ) : (
          <span className="text-muted">-</span>
        )
      ),
    },
    {
      name: 'Test Status',
      selector: (row) => row.checkflg,
      sortable: true,
      width: '130px',
      cell: (row) => (
        <Button
          variant={row.checkflg === 'Y' ? 'success' : 'secondary'}
          size="sm"
          onClick={() => handleToggleTestStatus(row)}
        >
          {row.checkflg === 'Y' ? 'Active' : 'Inactive'}
        </Button>
      ),
    },
    {
      name: 'Image Status',
      selector: (row) => row.Img_Upload,
      sortable: true,
      width: '130px',
      cell: (row) => (
        <Button
          variant={row.Img_Upload === 'Y' ? 'success' : 'secondary'}
          size="sm"
          onClick={() => handleToggleImageStatus(row)}
        >
          {row.Img_Upload === 'Y' ? 'Uploaded' : 'Pending'}
        </Button>
      ),
    },
    {
      name: 'Percentile Status',
      selector: (row) => row.percentile_gen,
      sortable: true,
      width: '150px',
      cell: (row) => (
        <Button
          variant={row.percentile_gen === 'Y' ? 'success' : 'secondary'}
          size="sm"
          onClick={() => handleTogglePercentileStatus(row)}
        >
          {row.percentile_gen === 'Y' ? 'Generated' : 'Pending'}
        </Button>
      ),
    },
    {
      name: 'View Images Upload Status',
      selector: (row) => row.testcode,
      sortable: false,
      width: '180px',
      cell: (row) => (
        <Button
          variant="info"
          size="sm"
          onClick={() => handleOpenImageStatusModal(row)}
        >
          <FaCheckCircle className="me-1" />
          View Status
        </Button>
      ),
    },
    {
      name: 'Actions',
      selector: (row) => row.id,
      sortable: false,
      width: '150px',
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleOpenModal('edit', row)}
            title="Edit Test Master"
          >
            <FaEdit />
          </Button>
          <Button
            variant="outline-warning"
            size="sm"
            onClick={() => handleDeleteTestMarks(row.testcode)}
            disabled={isDeletingMarks}
            title="Delete Test Marks & QB Data"
          >
            <FaDatabase />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleDelete(row.id)}
            title="Delete Test Master"
          >
            <FaTrash />
          </Button>
        </div>
      ),
    },
  ];

  const testMasterTableStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8f9fa',
        fontWeight: 'bold',
        fontSize: '14px',
        minHeight: '48px',
      },
    },
    rows: {
      style: {
        minHeight: '50px',
      },
    },
    cells: {
      style: {
        fontSize: '13px',
        paddingTop: '8px',
        paddingBottom: '8px',
      },
    },
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    if (mode === 'edit' && item) {
      // Initialize image_upload_districts if it doesn't exist
      const itemWithDefaults = {
        ...item,
        image_upload_districts: item.image_upload_districts || 
          (item.test_districts ? item.test_districts.split(',').map(() => 'N').join(',') : '')
      };
      setCurrentItem(itemWithDefaults);
      // Parse districts from comma-separated string to array for multi-select
      if (item.test_districts) {
        const districtCodes = item.test_districts.split(',').map(code => code.trim());
        const selected = districtOptions.filter(option => districtCodes.includes(option.value));
        setSelectedDistricts(selected);
      } else {
        setSelectedDistricts([]);
      }
    } else {
      setSelectedDistricts([]);
      setCurrentItem({
        id: null,
        testcode: '',
        testdate: '',
        sessions: '',
        no_of_ques: '',
        type_of_exam: '',
        std: '',
        exam_desc: '',
        flg: '',
        checkflg: 'N',
        Img_Upload: 'N',
        Key_Upload: 'N',
        percentile_gen: 'N',
        Test_Name: '',
        test_districts: '',
        repeaters: 'N',
        image_upload_districts: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDistricts([]);
    setCurrentItem({
      id: null,
      testcode: '',
      testdate: '',
      sessions: '',
      no_of_ques: '',
      type_of_exam: '',
      std: '',
      exam_desc: '',
      flg: '',
      checkflg: 'N',
      Img_Upload: 'N',
      Key_Upload: 'N',
      percentile_gen: 'N',
      Test_Name: '',
      test_districts: '',
      repeaters: 'N',
      image_upload_districts: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    if (date) {
      setCurrentItem(prev => ({
        ...prev,
        testdate: dateToString(date)
      }));
    } else {
      setCurrentItem(prev => ({
        ...prev,
        testdate: ''
      }));
    }
  };

  const handleDistrictChange = (selected) => {
    setSelectedDistricts(selected || []);
    // Convert array of selected options to comma-separated DCODE string
    const districtCodes = (selected || []).map(option => option.value).join(',');
    // Create N values for each district
    const imageUploadStatuses = (selected || []).map(() => 'N').join(',');
    setCurrentItem(prev => ({
      ...prev,
      test_districts: districtCodes,
      image_upload_districts: imageUploadStatuses
    }));
  };

  const handleSelectAllDistricts = () => {
    if (selectedDistricts.length === districtOptions.length) {
      // Deselect all
      setSelectedDistricts([]);
      setCurrentItem(prev => ({
        ...prev,
        test_districts: '',
        image_upload_districts: ''
      }));
    } else {
      // Select all
      setSelectedDistricts(districtOptions);
      const allCodes = districtOptions.map(option => option.value).join(',');
      const allStatuses = districtOptions.map(() => 'N').join(',');
      setCurrentItem(prev => ({
        ...prev,
        test_districts: allCodes,
        image_upload_districts: allStatuses
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for all mandatory fields
    if (!currentItem.testcode) {
      toast.error('Test code is required');
      return;
    }
    if (!currentItem.testdate) {
      toast.error('Test date is required');
      return;
    }
    if (!currentItem.Test_Name) {
      toast.error('Test name is required');
      return;
    }
    if (!currentItem.sessions) {
      toast.error('Session is required');
      return;
    }
    if (!currentItem.no_of_ques) {
      toast.error('No. of Questions is required');
      return;
    }
    if (!currentItem.type_of_exam) {
      toast.error('Type of Exam is required');
      return;
    }
    if (!currentItem.std) {
      toast.error('Standard is required');
      return;
    }
    if (!currentItem.exam_desc || currentItem.exam_desc.trim() === '') {
      toast.error('Exam Description is required');
      return;
    }
    if (!currentItem.test_districts || selectedDistricts.length === 0) {
      toast.error('Please select at least one district');
      return;
    }

    try {
      // Ensure date is in DD-MM-YYYY format before sending
      const dataToSend = {
        ...currentItem,
        testdate: formatDateForDisplay(currentItem.testdate)
      };
      
      if (modalMode === 'add') {
        await createTestMaster(dataToSend).unwrap();
        toast.success('Test master created successfully');
      } else {
        await updateTestMaster(dataToSend).unwrap();
        toast.success('Test master updated successfully');
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Error saving test master:', error);
      toast.error(error?.data?.message || 'Failed to save test master');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test master?')) {
      return;
    }

    try {
      await deleteTestMaster(id).unwrap();
      toast.success('Test master deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting test master:', error);
      toast.error(error?.data?.message || 'Failed to delete test master');
    }
  };

  const handleDeleteTestMarks = (testcode) => {
    setDeleteTestCode(testcode);
    setDeleteOptions({
      deleteResult: false,
      deleteQB: false,
      deleteQBMedium: false
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const { deleteResult, deleteQB, deleteQBMedium } = deleteOptions;

    if (!deleteResult && !deleteQB && !deleteQBMedium) {
      toast.warning('Please select at least one option to delete');
      return;
    }

    try {
      const result = await deleteTestMarks({
        testcode: deleteTestCode,
        deleteResult,
        deleteQB,
        deleteQBMedium
      }).unwrap();
      toast.success(result.message);
      setShowDeleteModal(false);
      refetch();
    } catch (error) {
      console.error('Error deleting test data:', error);
      toast.error(error?.data?.message || 'Failed to delete test data');
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTestCode(null);
    setDeleteOptions({
      deleteResult: false,
      deleteQB: false,
      deleteQBMedium: false
    });
  };

  // Toggle Test Status (checkflg)
  const handleToggleTestStatus = async (item) => {
    try {
      const newStatus = item.checkflg === 'Y' ? 'N' : 'Y';
      const dataToSend = {
        ...item,
        checkflg: newStatus,
        testdate: formatDateForDisplay(item.testdate)
      };
      
      await updateTestMaster(dataToSend).unwrap();
      toast.success(`Test status changed to ${newStatus === 'Y' ? 'Active' : 'Inactive'}`);
      refetch();
    } catch (error) {
      console.error('Error updating test status:', error);
      toast.error(error?.data?.message || 'Failed to update test status');
    }
  };

  // Toggle Image Status (Img_Upload)
  const handleToggleImageStatus = async (item) => {
    try {
      const newStatus = item.Img_Upload === 'Y' ? 'N' : 'Y';
      const dataToSend = {
        ...item,
        Img_Upload: newStatus,
        testdate: formatDateForDisplay(item.testdate)
      };
      
      await updateTestMaster(dataToSend).unwrap();
      toast.success(`Image status changed to ${newStatus === 'Y' ? 'Uploaded' : 'Pending'}`);
      refetch();
    } catch (error) {
      console.error('Error updating image status:', error);
      toast.error(error?.data?.message || 'Failed to update image status');
    }
  };

  // Toggle Percentile Status (percentile_gen)
  const handleTogglePercentileStatus = async (item) => {
    try {
      const newStatus = item.percentile_gen === 'Y' ? 'N' : 'Y';
      const dataToSend = {
        ...item,
        percentile_gen: newStatus,
        testdate: formatDateForDisplay(item.testdate)
      };
      
      await updateTestMaster(dataToSend).unwrap();
      toast.success(`Percentile status changed to ${newStatus === 'Y' ? 'Generated' : 'Pending'}`);
      refetch();
    } catch (error) {
      console.error('Error updating percentile status:', error);
      toast.error(error?.data?.message || 'Failed to update percentile status');
    }
  };

  // Open Image Upload Status Modal
  const handleOpenImageStatusModal = (item) => {
    setSelectedImageStatusItem(item);
    setShowImageStatusModal(true);
  };

  const handleCloseImageStatusModal = () => {
    setShowImageStatusModal(false);
    setSelectedImageStatusItem(null);
    setSelectedDistrictsForDelete([]);
  };

  // Handle district checkbox selection
  const handleDistrictSelection = (districtCode, isChecked) => {
    if (isChecked) {
      setSelectedDistrictsForDelete([...selectedDistrictsForDelete, districtCode]);
    } else {
      setSelectedDistrictsForDelete(selectedDistrictsForDelete.filter(code => code !== districtCode));
    }
  };

  // Handle select all districts
  const handleSelectAllDistrictsForDelete = (isChecked) => {
    if (isChecked) {
      const allCodes = getDistrictImageStatus(selectedImageStatusItem).map(d => d.code);
      setSelectedDistrictsForDelete(allCodes);
    } else {
      setSelectedDistrictsForDelete([]);
    }
  };

  // Open district delete modal
  const handleOpenDistrictDeleteModal = () => {
    if (selectedDistrictsForDelete.length === 0) {
      toast.warning('Please select at least one district to delete');
      return;
    }
    setDistrictDeleteOptions({
      deleteResult: false,
      deleteQB: false,
      deleteQBMedium: false
    });
    setShowDistrictDeleteModal(true);
  };

  // Close district delete modal
  const handleCloseDistrictDeleteModal = () => {
    setShowDistrictDeleteModal(false);
    setDistrictDeleteOptions({
      deleteResult: false,
      deleteQB: false,
      deleteQBMedium: false
    });
  };

  // Confirm district deletion
  const handleConfirmDistrictDelete = async () => {
    const { deleteResult, deleteQB, deleteQBMedium } = districtDeleteOptions;

    if (!deleteResult && !deleteQB && !deleteQBMedium) {
      toast.warning('Please select at least one option to delete');
      return;
    }

    try {
      const result = await deleteDistrictData({
        testcode: selectedImageStatusItem.testcode,
        districtCodes: selectedDistrictsForDelete,
        deleteResult,
        deleteQB,
        deleteQBMedium
      }).unwrap();
      toast.success(result.message);
      setShowDistrictDeleteModal(false);
      setSelectedDistrictsForDelete([]);
      refetch();
    } catch (error) {
      console.error('Error deleting district data:', error);
      toast.error(error?.data?.message || 'Failed to delete district data');
    }
  };

  // Get district-wise image upload status
  const getDistrictImageStatus = (item) => {
    if (!item.test_districts) return [];
    
    const districtCodes = item.test_districts.split(',').map(code => code.trim());
    const imageStatuses = item.image_upload_districts 
      ? item.image_upload_districts.split(',').map(status => status.trim())
      : districtCodes.map(() => 'N');
    
    const districts = districtData?.data || [];
    const districtCounts = imageCountsData?.data?.districtCounts || [];
    
    return districtCodes.map((code, index) => {
      const normalizedCode = String(code || '').trim();
      const district = districts.find(d => String(d.DCODE || '').trim() === normalizedCode);
      const countInfo = districtCounts.find(c => {
        const apiCode = String(c.districtCode || '').trim();
        return (
          apiCode === normalizedCode ||
          apiCode === normalizedCode.slice(0, 2) ||
          normalizedCode.startsWith(apiCode)
        );
      });
      return {
        code: normalizedCode,
        name: district ? district.DNAME : normalizedCode,
        status: imageStatuses[index] || 'N',
        count: Number(countInfo ? countInfo.count : 0)
      };
    });
  };

  // Calculate total image count for the test
  const getTotalImageCount = (item) => {
    const districtStatus = getDistrictImageStatus(item);
    return districtStatus.reduce((total, district) => total + district.count, 0);
  };

  // Export Image Upload Status to Excel
  const exportImageUploadStatus = () => {
    if (!selectedImageStatusItem) {
      toast.warning('No data to export');
      return;
    }

    const districtStatus = getDistrictImageStatus(selectedImageStatusItem);
    if (districtStatus.length === 0) {
      toast.warning('No district data to export');
      return;
    }

    const exportData = districtStatus.map((district, index) => ({
      'S.No': index + 1,
      'District Code': district.code,
      'District Name': district.name,
      'Image Count': district.count,
      'Upload Status': district.status === 'Y' ? 'Uploaded' : 'Not Uploaded',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'District Image Status');

    const fileName = `District_Image_Status_${selectedImageStatusItem.testcode}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success('Excel file exported successfully!');
  };

  // Toggle district image upload status
  const handleToggleDistrictStatus = async (districtCode) => {
    if (!selectedImageStatusItem) return;

    try {
      const result = await toggleDistrictStatus({
        testcode: selectedImageStatusItem.testcode,
        districtCode: districtCode
      }).unwrap();

      toast.success(result.message);
      refetch(); // Refresh the data
      
      // Update the modal view
      const updatedItem = { ...selectedImageStatusItem };
      const testDistricts = updatedItem.test_districts.split(',').map(d => d.trim());
      const imageStatuses = updatedItem.image_upload_districts ? updatedItem.image_upload_districts.split(',') : [];
      const districtPosition = testDistricts.findIndex(d => d.substring(0, 2) === districtCode.substring(0, 2));
      
      if (districtPosition !== -1) {
        imageStatuses[districtPosition] = result.data.newStatus;
        updatedItem.image_upload_districts = imageStatuses.join(',');
        setSelectedImageStatusItem(updatedItem);
      }
    } catch (error) {
      console.error('Error toggling district status:', error);
      toast.error(error?.data?.message || 'Failed to toggle district status');
    }
  };

  return (
    <Container fluid className="p-4">
      <style>{datePickerStyles}</style>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <h4 className="mb-0">
                <i className="bi bi-clipboard-data me-2"></i>
                Test Master Management
              </h4>
            </Col>
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="Search by test code, name, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="info" 
                onClick={exportToExcel}
                className="shadow-sm me-2"
              >
                <FaFileExcel className="me-2" />
                Export to Excel
              </Button>
              <Button 
                variant="success" 
                onClick={() => handleOpenModal('add')}
                className="shadow-sm"
              >
                <FaPlus className="me-2" />
                Add New Test
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Test Masters Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading test masters...</p>
        </div>
      ) : filteredTestMasters.length > 0 ? (
        <Card className="shadow-sm">
          <Card.Header style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
            <h5 className="mb-0">
              <i className="bi bi-table me-2"></i>
              Test Masters List ({filteredTestMasters.length})
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <DataTable
              columns={testMasterColumns}
              data={filteredTestMasters}
              pagination
              paginationPerPage={25}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              highlightOnHover
              striped
              responsive
              fixedHeader
              fixedHeaderScrollHeight="650px"
              customStyles={testMasterTableStyles}
            />
          </Card.Body>
        </Card>
      ) : (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">No test masters found</p>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
          <Modal.Title>
            {modalMode === 'add' ? 'Add New Test Master' : 'Edit Test Master'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="testcode"
                    value={currentItem.testcode}
                    onChange={handleInputChange}
                    maxLength={20}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Date <span className="text-danger">*</span></Form.Label>
                  <div className="position-relative">
                    <DatePicker
                      selected={stringToDate(currentItem.testdate)}
                      onChange={handleDateChange}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select test date"
                      className="form-control"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      required
                      isClearable
                      popperPlacement="bottom-start"
                      customInput={
                        <div className="input-group">
                          <Form.Control
                            type="text"
                            value={currentItem.testdate}
                            placeholder="DD-MM-YYYY"
                            readOnly
                          />
                          <span className="input-group-text bg-primary text-white" style={{ cursor: 'pointer' }}>
                            <FaCalendarAlt />
                          </span>
                        </div>
                      }
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Click calendar icon to select date
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="Test_Name"
                    value={currentItem.Test_Name}
                    onChange={handleInputChange}
                    maxLength={50}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Sessions <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="sessions"
                    value={currentItem.sessions}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Session</option>
                    <option value="1">FN - Forenoon</option>
                    <option value="2">AN - Afternoon</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>No. of Questions <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="no_of_ques"
                    value={currentItem.no_of_ques}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select No. of Questions</option>
                    {Array.from({ length: 300 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Type of Exam <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="type_of_exam"
                    value={currentItem.type_of_exam}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Type of Exam</option>
                    {(typeExamData?.data || []).map(type => (
                      <option key={type.id} value={type.type_of_exam_code}>
                        {type.type_of_exam_code} - {type.type_of_exam_desc}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Standard <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="std"
                    value={currentItem.std}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Standard</option>
                    <option value="9">9th</option>
                    <option value="10">10th</option>
                    <option value="11">11th</option>
                    <option value="12">12th</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Exam Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="exam_desc"
                    value={currentItem.exam_desc}
                    onChange={handleInputChange}
                    maxLength={15}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-block">Repeaters</Form.Label>
                  <Form.Check
                    type="checkbox"
                    label="Include Repeaters"
                    name="repeaters"
                    checked={currentItem.repeaters === 'Y'}
                    onChange={(e) => {
                      setCurrentItem(prev => ({
                        ...prev,
                        repeaters: e.target.checked ? 'Y' : 'N'
                      }));
                    }}
                    className="mt-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="mb-0">Test Districts <span className="text-danger">*</span></Form.Label>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={handleSelectAllDistricts}
                      type="button"
                    >
                      {selectedDistricts.length === districtOptions.length ? (
                        <><FaTimes className="me-1" /> Deselect All</>
                      ) : (
                        <><FaCheckCircle className="me-1" /> Select All</>
                      )}
                    </Button>
                  </div>
                  <Select
                    isMulti
                    value={selectedDistricts}
                    onChange={handleDistrictChange}
                    options={districtOptions}
                    placeholder="Select districts..."
                    isLoading={isLoadingDistricts}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '42px',
                        borderColor: '#dee2e6'
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: '#2c5aa0',
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        color: 'white',
                      }),
                      multiValueRemove: (base) => ({
                        ...base,
                        color: 'white',
                        ':hover': {
                          backgroundColor: '#1e4078',
                          color: 'white',
                        },
                      }),
                    }}
                  />
                  <Form.Text className="text-muted">
                    Select one or more districts for this test. Use "Select All" button to choose all districts.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Check Flag</Form.Label>
                  <Form.Select
                    name="checkflg"
                    value={currentItem.checkflg}
                    onChange={handleInputChange}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Image Upload</Form.Label>
                  <Form.Select
                    name="Img_Upload"
                    value={currentItem.Img_Upload}
                    onChange={handleInputChange}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Key Upload</Form.Label>
                  <Form.Select
                    name="Key_Upload"
                    value={currentItem.Key_Upload}
                    onChange={handleInputChange}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Percentile Gen</Form.Label>
                  <Form.Select
                    name="percentile_gen"
                    value={currentItem.percentile_gen}
                    onChange={handleInputChange}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              <FaTimes className="me-2" />
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              <FaSave className="me-2" />
              {modalMode === 'add' ? 'Create' : 'Update'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Image Upload Status Modal */}
      <Modal show={showImageStatusModal} onHide={handleCloseImageStatusModal} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#2c5aa0', color: 'white' }}>
          <div className="d-flex justify-content-between align-items-center w-100 me-3">
            <Modal.Title>
              <FaCheckCircle className="me-2" />
              District-wise Image Upload Status
            </Modal.Title>
            <Button 
              variant="light" 
              size="sm" 
              onClick={exportImageUploadStatus}
              className="d-flex align-items-center gap-2"
            >
              <FaFileExcel /> Export to Excel
            </Button>
          </div>
        </Modal.Header>
        <Modal.Body>
          {selectedImageStatusItem && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <div>
                    <strong>Test Code:</strong> <Badge bg="primary" className="ms-2">{selectedImageStatusItem.testcode}</Badge>
                  </div>
                  <div className="mt-2">
                    <strong>Test Name:</strong> <span className="ms-2">{selectedImageStatusItem.Test_Name}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div>
                    <strong>Exam Date:</strong> <span className="ms-2">{formatDateForDisplay(selectedImageStatusItem.testdate)}</span>
                  </div>
                  <div className="mt-2">
                    <strong>Repeater:</strong> 
                    {selectedImageStatusItem.repeaters === 'Y' ? (
                      <Badge bg="success" className="ms-2">Yes</Badge>
                    ) : (
                      <Badge bg="secondary" className="ms-2">No</Badge>
                    )}
                  </div>
                </Col>
              </Row>
              
              {/* Total Image Count */}
              <Alert variant="info" className="mb-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <FaImages className="me-2" size={24} />
                  <strong style={{ fontSize: '1.1rem' }}>Total Images for Test Code:</strong>
                </div>
                <Badge bg="primary" pill style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>
                  {getTotalImageCount(selectedImageStatusItem)}
                </Badge>
              </Alert>

              {/* Delete Selected Districts Button */}
              {selectedDistrictsForDelete.length > 0 && (
                <Alert variant="warning" className="mb-3 d-flex align-items-center justify-content-between">
                  <span>
                    <strong>{selectedDistrictsForDelete.length}</strong> district(s) selected
                  </span>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={handleOpenDistrictDeleteModal}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaTrash /> Delete Selected
                  </Button>
                </Alert>
              )}

              <Table bordered hover>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        checked={selectedDistrictsForDelete.length === getDistrictImageStatus(selectedImageStatusItem).length && getDistrictImageStatus(selectedImageStatusItem).length > 0}
                        onChange={(e) => handleSelectAllDistrictsForDelete(e.target.checked)}
                      />
                    </th>
                    <th>S.No</th>
                    <th>District Code</th>
                    <th>District Name</th>
                    <th>Image Count</th>
                    <th>Upload Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getDistrictImageStatus(selectedImageStatusItem).map((district, index) => (
                    <tr key={district.code}>
                      <td>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedDistrictsForDelete.includes(district.code)}
                          onChange={(e) => handleDistrictSelection(district.code, e.target.checked)}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td><Badge bg="secondary">{district.code}</Badge></td>
                      <td>{district.name}</td>
                      <td className="text-center">
                        <Badge bg="info" pill>{district.count}</Badge>
                      </td>
                      <td>
                        {district.status === 'Y' ? (
                          <Badge bg="success" pill>
                            <FaCheckCircle className="me-1" />
                            Image Uploaded
                          </Badge>
                        ) : (
                          <Badge bg="danger" pill>
                            <FaTimesCircle className="me-1" />
                            Image Not Uploaded
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Button
                          variant={district.status === 'Y' ? 'warning' : 'success'}
                          size="sm"
                          onClick={() => handleToggleDistrictStatus(district.code)}
                        >
                          {district.status === 'Y' ? 'Mark as Not Uploaded' : 'Mark as Uploaded'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-secondary">
                  <tr>
                    <th colSpan="4" className="text-end">Total:</th>
                    <th className="text-center">
                      <Badge bg="success" pill style={{ fontSize: '1rem', padding: '0.4rem 0.8rem' }}>
                        {getTotalImageCount(selectedImageStatusItem)}
                      </Badge>
                    </th>
                    <th colSpan="2"></th>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseImageStatusModal}>
            <FaTimes className="me-2" />
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Test Data Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#dc3545', color: 'white' }}>
          <Modal.Title>
            <FaTrash className="me-2" />
            Delete Test Data
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Warning!</strong> This action will permanently delete selected data for test code: <Badge bg="dark">{deleteTestCode}</Badge>
          </Alert>
          
          <p className="mb-3">Please select the data you want to delete:</p>
          
          <Form>
            <Form.Check 
              type="checkbox"
              id="deleteResult"
              label={
                <span>
                  <FaDatabase className="me-2 text-primary" />
                  <strong>Result</strong> - Delete all student marks from <code>jee_marks</code> table
                </span>
              }
              checked={deleteOptions.deleteResult}
              onChange={(e) => setDeleteOptions({ ...deleteOptions, deleteResult: e.target.checked })}
              className="mb-3"
            />
            
            <Form.Check 
              type="checkbox"
              id="deleteQB"
              label={
                <span>
                  <FaDatabase className="me-2 text-success" />
                  <strong>QB</strong> - Delete question bank details from <code>jee_qb_details</code> table
                </span>
              }
              checked={deleteOptions.deleteQB}
              onChange={(e) => setDeleteOptions({ ...deleteOptions, deleteQB: e.target.checked })}
              className="mb-3"
            />
            
            <Form.Check 
              type="checkbox"
              id="deleteQBMedium"
              label={
                <span>
                  <FaDatabase className="me-2 text-info" />
                  <strong>QB Medium</strong> - Delete question statistics from <code>question_statistics</code> table
                </span>
              }
              checked={deleteOptions.deleteQBMedium}
              onChange={(e) => setDeleteOptions({ ...deleteOptions, deleteQBMedium: e.target.checked })}
              className="mb-3"
            />
          </Form>

          {!deleteOptions.deleteResult && !deleteOptions.deleteQB && !deleteOptions.deleteQBMedium && (
            <Alert variant="info" className="mt-3 mb-0">
              <small>Please select at least one option to proceed with deletion.</small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            <FaTimes className="me-2" />
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDelete}
            disabled={!deleteOptions.deleteResult && !deleteOptions.deleteQB && !deleteOptions.deleteQBMedium || isDeletingMarks}
          >
            {isDeletingMarks ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Delete Selected
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete District Test Data Modal */}
      <Modal show={showDistrictDeleteModal} onHide={handleCloseDistrictDeleteModal} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#dc3545', color: 'white' }}>
          <Modal.Title>
            <FaTrash className="me-2" />
            Delete District-wise Test Data
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Warning!</strong> This action will permanently delete selected data for:
          </Alert>
          
          <div className="mb-3">
            <strong>Test Code:</strong> <Badge bg="dark" className="ms-2">{selectedImageStatusItem?.testcode}</Badge>
          </div>
          
          <div className="mb-3">
            <strong>Selected Districts ({selectedDistrictsForDelete.length}):</strong>
            <div className="mt-2">
              {selectedDistrictsForDelete.map(code => {
                const districts = districtData?.data || [];
                const district = districts.find(d => d.DCODE === code);
                return (
                  <Badge key={code} bg="secondary" className="me-2 mb-2">
                    {code} - {district ? district.DNAME : code}
                  </Badge>
                );
              })}
            </div>
          </div>

          <p className="mb-3">Please select the data you want to delete:</p>
          
          <Form>
            <Form.Check 
              type="checkbox"
              id="districtDeleteResult"
              label={
                <span>
                  <FaDatabase className="me-2 text-primary" />
                  <strong>Result</strong> - Delete student marks from <code>jee_marks</code> table
                </span>
              }
              checked={districtDeleteOptions.deleteResult}
              onChange={(e) => setDistrictDeleteOptions({ ...districtDeleteOptions, deleteResult: e.target.checked })}
              className="mb-3"
            />
            
            <Form.Check 
              type="checkbox"
              id="districtDeleteQB"
              label={
                <span>
                  <FaDatabase className="me-2 text-success" />
                  <strong>QB</strong> - Delete question bank details from <code>jee_qb_details</code> table
                </span>
              }
              checked={districtDeleteOptions.deleteQB}
              onChange={(e) => setDistrictDeleteOptions({ ...districtDeleteOptions, deleteQB: e.target.checked })}
              className="mb-3"
            />
            
            <Form.Check 
              type="checkbox"
              id="districtDeleteQBMedium"
              label={
                <span>
                  <FaDatabase className="me-2 text-info" />
                  <strong>QB Medium</strong> - Delete question statistics from <code>question_statistics</code> table
                </span>
              }
              checked={districtDeleteOptions.deleteQBMedium}
              onChange={(e) => setDistrictDeleteOptions({ ...districtDeleteOptions, deleteQBMedium: e.target.checked })}
              className="mb-3"
            />
          </Form>

          {!districtDeleteOptions.deleteResult && !districtDeleteOptions.deleteQB && !districtDeleteOptions.deleteQBMedium && (
            <Alert variant="info" className="mt-3 mb-0">
              <small>Please select at least one option to proceed with deletion.</small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDistrictDeleteModal}>
            <FaTimes className="me-2" />
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDistrictDelete}
            disabled={!districtDeleteOptions.deleteResult && !districtDeleteOptions.deleteQB && !districtDeleteOptions.deleteQBMedium || isDeletingDistrictData}
          >
            {isDeletingDistrictData ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Delete Selected Districts
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TestMaster;
