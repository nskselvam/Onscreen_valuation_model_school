import React, { useState, useMemo, useEffect } from 'react'
import DataTableBase from 'react-data-table-component'
import UploadPageLayout from '../../components/DashboardComponents/UploadPageLayout'
import { useSelector } from 'react-redux'
import { Button, Form, InputGroup, Row, Col } from 'react-bootstrap'
import { data } from 'react-router-dom'
import ExaminerMarkCampModal from '../../components/modals/ExaminerMarkCampModal'
import {useGetEvaluationmarkspreviewdateQuery} from '../../redux-slice/valuationApiSlice'
import { useGetAllUserDataQuery } from '../../redux-slice/adminOperationApiSlice'

import * as XLSX from 'xlsx'

const DataTable = DataTableBase.default || DataTableBase

const PdfDocumentCamp = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('All')
    const [coloredLines, setColoredLines] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [selectedId, setSelectedId] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [viewMode, setViewMode] = useState('date')
    const [dateFilter, setDateFilter] = useState('All')
    const [selectedEvaluator, setSelectedEvaluator] = useState('All')
    const [selectedExaminerStatus, setSelectedExaminerStatus] = useState('All')
    const [selectEvaName, setSelectEvaName] = useState('')
    const [evaluatorData, setEvaluatorData] = useState(null)
    const [shouldFetch, setShouldFetch] = useState(false)
    const userInfo = useSelector((state) => state.auth.userInfo)

    const  SelectRole = userInfo?.selected_role || 'No Role';

    // Fetch all faculties data
    const { data: facultiesData, isLoading: facultiesLoading } = useGetAllUserDataQuery();

    // Get evaluator ID from filter or userInfo
    const evaluatorIdToFetch = selectedEvaluator === 'All' ? userInfo?.username : selectedEvaluator;
     
    
    const { data: evaluationMarksPreviewDateData, error, isLoading, refetch } = useGetEvaluationmarkspreviewdateQuery(
         {
            "Eva_Id": selectedEvaluator,
            "Dept_Code": userInfo?.selected_course,
            "Selected_Role": selectedExaminerStatus
        },
        {
            skip: !shouldFetch,
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true
        }
    );

    // Handler for fetch button
    const handleFetchData = () => {
        setShouldFetch(true);
        if (shouldFetch) {
            refetch();
        }
    };

    // Update evaluator data when evaluator is selected
    useEffect(() => {
        if (selectedEvaluator !== 'All' && facultiesData?.data) {
            const selected = facultiesData.data.find(f => f.Eva_Id === selectedEvaluator);
            setEvaluatorData(selected || null);
            setSelectEvaName(selected?.FACULTY_NAME || '');
            
            // Reset examiner status filter if current selection is not available for selected evaluator
            if (selectedExaminerStatus !== 'All' && selected && selected.Role) {
                const roles = selected.Role.split(',').map(r => r.trim());
                if (!roles.includes(selectedExaminerStatus)) {
                    setSelectedExaminerStatus('All');
                }
            }
        } else {
            setEvaluatorData(null);
            setSelectEvaName('');
        }
    }, [selectedEvaluator, facultiesData, selectedExaminerStatus]);

    // Extract unique roles for Examiner Status filter based on selected evaluator
    const examinerRoles = useMemo(() => {
        if (!facultiesData?.data) return [];
        const rolesSet = new Set();
        
        // If specific evaluator is selected, show only their roles
        if (selectedEvaluator !== 'All') {
            const selectedFaculty = facultiesData.data.find(f => f.Eva_Id === selectedEvaluator);
            if (selectedFaculty && selectedFaculty.Role) {
                const roles = selectedFaculty.Role.split(',').map(r => r.trim());
                roles.forEach(role => {
                    if (role === '1' || role === '2') {
                        rolesSet.add(role);
                    }
                });
            }
        } else {
            // If "All" is selected, show all available roles
            facultiesData.data.forEach(faculty => {
                if (faculty.Role) {
                    const roles = faculty.Role.split(',').map(r => r.trim());
                    roles.forEach(role => {
                        if (role === '1' || role === '2') {
                            rolesSet.add(role);
                        }
                    });
                }
            });
        }
        
        return Array.from(rolesSet).sort();
    }, [facultiesData, selectedEvaluator]);


    // const allData = [
    //     { id: 1, fileName: 'document1.pdf', uploadDate: '2024-01-01', status: 'Processed' },
    //     { id: 2, fileName: 'document2.pdf', uploadDate: '2024-01-02', status: 'Pending'},
    //     { id: 3, fileName: 'report.xlsx', uploadDate: '2024-01-03', status: 'Processed'},
    //     { id: 4, fileName: 'data.txt', uploadDate: '2024-01-04', status: 'Pending'},
    //     { id: 5, fileName: 'presentation.pptx', uploadDate: '2024-01-05', status: 'Processed' },
    //     { id: 6, fileName: 'budget.xlsx', uploadDate: '2024-01-06', status: 'Pending'},
    //     { id: 7, fileName: 'invoice.pdf', uploadDate: '2024-01-07', status: 'Processed'},
    //     { id: 8, fileName: 'notes.txt', uploadDate: '2024-01-08', status: 'Pending'},
    //     { id: 9, fileName: 'contract.pdf', uploadDate: '2024-01-09', status: 'Processed' },
    //     { id: 10, fileName: 'analysis.xlsx', uploadDate: '2024-01-10', status: 'Pending'},
    //     { id: 11, fileName: 'summary.docx', uploadDate: '2024-01-11', status: 'Processed'},
    //     { id: 12, fileName: 'readme.txt', uploadDate: '2024-01-12', status: 'Pending'},
    //     { id: 13, fileName: 'proposal.pdf', uploadDate: '2024-01-13', status: 'Processed' },
    //     { id: 14, fileName: 'schedule.xlsx', uploadDate: '2024-01-14', status: 'Pending'},
    //     { id: 15, fileName: 'minutes.docx', uploadDate: '2024-01-15', status: 'Processed'},
    //     { id: 16, fileName: 'changelog.txt', uploadDate: '2024-01-16', status: 'Pending'},
    // ]
    const allData1 = evaluationMarksPreviewDateData?.data?.checkdates ;

    const displayReport = (dataid, event) => {
        event.stopPropagation(); // Prevent row click event
        
        // Add the row to colored lines
        setColoredLines(prev => {
            if (!prev.includes(dataid)) {
                return [...prev, dataid]
            }
            return prev
        })
        
        setSelectedId(dataid )
        setShowModal(true)
    }

    const handleRowClick = (row) => {
        // Toggle the row selection
        setColoredLines(prev => {
            if (prev.includes(row.id)) {
                // If already selected, remove it
                return prev.filter(id => id !== row.id)
            } else {
                // If not selected, add it
                return [...prev, row.id]
            }
        })
    }

    const conditionalRowStyles = [
        {
            when: row => coloredLines.includes(row.id),
            style: {
                backgroundColor: '#d4e6ff',
                borderLeft: '4px solid #667eea',
                '&:hover': {
                    backgroundColor: '#c2dbff',
                }
            }
        }
    ]

    const filteredData = useMemo(() => {
        if (!allData1 || allData1.length === 0) {
            return [];
        }
        
        return allData1.filter(item => {
            const matchesSearch = 
                (item.Evaluator_Id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.check_date || '').includes(searchTerm) ||
                (item.Valuation_Type || '').toString().includes(searchTerm) ||
                (item.Total_Papers || '').toString().includes(searchTerm) ||
                (item.subcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.Dept_Code || '').toLowerCase().includes(searchTerm.toLowerCase())
                
            
            const matchesStatus = filterStatus === 'All' || item.Valuation_Type.toString() === filterStatus
            
            // Filter by Evaluator ID
            const matchesEvaluator = selectedEvaluator === 'All' || item.Evaluator_Id === selectedEvaluator
            
            // Filter by Examiner Status (Role) - matches if evaluator has the selected role
            let matchesExaminerStatus = selectedExaminerStatus === 'All';
            if (!matchesExaminerStatus && facultiesData?.data) {
                const faculty = facultiesData.data.find(f => f.Eva_Id === item.Evaluator_Id);
                if (faculty && faculty.Role) {
                    const roles = faculty.Role.split(',').map(r => r.trim());
                    matchesExaminerStatus = roles.includes(selectedExaminerStatus);
                }
            }

            return matchesSearch && matchesStatus && matchesEvaluator && matchesExaminerStatus
        })
    }, [searchTerm, filterStatus, allData1, selectedEvaluator, selectedExaminerStatus, facultiesData])

    const subjectData = useMemo(() => {
        if (!allData1 || allData1.length === 0) return [];
        
        // Apply filters first
        const filtered = allData1.filter(item => {
            const matchesEvaluator = selectedEvaluator === 'All' || item.Evaluator_Id === selectedEvaluator;
            
            let matchesExaminerStatus = selectedExaminerStatus === 'All';
            if (!matchesExaminerStatus && facultiesData?.data) {
                const faculty = facultiesData.data.find(f => f.Eva_Id === item.Evaluator_Id);
                if (faculty && faculty.Role) {
                    const roles = faculty.Role.split(',').map(r => r.trim());
                    matchesExaminerStatus = roles.includes(selectedExaminerStatus);
                }
            }
            
            return matchesEvaluator && matchesExaminerStatus;
        });
        
        const map = {};
        filtered.forEach(item => {
            const subcode = item.subcode || item.Dept_Code;
            const key = `${subcode}_${item.Valuation_Type}`;
            if (!map[key]) {
                map[key] = {
                    Dept_Code: subcode,
                    Table_Dept_Code: item.Dept_Code,
                    Evaluator_Id: item.Evaluator_Id,
                    Valuation_Type: item.Valuation_Type,
                    Total_Papers: 0,
                    Total_Dates: 0,
                    Dates: [],
                };
            }
            map[key].Total_Papers += Number(item.Total_Papers) || 0;
            if (!map[key].Dates.includes(item.check_date)) {
                map[key].Dates.push(item.check_date);
                map[key].Total_Dates += 1;
            }
        });
        return Object.values(map).sort((a, b) =>
            (a.Dept_Code || '').localeCompare(b.Dept_Code || '')
        );
    }, [allData1, selectedEvaluator, selectedExaminerStatus, facultiesData])

    const filteredSubjectData = useMemo(() => {
        if (!subjectData.length) return [];
        return subjectData
            .map(item => ({ ...item, Dates: item.Dates || [] }))
            .filter(item =>
                (item.Dept_Code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.Evaluator_Id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.Valuation_Type || '').toString().includes(searchTerm) ||
                item.Total_Papers.toString().includes(searchTerm)
            );
    }, [searchTerm, subjectData])

    const dateGroupedData = useMemo(() => {
        if (!allData1 || allData1.length === 0) return [];
        
        // Apply filters first
        const filtered = allData1.filter(item => {
            const matchesEvaluator = selectedEvaluator === 'All' || item.Evaluator_Id === selectedEvaluator;
            
            let matchesExaminerStatus = selectedExaminerStatus === 'All';
            if (!matchesExaminerStatus && facultiesData?.data) {
                const faculty = facultiesData.data.find(f => f.Eva_Id === item.Evaluator_Id);
                if (faculty && faculty.Role) {
                    const roles = faculty.Role.split(',').map(r => r.trim());
                    matchesExaminerStatus = roles.includes(selectedExaminerStatus);
                }
            }
            
            return matchesEvaluator && matchesExaminerStatus;
        });
        
        const map = {};
        filtered.forEach(item => {
            const key = `${item.check_date}_${item.Valuation_Type}`;
            if (!map[key]) {
                map[key] = {
                    id: key,
                    check_date: item.check_date,
                    Evaluator_Id: item.Evaluator_Id,
                    Valuation_Type: item.Valuation_Type,
                    Date_Total_Papers: Number(item.Date_Total_Papers) || 0,
                    subcodes: []
                };
            }
            map[key].subcodes.push({
                subcode: item.subcode,
                Total_Papers: item.Total_Papers,
                id: item.id,
                Dept_Code: item.Dept_Code
            });
        });
        return Object.values(map).sort((a, b) => (a.check_date || '').localeCompare(b.check_date || ''));
    }, [allData1, selectedEvaluator, selectedExaminerStatus, facultiesData]);

    const uniqueDates = useMemo(() => {
        if (!dateGroupedData.length) return [];
        return [...new Set(dateGroupedData.map(d => d.check_date))].sort();
    }, [dateGroupedData]);

    const filteredDateGroupedData = useMemo(() => {
        return dateGroupedData.filter(item => {
            const matchesDate = dateFilter === 'All' || item.check_date === dateFilter;
            const matchesSearch =
                (item.check_date || '').includes(searchTerm) ||
                (item.Evaluator_Id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.Valuation_Type || '').toString().includes(searchTerm) ||
                (item.subcodes || []).some(s => (s.subcode || '').toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesDate && matchesSearch;
        });
    }, [dateGroupedData, dateFilter, searchTerm]);

    const exportToExcel = () => {
        // Prepare data for export with serial numbers
        const dataToExport = filteredData.map((item, index) => ({
            'Sl.No': index + 1,
            'Subject Code & Name': item.Evaluator_Id,
            'Valuation Date': item.check_date,
            'Status': item.Valuation_Type
        }))

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        
        // Set column widths
        ws['!cols'] = [
            { wch: 8 },  // Sl.No
            { wch: 40 }, // Subject Code & Name
            { wch: 15 }, // Valuation Date
            { wch: 12 }  // Status
        ]

        // Create workbook
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Files')

        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0]
        const filename = `Files_Export_${date}.xlsx`

        // Save file
        XLSX.writeFile(wb, filename)
    }

    return (
        <>
            <UploadPageLayout
                mainTopic="Excel and Text Upload System"
                subTopic="Upload your Excel and Text files for processing"
                cardTitle="Excel and Text Upload"
            >
                {/* Filter Section with Combo Boxes */}
                <Row className="mb-3">
                    <Col>
                        <div style={{
                            backgroundColor: '#ffffff',
                            border: '2px solid #2c5282',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 4px 12px rgba(44, 82, 130, 0.15)'
                        }}>
                            <Row className="g-3 align-items-end">
                                <Col md={5}>
                                    <div style={{ 
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#2c5282',
                                        marginBottom: '8px'
                                    }}>
                                        Evaluator
                                    </div>
                                    <Form.Select
                                        value={selectedEvaluator}
                                        onChange={(e) => {
                                            setSelectedEvaluator(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        style={{
                                            borderColor: '#2c5282',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                        disabled={facultiesLoading}
                                    >
                                        <option value="All">All Evaluators</option>
                                        {facultiesData?.data
                                            ?.filter((faculty) => {
                                                if (!faculty.Role) return false;
                                                const roles = faculty.Role.split(',').map(r => r.trim());
                                                return roles.includes('1') || roles.includes('2');
                                            })
                                            .map((faculty) => (
                                                <option key={faculty.Eva_Id} value={faculty.Eva_Id}>
                                                    {faculty.Eva_Id} - {faculty.FACULTY_NAME}
                                                </option>
                                            ))}
                                    </Form.Select>
                                </Col>
                                <Col md={5}>
                                    <div style={{ 
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#2c5282',
                                        marginBottom: '8px'
                                    }}>
                                        Examiner Status (Role-Based)
                                    </div>
                                    <Form.Select
                                        value={selectedExaminerStatus}
                                        onChange={(e) => {
                                            setSelectedExaminerStatus(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        style={{
                                            borderColor: '#2c5282',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                        disabled={facultiesLoading}
                                    >
                                        <option value="All">All Examiner Roles</option>
                                        {examinerRoles.includes('1') && (
                                            <option value="1">1. Chief Examiner (Chief_Eva_Subject)</option>
                                        )}
                                        {examinerRoles.includes('2') && (
                                            <option value="2">2. Examiner (Eva_Subject)</option>
                                        )}
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Button
                                        onClick={handleFetchData}
                                        disabled={facultiesLoading || isLoading}
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#2c5282',
                                            border: 'none',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1e3a5f'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#2c5282'}
                                    >
                                        {isLoading ? '🔄 Loading...' : '🔍 Fetch Data'}
                                    </Button>
                                </Col>
                            </Row>
                            {selectedEvaluator !== 'All' && evaluatorData && (
                                <Row className="g-3 mt-2" style={{
                                    borderTop: '1px solid #e2e8f0',
                                    paddingTop: '15px'
                                }}>
                                    <Col md={4}>
                                        <div style={{ fontSize: '13px', color: '#4a5568' }}>
                                            <strong>Evaluator Name:</strong> {evaluatorData.FACULTY_NAME || '-'}
                                        </div>
                                    </Col>
                                    <Col md={2}>
                                        <div style={{ fontSize: '13px', color: '#4a5568' }}>
                                            <strong>Role(s):</strong> {evaluatorData.Role ? 
                                                evaluatorData.Role.split(',').map(r => {
                                                    const role = r.trim();
                                                    return role === '1' ? 'Chief' : role === '2' ? 'Examiner' : role;
                                                }).join(', ') : '-'}
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div style={{ fontSize: '13px', color: '#4a5568' }}>
                                            <strong>Examiner Subjects:</strong> {evaluatorData.Eva_Subject ? 
                                                `${evaluatorData.Eva_Subject.split(',').length} subjects` : '-'}
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div style={{ fontSize: '13px', color: '#4a5568' }}>
                                            <strong>Chief Subjects:</strong> {evaluatorData.Chief_Eva_Subject ? 
                                                `${evaluatorData.Chief_Eva_Subject.split(',').length} subjects` : '-'}
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </div>
                    </Col>
                </Row>

                {/* View Mode Toggle */}
                <Row className="mb-3">
                    <Col>
                        <div className="d-flex align-items-center gap-2">
                            <span style={{ fontWeight: 600, fontSize: '14px', color: '#4a5568' }}>View By:</span>
                            <Button
                                size="sm"
                                onClick={() => { setViewMode('date'); setCurrentPage(1); }}
                                style={{
                                    borderRadius: '20px',
                                    padding: '6px 20px',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    border: '2px solid #667eea',
                                    backgroundColor: viewMode === 'date' ? '#667eea' : '#ffffff',
                                    color: viewMode === 'date' ? '#ffffff' : '#667eea',
                                    transition: 'all 0.2s'
                                }}
                            >
                                📅 Date Wise
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => { setViewMode('subject'); setCurrentPage(1); }}
                                style={{
                                    borderRadius: '20px',
                                    padding: '6px 20px',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    border: '2px solid #38a169',
                                    backgroundColor: viewMode === 'subject' ? '#38a169' : '#ffffff',
                                    color: viewMode === 'subject' ? '#ffffff' : '#38a169',
                                    transition: 'all 0.2s'
                                }}
                            >
                                📚 Subject Wise
                            </Button>
                        </div>
                    </Col>
                </Row>

                {viewMode === 'date' && (
                    <Row className="mb-2">
                        <Col md={4}>
                            <div className="d-flex align-items-center gap-2">
                                <span style={{ fontWeight: 600, fontSize: '13px', color: '#4a5568', whiteSpace: 'nowrap' }}>📅 Filter by Date:</span>
                                <Form.Select
                                    size="sm"
                                    value={dateFilter}
                                    onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                                    style={{ borderColor: '#667eea', fontSize: '13px' }}
                                >
                                    <option value="All">All Dates</option>
                                    {uniqueDates.map(date => (
                                        <option key={date} value={date}>{date}</option>
                                    ))}
                                </Form.Select>
                            </div>
                        </Col>
                    </Row>
                )}

                <Row className="mb-3 g-3">
                    <Col md={8}>
                        <InputGroup>
                            <InputGroup.Text style={{ 
                                backgroundColor: '#667eea', 
                                color: 'white',
                                border: '1px solid #667eea'
                            }}>
                                🔍
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Search by filename, date, or status..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    borderColor: '#667eea',
                                    fontSize: '14px'
                                }}
                            />
                            {searchTerm && (
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={() => setSearchTerm('')}
                                    style={{ borderColor: '#667eea' }}
                                >
                                    Clear
                                </Button>
                            )}
                        </InputGroup>
                    </Col>
                    <Col md={4} className="d-flex gap-2">
                        <Button 
                            variant="success" 
                            onClick={exportToExcel}
                            className="w-100"
                            style={{ fontSize: '14px' }}
                        >
                            📥 Export to Excel
                        </Button>
                    </Col>
                    {/* <Col md={4}>
                        <Form.Select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                borderColor: '#667eea',
                                fontSize: '14px'
                            }}
                        >
                            <option value="All">All Status</option>
                            <option value="Processed">Processed</option>
                            <option value="Pending">Pending</option>
                        </Form.Select>
                    </Col> */}
                </Row>

                <div style={{
                    border: viewMode === 'date' ? '2px solid #667eea' : '2px solid #38a169',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: viewMode === 'date' ? '0 4px 12px rgba(102, 126, 234, 0.15)' : '0 4px 12px rgba(56, 161, 105, 0.15)'
                }}>
                    <DataTable
                        columns={viewMode === 'date' ? [
                            { 
                                name: 'Sl.No', 
                                selector: (row, index) => (currentPage - 1) * rowsPerPage + index + 1,
                                sortable: false,
                                width: '80px',
                                center: true,
                                style: { borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }
                            },
                            { 
                                name: 'Valuation Date', 
                                selector: row => row.check_date, 
                                sortable: true,
                                center: true,
                                cell: row => (
                                    <span style={{ fontWeight: 700, color: '#2c5282', fontSize: '14px' }}>{row.check_date}</span>
                                ),
                                style: { borderRight: '1px solid #e0e0e0' }
                            },
                            { 
                                name: 'Valuation Type', 
                                selector: row => row.Valuation_Type, 
                                sortable: true,
                                center: true,
                                width: '130px',
                                style: { borderRight: '1px solid #e0e0e0', fontWeight: '500' }
                            },
                            { 
                                name: 'Subjects', 
                                selector: row => (row.subcodes || []).length, 
                                sortable: true,
                                center: true,
                                width: '110px',
                                cell: row => (
                                    <span style={{ fontWeight: 600, color: '#4a5568' }}>{(row.subcodes || []).length} subj</span>
                                ),
                                style: { borderRight: '1px solid #e0e0e0' }
                            },
                            { 
                                name: 'Total Papers (Day)', 
                                selector: row => row.Date_Total_Papers, 
                                sortable: true,
                                center: true,
                                cell: row => (
                                    <span style={{ fontWeight: 700, color: '#667eea', fontSize: '14px' }}>{row.Date_Total_Papers}</span>
                                ),
                                style: { borderRight: '1px solid #e0e0e0' }
                            },
                            {
                                name: 'View',
                                center: true,
                                width: '100px',
                                cell: row => (
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        style={{ fontSize: '11px', fontWeight: 600 }}
                                        onClick={(e) => displayReport({
                                            id: row.id,
                                            Evaluator_Id: row.Evaluator_Id,
                                            check_date: row.check_date,
                                            Valuation_Type: row.Valuation_Type,
                                            Dept_Code: row.subcodes?.[0]?.Dept_Code,
                                            Reports: "1",
                                        }, e)}
                                    >
                                        View
                                    </Button>
                                )
                            },
                        ] : [
                            { 
                                name: 'Sl.No', 
                                selector: (row, index) => (currentPage - 1) * rowsPerPage + index + 1,
                                sortable: false,
                                width: '80px',
                                center: true,
                                style: { borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }
                            },
                            { 
                                name: 'Subject Code', 
                                selector: row => row.Dept_Code, 
                                sortable: true,
                                center: true,
                                width: '140px',
                                cell: row => (
                                    <span style={{ fontWeight: 700, color: '#276749', fontSize: '14px', letterSpacing: '0.5px' }}>{row.Dept_Code}</span>
                                ),
                                style: { borderRight: '1px solid #e0e0e0' }
                            },
                            { 
                                name: 'Evaluator ID', 
                                selector: row => row.Evaluator_Id, 
                                sortable: true,
                                center: true,
                                width: '130px',
                                style: { borderRight: '1px solid #e0e0e0', fontWeight: '500' }
                            },
                            { 
                                name: 'Valuation Type', 
                                selector: row => row.Valuation_Type, 
                                sortable: true,
                                center: true,
                                width: '120px',
                                style: { borderRight: '1px solid #e0e0e0' }
                            },
                            { 
                                name: 'Valuation Days', 
                                selector: row => row.Total_Dates, 
                                sortable: true,
                                center: true,
                                width: '120px',
                                cell: row => (
                                    <span style={{ fontWeight: 600, color: '#2c5282' }}>{row.Total_Dates}</span>
                                ),
                                style: { borderRight: '1px solid #e0e0e0' }
                            },
                            { 
                                name: 'Total Papers', 
                                selector: row => row.Total_Papers, 
                                sortable: true,
                                center: true,
                                width: '120px',
                                cell: row => (
                                    <span style={{ fontWeight: 700, color: '#276749', fontSize: '14px' }}>{row.Total_Papers}</span>
                                ),
                                style: { borderRight: '1px solid #e0e0e0' }
                            },
                            { 
                                name: 'Dates', 
                                selector: row => (row.Dates || []).join(', '), 
                                grow: 3,
                                cell: row => (
                                    <div style={{ fontSize: '11px', color: '#4a5568', padding: '4px 0', lineHeight: '1.6' }}>
                                        {(row.Dates || []).map((d, i) => (
                                            <span key={i} style={{ display: 'inline-block', background: '#e9ecef', borderRadius: '4px', padding: '1px 6px', margin: '1px', fontSize: '11px' }}>{d}</span>
                                        ))}
                                    </div>
                                ),
                                style: { borderRight: '1px solid #e0e0e0' }
                            },
                            { 
                                name: 'View', 
                                center: true,
                                width: '100px',
                                cell: row => (
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={(e) => displayReport(
                                            {
                                                id: row.Dept_Code,
                                                Evaluator_Id: row.Evaluator_Id,
                                                check_date: (row.Dates && row.Dates[0]) || '',
                                                Valuation_Type: row.Valuation_Type,
                                                Dept_Code: row.Dept_Code,
                                                Table_Dept_Code: row.Table_Dept_Code,
                                                Reports: "2",
                                            }, e
                                        )}
                                        style={{ fontSize: '11px', fontWeight: 600 }}
                                    >
                                        View
                                    </Button>
                                ),
                            },
                        ]}
                        data={viewMode === 'date' ? filteredDateGroupedData : filteredSubjectData}
                        onRowClicked={undefined}
                        conditionalRowStyles={[]}
                        pagination
                        paginationPerPage={rowsPerPage}
                        paginationRowsPerPageOptions={[10, 15, 20, 25]}
                        onChangePage={(page) => setCurrentPage(page)}
                        onChangeRowsPerPage={(newPerPage) => {
                            setRowsPerPage(newPerPage)
                            setCurrentPage(1)
                        }}
                        striped
                        highlightOnHover
                        pointerOnHover
                        responsive
                        dense
                        customStyles={{
                            table: {
                                style: {
                                    border: 'none'
                                }
                            },
                            headRow: {
                                style: {
                                    backgroundColor: viewMode === 'date' ? '#667eea' : '#38a169',
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    borderBottom: viewMode === 'date' ? '3px solid #5568d3' : '3px solid #276749',
                                    minHeight: '48px'
                                }
                            },
                            headCells: {
                                style: {
                                    borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                                    paddingLeft: '16px',
                                    paddingRight: '16px',
                                    '&:last-child': {
                                        borderRight: 'none'
                                    }
                                }
                            },
                            cells: {
                                style: {
                                    borderRight: '1px solid #e0e0e0',
                                    paddingLeft: '16px',
                                    paddingRight: '16px',
                                    fontSize: '13px',
                                    '&:last-child': {
                                        borderRight: 'none'
                                    }
                                }
                            },
                            rows: {
                                style: {
                                    fontSize: '13px',
                                    minHeight: '52px',
                                    borderBottom: '1px solid #e8e8e8',
                                    '&:hover': {
                                        backgroundColor: '#f5f7ff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }
                                },
                                stripedStyle: {
                                    backgroundColor: '#fafbff'
                                }
                            },
                            pagination: {
                                style: {
                                    borderTop: '2px solid #667eea',
                                    fontSize: '13px',
                                    minHeight: '56px',
                                    backgroundColor: '#f8f9fa'
                                },
                                pageButtonsStyle: {
                                    borderRadius: '6px',
                                    height: '32px',
                                    padding: '4px 8px',
                                    margin: '2px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover:not(:disabled)': {
                                        backgroundColor: '#667eea',
                                        color: '#ffffff'
                                    }
                                }
                            }
                        }}
                    />
                </div>



            </UploadPageLayout>
            {showModal && <ExaminerMarkCampModal show={showModal} onHide={() => setShowModal(false)} selectedId={selectedId} examinerRoles={selectedExaminerStatus} examinerName={selectEvaName} />}
        </>
    )
}

export default PdfDocumentCamp
