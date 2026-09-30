import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col,Spinner, Badge, Modal, Table, Button, Form } from 'react-bootstrap';
import DataTableBase from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileInvoiceDollar, FaInfoCircle, FaCheckCircle, FaSearch, FaPrint, FaTrash, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useGetexaminerPaymentDetailsQuery, usePostExaminerPaymentChallanMutation, useDeleteExaminerPaymentMutation, usePostUserBankDetailsUpdateMutation, useGetUserBankDetailsQuery,usePostBankifscUpdateconsolidatedMutation } from '../../redux-slice/userDashboardSlice';
import navbarData from '../../hooks/navbar/navbar.json';
import ElegantLoader from '../../components/ElegantLoader';
const { VITE_Institution_No } = import.meta.env;

const DataTable = DataTableBase.default || DataTableBase;
 
const ConsolidatedPaymentDetails = () => {
    const userInfo = useSelector((state) => state.auth.userInfo);
    const monthYear = useSelector((state) => state.auth.monthyearInfo || {});
    const Eva_Id = userInfo?.username || '';

    console.log("User Info:", userInfo);
    console.log("Month Year Info:", monthYear);

    const [filterText, setFilterText] = useState('');
    const [valuationType, setValuationType] = useState('');
    const [campIdFilter, setCampIdFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [postExaminerPaymentChallan, { isLoading: isPosting }] = usePostExaminerPaymentChallanMutation();
    const [deleteExaminerPayment, { isLoading: isDeleting }] = useDeleteExaminerPaymentMutation();
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, row: null });
    const [editingBank, setEditingBank] = useState(false);
    const [bankFormData, setBankFormData] = useState({});
    const [ifscToFetch, setIfscToFetch] = useState('');
    const [skipIfscQuery, setSkipIfscQuery] = useState(true);
    const [isWebIfscLoading, setIsWebIfscLoading] = useState(false);
    const [webIfscError, setWebIfscError] = useState('');
    const [webIfscData, setWebIfscData] = useState(null);
    const [updateBankDetails, { isLoading: isUpdatingBank }] = usePostUserBankDetailsUpdateMutation();
    const [updateBankIfscConsolidated, { isLoading: isUpdatingBankIfscConsolidated }] = usePostBankifscUpdateconsolidatedMutation();
    const { data: ifscBankData, error: ifscError, isLoading: isIfscLoading } = useGetUserBankDetailsQuery(
        { ifsc: ifscToFetch },
        { skip: skipIfscQuery }
    );

    const Institution_Details = navbarData.find(n => String(n._id) === String(VITE_Institution_No)) || {}

    const { data: paymentData, isLoading, isError, refetch } = useGetexaminerPaymentDetailsQuery({
        Eva_Id,
        Valuation_Type: valuationType || undefined,
        Role: userInfo?.selected_role || undefined,
    });

    useEffect(() => {
        if (Eva_Id) {
            refetch();
        }
    }, [Eva_Id, valuationType]);

    // Auto-fill bank details when IFSC is fetched from local DB
    useEffect(() => {
        if (ifscBankData && editingBank) {
            setBankFormData(prev => ({
                ...prev,
                bankName: ifscBankData.BANK_NAME || ifscBankData.BANK || prev.bankName,
                branchName: ifscBankData.BRANCH || prev.branchName,
                bankAddress: ifscBankData.ADDRESS || prev.bankAddress
            }));
            setWebIfscData(null);
            setWebIfscError('');
        }
    }, [ifscBankData]);

    // Automatically try web API if local DB fails
    useEffect(() => {
        if (ifscError && ifscToFetch && ifscToFetch.length === 11 && editingBank) {
            // Automatically fetch from web as fallback
            fetchIfscFromWeb(ifscToFetch);
        }
    }, [ifscError, ifscToFetch]);

    const records = Array.isArray(paymentData) ? paymentData : [];

    // Get unique Camp IDs for the dropdown
    const uniqueCampIds = [...new Set(records.map(item => item.Camp_Id).filter(Boolean))].sort();

    const filteredData = records.filter((item) => {
        const matchesText = 
            (item.Evaluation_Id?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
            (item.Evaluation_Name?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
            (item.ChallanNumber?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
            (item.Camp_Id?.toLowerCase() || '').includes(filterText.toLowerCase());
        
        const matchesCampId = campIdFilter === '' || item.Camp_Id === campIdFilter;
        
        return matchesText && matchesCampId;
    }).sort((a, b) => {
        // Sort by IFSC code: CIUB first, then alphabetically
        const ifscA = (a.IFSC || '').toUpperCase();
        const ifscB = (b.IFSC || '').toUpperCase();
        
        const isCIUB_A = ifscA.startsWith('CIUB');
        const isCIUB_B = ifscB.startsWith('CIUB');
        
        // CIUB banks come first
        if (isCIUB_A && !isCIUB_B) return -1;
        if (!isCIUB_A && isCIUB_B) return 1;
        
        // Within same category, sort alphabetically by IFSC
        return ifscA.localeCompare(ifscB);
    });

    const handleViewSubjects = (row) => {
        setSelectedRecord(row);
        setShowModal(true);
        // Reset editing state when opening a new record
        setEditingBank(false);
        setBankFormData({});
        setWebIfscData(null);
        setWebIfscError('');
        setSkipIfscQuery(true);
    };

    // Handle modal close and reset all editing states
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBank(false);
        setBankFormData({});
        setWebIfscData(null);
        setWebIfscError('');
        setSkipIfscQuery(true);
    };

    // Fetch IFSC details from web API (Razorpay public API)
    const fetchIfscFromWeb = async (ifscCode) => {
        if (!ifscCode || ifscCode.length !== 11) {
            setWebIfscError('Please enter a valid 11-character IFSC code');
            return;
        }

        setIsWebIfscLoading(true);
        setWebIfscError('');
        setWebIfscData(null);

        try {
            const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
            
            if (!response.ok) {
                throw new Error('IFSC code not found');
            }

            const data = await response.json();
            setWebIfscData(data);
            
            // Auto-fill the form with web API data
            setBankFormData(prev => ({
                ...prev,
                bankName: data.BANK || prev.bankName,
                branchName: data.BRANCH || prev.branchName,
                bankAddress: data.ADDRESS || prev.bankAddress
            }));
            
            toast.success('Bank details fetched from web successfully!');
        } catch (error) {
            setWebIfscError(error.message || 'Failed to fetch IFSC details from web');
            toast.error('Failed to fetch IFSC details from web');
        } finally {
            setIsWebIfscLoading(false);
        }
    };

    const valuationLabel = (type) => {
        const map = { '1': 'First', '2': 'Second', '3': 'Third', '4': 'Fourth' };
        return map[type] ? `${map[type]} Valuation` : `Type ${type}`;
    };

    const handlePostExaminerPaymentChallan = async (row) => {
        try {
            const result = await postExaminerPaymentChallan({ paymentRecord: row ,
                campus_Id: VITE_Institution_No,
            }).unwrap();
            
            if (result instanceof Blob) {
                const fileURL = URL.createObjectURL(result);
                window.open(fileURL);
                setTimeout(() => URL.revokeObjectURL(fileURL), 100);
                toast.success('Challan generated successfully!');
            } else {
                toast.error('Error: Response is not a valid PDF');
            }
        } catch (error) {
            console.error("Error posting payment challan:", error);
            let errorMessage = 'Failed to generate payment challan';
            if (error.data?.message) {
                errorMessage = error.data.message;
            } else if (error.data?.error) {
                errorMessage = error.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            toast.error(`Error: ${errorMessage}`);
        }
    };

    const examinerPaymentDelete = (row) => {
        setDeleteConfirm({ show: true, row });
    };

    const confirmDelete = async () => {
        const row = deleteConfirm.row;
        setDeleteConfirm({ show: false, row: null });
        try {
            await deleteExaminerPayment(row.id).unwrap();
            toast.success(`Challan "${row.ChallanNumber}" and ${row.subjects?.length || 0} subject record(s) deleted successfully.`);
            refetch();
        } catch (error) {
            const msg = error.data?.message || error.message || 'Failed to delete payment record';
            toast.error(`Delete failed: ${msg}`);
        }
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

    const exportToExcel = () => {
        if (!filteredData.length) {
            toast.warning('No data to export.');
            return;
        }
        const rows = filteredData.map((item, index) => ({
            'S.No':             index + 1,
            'Challan Number':   item.ChallanNumber    || '',
            'Evaluator ID':     item.Evaluation_Id    || '',
            'Evaluator Name':   item.Evaluation_Name  || '',
            'Degree':           item.Degree_Name      || '',
            'Camp ID':          item.Camp_Id          || '',
            'Camp Officer ID':  item.Camp_Officer_Id  || '',
            'Report From':      item.Report_I_Date    || '',
            'Report To':        item.Report_E_Data    || '',
            'Examiner Type':    valuationLabel(item.Examiner_Type),
            'Examiner Status':  item.Examiner_Status  || '',
            'Subject Amount':   item.Subject_Amount   || 0,
            'DA Days':          item.Da_Days          || 0,
            'DA Per Day':       item.Da_Per_Day_Amt   || 0,
            'DA Amount':        item.Da_Amount        || 0,
            'DA Description':   item.Da_Descrption    || '',
            'Additional Amount':item.Additional_Amount|| 0,
            'Total Amount':     item.Total_Amount     || 0,
            'Account Number':   item.BANK_ACCOUNT_NUMBER || '',
            'IFSC Code':        item.IFSC             || '',
            'Bank Name':        item.BANK_NAME        || '',
            'Bank Branch':      item.BRANCH      || '',
            'Bank Address':     item.BANK_ADDRESS     || '',
            'Mobile Number':    item.Mobile_Number    || '',
            'Email Id':         item.Email_Id         || '',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Consolidated Payment Report');
        XLSX.writeFile(wb, `Consolidated_Payment_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success(`Exported ${rows.length} record(s) to Excel.`);
    };

    const exportToPDF = () => {
        try {
            if (!filteredData.length) {
                toast.warning('No data to export.');
                return;
            }

            // Function to clean account number by removing bank name
            const cleanAccountNumber = (accountNo, bankName) => {
                if (!accountNo) return '';
                
                let cleaned = accountNo;
                
                // Remove bank name if provided
                if (bankName) {
                    cleaned = cleaned.replace(new RegExp(bankName, 'gi'), '');
                }
                
                // Remove "BANK" with separators
                cleaned = cleaned.replace(/BANK\s*[-\/:\s]*/gi, '');
                
                // Remove common bank abbreviations and patterns
                cleaned = cleaned.replace(/^(CUB|CIUB|AXIS|SBI|ICICI|HDFC|PNB|BOB|BOI|CANARA|INDIAN|UNION|CENTRAL|SYNDICATE|VIJAYA)\s*[-\/:\s]*/gi, '');
                
                // Remove any remaining leading/trailing separators and spaces
                cleaned = cleaned.replace(/^[\s\-\/:\|]+|[\s\-\/:\|]+$/g, '').trim();
                
                return cleaned;
            };
            

            // Separate CIUB and non-CIUB records
            const ciubData = filteredData.filter(item => (item.IFSC || '').toUpperCase().startsWith('CIUB'));
            const otherData = filteredData.filter(item => !(item.IFSC || '').toUpperCase().startsWith('CIUB'));

            // A3 size for optimal spacing: 420 x 297 (landscape)
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a3'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Function to add header
            const addHeader = (bankType) => {
                // Add Institution Name at top
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(Institution_Details.Institution_Name || 'Institution Name', pageWidth / 2, 10, { align: 'center' });
                
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text(`Consolidated Payment Details Report - ${monthYear?.Eva_Month || ''} ${monthYear?.Eva_Year || ''} ${bankType}`, pageWidth / 2, 17, { align: 'center' });
                
                // Add Camp Information Header
                if (campIdFilter && filteredData.length > 0) {
                    const firstRecord = filteredData[0];
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Camp ID: ${campIdFilter}`, 14,  25, { align: 'left' });
                    
                    if (firstRecord.Camp_Officer_Id || firstRecord.Camp_Officer_Name) {
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'normal');
                        const officerInfo = `Camp Officer:  ${firstRecord.Camp_Officer_Name || ''} - ${firstRecord.Camp_Officer_Id || ''}`;
                        doc.text(officerInfo, 14, 31, { align: 'left' });
                    }
                }
            };

            // Function to add table and footer
            const addTableAndFooter = (data, bankType, startPageNum) => {
                const infoY = campIdFilter && filteredData.length > 0 ? 28 : 20;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, infoY-5, { align: 'right' });
                doc.text(`Total Records: ${data.length}`, pageWidth - 14, infoY + 1, { align: 'right' });

                // Prepare table data
                const tableData = data.map((item, index) => {
                    // Shorten campus names: Kattakulathur -> KTR, Vadapalani -> VPD
                    const campusName = (item.campusName || '')
                        .replace(/Kattakulathur/gi, 'KTR')
                        .replace(/Vadapalani/gi, 'VDP')
                        .replace(/Trichy/gi, 'TRY')
                        .replace(/Ramapuram/gi, 'RPM')
                        .replace(/Modi Nagar -Delhi/gi, 'MDN')
                        ;
                    
                    return [
                        index + 1,
                        item.ChallanNumber || '',
                        item.Evaluation_Id || '',
                        item.Evaluation_Name || '',
                        campusName,
                        cleanAccountNumber(item.BANK_ACCOUNT_NUMBER, item.BANK_NAME),
                        item.IFSC || '',
                        item.BANK_NAME || '',
                        item.BANK_BRANCH || item.Bank_Branch || item.branch || item.BRANCH || item.BANK_Branch || '-',
                        item.Mobile_Number || '',
                        item.Email_Id || '',
                        item.Examiner_Status || '',
                        item.Total_Amount || '',
                    ];
                });

                // Add table using autoTable
                const tableStartY = campIdFilter && filteredData.length > 0 ? 32 : 24;
                doc.autoTable({
                    startY: tableStartY,
                    head: [[
                        'S.No',
                        'Challan Number',
                        'Evaluator ID',
                        'Evaluator Name',
                        'Campus Name',
                        'Account No.',
                        'IFSC Code',
                        'Bank Name',
                        'Bank Branch',
                        'Mobile Number',
                        'Email Id',
                        'Evalutor Type',
                        'Total Amount',
                    ]],
                    body: tableData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [44, 82, 130],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 10,
                        halign: 'center',
                        cellPadding: 2,
                    },
                    bodyStyles: {
                        fontSize: 9,
                        cellPadding: 2,
                        fontStyle: 'bold',
                    },
                    columnStyles: {
                        0: { cellWidth: 12, halign: 'center' },
                        1: { cellWidth: 40, fontSize: 9, halign: 'center' },
                        2: { cellWidth: 25, fontSize:12, halign: 'center' },
                        3: { cellWidth: 38, fontSize: 9},
                        4: { cellWidth: 20, halign: 'center' },
                        5: { cellWidth: 40, fontSize: 12, halign: 'center' },
                        6: { cellWidth: 30, fontSize: 11, halign: 'center' },
                        7: { cellWidth: 50, halign: 'center' },
                        8: { cellWidth: 32,  halign: 'center' },
                        9: { cellWidth: 28, fontSize: 12, halign: 'center' },
                        10: { cellWidth: 40, fontSize: 9, halign: 'center' },
                        11: { cellWidth: 28, halign: 'center' },
                        12: { cellWidth: 20, fontSize: 12, halign: 'right' },
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252],
                    },
                    margin: { top: 36, left: 10, right: 10 },
                    rowPageBreak: 'avoid',
                    showHead: 'everyPage',
                    didDrawPage: function (data) {
                        // Add header on every page
                        doc.setFontSize(14);
                        doc.setFont('helvetica', 'bold');
                        doc.text(Institution_Details.InstitutionName || 'Institution Name', pageWidth / 2, 10, { align: 'center' });
                        
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        const monthYearData = Array.isArray(monthYear) && monthYear.length > 0 ? monthYear[0] : null;
                        const periodText = monthYearData?.Eva_Month && monthYearData?.Eva_Year ? `${monthYearData.Eva_Month} - ${monthYearData.Eva_Year} - ` : '';
                        doc.text(`Consolidated Payment Details Report - ${periodText}${bankType}`, pageWidth / 2, 17, { align: 'center' });
                        
                        // Add Camp Information on every page
                        if (campIdFilter && filteredData.length > 0) {
                            const firstRecord = filteredData[0];
                            doc.setFontSize(12);
                            doc.setFont('helvetica', 'bold');
                            doc.text(`Camp ID: ${campIdFilter}`, 14, 25, { align: 'left' });
                            
                            if (firstRecord.Camp_Officer_Id || firstRecord.Camp_Officer_Name) {
                                doc.setFontSize(12);
                                doc.setFont('helvetica', 'normal');
                                const officerInfo = `Camp Officer:  ${firstRecord.Camp_Officer_Name || ''} - ${firstRecord.Camp_Officer_Id || ''}`;
                                doc.text(officerInfo, 14, 31, { align: 'left' });
                            }
                        }
                    },
                });

                // Calculate and add Grand Total
                const grandTotal = data.reduce((sum, item) => sum + (parseFloat(item.Total_Amount) || 0), 0);
                const finalY = doc.lastAutoTable.finalY + 5;
                
                // Add Grand Total row
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('GRAND TOTAL:', pageWidth - 82, finalY + 5);
                doc.text(grandTotal.toFixed(2), pageWidth - 20, finalY + 5, { align: 'right' });
                doc.setTextColor(0, 0, 0);

                // Store the end page number for this section
                return doc.internal.getNumberOfPages();
            };

            let ciubEndPage = 0;
            let otherStartPage = 0;

            // Process CIUB data
            if (ciubData.length > 0) {
                ciubEndPage = addTableAndFooter(ciubData, 'CIUB Bank', 1);
            }

            // Process Other banks data
            if (otherData.length > 0) {
                if (ciubData.length > 0) {
                    doc.addPage(); // Add new page for other banks
                }
                otherStartPage = doc.internal.getNumberOfPages();
                addTableAndFooter(otherData, 'Other Banks', 1);
            }

            // Add footer with signature and page number
            const totalPages = doc.internal.getNumberOfPages();
            
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                
                const footerY = pageHeight - 10;
                
                // Left side - Camp Officer Signature & Date
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Camp Officer Signature & Date: _____________________', 14, footerY);
                
                // Center - Page number (separate numbering for CIUB and Others)
                doc.setFont('helvetica', 'italic');
                let pageText = '';
                
                if (ciubData.length > 0 && i <= ciubEndPage) {
                    // CIUB pages
                    pageText = `Page ${i} of ${ciubEndPage}`;
                } else if (otherData.length > 0 && i >= otherStartPage) {
                    // Other banks pages
                    const otherPageNum = i - otherStartPage + 1;
                    const otherTotalPages = totalPages - otherStartPage + 1;
                    pageText = `Page ${otherPageNum} of ${otherTotalPages}`;
                }
                
                doc.text(pageText, pageWidth / 2, footerY, { align: 'center' });
            }

            // Save the PDF
            doc.save(`Consolidated_Payment_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
            toast.success(`Exported ${filteredData.length} record(s) to PDF (CIUB: ${ciubData.length}, Others: ${otherData.length}).`);
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error(`Failed to export PDF: ${error.message}`);
        }
    };

    const columns = [
        {
            name: 'S.No',
            cell: (row, index) => (currentPage - 1) * perPage + index + 1,
            width: '65px',
            style: {
                justifyContent: 'center',
            },
        },
        {
            name: 'Challan Number',
            selector: (row) => row.ChallanNumber,
            sortable: true,
            wrap: true,
            width: '230px',
            cell: (row) => (
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>
                    {row.ChallanNumber || '-'}
                </span>
            ),
        },
        {
            name: 'Evaluator',
            selector: (row) => row.Evaluation_Id,
            sortable: true,
            width: '200px',
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div
                        style={{ fontWeight: 700, color: '#1e40af', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleViewSubjects(row)}
                        title="Click to view subject details"
                    >
                        {row.Evaluation_Id || '-'}
                    </div>
                    <div style={{ color: '#4a5568' }}>{row.Evaluation_Name || '-'}</div>
                </div>
            ),
        },
        {
            name: 'Period',
            width: '160px',
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div><strong>From:</strong> {row.Report_I_Date || '-'}</div>
                    <div><strong>To:</strong> {row.Report_E_Data || '-'}</div>
                </div>
            ),
        },
        {
            name: 'Camp',
            width: '140px',
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: 600, color: '#1e40af' }}>{row.Camp_Id || '-'}</div>
                    <div style={{ color: '#4a5568' }}>Officer: {row.Camp_Officer_Id || '-'}</div>
                </div>
            ),
        },
        {
            name: 'Campus Name',
            selector: (row) => row.campusName,
            sortable: true,
            width: '150px',
            cell: (row) => (
                <span style={{ fontSize: '12px', color: '#4a5568' }}>
                    {row.campusName || '-'}
                </span>
            ),
        },
        {
            name: 'Camp Officer',
            selector: (row) => row.Camp_Officer_Name,
            sortable: true,
            width: '180px',
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: 600, color: '#1e40af' }}>{row.Camp_Officer_Id || '-'}</div>
                    <div style={{ color: '#4a5568' }}>{row.Camp_Officer_Name || '-'}</div>
                </div>
            ),
        },
        {
            name: 'Examiner Status',
            selector: (row) => row.Examiner_Status,
            sortable: true,
            width: '140px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <Badge 
                    bg={row.Examiner_Status === 'Chief Examiner' ? 'primary' : 'success'}
                    style={{ fontSize: '11px', padding: '6px 12px', fontWeight: 600 }}
                >
                    {row.Examiner_Status || 'Examiner'}
                </Badge>
            ),
        },
        {
            name: 'Subjects',
            width: '80px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <Badge bg="info" style={{ fontSize: '12px', padding: '5px 10px', cursor: 'pointer' }}
                    onClick={() => handleViewSubjects(row)}>
                    {row.subjects?.length || 0}
                </Badge>
            ),
        },
        {
            name: 'DA / Additional',
            width: '150px',
            cell: (row) => (
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <div>DA: <strong>{formatCurrency(row.Da_Amount)}</strong></div>
                    <div>Add: <strong>{formatCurrency(row.Additional_Amount)}</strong></div>
                </div>
            ),
        },
        {
            name: 'Total Amount',
            selector: (row) => row.Total_Amount,
            sortable: true,
            width: '130px',
            style: {
                justifyContent: 'flex-end',
            },
            cell: (row) => (
                <strong style={{ color: '#16a34a', fontSize: '13px' }}>
                    {formatCurrency(row.Total_Amount)}
                </strong>
            ),
        },
        {
            name: 'Action',
            width: '250px',
            style: {
                justifyContent: 'center',
            },
            cell: (row) => (
                <div className="d-flex gap-1">
                    <Button size="sm" variant="outline-primary" style={{ fontSize: '11px' }}
                        onClick={() => handlePostExaminerPaymentChallan(row)}>
                        <FaPrint className="me-1" /> Print
                    </Button>
                    <Button size="sm" variant="outline-danger" style={{ fontSize: '11px' }}
                        onClick={() => examinerPaymentDelete(row)}>
                        <FaTrash className="me-1" /> Delete
                    </Button>
                    <Button size="sm" variant="outline-info" style={{ fontSize: '11px' }}
                        onClick={() => handleViewSubjects(row)}>
                        <FaSearch className="me-1" /> Update Bank Details
                    </Button>
                </div>
            ),
        },
    ];

    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#2c5282',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                minHeight: '48px',
            },
        },
        rows: {
            style: {
                minHeight: '58px',
                fontSize: '12px',
                '&:hover': { backgroundColor: '#f0f4f8', cursor: 'pointer' },
            },
            stripedStyle: { backgroundColor: '#f8fafc' },
        },
        cells: {
            style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRight: '1px solid #e2e8f0',
                '&:last-child': { borderRight: 'none' },
            },
        },
    };

    return (
        <Container fluid className="p-4">
            <ToastContainer position="bottom-right" autoClose={3000} />

            <Row className="mb-3">
                <Col>
                    <h3 style={{ color: '#2c5282', fontWeight: '600' }}>
                        <FaFileInvoiceDollar className="me-2" />
                        Consolidated Payment Details
                    </h3>
                </Col>
            </Row>

            <Card className="mb-3">
                <Card.Body>
                    {/* Filters */}
                    <Row className="mb-3 align-items-center">
                        <Col md={3}>
                            <div className="d-flex gap-2 flex-wrap">
                                {[
                                    { value: '', label: 'All', color: '#6c757d' },
                                    { value: '1', label: 'Chief Examiner', color: '#0066cc' },
                                    { value: '2', label: 'Examiner', color: '#28a745' },
                                ].map((type) => (
                                    <Button
                                        key={type.value}
                                        size="sm"
                                        variant={valuationType === type.value ? 'primary' : 'outline-secondary'}
                                        onClick={() => setValuationType(type.value)}
                                        style={{
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            fontSize: '12px',
                                            border: valuationType === type.value ? `2px solid ${type.color}` : '2px solid #dee2e6',
                                            backgroundColor: valuationType === type.value ? type.color : '#ffffff',
                                            color: valuationType === type.value ? '#ffffff' : '#6c757d',
                                        }}
                                    >
                                        {type.label}
                                    </Button>
                                ))}
                            </div>
                        </Col>
                        <Col md={2}>
                            <Form.Select
                                size="sm"
                                value={campIdFilter}
                                onChange={(e) => setCampIdFilter(e.target.value)}
                                style={{
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    border: '2px solid #dee2e6',
                                }}
                            >
                                <option value="">All Camps</option>
                                {uniqueCampIds.map((campId) => (
                                    <option key={campId} value={campId}>
                                        {campId}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <div className="input-group">
                                <span className="input-group-text"><FaSearch /></span>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by Evaluator, Challan, Camp..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                />
                            </div>
                        </Col>
                        <Col md="auto">
                            <Badge bg="danger" style={{ fontSize: '14px', padding: '8px 14px' }}>
                                Total: {filteredData.length}
                            </Badge>
                        </Col>
                        <Col md="auto">
                            <Button size="sm" variant="success" onClick={exportToExcel}
                                style={{ fontSize: '12px', fontWeight: 600 }}>
                                <FaFileExcel className="me-1" /> Export Excel
                            </Button>
                        </Col>
                        <Col md="auto">
                            <Button size="sm" variant="danger" onClick={exportToPDF}
                                style={{ fontSize: '12px', fontWeight: 600 }}>
                                <FaFilePdf className="me-1" /> Export PDF (A3)
                            </Button>
                        </Col>
                    </Row>

                    {isLoading ? (
                        <ElegantLoader 
                            message="Loading payment records..." 
                            size="medium"
                            variant="success"
                        />
                    ) : isError ? (
                        <div className="text-center py-5 text-danger">
                            <FaInfoCircle size={36} className="mb-2" />
                            <p>Failed to load payment data. Please try again.</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 20, 50, 100]}
                            onChangePage={(page) => setCurrentPage(page)}
                            onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
                            highlightOnHover
                            striped
                            responsive
                            customStyles={customStyles}
                            noDataComponent={
                                <div className="text-center py-5 text-muted">
                                    <FaFileInvoiceDollar size={40} className="mb-2" style={{ opacity: 0.4 }} />
                                    <p>No payment records found</p>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>

            {/* Subject Details Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="xl" centered>
                <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <Modal.Title style={{ fontWeight: 700 }}>
                        <FaFileInvoiceDollar className="me-2" />
                        Payment Details — {selectedRecord?.Evaluation_Id} ({selectedRecord?.Evaluation_Name})
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRecord && (
                        <>
                            {/* Summary */}
                            <Row className="mb-3 g-2">
                                {[
                                    { label: 'Challan No', value: selectedRecord.ChallanNumber },
                                    { label: 'Period', value: `${selectedRecord.Report_I_Date} → ${selectedRecord.Report_E_Data}` },
                                    { label: 'Camp ID', value: selectedRecord.Camp_Id },
                                    { label: 'DA Amount', value: formatCurrency(selectedRecord.Da_Amount) },
                                    { label: 'DA Days', value: selectedRecord.Da_Days || '-' },
                                    { label: 'Additional', value: formatCurrency(selectedRecord.Additional_Amount) },
                                    { label: 'Total Amount', value: formatCurrency(selectedRecord.Total_Amount) },
                                ].map((item, i) => (
                                    <Col xs={6} md={3} key={i}>
                                        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px', textAlign: 'center', height: '100%' }}>
                                            <div style={{ fontSize: '11px', color: '#6c757d', fontWeight: 600 }}>{item.label}</div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#2c5282', marginTop: '4px' }}>{item.value}</div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>

                            {/* Banking Details */}
                            <div className="mb-3 p-3" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: '10px', border: '1px solid #2196f3' }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 style={{ color: '#1565c0', fontWeight: 700, marginBottom: 0 }}>💳 Banking Details</h6>
                                    {!editingBank ? (
                                        <Button size="sm" variant="outline-primary" onClick={() => {
                                            setEditingBank(true);
                                            setBankFormData({
                                                accountNumber: selectedRecord.BANK_ACCOUNT_NUMBER || '',
                                                ifscCode: selectedRecord.IFSC || '',
                                                bankName: selectedRecord.BANK_NAME || '',
                                                branchName: selectedRecord.BRANCH || '',
                                                bankAddress: selectedRecord.BANK_ADDRESS || '',
                                                Evaluator_Id: selectedRecord.Evaluation_Id || ''
                                            });
                                        }}>
                                            Edit
                                        </Button>
                                    ) : (
                                        <div>
                                            <Button size="sm" variant="success" className="me-2" onClick={async () => {
                                                try {
                                                    await updateBankIfscConsolidated({
                                                        accountNumber: bankFormData.accountNumber,
                                                        ifscCode: bankFormData.ifscCode,
                                                        bankName: bankFormData.bankName,
                                                        branchName: bankFormData.branchName,
                                                        branchAddress: bankFormData.bankAddress,
                                                        Evaluator_Id: bankFormData.Evaluator_Id
                                                    }).unwrap();
                                                    
                                                    // Update the selectedRecord state immediately with new bank details
                                                    setSelectedRecord(prev => ({
                                                        ...prev,
                                                        BANK_ACCOUNT_NUMBER: bankFormData.accountNumber,
                                                        IFSC: bankFormData.ifscCode,
                                                        BANK_NAME: bankFormData.bankName,
                                                        BRANCH: bankFormData.branchName,
                                                        BANK_ADDRESS: bankFormData.bankAddress
                                                    }));
                                                    
                                                    toast.success('Bank details updated successfully!');
                                                    setEditingBank(false);
                                                    refetch(); // Refresh the main data table
                                                } catch (error) {
                                                    toast.error('Failed to update bank details');
                                                    console.error('Update error:', error);
                                                }
                                            }} disabled={isUpdatingBankIfscConsolidated}>
                                                {isUpdatingBankIfscConsolidated ? <Spinner animation="border" size="sm" /> : 'Save'}
                                            </Button>
                                            <Button size="sm" variant="outline-secondary" onClick={() => setEditingBank(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {!editingBank ? (
                                    <Row className="g-2">
                                        <Col xs={12} md={6}>
                                            <div style={{ fontSize: '13px' }}>
                                                <strong style={{ color: '#0d47a1' }}>Account Number:</strong>
                                                <span className="ms-2">{selectedRecord.BANK_ACCOUNT_NUMBER || 'N/A'}</span>
                                            </div>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <div style={{ fontSize: '13px' }}>
                                                <strong style={{ color: '#0d47a1' }}>IFSC Code:</strong>
                                                <span className="ms-2">{selectedRecord.IFSC || 'N/A'}</span>
                                            </div>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <div style={{ fontSize: '13px' }}>
                                                <strong style={{ color: '#0d47a1' }}>Bank Name:</strong>
                                                <span className="ms-2">{selectedRecord.BANK_NAME || 'N/A'}</span>
                                            </div>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <div style={{ fontSize: '13px' }}>
                                                <strong style={{ color: '#0d47a1' }}>Bank Branch:</strong>
                                                <span className="ms-2">{selectedRecord.BRANCH || 'N/A'}</span>
                                            </div>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <div style={{ fontSize: '13px' }}>
                                                <strong style={{ color: '#0d47a1' }}>Bank Address:</strong>
                                                <span className="ms-2">{selectedRecord.BANK_ADDRESS || 'N/A'}</span>
                                            </div>
                                        </Col>
                                    </Row>
                                ) : (
                                    <Row className="g-3">
                                        <Col xs={12} md={6}>
                                            <Form.Group>
                                                <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>Account Number</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={bankFormData.accountNumber}
                                                    onChange={(e) => setBankFormData({...bankFormData, accountNumber: e.target.value})}
                                                    placeholder="Enter account number"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Form.Group>
                                                <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>IFSC Code</Form.Label>
                                                <div className="d-flex gap-2">
                                                    <div className="position-relative flex-grow-1">
                                                        <Form.Control
                                                            type="text"
                                                            size="sm"
                                                            value={bankFormData.ifscCode}
                                                            onChange={(e) => {
                                                                const ifsc = e.target.value.toUpperCase();
                                                                setBankFormData({...bankFormData, ifscCode: ifsc});
                                                                setWebIfscData(null);
                                                                setWebIfscError('');
                                                                if (ifsc.length === 11) {
                                                                    setIfscToFetch(ifsc);
                                                                    setSkipIfscQuery(false);
                                                                } else {
                                                                    setSkipIfscQuery(true);
                                                                }
                                                            }}
                                                            placeholder="Enter IFSC code"
                                                            maxLength={11}
                                                            style={{ textTransform: 'uppercase' }}
                                                        />
                                                        {(isIfscLoading || isWebIfscLoading) && (
                                                            <Spinner
                                                                animation="border"
                                                                size="sm"
                                                                className="position-absolute"
                                                                style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}
                                                            />
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-info"
                                                        onClick={() => fetchIfscFromWeb(bankFormData.ifscCode)}
                                                        disabled={!bankFormData.ifscCode || bankFormData.ifscCode.length !== 11 || isWebIfscLoading}
                                                        title="Fetch from web"
                                                        style={{ minWidth: '80px' }}
                                                    >
                                                        {isWebIfscLoading ? <Spinner animation="border" size="sm" /> : '🌐 Web'}
                                                    </Button>
                                                </div>
                                                {ifscBankData && (
                                                    <small className="text-success">✓ Bank details from database</small>
                                                )}
                                                {webIfscData && (
                                                    <small className="text-success">✓ Bank details from web</small>
                                                )}
                                                {ifscError && !webIfscData && !isWebIfscLoading && (
                                                    <small className="text-warning">⚠ Not in database, trying web...</small>
                                                )}
                                                {webIfscError && (
                                                    <small className="text-danger">✗ {webIfscError}</small>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Form.Group>
                                                <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>Bank Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={bankFormData.bankName}
                                                    onChange={(e) => setBankFormData({...bankFormData, bankName: e.target.value})}
                                                    placeholder="Auto-filled from IFSC"
                                                    readOnly={(ifscBankData || webIfscData) && !ifscError && !webIfscError}
                                                    style={(ifscBankData || webIfscData) ? { background: '#f0fdf4', fontWeight: 600 } : {}}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Form.Group>
                                                <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>Branch Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={bankFormData.branchName}
                                                    onChange={(e) => setBankFormData({...bankFormData, branchName: e.target.value})}
                                                    placeholder="Auto-filled from IFSC"
                                                    readOnly={(ifscBankData || webIfscData) && !ifscError && !webIfscError}
                                                    style={(ifscBankData || webIfscData) ? { background: '#f0fdf4', fontWeight: 600 } : {}}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Group>
                                                <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>Bank Address</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={bankFormData.bankAddress}
                                                    onChange={(e) => setBankFormData({...bankFormData, bankAddress: e.target.value})}
                                                    placeholder="Auto-filled from IFSC"
                                                    readOnly={(ifscBankData || webIfscData) && !ifscError && !webIfscError}
                                                    style={(ifscBankData || webIfscData) ? { background: '#f0fdf4', fontWeight: 600 } : {}}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                )}
                            </div>

                            {/* Subject Table */}
                            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <Table responsive className="mb-0">
                                    <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                        <tr>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px', width: '50px' }}>S.No</th>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px' }}>Subject Code</th>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px' }}>Subject Name</th>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>Papers</th>
                                           {selectedRecord.Examiner_Type === '2' && (
                                            <>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Rate/Paper (₹)</th>
                                            <th style={{ padding: '12px 15px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Total (₹)</th>
                                            </>
                                           )}
                                            </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRecord.subjects?.length > 0 ? (
                                            <>
                                                {selectedRecord.subjects.map((sub, idx) => (
                                                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>{idx + 1}</td>
                                                        <td style={{ padding: '12px 15px' }}>
                                                            <Badge bg="primary" style={{ fontSize: '12px', padding: '5px 10px' }}>{sub.Subcode}</Badge>
                                                        </td>
                                                        <td style={{ padding: '12px 15px', fontSize: '13px' }}>{sub.Subname}</td>
                                                        <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 600 }}>{sub.No_Paper}</td>
                                                        {selectedRecord.Examiner_Type === '2' && (
                                                            <>
                                                        <td style={{ padding: '12px 15px', textAlign: 'right' }}>₹ {sub.Paper_Amount}</td>
                                                        <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 700, color: '#667eea' }}>
                                                            ₹ {sub.Total?.toLocaleString('en-IN')}
                                                        </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                                <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                                    <td colSpan={5} style={{ padding: '12px 15px', fontWeight: 700, textAlign: 'right' }}>
                                                        <FaCheckCircle className="me-2" />{selectedRecord.Examiner_Type === '2' ? 'Grand Total' : ''} 
                                                    </td>
                                                    <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>
                                                        {selectedRecord.Examiner_Type === '2' && formatCurrency(selectedRecord.Total_Amount)}
                                                    </td>
                                                </tr>
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="text-center py-4 text-muted">No subject records found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleCloseModal}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={deleteConfirm.show} onHide={() => setDeleteConfirm({ show: false, row: null })} centered>
                <Modal.Header closeButton style={{ background: '#fff3cd', borderBottom: '1px solid #ffc107' }}>
                    <Modal.Title style={{ fontWeight: 700, color: '#856404', fontSize: '16px' }}>
                        ⚠️ Confirm Delete
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {deleteConfirm.row && (
                        <>
                            <p className="mb-2">Are you sure you want to permanently delete this payment record?</p>
                            <div className="p-3 rounded" style={{ background: '#f8f9fa', fontSize: '13px' }}>
                                <div><strong>Challan Number:</strong> {deleteConfirm.row.ChallanNumber || '—'}</div>
                                <div><strong>Evaluator:</strong> {deleteConfirm.row.Evaluation_Id} — {deleteConfirm.row.Evaluation_Name}</div>
                                <div><strong>Degree:</strong> {deleteConfirm.row.Degree_Name}</div>
                                <div><strong>Subject Records:</strong> {deleteConfirm.row.subjects?.length || 0} subcode(s) will also be deleted</div>
                                <div><strong>Total Amount:</strong> ₹{deleteConfirm.row.Total_Amount}</div>
                            </div>
                            <p className="mt-2 mb-0 text-danger" style={{ fontSize: '12px' }}>
                                This action cannot be undone. All associated subject records will be removed.
                            </p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setDeleteConfirm({ show: false, row: null })}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                        {isDeleting ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ConsolidatedPaymentDetails;