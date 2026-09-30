import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Spinner, Form, Button, ButtonGroup } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import DataTableBase from 'react-data-table-component';
import { useGetStudentProcessingReportQuery } from '../../../redux-slice/masterApiSlice';
import { useGetDistrictDataQuery } from '../../../redux-slice/GeneralGetSqlOperationApiSlice';
import * as XLSX from 'xlsx';
import { FaFileExcel, FaSync, FaUserCheck, FaUserTimes, FaUserSlash, FaBan, FaSchool } from 'react-icons/fa';
import { generateCandidatePDF } from '../../../components/PDFGenerator/CandidatePDFGenerator';
import '../../../style/dashboard/statistics.css';

const DataTable = DataTableBase.default || DataTableBase;

const Student_processing_data_report = () => {
  // Helper functions for mapping codes to names
  const getCommunityName = (code) => {
    const communityMap = {
      0: 'Others', 1: 'SC', 2: 'ST', 3: 'MBC',
      4: 'BC', 5: 'OC', 6: 'SCA', 7: 'BCM'
    };
    return communityMap[code] || code;
  };

  const getGenderName = (code) => {
    const genderMap = { 0: 'Others', 1: 'Male', 2: 'Female' };
    return genderMap[code] || code;
  };

  const getPSTMName = (code) => {
    const pstmMap = { 0: 'Others', 1: 'Tamil', 2: 'English' };
    return pstmMap[code] || code;
  };

  const getPreferenceName = (code) => {
    const preferenceMap = {
      0: 'Not Selected',
      1: 'JEE',
      2: 'NEET'
    };
    return preferenceMap[code] || code;
  };

  // Parse and format candidate preferences
  const formatPreferences = (preferencesString) => {
    if (!preferencesString) return [];
    return preferencesString
      .split(',')
      .map(p => p.trim())
      .filter(p => p)
      .map(code => getPreferenceName(code));
  };

  // Get user info from Redux state
  const { userInfo } = useSelector((state) => state.auth);
  const userDistrictCode = userInfo?.D_Code || '00';
  const userRole = String(userInfo?.Role || '1'); // Convert to string for comparison
  // State-level users can be determined by role OR district code "00"
  const isStateUser = userDistrictCode === '00' || userRole === '0' || userRole === '2' || userRole === '5';
  
  console.log('User District:', userDistrictCode, 'User Role:', userRole, 'Is State User:', isStateUser);

  // Fetch district data for dropdown (state users only)
  const { data: districtData } = useGetDistrictDataQuery();
  const allDistricts = districtData?.data || [];
  
  // Get initial district value
  const initialDistrict = useMemo(() => {
    if (isStateUser) return 'all';
    return userDistrictCode;
  }, [isStateUser, userDistrictCode]);

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const districtInitialized = useRef(false);
  
  // Initialize district for non-state users
  useEffect(() => {
    if (!districtInitialized.current && !isStateUser && initialDistrict !== 'all') {
      setSelectedDistrict(initialDistrict);
      districtInitialized.current = true;
    }
  }, [isStateUser, initialDistrict]);

  const [candidateStatus, setCandidateStatus] = useState('all'); // all, 1=present, 4=absent, 2=not willing, 3=not eligible

  const [schoolType, setSchoolType] = useState('all'); // all, 1=Model School, 2=Government School
  
  const [searchText, setSearchText] = useState('');

  // Determine which district to query
  const queryDistrictCode = isStateUser ? selectedDistrict : userDistrictCode;

  // Fetch report data
  const { data: reportData, isLoading, error, refetch } = useGetStudentProcessingReportQuery({
    districtCode: queryDistrictCode,
    candidateStatus: candidateStatus,
    schoolType: schoolType
  });

  const studentRecords = reportData?.data || [];
  const summary = reportData?.summary || {};

  // Filter data based on search text
  const filteredStudentRecords = useMemo(() => {
    if (!searchText) return studentRecords;
    
    const searchLower = searchText.toLowerCase();
    return studentRecords.filter(record => {
      return (
        record.Emis_No?.toLowerCase().includes(searchLower) ||
        record.udise_code?.toLowerCase().includes(searchLower) ||
        record.school_name?.toLowerCase().includes(searchLower) ||
        record.name?.toLowerCase().includes(searchLower) ||
        record.father_name?.toLowerCase().includes(searchLower) ||
        record.district_name?.toLowerCase().includes(searchLower)
      );
    });
  }, [studentRecords, searchText]);

  // Get selected district name for display
  const selectedDistrictName = useMemo(() => {
    if (!isStateUser) {
      return userInfo?.districtName || userDistrictCode;
    }
    if (selectedDistrict === 'all') {
      return 'All Districts';
    }
    const district = allDistricts.find(d => d.DCODE === selectedDistrict);
    return district ? district.DNAME : selectedDistrict;
  }, [isStateUser, selectedDistrict, allDistricts, userInfo, userDistrictCode]);


  // Status button configurations
  const statusButtons = [
    { value: '1', label: 'Present', icon: FaUserCheck, variant: 'success', count: summary.presentCount || 0 },
    { value: '4', label: 'Absent', icon: FaUserTimes, variant: 'danger', count: summary.absentCount || 0 },
    { value: '3', label: 'Not Willing', icon: FaUserSlash, variant: 'warning', count: summary.status2Count || 0 },
    { value: '2', label: 'Not Eligible', icon: FaBan, variant: 'secondary', count: summary.status3Count || 0 },
    { value: '5', label: 'Head master yet to be checked', icon: FaSchool, variant: 'info', count: summary.status5Count || 0 }
  ];

  // Show district column only when "all districts" is selected for state users
  const showDistrictColumn = isStateUser && selectedDistrict === 'all';

  // Table columns - includes all fields from Master_Data_District
  const columns = [
    {
      name: 'S.No',
      selector: (row, index) => index + 1,
      sortable: true,
      width: '70px',
      center: true,
    },
    {
      name: 'EMIS No',
      selector: row => row.Emis_No,
      sortable: true,
      wrap: true,
      width: '120px',
    },
    {
      name: 'UDISE Code',
      selector: row => row.udise_code,
      sortable: true,
      wrap: true,
      width: '130px',
    },
    ...(showDistrictColumn ? [{
      name: 'District',
      selector: row => row.district_name,
      sortable: true,
      wrap: true,
      width: '120px',
    }] : []),
    {
      name:'School Type',
      selector: row => row.Student_Status === 1 ? 'Model School' : row.Student_Status === 2 ? 'Government School' : 'Other',
      sortable: true,
      wrap: true,
      width: '150px',
    },
    {
      name: 'School Name',
      selector: row => row.school_name,
      sortable: true,
      wrap: true,
      width: '200px',
    },
    {
      name: 'Student Name',
      selector: row => row.name,
      sortable: true,
      wrap: true,
      width: '150px',
    },
    {
      name: 'Father Name',
      selector: row => row.father_name,
      sortable: true,
      wrap: true,
      width: '150px',
    },
    {
      name: 'Community',
      selector: row => getCommunityName(row.com),
      sortable: true,
      width: '100px',
    },
    {
      name: 'Gender',
      selector: row => getGenderName(row.sex),
      sortable: true,
      width: '80px',
    },
    {
      name: 'PSTM',
      selector: row => getPSTMName(row.pstm),
      sortable: true,
      width: '80px',
    },
    {
      name: 'DOB',
      selector: row => row.dob,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Disability',
      selector: row => row.ph === 1 ? (row.Disability_Name || 'Yes') : 'No',
      sortable: true,
      wrap: true,
      width: '150px',
    },
    {
      name: 'JEE Zone',
      selector: row => row.Zone_Name_Jee,
      sortable: true,
      wrap: true,
      width: '120px',
    },
    {
      name: 'NEET Zone',
      selector: row => row.Zone_Name_Neet,
      sortable: true,
      wrap: true,
      width: '120px',
    },
    {
      name: 'Phone Number',
      selector: row => row.PHONE_NUMBER || '-',
      sortable: true,
      wrap: true,
      width: '130px',
    },
    {
      name: 'House Address',
      selector: row => row.HOUSE_ADDRESS || '-',
      sortable: true,
      wrap: true,
      width: '200px',
    },
    {
      name: 'Candidate Status',
      selector: row => {
        if (!row.candidate_status || row.candidate_status === 0) return '';
        const statusMap = {
          1: 'Present',
          2: 'Not Willing',
          3: 'Not Eligible',
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
          3: { label: 'Not Willing', bg: '#fff3cd', color: '#856404' },
          2: { label: 'Not Eligible', bg: '#fef3c7', color: '#a16207' },
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
        if (row.candidate_status !== 1 || !row.candidate_preferences) return '-';
        const prefs = formatPreferences(row.candidate_preferences);
        return prefs.join(', ');
      },
      sortable: true,
      wrap: true,
      width: '200px',
      cell: (row) => {
        if (row.candidate_status !== 1 || !row.candidate_preferences) {
          return <span style={{ color: '#9ca3af' }}>-</span>;
        }
        // Parse and format preferences with labels
        const prefs = formatPreferences(row.candidate_preferences);
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
        row.candidate_status > 0 && (
          <Button
            variant="danger"
            onClick={() => generateCandidatePDF(row)}
            title="Print Candidate Card"
            style={{
              padding: '5px 10px',
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
        )
      ),
      width: '100px',
      ignoreRowClick: true,
    },
  ];

  // Export to Excel with all columns
  // Export to Excel with all columns
  const exportToExcel = () => {
    const exportData = filteredStudentRecords.map((row, index) => {
      const baseData = {
        'S.No': index + 1,
        'EMIS No': row.Emis_No,
        'UDISE Code': row.udise_code || '',
      };

      if (showDistrictColumn) {
        baseData['District'] = row.district_name;
      }

      baseData['School Name'] = row.school_name;
      baseData['Student Name'] = row.name;
      baseData['Father Name'] = row.father_name;
      baseData['Community'] = getCommunityName(row.com);
      baseData['Gender'] = getGenderName(row.sex);
      baseData['PSTM'] = getPSTMName(row.pstm);
      baseData['DOB'] = row.dob || '';
      baseData['Disability'] = row.ph === 1 ? (row.Disability_Name || 'Yes') : 'No';
      baseData['JEE Zone'] = row.Zone_Name_Jee || '';
      baseData['NEET Zone'] = row.Zone_Name_Neet || '';
      baseData['Phone Number'] = row.PHONE_NUMBER || '';
      baseData['House Address'] = row.HOUSE_ADDRESS || '';
      baseData['Candidate Status'] = 
        row.candidate_status === 0 ? 'Not Processed' :
        row.candidate_status === 1 ? 'Present' :
        row.candidate_status === 3 ? 'Not Willing' :
        row.candidate_status === 2 ? 'Not Eligible' :
        row.candidate_status === 4 ? 'Absent' : 'Unknown';

  
      
      // Add preferences only if candidate is Present
      if (row.candidate_status === 1 && row.candidate_preferences) {
        const prefs = formatPreferences(row.candidate_preferences);
        baseData['Candidate Preferences'] = prefs.join(', ');
      } else {
        baseData['Candidate Preferences'] = '-';
      }
      baseData['School Type'] = row.Student_Status === 1 ? 'Model School' : row.Student_Status === 2 ? 'Government School' : 'Other';

      return baseData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Report');

    // Auto-size columns
    const maxWidth = 40;
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.min(
        maxWidth,
        Math.max(
          key.length,
          ...exportData.map(row => String(row[key] || '').length)
        )
      )
    }));
    worksheet['!cols'] = colWidths;

    const statusLabel = 
      candidateStatus === '1' ? 'Present' :
      candidateStatus === '4' ? 'Absent' :
      candidateStatus === '3' ? 'NotWilling' :
      candidateStatus === '2' ? 'NotEligible' : 'All';
      candidateStatus === '5' ? 'HeadMasterYetToCheck' : statusLabel;

    const fileName = `Student_Report_${statusLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (isLoading) {
    return (
      <Container className="mt-4">
        <div className="dashboard-loading text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-muted mt-3">Loading report data...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">
          <h5>Error Loading Report</h5>
          <p>{error?.data?.message || 'Failed to load student processing report'}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2 className="dashboard-title">
            📊 Student Processing Data Report
          </h2>
          <p className="text-muted">
            District: {selectedDistrictName}
          </p>
        </Col>
      </Row>

      {/* Filters Row - State Users Only */}
      {isStateUser && (
        <Row className="mb-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label><strong>Select District</strong></Form.Label>
              <Form.Select 
                value={selectedDistrict} 
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setCandidateStatus('all'); // Reset status filter when district changes
                }}
                size="lg"
              >
                <option value="all">All Districts</option>
                {allDistricts.map((district) => (
                  <option key={district.id} value={district.DCODE}>
                    {district.DCODE} — {district.DNAME}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label><strong><FaSchool className="me-2" />School Type</strong></Form.Label>
              <Form.Select 
                value={schoolType} 
                onChange={(e) => setSchoolType(e.target.value)}
                size="lg"
              >
                <option value="all">All Schools</option>
                <option value="1">Model School</option>
                <option value="2">Government School</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label><strong>Filter by Status</strong></Form.Label>
              <Form.Select 
                value={candidateStatus} 
                onChange={(e) => setCandidateStatus(e.target.value)}
                size="lg"
              >
                <option value="all">All ({summary.totalRecords || 0})</option>
                <option value="1">Present ({summary.presentCount || 0})</option>
                <option value="4"> Absent ({summary.absentCount || 0})</option>
                <option value="3"> Not Willing ({summary.status3Count || 0})</option>
                <option value="2"> Not Eligible ({summary.status2Count || 0})</option>
                <option value="5"> Head master yet to be checked ({summary.status5Count || 0})</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      )}


      {/* Filters Row - District Users Only */}
      {!isStateUser && (
        <Row className="mb-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label><strong><FaSchool className="me-2" />School Type</strong></Form.Label>
              <Form.Select 
                value={schoolType} 
                onChange={(e) => setSchoolType(e.target.value)}
                size="lg"
              >
                <option value="all">All Schools</option>
                <option value="1">Model School</option>
                <option value="2">Government School</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label><strong>Filter by Status</strong></Form.Label>
              <Form.Select 
                value={candidateStatus} 
                onChange={(e) => setCandidateStatus(e.target.value)}
                size="lg"
              >
                <option value="all">All ({summary.totalRecords || 0})</option>
                <option value="1">✓ Present ({summary.presentCount || 0})</option>
                <option value="4">✗ Absent ({summary.absentCount || 0})</option>
                <option value="3">⚠ Not Willing ({summary.status2Count || 0})</option>
                <option value="2">⊘ Not Eligible ({summary.status3Count || 0})</option>
                <option value="5"> Head master yet to be checked ({summary.status5Count || 0})</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      )}


      {/* Action Buttons */}
      <Row className="mb-3">
        <Col className="d-flex gap-2">
          <Button variant="primary" onClick={() => refetch()} className="d-flex align-items-center gap-2">
            <FaSync /> Refresh
          </Button>
          <Button 
            variant="success" 
            onClick={exportToExcel}
            disabled={filteredStudentRecords.length === 0}
            className="d-flex align-items-center gap-2"
          >
            <FaFileExcel /> Export to Excel
          </Button>
        </Col>
      </Row>

      {/* Search Bar */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Search by EMIS, UDISE, School, Student Name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="lg"
          />
        </Col>
        {searchText && (
          <Col md={6} className="d-flex align-items-center">
            <span className="text-muted">
              Showing {filteredStudentRecords.length} of {studentRecords.length} records
            </span>
          </Col>
        )}
      </Row>

      {/* Data Table */}
      <Card>
        <Card.Body>
          <DataTable
            columns={columns}
            data={filteredStudentRecords}
            pagination
            paginationPerPage={25}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            highlightOnHover
            striped
            responsive
            dense
            noDataComponent={
              <div className="text-center py-4">
                <p className="text-muted">
                  {searchText ? `No students found matching "${searchText}"` : 'No students found for the selected filters'}
                </p>
              </div>
            }
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Student_processing_data_report;
