import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Badge, Button } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { useGetCampDetailsQuery, useLazyGetCampDetailsOverallQuery } from '../../../redux-slice/valuationStatusApiSlice'
import {useLazyGetPdfMarkGenerateCampDetailsQuery} from '../../../redux-slice/pdfGetslice'
import * as XLSX from 'xlsx';
import { useSelector } from 'react-redux';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ElegantLoader from '../../../components/ElegantLoader';
// import axios from 'axios';

const DataTable = DataTableBase.default || DataTableBase;

const Camp_Details = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Fetch camp details on mount
  const userDegree = useSelector((state) => state.auth.degreeInfo);
  const userCourse = useSelector((state) => state.auth.userInfo.selected_course);
  const userRole = useSelector((state) => state.auth.userInfo.selected_role);
  const { data: campData, isLoading: campLoading } = useGetCampDetailsQuery(
    userCourse ? { course: userCourse ,
      role: userRole
    } : {}
  );

  // Lazy query for fetching detailed camp data on demand
  const [triggerGetCampDetailsOverall, { data: campDataAll, isLoading: campOverallLoading }] = useLazyGetCampDetailsOverallQuery();
  const [triggerGetPdfMarkGenerateCampDetails, { data: markDetailsOverallData, isLoading: markDetailsOverallLoading }] = useLazyGetPdfMarkGenerateCampDetailsQuery();

  useEffect(() => {
    if (campData?.campResults) {
      setData(campData.campResults);
    }
  }, [campData]);



  // const fetchCampDetails = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await axios.get('/api/valuationstatus/camp-details');
  //     if (response.data?.campResults) {
  //       setData(response.data.campResults);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching camp details:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Filter data based on search

  const Print_Mark_Statment = async (row) => {
    try {
      // Force a fresh fetch by passing forceRefetch option
      const result = await triggerGetPdfMarkGenerateCampDetails({
        course: userCourse,
        role: userRole,
        evaId: row.Eva_Id,
        campId: row.Camp_id_Camp,
        department: row.department,
        valuationType: row.valuationType
      }, true); // Force refetch

      if (result.error) {
        console.error('Error response:', result.error);
        alert('Failed to generate PDF. Please try again.');
        return;
      }

      const blob = result.data;
      
      // Verify it's actually a blob
      if (!(blob instanceof Blob)) {
        console.error('Response is not a Blob:', blob);
        alert('Invalid PDF response received.');
        return;
      }
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Mark_Statement_${row.Eva_Id}_${row.Camp_id_Camp}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error fetching mark details overall:', error);
      alert('Failed to download mark statement. Please try again.');
    }
  }


  const Print_Camp_Details = async (row) => {
    try {
      // Trigger the RTK Query to fetch detailed camp data
      const result = await triggerGetCampDetailsOverall({
        course: userCourse,
        role: userRole,
        evaId: row.Eva_Id,
        campId: row.Camp_id_Camp,
        department: row.department,
        valuationType: row.valuationType
      }).unwrap();


      // Create a new PDF document with A4 size
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      // Helper function to check if we need a new page
      const checkPageBreak = (requiredSpace) => {
        if (currentY + requiredSpace > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
          return true;
        }
        return false;
      };

      // Title
      doc.setFontSize(16);
      doc.setTextColor(44, 82, 130);
      doc.text('Camp Valuation Details', pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
      
      // Horizontal line
      doc.setDrawColor(44, 82, 130);
      doc.setLineWidth(0.5);
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 7;
      
      // Date
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, currentY);
      currentY += 10;
      
      // Camp Officer Details
      checkPageBreak(40);
      doc.setFontSize(12);
      doc.setTextColor(44, 82, 130);
      doc.text('Camp Officer Information', 20, currentY);
      currentY += 5;
      
      // Get department name
      const departmentName = userDegree && row.department 
        ? userDegree.find(d => d.D_Code === row.department)?.Degree_Name || row.department 
        : row.department || '-';
      
      // Officer details table
      const officerData = [
        ['Camp ID & Name', `${row.Eva_Id}  -  ${row.FACULTY_NAME || '-'}`],
        ['Department & Camp ID', `${departmentName} - ${row.Camp_id_Camp} (Val - ${row.valuationType})` || '-'],
        ['Email & Mobile', `${row.Email_d || '-'} / ${row.MobileNumber || '-'}`]
      ];
      
      doc.autoTable({
        startY: currentY,
        head: [['Description', 'Value']],
        body: officerData,
        theme: 'striped',
        headStyles: { 
          fillColor: [44, 82, 130],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 55 },
          1: { cellWidth: 115 }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = doc.lastAutoTable.finalY + 10;
      
      // Valuation Statistics
      checkPageBreak(50);
      doc.setFontSize(12);
      doc.setTextColor(44, 82, 130);
      doc.text('Date-wise Valuation Statistics', 20, currentY);
      currentY += 5;

    // Prepare data from backend response
    const summaryByDate = result?.data?.summaryByDate || [];
    
    // Map the data to table format
    const statisticsData = summaryByDate.map(item => ({
      date: item.date || '-',
      subcodeCount: item.subcodeCount?.toString() || '0',
      checkedCount: item.checkedCount?.toString() || '0',
      overallSubcodes: item.overallSubcodes?.toString() || '0',
      totalPapers: item.totalPapers?.toString() || '0'
    }));
    
    doc.autoTable({
      startY: currentY,
      columns: [
        { header: 'Date', dataKey: 'date' },
        { header: 'Subcode', dataKey: 'subcodeCount' },
        { header: 'Checked', dataKey: 'checkedCount' },
        { header: 'Overall', dataKey: 'overallSubcodes' },
        { header: 'Total', dataKey: 'totalPapers' }
      ],
      body: statisticsData,
      theme: 'striped',
      headStyles: { 
        fillColor: [44, 82, 130],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9
      },
      bodyStyles: {
        halign: 'center',
        fontSize: 8
      },
      didParseCell: function(data) {
        if (data.row.index === statisticsData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },
      margin: { left: 20, right: 20 }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    const Examiner_Absent_Details = result?.data?.examinerAbsentDetailsWithNames || [];
    if (Examiner_Absent_Details.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(12);
      doc.setTextColor(44, 82, 130);
      doc.text('Examiner Absent Details (Not Checked Today)', 20, currentY);
      currentY += 5;

      // Get unique evaluators by Evaluator_Id
      const uniqueExaminers = Examiner_Absent_Details.reduce((acc, item) => {
        if (!acc.find(e => e.Evaluator_Id === item.Evaluator_Id)) {
          acc.push(item);
        }
        return acc;
      }, []);

      const absentData = uniqueExaminers.map(item => ({
        evaluatorId: item.Evaluator_Id || '-',
        name: item.FACULTY_NAME || '-',
        mobile: item.MobileNumber || '-',
        email: item.Email_d || '-'
      }));

      doc.autoTable({
        startY: currentY,
        columns: [
          { header: 'Eva ID', dataKey: 'evaluatorId' },
          { header: 'Name', dataKey: 'name' },
          { header: 'Mobile', dataKey: 'mobile' },
          { header: 'Email', dataKey: 'email' }
        ],
        body: absentData,
        theme: 'striped',
        headStyles: { 
          fillColor: [44, 82, 130],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9
        },
        bodyStyles: {
          halign: 'center',
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 },
          3: { cellWidth: 65 }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = doc.lastAutoTable.finalY + 10;
    }

    

    // Chief Examiner Absent Details (for valuation type 1)
    const Chief_Examiner_Absent_Details = result?.data?.chiefExaminerAbsentDetailsWithNames || [];
    if (Chief_Examiner_Absent_Details.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(12);
      doc.setTextColor(44, 82, 130);
      doc.text('Chief Examiner Absent Details (Not Checked Today)', 20, currentY);
      currentY += 5;

      // Get unique chief examiners by Evaluator_Id
      const uniqueChiefExaminers = Chief_Examiner_Absent_Details.reduce((acc, item) => {
        if (!acc.find(e => e.Evaluator_Id === item.Evaluator_Id)) {
          acc.push(item);
        }
        return acc;
      }, []);

      const chiefAbsentData = uniqueChiefExaminers.map(item => ({
        evaluatorId: item.Evaluator_Id || '-',
        name: item.FACULTY_NAME || '-',
        mobile: item.MobileNumber || '-',
        email: item.Email_d || '-'
      }));

      doc.autoTable({
        startY: currentY,
        columns: [
          { header: 'Eva ID', dataKey: 'evaluatorId' },
          { header: 'Name', dataKey: 'name' },
          { header: 'Mobile', dataKey: 'mobile' },
          { header: 'Email', dataKey: 'email' }
        ],
        body: chiefAbsentData,
        theme: 'striped',
        headStyles: { 
          fillColor: [44, 82, 130],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9
        },
        bodyStyles: {
          halign: 'center',
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 },
          3: { cellWidth: 65 }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = doc.lastAutoTable.finalY + 10;
    }
    


const MalpracticeDetails = result?.data?.valuationRemarksWithNames || [];
// Valuation Remarks (Malpractice Details)
if (MalpracticeDetails.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setTextColor(44, 82, 130);
    doc.text('Malpractice', 20, currentY);
    currentY += 5;
    
    // Table data
    const remarksData = MalpracticeDetails.map(remark => ({
        evaId: remark.Eva_Id || '-',
        name: remark.FACULTY_NAME || '-',
        mobile: remark.MobileNumber || '-',
        email: remark.Email_d || '-',
        subcode: remark.subcode || '-',
        barcode: remark.Barcode || '-'
    }));
    
    // Generate table using autoTable
    doc.autoTable({
        startY: currentY,
        columns: [
          { header: 'Eva ID', dataKey: 'evaId' },
          { header: 'Name', dataKey: 'name' },
          { header: 'Mobile', dataKey: 'mobile' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Subcode', dataKey: 'subcode' },
          { header: 'Barcode', dataKey: 'barcode' }
        ],
        body: remarksData,
        theme: 'striped',
        headStyles: {
            fillColor: [44, 82, 130],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9
        },
        bodyStyles: {
            halign: 'center',
            fontSize: 8
        },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 42 },
            2: { cellWidth: 28 },
            3: { cellWidth: 42 },
            4: { cellWidth: 22 },
            5: { cellWidth: 24 }
        },
        margin: { left: 20, right: 20 }
    });
}

    // Add page numbers to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    const fileName = `Camp_Details_${row.Eva_Id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    } catch (error) {
      console.error('Error fetching camp details or generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const filteredData = data.filter(
    (item) =>
      (item.FACULTY_NAME?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
      (item.Eva_Id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
      (item.Email_d?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
      (item.MobileNumber?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
      (item.department?.toLowerCase() || '').includes(filterText.toLowerCase())
  );

  // Export to Excel function
  const handleExportToExcel = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = filteredData.map((item, index) => ({
      'S.No': index + 1,
      'Camp Officer ID': item.Eva_Id,
      'Name': item.FACULTY_NAME,
      'Camp ID': `${item.Camp_id_Camp} ( Val - ${item.valuationType})`,
      'Department': userDegree && item.department ? userDegree.find(d => d.D_Code === item.department)?.Degree_Name || item.department : item.department || '-',
      'Email': item.Email_d || '-',
      'Mobile': item.MobileNumber || '-',
      'Overall Count': item.overallCount,
      'Checked Count': item.checkedCount,
      'Pending Count': item.pendingCount,
      'Percentage': item.Percentage
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Camp Details');
    XLSX.writeFile(workbook, `Camp_Valuation_Details_${new Date().toLocaleDateString()}.xlsx`);
  };

  // Table columns
  const columns = [
    {
      name: 'S.No',
      cell: (row, index) => <div style={{ textAlign: 'center' }}>{(currentPage - 1) * perPage + index + 1}</div>,
      sortable: false,
      width: '40px'
    },
    {
      name: 'Camp Officer ID',
      selector: (row) => row.Eva_Id,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Name',
      selector: (row) => `${row.FACULTY_NAME} (${row.Email_d} | ${row.MobileNumber})`,
      sortable: true,
      width: '200px',
      wrap: true
    },
    {
      name: 'Camp Id',
      selector: (row) => `${row.Camp_id_Camp} ( Val - ${row.valuationType})`,
      sortable: true,
      width: '100px',
      wrap: true
    },
    {
      name: 'Department',
      selector: (row) => userDegree && row.department ? userDegree.find(d => d.D_Code === row.department)?.Degree_Name || row.department : row.department || '-',
      sortable: true,
      width: '120px'
    },

    {
      name: 'Overall Count',
      selector: (row) => row.overallCount,
      sortable: true,
      width: '130px',
      cell: (row) => (
        <div style={{ textAlign: 'center' }}>
          <Badge bg="primary" style={{ fontSize: '13px', padding: '6px 12px' }}>
            {row.overallCount}
          </Badge>
        </div>
      ),
    },
    {
      name: 'Checked Count',
      selector: (row) => row.checkedCount,
      sortable: true,
      width: '130px',
      cell: (row) => (
        <div style={{ textAlign: 'center' }}>
          <Badge bg="success" style={{ fontSize: '13px', padding: '6px 12px' }}>
            {row.checkedCount}
          </Badge>
        </div>
      ),
    },
    {
      name: 'Pending Count',
      selector: (row) => row.pendingCount,
      sortable: true,
      width: '130px',
      cell: (row) => (
        <div style={{ textAlign: 'center' }}>
          <Badge bg="warning" style={{ fontSize: '13px', padding: '6px 12px' }}>
            {row.pendingCount}
          </Badge>
        </div>
      ),
    },
    {
      name: 'Percentage',
      selector: (row) => row.Percentage,
      sortable: true,
      width: '120px',
      cell: (row) => (
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: '600', color: '#2c5282' }}>
            {row.Percentage}%
          </span>
        </div>
      ),
    },
    {
      name : 'Print',
      cell : (row) => (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
          <Button variant="info" size="sm" onClick={() => Print_Camp_Details(row)}>
            <i className="bi bi-printer"></i> Print
          </Button>
          {!(userRole === 1 || userRole === 2) && (
            <Button variant="info" size="sm" onClick={() => Print_Mark_Statment(row)}>
              <i className="bi bi-printer"></i> Mark
            </Button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      width: '160px'
    }
  ];

  // Custom styles for the table
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#2c5282',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '13px',
        borderBottom: '2px solid #1a365d'
      },
    },
    headCells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        borderRight: '1px solid #cbd5e0',
        '&:last-child': {
          borderRight: 'none'
        }
      },
    },
    rows: {
      style: {
        minHeight: '75px',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '13px',
        '&:hover': {
          backgroundColor: '#f7fafc',
          cursor: 'pointer'
        }
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        borderRight: '1px solid #e2e8f0',
        fontSize: '13px',
        '&:last-child': {
          borderRight: 'none'
        }
      },
    }
  };

  return (
    <Container fluid className="p-4">
      <h3 className="mb-4" style={{ color: '#2c5282', fontWeight: '600' }}>
        Camp Valuation Details
      </h3>
      
      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Search by Name, Camp Officer ID, Email, Mobile, or Department..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="text-end d-flex align-items-center justify-content-end gap-3">
              <div style={{ fontSize: '14px', color: '#2c5282' }}>
                <strong>Total Records:</strong> {filteredData.length}
              </div>
              <Button
                variant="success"
                size="sm"
                onClick={handleExportToExcel}
                disabled={filteredData.length === 0}
              >
                <i className="bi bi-file-earmark-excel me-2"></i>
                Export to Excel
              </Button>
            </Col>
          </Row>

          {campLoading ? (
            <ElegantLoader 
              message="Loading camp details..." 
              size="medium"
              variant="info"
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 30, 50]}
              onChangePage={(page) => setCurrentPage(page)}
              onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
              highlightOnHover
              striped
              responsive
              customStyles={customStyles}
              noDataComponent={
                <div className="text-center py-5">
                  <p>No camp details found</p>
                </div>
              }
            />
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Camp_Details;
