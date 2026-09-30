import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Badge, Button } from 'react-bootstrap';
import ElegantLoader from '../../../components/ElegantLoader';
import DataTableBase from 'react-data-table-component';
import { useGetRemarksMalpracticeDetailsQuery } from '../../../redux-slice/valuationStatusApiSlice';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const DataTable = DataTableBase.default || DataTableBase;

const RemarksMalpracticeDetails = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [remarksType, setRemarksType] = useState('1');
    const { data: apiData, error, isLoading: apiLoading } = useGetRemarksMalpracticeDetailsQuery({ 
        
     });

    const getTodayDate = () => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Fetch remarks/malpractice details
    // const fetchRemarksDetails = async () => {
    //     setIsLoading(true);
    //     try {
    //         const response = await axios.post('/api/valuation-status/remarks-malpractice-details', {
    //             Remarks_Type: remarksType
    //         });

    //         if (response.data.success) {
    //             setData(response.data.data || []);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching remarks details:', error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    useEffect(() => {
        if (apiData) {
            const filtered = apiData.data.filter(item => item.Remarks_Type === remarksType);
            setData(filtered || []);
        }
    }, [apiData,remarksType]);

    // Filter data
    const filteredData = data.filter((item) =>
        (item.evaluator_id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.evaluator_name?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Dummy_Number?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.evaluator_subject?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.msg?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.Campid?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (item.remarks_reasons?.toLowerCase() || '').includes(filterText.toLowerCase())
    );

    // Export to Excel
    const handleExportToExcel = () => {
        if (filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const exportData = filteredData.map((item, index) => ({
            'S.No': index + 1,
            'Evaluator ID': item.evaluator_id,
            'Evaluator Name': item.evaluator_name,
            'Remarks Type': item.Remarks_Type,
            'Examiner Type': item.Examiner_Type,
            'Message': item.msg,
            'Subject': item.evaluator_subject,
            'Dummy Number': item.Dummy_Number,
            'Remarks Subject': item.RemarksSubject,
            'Camp Officer ID': item.Campofficerid,
            'Camp ID': item.Campid,
            'Department Name': item.Dep_Name,
            'Remarks Reasons': item.remarks_reasons
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Remarks Details');
        XLSX.writeFile(workbook, `Remarks_Malpractice_Details_Type${remarksType}_${new Date().toLocaleDateString()}.xlsx`);
    };

    // Export to PDF
    const handleExportToPDF = () => {
        if (filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        try {
            // Create a new PDF document with A4 size
            const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation for better table fit
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            let currentY = 20;

            // Get remarks type label
            const remarksTypeLabel = remarksType === '1' ? 'General Remarks' : remarksType === '2' ? 'Malpractice' : 'Queries';

            // Title
            doc.setFontSize(16);
            doc.setTextColor(44, 82, 130);
            doc.text(`${remarksTypeLabel} Details`, pageWidth / 2, currentY, { align: 'center' });
            currentY += 5;

            // Horizontal line
            doc.setDrawColor(44, 82, 130);
            doc.setLineWidth(0.5);
            doc.line(20, currentY, pageWidth - 20, currentY);
            currentY += 7;

            // Date and summary
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, currentY);
            doc.text(`Total Records: ${filteredData.length}`, pageWidth - 20, currentY, { align: 'right' });
            currentY += 10;

            // Prepare table data
            const tableData = filteredData.map((item, index) => ({
                sno: index + 1,
                campId: item.Campid || '-',
                campOfficer: item.Campofficerid || '-',
                dept: item.Dep_Name || '-',
                evaluatorId: item.evaluator_id || '-',
                evaluatorName: item.evaluator_name || '-',
                dummy: item.Dummy_Number || '-',
                subject: item.evaluator_subject || '-',
                message: item.msg || '-',
                remarksSubject: item.RemarksSubject || '-',
                reason: item.remarks_reasons || '-'
            }));

            // Generate table
            doc.autoTable({
                startY: currentY,
                columns: [
                    { header: 'S.No', dataKey: 'sno' },
                    { header: 'Camp ID', dataKey: 'campId' },
                    { header: 'Officer ID', dataKey: 'campOfficer' },
                    { header: 'Dept', dataKey: 'dept' },
                    { header: 'Eva ID', dataKey: 'evaluatorId' },
                    { header: 'Name', dataKey: 'evaluatorName' },
                    { header: 'Dummy', dataKey: 'dummy' },
                    { header: 'Subject', dataKey: 'subject' },
                    { header: 'Message', dataKey: 'message' },
                    { header: 'Remarks Subject', dataKey: 'remarksSubject' },
                    { header: 'Reason', dataKey: 'reason' }
                ],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [44, 82, 130],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 8
                },
                bodyStyles: {
                    fontSize: 7,
                    cellPadding: 2
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 18, halign: 'center' },
                    2: { cellWidth: 18, halign: 'center' },
                    3: { cellWidth: 15 },
                    4: { cellWidth: 18, halign: 'center' },
                    5: { cellWidth: 30 },
                    6: { cellWidth: 16, halign: 'center' },
                    7: { cellWidth: 25 },
                    8: { cellWidth: 28 },
                    9: { cellWidth: 28 },
                    10: { cellWidth: 28 }
                },
                margin: { left: 10, right: 10 },
                didDrawPage: function (data) {
                    // Footer with page numbers
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.text(
                        `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: 'center' }
                    );
                }
            });

            // Save the PDF
            const fileName = `${remarksTypeLabel}_Details_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    // Get badge color based on examiner type
    const getExaminerTypeBadge = (type) => {
        const typeMap = {
            '1': { label: 'First Examiner', color: 'primary' },
            '2': { label: 'Second Examiner', color: 'success' },
            '3': { label: 'Third Examiner', color: 'warning' },
            '4': { label: 'Fourth Examiner', color: 'info' }
        };
        return typeMap[type] || { label: `Type ${type}`, color: 'secondary' };
    };

    // Get badge color based on remarks type
    const getRemarksTypeBadge = (type) => {
        const typeMap = {
            '1': { label: 'General Remark', color: 'warning' },
            '2': { label: 'Malpractice', color: 'danger' },
            '3': { label: 'Query', color: 'info' }
        };
        return typeMap[type] || { label: `Type ${type}`, color: 'secondary' };
    };

    // Table columns
    const columns = [
        {
            name: 'S.No',
            cell: (row, index) => <div style={{ textAlign: 'center' }}>{(currentPage - 1) * perPage + index + 1}</div>,
            sortable: false,
            width: '60px',
        },
        {
            name: 'Camp Details',
            selector: (row) => row.Campid,
            sortable: true,
            width: '140px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px', marginBottom: '4px' }}>
                        {row.Campid || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        Officer ID: {row.Campofficerid || '-'}
                    </div>
                    <div style={{ color: '#718096', fontSize: '11px' }}>
                        Dept: {row.Dep_Name || '-'}
                    </div>
                </div>
            ),
        },
        {
            name: 'Evaluator Details',
            selector: (row) => row.evaluator_id,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px', marginBottom: '4px' }}>
                        {row.evaluator_id || '-'}
                    </div>
                    <div style={{ color: '#4a5568', fontWeight: '500' }}>
                        {row.evaluator_name || '-'}
                    </div>
                </div>
            ),
        },
        {
            name: 'Dummy Number',
            selector: (row) => row.Dummy_Number,
            sortable: true,
            width: '100px',
            cell: (row) => (
                <div style={{ textAlign: 'center' }}>
                    <Badge bg="dark" style={{ fontSize: '13px', padding: '6px 12px' }}>
                        {row.Dummy_Number || '-'}
                    </Badge>
                </div>
            ),
        },
        {
            name: 'Subject',
            selector: (row) => row.evaluator_subject,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', color: '#4a5568', fontWeight: '500' }}>
                    {row.evaluator_subject || '-'}
                </div>
            ),
        },
        {
            name: 'Remarks Type',
            selector: (row) => row.Remarks_Type,
            sortable: true,
            width: '130px',
            cell: (row) => {
                const badge = getRemarksTypeBadge(row.Remarks_Type);
                return (
                    <div style={{ textAlign: 'center' }}>
                        <Badge bg={badge.color} style={{ fontSize: '12px', padding: '6px 12px' }}>
                            {badge.label}
                        </Badge>
                    </div>
                );
            },
        },
        // {
        //     name: 'Examiner Type',
        //     selector: (row) => row.Examiner_Type,
        //     sortable: true,
        //     width: '150px',
        //     center: true,
        //     cell: (row) => {
        //         const badge = getExaminerTypeBadge(row.Examiner_Type);
        //         return (
        //             <Badge bg={badge.color} style={{ fontSize: '12px', padding: '6px 12px' }}>
        //                 {badge.label}
        //             </Badge>
        //         );
        //     },
        // },
        {
            name: 'Message',
            selector: (row) => row.msg,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', color: '#4a5568', lineHeight: '1.4' }}>
                    {row.msg || '-'}
                </div>
            ),
        },
        {
            name: 'Remarks Subject',
            selector: (row) => row.RemarksSubject,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', color: '#4a5568', lineHeight: '1.4' }}>
                    {row.RemarksSubject || '-'}
                </div>
            ),
        },
        {
            name: 'Remarks Reason',
            selector: (row) => row.remarks_reasons,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: (row) => (
                <div style={{ fontSize: '12px', color: '#4a5568', lineHeight: '1.4' }}>
                    {row.remarks_reasons || '-'}
                </div>
            ),
        }
    ];

    // Custom styles for DataTable
    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#2c5282',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '8px 8px 0 0',
                minHeight: '52px',
            },
        },
        rows: {
            style: {
                fontSize: '13px',
                minHeight: '60px',
                '&:hover': {
                    backgroundColor: '#f0f4f8',
                    cursor: 'pointer',
                },
            },
            stripedStyle: {
                backgroundColor: '#f8fafc',
            },
        },
        pagination: {
            style: {
                borderTop: '1px solid #e2e8f0',
                minHeight: '56px',
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
                Remarks & Malpractice Details
            </h3>

            {/* Remarks Type Selector and Controls */}
            <Card className="mb-3">
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <div className="d-flex gap-2">
                                {[
                                    { value: '1', label: 'General Remarks', color: '#ffc107' },
                                    { value: '2', label: 'Malpractice', color: '#dc3545' },
                                    // { value: '3', label: 'Queries', color: '#17a2b8' }
                                ].map((type) => (
                                    <Button
                                        key={type.value}
                                        variant={remarksType === type.value ? 'primary' : 'outline-secondary'}
                                        onClick={() => setRemarksType(type.value)}
                                        style={{
                                            borderRadius: '8px',
                                            padding: '10px 20px',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            border: remarksType === type.value ? `2px solid ${type.color}` : '2px solid #dee2e6',
                                            backgroundColor: remarksType === type.value ? type.color : '#ffffff',
                                            color: remarksType === type.value ? '#ffffff' : '#6c757d',
                                            transition: 'all 0.3s ease',
                                            boxShadow: remarksType === type.value ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        {type.label}
                                    </Button>
                                ))}
                            </div>
                        </Col>
                        <Col md={6} className="d-flex align-items-center justify-content-end gap-3">
                            <Form.Control
                                type="text"
                                placeholder="Search by Evaluator, Dummy Number, Subject..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                style={{ maxWidth: '350px' }}
                            />
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleExportToPDF}
                                disabled={filteredData.length === 0}
                            >
                                <i className="bi bi-file-earmark-pdf me-2"></i>
                                Export to PDF
                            </Button>
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

                    {isLoading ? (
                        <ElegantLoader 
                            message="Loading remarks details..." 
                            size="medium"
                            variant="warning"
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
                            onChangePage={(page) => setCurrentPage(page)}
                            onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
                            highlightOnHover
                            striped
                            responsive
                            customStyles={customStyles}
                            noDataComponent={
                                <div className="text-center py-5">
                                    <p>No remarks details found</p>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RemarksMalpracticeDetails;