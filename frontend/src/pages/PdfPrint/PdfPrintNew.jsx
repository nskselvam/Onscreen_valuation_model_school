import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Form, Row, Col, Badge, Button } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
//import { useGetCampDetailsQuery, useLazyGetCampDetailsOverallQuery } from '../../redux-slice/valuationStatusApiSlice'
import { useGetPdfDataDetailsQuery, useLazyGetMarkDetailsOverallQuery } from '../../redux-slice/pdfGetslice';
import * as XLSX from 'xlsx';
import { useSelector } from 'react-redux';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import navbarData from '../../hooks/navbar/navbar.json'
const { VITE_Institution_Name, VITE_Institution_No } = import.meta.env;

const DataTable = DataTableBase.default || DataTableBase;

const PdfPrintNew = () => {
    // Roman numeral mapping for valuationType
    const valuationTypeMap = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
    
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);


    // Fetch camp details on mount
    const userDegree = useSelector((state) => state.auth.degreeInfo);
    const userCourse = useSelector((state) => state.auth.userInfo.selected_course);
    const userRole = useSelector((state) => state.auth.userInfo.selected_role);
    const UserName = useSelector((state) => state.auth.userInfo.username);
    const Institution_Details = navbarData.find(n => String(n._id) === String(VITE_Institution_No)) || {}
    const { data: campData, isLoading: campLoading } = useGetPdfDataDetailsQuery(
        userCourse ? {
            course: userCourse,
            role: userRole,
            Eva_Id: UserName
        } : {}
    );

    console.log('Fetched camp data:', campData, 'with params:', { course: userCourse, role: userRole, Eva_Id: UserName });
    // Lazy query for fetching detailed camp data on demand
    const [triggerGetCampDetailsOverall, { data: campDataAll, isLoading: campOverallLoading }] = useLazyGetMarkDetailsOverallQuery();

    useEffect(() => {
        if (campData?.campResults) {
            setData(campData.campResults);
        }
    }, [campData]);

    const Print_Camp_Details = async (row) => {

        if (VITE_Institution_No === '2') {
            // Thiagarajar College of Engineering PDF Style
            try {
                console.log('Triggering PDF generation for Thiagarajar College:', row);
                
                const result = await triggerGetCampDetailsOverall({
                    course: userCourse,
                    role: userRole,
                    evaId: row.Eva_Id,
                    campId: row.Camp_id_Camp,
                    department: row.department,
                    valuationType: row.valuationType,
                    Examiner_Status: row.Examiner_Status
                }).unwrap();

                console.log('Fetched detailed camp data:', result);

                const doc = new jsPDF('p', 'mm', 'a4');
                const pageHeight = doc.internal.pageSize.getHeight();
                const pageWidth = doc.internal.pageSize.getWidth();
                let currentY = 15;

                const departmentName = userDegree && row.department
                    ? userDegree.find(d => d.D_Code === row.department)?.Degree_Name || row.department
                    : row.department || '-';

                // Get data first before header
                const Subject_Master = result.uniqueSubcodes || [];
                const Mark_Details_Overall = result.markDetails || [];

                // Header function for Thiagarajar style - accepts subject parameter
                const addHeader = (currentSubject) => {
                    currentY = 10;
                    
                    // Institution Name - Bold and larger
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text(Institution_Details.InstitutionName || 'THIAGARAJAR COLLEGE OF ENGINEERING', pageWidth / 2, currentY, { align: 'center' });
                    currentY += 6;

                    // Subtitle line
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Camp Details: E & T  - ${row.Camp_id_Camp || '-'}`, pageWidth / 2, currentY, { align: 'center' });
                    currentY += 5;
                  
                    // Subtitle line
                    // doc.setFontSize(10);
                    // doc.setFont('helvetica', 'normal');
                    // doc.text('(An Autonomous Institution affiliated to Anna University)', pageWidth / 2, currentY, { align: 'center' });
                    // currentY += 5;

                    // // Exam title
                    // doc.setFontSize(11);
                    // doc.setFont('helvetica', 'bold');
                    // doc.text('ONLINE VALUATION SYSTEM', pageWidth / 2, currentY, { align: 'center' });
                    // currentY += 5;

                    // // Valuation type
                    // doc.setFontSize(10);
                    // doc.setFont('helvetica', 'bold');
                    // doc.text(`VALUATION - ${valuationTypeMap[row.valuationType] || row.valuationType}`, pageWidth / 2, currentY, { align: 'center' });
                    // currentY += 8;

                    // Examiner details box
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.3);
                    const boxHeight = 18;
                    doc.rect(15, currentY, pageWidth - 30, boxHeight);
                    
                    currentY += 5;
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');
                    
                    // Left column - Examiner ID and Name merged, Course Code and Name merged
                    const leftX = 20;
                    let leftY = currentY;
                    doc.text(`Examiner: ${row.Eva_Id || '-'} - ${row.FACULTY_NAME || '-'}`, leftX, leftY);
                    leftY += 10;
                    
                    // Get current subject marks count for this specific subject
                    const currentSubjectMarks = Mark_Details_Overall.filter(m => m.subcode === currentSubject.Subcode);
                    
                    doc.text(`Course Code & Name : ${currentSubject?.Subcode || '-'} - ${currentSubject?.SUBNAME || '-'}`, pageWidth / 2, leftY, { align: 'center' });
                    
                    // Right column - Total, Maximum Mark (Camp ID removed)
                    const rightX = pageWidth - 20;
                    let rightY = currentY;
                    doc.text(`Total: ${currentSubjectMarks.length || 0}`, rightX, rightY, { align: 'right' });
                    rightY += 4.5;
                    doc.text(`Maximum Mark: 100`, leftX, rightY);
                    
                    currentY += boxHeight + 3;
                };

                const checkPageBreak = (requiredSpace, currentSubject) => {
                    if (currentY + requiredSpace > pageHeight - 30) {
                        doc.addPage();
                        addHeader(currentSubject);
                        return true;
                    }
                    return false;
                };

                Subject_Master.forEach((subject, index) => {
                    // Create new page for each subject change
                    if (index === 0) {
                        // First subject - add initial header
                        addHeader(subject);
                    } else {
                        // New subject - create new page with updated header
                        doc.addPage();
                        addHeader(subject);
                    }

                    const subjectMarks = Mark_Details_Overall.filter(m => m.subcode === subject.Subcode)
                        .sort((a, b) => {
                            const barcodeA = a.barcode || '';
                            const barcodeB = b.barcode || '';
                            return barcodeA.toString().localeCompare(barcodeB.toString(), undefined, { numeric: true });
                        });

                    // Remove subject header box - no longer needed since info is in top box

                    // Marks table - 3 columns with 25 rows each
                    const columns = 3;
                    const maxRowsPerColumn = 25;
                    const columnWidth = (pageWidth - 30) / columns;
                    const startX = 15;
                    const rowHeight = 8.5;

                    // Process marks in batches of 75 (3 columns x 25 rows)
                    for (let batch = 0; batch < Math.ceil(subjectMarks.length / (columns * maxRowsPerColumn)); batch++) {
                        const startIdx = batch * columns * maxRowsPerColumn;
                        const endIdx = Math.min(startIdx + columns * maxRowsPerColumn, subjectMarks.length);
                        const batchMarks = subjectMarks.slice(startIdx, endIdx);

                        // Calculate actual rows needed for this batch (might be less than 25 for last batch)
                        const actualRows = Math.max(...Array.from({length: columns}, (_, col) => 
                            Math.ceil((batchMarks.length - col * maxRowsPerColumn) / maxRowsPerColumn)
                        ).filter(n => n > 0));
                        const actualHeight = actualRows * rowHeight + 12;

                        // Check if we need a new page for this batch
                        // Only check after the first batch or if we'll run out of space
                        if (batch > 0 || currentY + actualHeight > pageHeight - 30) {
                            checkPageBreak(actualHeight, subject);
                        }

                        // Draw table headers
                        doc.setDrawColor(0, 0, 0);
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(0, 0, 0);
                        
                        for (let col = 0; col < columns; col++) {
                            const xPos = startX + (col * columnWidth);
                            const dummyColWidth = columnWidth * 0.65;
                            const markColWidth = columnWidth * 0.35;
                            
                            // Dummy No header
                            doc.rect(xPos, currentY, dummyColWidth - 2, 8, 'S');
                            doc.text('Dummy No', xPos + (dummyColWidth - 2) / 2, currentY + 5.5, { align: 'center' });
                            
                            // Marks header
                            doc.rect(xPos + dummyColWidth - 2, currentY, markColWidth, 8, 'S');
                            doc.text('Marks', xPos + dummyColWidth - 2 + markColWidth / 2, currentY + 5.5, { align: 'center' });
                        }
                        
                        currentY += 8;

                        // Fill the table with marks
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(12);
                        
                        for (let row = 0; row < maxRowsPerColumn; row++) {
                            for (let col = 0; col < columns; col++) {
                                const idx = row + (col * maxRowsPerColumn);
                                if (idx < batchMarks.length) {
                                    const mark = batchMarks[idx];
                                    const xPos = startX + (col * columnWidth);
                                    const dummyColWidth = columnWidth * 0.65;
                                    const markColWidth = columnWidth * 0.35;
                                    const yPos = currentY + (row * rowHeight);
                                    
                                    const markValue = row.Examiner_Status === '2' ? mark.Chief_tot_round : mark.tot_round;

                                    // Draw cell borders
                                    doc.setDrawColor(200, 200, 200);
                                    doc.setLineWidth(0.1);
                                    doc.rect(xPos, yPos, dummyColWidth - 2, rowHeight);
                                    doc.rect(xPos + dummyColWidth - 2, yPos, markColWidth, rowHeight);

                                    // Dummy No
                                    doc.setTextColor(0, 0, 0);
                                    doc.text(mark.barcode || '-', xPos + 2, yPos + 5.5);
                                    
                                    // Marks with color coding
                                    if (markValue === '0' || markValue === 0) {
                                        doc.setTextColor(220, 53, 69);
                                    } else {
                                        doc.setTextColor(0, 0, 0);
                                    }
                                    doc.setFont('helvetica', 'bold');
                                    doc.setFontSize(12);
                                    doc.text(`${markValue || '-'}`, xPos + dummyColWidth - 2 + markColWidth / 2, yPos + 5.5, { align: 'center' });
                                    doc.setFont('helvetica', 'normal');
                                    doc.setFontSize(12);
                                }
                            }
                        }

                        currentY += (maxRowsPerColumn * rowHeight) + 5;
                    }
                });

                // Footer with signature, date and page number
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    
                    // Footer at bottom
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(0, 0, 0);
                    
                    // Date on left
                    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, pageHeight - 10);
                    
                    // Page number centered
                    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                    
                    // Signature on right
                    doc.setFont('helvetica', 'bold');
                    doc.text(row.Examiner_Status === '2' ? 'Chief Examiner Signature' : 'Examiner Signature', pageWidth - 20, pageHeight - 10, { align: 'right' });
                }

                const fileName = `TCE_Valuation_${row.Eva_Id}_${new Date().toISOString().split('T')[0]}.pdf`;
                doc.save(fileName);

            } catch (error) {
                console.error('Error generating Thiagarajar College PDF:', error);
                alert('Failed to generate PDF. Please try again.');
            }

        } else {
   
        try {
            console.log('Triggering PDF generation for row:', row);
            // Trigger the RTK Query to fetch detailed camp data
            const result = await triggerGetCampDetailsOverall({
                course: userCourse,
                role: userRole,
                evaId: row.Eva_Id,
                campId: row.Camp_id_Camp,
                department: row.department,
                valuationType: row.valuationType,
                Examiner_Status: row.Examiner_Status
            }).unwrap();

            console.log('Fetched detailed camp data:', result);

            // Create a new PDF document with A4 size
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            let currentY = 10; // Starting Y position for content

            const departmentName = userDegree && row.department
                ? userDegree.find(d => d.D_Code === row.department)?.Degree_Name || row.department
                : row.department || '-';

            // Helper function to add header on each page
            const addHeader = () => {
                currentY = 10;
                // Title
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(44, 82, 130);
                doc.text(Institution_Details.InstitutionName || VITE_Institution_Name || 'Government Institution', pageWidth / 2, 7, { align: 'center' });
                currentY += 2;


                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(44, 82, 130);
                doc.text(`Camp Details : ${departmentName} - ${row.Camp_id_Camp} - ${row.Camp_id || '-'}`, pageWidth / 2, currentY, { align: 'center' });
                currentY += 5;


                // Horizontal line
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(44, 82, 130);
                doc.text(`${row.Examiner_Status === '2' ? 'Chief Examiner' : 'Examiner'} Name & Id:  ${row.FACULTY_NAME || '-'}  -  ${row.Eva_Id || '-'}`, 5, currentY, { align: 'left' });

           

                doc.setFontSize(14);
                doc.setTextColor(44, 82, 130);
                doc.text(`Valuation :  ${valuationTypeMap[row.valuationType] || row.valuationType || '-'}`, pageWidth - 6, currentY, { align: 'right' });
                currentY += 3;

                // Add Examiner_Status circle in top right corner
                const circleRadius = 5; // 0.5 cm = 5 mm
                const circleY = 7; // Top position
                const circleXPos = pageWidth - 15; // Position from right
                
                // Determine the label based on Examiner_Status
                const statusLabel = row.Examiner_Status === '2' ? 'C' : 'E';
                
                // Draw circle
                doc.setDrawColor(44, 82, 130);
                doc.setLineWidth(0.5);
                doc.circle(circleXPos, circleY, circleRadius, 'S');
                
                // Add label text inside circle
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(44, 82, 130);
                doc.text(statusLabel, circleXPos, circleY + 2, { align: 'center' });

                // Add watermark in center if Chief Examiner
                if (row.Examiner_Status === '2') {
                    doc.setFontSize(60);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(200, 200, 200); // Light gray color for watermark
                    doc.saveGraphicsState();
                    doc.setGState(new doc.GState({ opacity: 0.3}));
                    doc.text('CHIEF EXAMINER', pageWidth / 2, pageHeight / 2, { 
                        align: 'center',
                        angle: 45
                    });
                    doc.restoreGraphicsState();
                }

                doc.setDrawColor(44, 82, 130);
                doc.setLineWidth(0.5);
                doc.line(5, currentY, pageWidth - 5, currentY);
                currentY += 4;
            };

            // Helper function to check if we need a new page
            const checkPageBreak = (requiredSpace) => {
                if (currentY + requiredSpace > pageHeight - 20) {
                    doc.addPage();
                    addHeader();
                    return true;
                }
                return false;
            };

            // Add header to first page
            addHeader();

            const Subject_Master = result.uniqueSubcodes || [];
            const Mark_Details_Overall = result.markDetails || [];

            Subject_Master.forEach((subject, index) => {

                
                const subjectMarks = Mark_Details_Overall.filter(m => m.subcode === subject.Subcode)
                .sort((a, b) => {
                    // Sort by barcode numerically if both are numbers, otherwise alphabetically
                    const barcodeA = a.barcode || '';
                    const barcodeB = b.barcode || '';
                    return barcodeA.toString().localeCompare(barcodeB.toString(), undefined, { numeric: true });
                });
                doc.setFontSize(9);
                doc.setTextColor(44, 82, 130);
                doc.text(`${VITE_Institution_No == '2' ? 'Course Code  & Name: ' : 'Subcode & Name: '} ${subject.Subcode || '-'} - ${subject.SUBNAME || '-'}`, 5, currentY, { align: 'left' });
                doc.setFontSize(9);
                doc.setTextColor(44, 82, 130);
                doc.text(`Total Count: ${subjectMarks.length}`, pageWidth - 8, currentY, { align: 'right' });
                currentY += 5;

      




                // Print marks in 7 columns
                const columns = 8;
                const columnWidth = 25; // Width for each column
                const startX = 5;
                let rowHeight = 0;

                subjectMarks.forEach((mark, idx) => {
                    const col = idx % columns;
                    const gridRow = Math.floor(idx / columns);

                    // Check if we need a page break for new row
                    if (col === 0 && gridRow > rowHeight) {
                        checkPageBreak(6);
                        rowHeight = gridRow;
                    }

                    const xPos = startX + (col * columnWidth);

                    const markValue = row.Examiner_Status === '2' ? mark.Chief_tot_round : mark.tot_round ;

                    console.log('Rendering mark:',row.Examiner_Status,'', mark.barcode, markValue);


                    doc.setFontSize(10);
                    // Set color to red if mark is 0, otherwise use default blue
                    if (markValue === '0' || markValue === 0) {
                        doc.setTextColor(220, 53, 69); // danger red color
                    } else {
                        //doc.setTextColor(44, 82, 130); // default blue color
                         doc.setTextColor(0, 0, 0); // default blue color
                    }
                    
                    // Render barcode in normal font
                    doc.setFont('helvetica', 'normal');
                    const barcodeText = `${mark.barcode} - `;
                    doc.text(barcodeText, xPos, currentY + (gridRow * 5), { align: 'left' });
                    
                    // Calculate width of barcode text and render markValue in bold
                    const barcodeWidth = doc.getTextWidth(barcodeText);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${markValue || '-'}`, xPos + barcodeWidth, currentY + (gridRow * 5), { align: 'left' });
                });

                // Move currentY after all marks are printed
                if (subjectMarks.length > 0) {
                    const totalRows = Math.ceil(subjectMarks.length / columns);
                    currentY += (totalRows * 5) + 3;
                }

                // Add horizontal line separator after each subject
                checkPageBreak(5);
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.3);
                doc.line(5, currentY, pageWidth - 5, currentY);
                currentY += 4;

            });
            // Get department name

            // Officer details table


            // Valuation Statistics
            // Add page numbers to all pages
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 5,
                    { align: 'center' }
                );
                // Add generated date on bottom left
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, pageHeight - 5, { align: 'left' });
                
                // Add signature on bottom right edge
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(row.Examiner_Status === '2' ? 'Chief Examiner Signature' : 'Examiner Signature', pageWidth - 30, pageHeight - 5, { align: 'right' });
            }

            // Save the PDF
            const fileName = `Examiner_Details_${row.Eva_Id}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Error fetching camp details or generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
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
            'Camp ID': `${item.Camp_id_Camp} ( Val - ${valuationTypeMap[item.valuationType] || item.valuationType})`,
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
            width: '70px'
        },
        {
            name: 'Evaluator ID',
            selector: (row) => row.Eva_Id,
            sortable: true,
            width: '140px',
        },
        {
            name: 'Name',
            selector: (row) => `${row.FACULTY_NAME} (${row.Email_d} | ${row.MobileNumber})`,
            sortable: true,
            width: '250px',
            wrap: true
        },
        {
            name: 'Camp ID',
            selector: (row) => `${row.Camp_id_Camp} ( Val - ${valuationTypeMap[row.valuationType] || row.valuationType})`,
            sortable: true,
            width: '120px',
            wrap: true
        },
        {
            name: 'Department',
            selector: (row) => userDegree && row.department ? userDegree.find(d => d.D_Code === row.department)?.Degree_Name || row.department : row.department || '-',
            sortable: true,
            width: '150px'
        },
        {
            name: 'Examiner Status',
            selector: (row) => row.Examiner_Status || 'N/A',
            sortable: true,
            width: '130px',
            cell: (row) => (
                <div style={{ textAlign: 'center' }}>
                    <Badge bg={row.Examiner_Status === '1' ? 'success' : 'secondary'} style={{ fontSize: '13px', padding: '6px 12px' }}>
                        {row.Examiner_Status === '1' ? 'Examiner' : row.Examiner_Status === '2' ? 'Chief Examiner' : 'N/A'}
                    </Badge>
                </div>
            ),

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
        // {
        //   name: 'Pending Count',
        //   selector: (row) => row.pendingCount,
        //   sortable: true,
        //   width: '130px',
        //   cell: (row) => (
        //     <div style={{ textAlign: 'center' }}>
        //       <Badge bg="warning" style={{ fontSize: '13px', padding: '6px 12px' }}>
        //         {row.pendingCount}
        //       </Badge>
        //     </div>
        //   ),
        // },
        // {
        //   name: 'Percentage',
        //   selector: (row) => row.Percentage,
        //   sortable: true,
        //   width: '110px',
        //   cell: (row) => (
        //     <div style={{ textAlign: 'center' }}>
        //       <span style={{ fontWeight: '600', color: '#2c5282' }}>
        //         {row.Percentage}%
        //       </span>
        //     </div>
        //   ),
        // },
        {
            name: 'Print PDF',
            cell: (row) => (
                <div style={{ textAlign: 'center' }}>
                    <Button variant="info" size="sm" onClick={() => Print_Camp_Details(row)}>
                        <i className="bi bi-printer"></i> Print
                    </Button>
                </div>
            ),
            ignoreRowClick: true,
            center: true,
            width: '100px'
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
                Evaluation Print
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
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Loading camp details...</p>
                        </div>
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

export default PdfPrintNew;