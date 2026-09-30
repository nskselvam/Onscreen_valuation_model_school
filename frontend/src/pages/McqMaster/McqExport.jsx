import React, { useMemo, useState, useEffect } from 'react'
import DataTableBase from 'react-data-table-component';
import {
    useGetCommonDataQuery,
} from '../../redux-slice/getDataCommonRouterdata';
import { useSelector, useDispatch } from 'react-redux';
import { masterDataAdminDataSubcode } from '../../redux-slice/getDataCommonRouterSlice';
import { Button, Modal } from 'react-bootstrap';
import { useMcqMasterDataUpdateMutation, useReverteMcqDataFinalMutation, useEvaluatorDataFromTheBackQuery, useGetMcqDataBySubcodeFromTheBackQuery, useLazyGetMcqDataBySubcodeFromTheBackQuery, useMcqMasterDataBySubcodeQuery } from '../../redux-slice/mcqOperationSlice';
import McqAssignModal from '../../components/modals/McqAssignModal';
import { toast } from 'react-toastify';
import { McqAnswerKeyPdfDownload } from '../../utils/McqAnswerKeyPdfGenerator.jsx';
import { Document, Page, Text, View, StyleSheet, Image, pdf, Font } from '@react-pdf/renderer';
import logoImage from '../../assets/SRMCLEARLOGO.png';
import * as XLSX from 'xlsx';
const DataTable = DataTableBase.default || DataTableBase;

// Component to fetch MCQ data for a subcode and optionally filter by a field
const McqDataFetcher = ({ subcode, evaId, filterField }) => {
    const { data: mcqData, isLoading, isError } = useGetMcqDataBySubcodeFromTheBackQuery(
        { Subcode: subcode, Eva_Id: evaId },
        { skip: !subcode || !evaId }
    );

    useEffect(() => {
        if (mcqData) {
            if (filterField) {
                const filtered = Array.isArray(mcqData?.data) ? mcqData.data.filter(d => String(d[filterField]).toUpperCase() === 'Y') : [];
            }
        }
    }, [mcqData, subcode, evaId, filterField]);

    if (isLoading) return <Button size="sm" variant="secondary" disabled style={{ fontSize: '0.8rem' }}>Loading...</Button>;
    if (isError || !mcqData?.data || mcqData.data.length === 0) return <Button size="sm" variant="secondary" disabled style={{ fontSize: '0.8rem' }}>No Data</Button>;

    const filtered = filterField ? mcqData.data.filter(d => String(d[filterField]).toUpperCase() === 'Y') : mcqData.data;
    if (filtered.length === 0) return <Button size="sm" variant="secondary" disabled style={{ fontSize: '0.8rem' }}>No Data</Button>;

    return (
        null
    );
};

// Cell component: fetch MCQ data and render concatenated key (answers ordered by Qst_Number)
const McqKeyCell = ({ subcode, evaId, onKeyFetched }) => {
    const { data: mcqData, isLoading, isError } = useGetMcqDataBySubcodeFromTheBackQuery(
        { Subcode: subcode, Eva_Id: evaId },
        { skip: !subcode || !evaId }
    );

    useEffect(() => {
        if (mcqData?.data && mcqData.data.length > 0) {
            const sorted = [...mcqData.data].sort((a, b) => (Number(a.Qst_Number) || 0) - (Number(b.Qst_Number) || 0));
            const key = sorted.map((it) => String(it.Qst_Ans || '').trim()).join('');
            if (onKeyFetched) {
                onKeyFetched(subcode, evaId, key);
            }
        }
    }, [mcqData, subcode, evaId, onKeyFetched]);

    if (isLoading) return <span style={{ color: '#666', fontSize: '0.9rem' }}>Loading...</span>;
    if (isError || !mcqData?.data || mcqData.data.length === 0) return <span>--</span>;

    // sort by Qst_Number and concatenate Qst_Ans
    const sorted = [...mcqData.data].sort((a, b) => (Number(a.Qst_Number) || 0) - (Number(b.Qst_Number) || 0));
    const key = sorted.map((it) => String(it.Qst_Ans || '').trim()).join('');
    return <span style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{key || '--'}</span>;
};

const McqExport = () => {
    const Dep_Name = useSelector((state) => state?.auth?.userInfo?.selected_course);
    const Eva_Id = useSelector((state) => state?.auth?.username);
    const dispatch = useDispatch();

    const { data: subMaster, error, isLoading, refetch } = useGetCommonDataQuery(
        { tableId: 'sub_master', Dep_Name },
        { skip: !Dep_Name }
    );

    const [filteredSubCode, setFilteredSubCode] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [mcqKeys, setMcqKeys] = useState({});
    const [isExporting, setIsExporting] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0, subcode: '' });
    const [excelProgress, setExcelProgress] = useState({ current: 0, total: 0 });
    const [selectedRows, setSelectedRows] = useState([]);
    const [toggleCleared, setToggleCleared] = useState(false);

    const [getMcqData] = useLazyGetMcqDataBySubcodeFromTheBackQuery();
    const { data: masterDataResponse } = useMcqMasterDataBySubcodeQuery();
    const masterData = masterDataResponse?.data || [];

    const handleKeyFetched = React.useCallback((subcode, evaId, key) => {
        setMcqKeys(prev => ({
            ...prev,
            [`${subcode}_${evaId}`]: key
        }));
    }, []);

  

    const filteredMcqData = useMemo(() => {
       if (!subMaster?.data || !Array.isArray(subMaster.data)) return [];
       return subMaster.data.filter(item =>
         item.mcq_flg === "Y" && item.mcq_updates  === "Y"
       );
     }, [subMaster, Eva_Id]);


    // Prepare table data with serial number and key
    const tableDataWithSno = filteredMcqData.map((r, i) => ({ 
        ...r, 
        __sno: i + 1,
        __key: mcqKeys[`${r.Subcode}_${r.Eva_Id}`] || ''
    }));

    const filteredBySearch = tableDataWithSno.filter(item => {
      if (!searchText) return true;
      const s = searchText.toLowerCase();
      return (item.Subcode || '').toLowerCase().includes(s) || 
      (item.SUBNAME || '').toLowerCase().includes(s) || 
      String(item.Eva_Id || '').toLowerCase().includes(s) ||
      String(item.__key || '').toLowerCase().includes(s);
    });

    const noDataComponent = useMemo(() => (
        <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No MCQ subjects found.</div>
    ), []);

    const exportToExcel = async () => {
        if (!filteredBySearch || filteredBySearch.length === 0) return;
        
        setIsExporting(true);
        setExcelProgress({ current: 0, total: filteredBySearch.length });
        
        try {
            // Fetch all keys for all rows with progress tracking
            const allKeys = [];
            
            for (let i = 0; i < filteredBySearch.length; i++) {
                const row = filteredBySearch[i];
                setExcelProgress({ current: i + 1, total: filteredBySearch.length });
                
                const { data } = await getMcqData({ Subcode: row.Subcode, Eva_Id: row.Eva_Id });
                if (data?.data && data.data.length > 0) {
                    const sorted = [...data.data].sort((a, b) => (Number(a.Qst_Number) || 0) - (Number(b.Qst_Number) || 0));
                    const key = sorted.map((it) => String(it.Qst_Ans || '').trim()).join('');
                    allKeys.push({ subcode: row.Subcode, evaId: row.Eva_Id, key });
                } else {
                    allKeys.push({ subcode: row.Subcode, evaId: row.Eva_Id, key: '' });
                }
            }
            
            // Create a map of keys
            const keysMap = {};
            allKeys.forEach(({ subcode, evaId, key }) => {
                keysMap[`${subcode}_${evaId}`] = key;
            });

            // Find the maximum number of questions to create columns
            const maxQuestions = Math.max(...allKeys.map(({ key }) => key.length));
            
            // Export data with all keys split into individual columns
            const exportData = filteredBySearch.map((row, i) => {
                const key = keysMap[`${row.Subcode}_${row.Eva_Id}`] || '';
                const answers = key.split('');
                
                const rowData = {
                    'S.No': i + 1,
                    'Subname': row.SUBNAME || '',
                    'Evaluator ID': row.Eva_Id || '',
                    'Subcode': row.Subcode || ''
                };
                
                // Add individual question columns
                for (let j = 0; j < maxQuestions; j++) {
                    rowData[`Q${j + 1}`] = answers[j] || '';
                }
                
                // Add full key at the end
                rowData['Full Key'] = key;
                
                return rowData;
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'MCQ Subcodes');
            XLSX.writeFile(workbook, `MCQ_Subcodes_${new Date().toISOString().split('T')[0]}.xlsx`);
            
            toast.success('Excel file exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export Excel file');
        } finally {
            setIsExporting(false);
            setExcelProgress({ current: 0, total: 0 });
        }
    };

    const generateAllPDFs = async () => {
        const rowsToGenerate = selectedRows.length > 0 ? selectedRows : filteredBySearch;
        
        if (!rowsToGenerate || rowsToGenerate.length === 0) {
            toast.warning('No rows to generate PDFs. Please select rows first.');
            return;
        }
        
        setIsGeneratingPdf(true);
        setPdfProgress({ current: 0, total: rowsToGenerate.length, subcode: '' });
        
        try {
            // Fetch all MCQ data for each subcode with progress tracking
            const allPdfData = [];
            
            for (let i = 0; i < rowsToGenerate.length; i++) {
                const row = rowsToGenerate[i];
                setPdfProgress({ 
                    current: i + 1, 
                    total: filteredBySearch.length, 
                    subcode: row.Subcode 
                });
                
                const { data } = await getMcqData({ Subcode: row.Subcode, Eva_Id: row.Eva_Id });
                if (data?.data && data.data.length > 0) {
                    allPdfData.push({
                        subcode: row.Subcode,
                        subname: row.SUBNAME,
                        evaId: row.Eva_Id,
                        data: data.data
                    });
                }
            }
            
            if (allPdfData.length === 0) {
                toast.warning('No answer keys found to generate PDF');
                return;
            }

            setPdfProgress({ 
                current: rowsToGenerate.length, 
                total: rowsToGenerate.length, 
                subcode: 'Generating PDF...' 
            });

            // Register fonts
            Font.register({
                family: 'NotoSansCJK',
                fonts: [
                    { src: new URL('../../assets/fonts/NotoSansCJK-Regular.ttc', import.meta.url).href, fontWeight: 400 },
                    { src: new URL('../../assets/fonts/NotoSansCJK-Bold.ttc', import.meta.url).href, fontWeight: 700 },
                ],
            });

            // Helper function to get answer description
            const getAnswerDescription = (answerCode) => {
                if (!masterData || !Array.isArray(masterData)) return answerCode || '-';
                const found = masterData.find(item => item.ans_Mas === answerCode);
                return found ? found.ans_Des : (answerCode || '-');
            };

            // Define PDF styles
            const pdfStyles = StyleSheet.create({
                page: { padding: 25, fontSize: 9, fontFamily: 'NotoSansCJK' },
                header: { marginBottom: 15, borderBottom: '1.5px solid #000000', paddingBottom: 8 },
                logoContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
                logo: { width: 40, height: 40, marginRight: 8 },
                institutionTitle: { fontSize: 12, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: 2 },
                institutionSubtitle: { fontSize: 8, color: '#000000', textAlign: 'center', marginBottom: 2 },
                institutionAddress: { fontSize: 8, color: '#000000', textAlign: 'center', marginBottom: 6 },
                infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, fontSize: 9 },
                infoLeft: { flexDirection: 'row', flex: 1 },
                infoRight: { flexDirection: 'row', flex: 1, justifyContent: 'flex-end' },
                infoLabel: { fontWeight: 'bold', color: '#000000' },
                infoValue: { color: '#000000', marginLeft: 5 },
                table: { marginTop: 12, borderWidth: 1, borderColor: '#000000', borderStyle: 'solid' },
                tableHeader: { flexDirection: 'row', backgroundColor: '#f8f9fa', borderBottomWidth: 2, borderBottomColor: '#000000', borderBottomStyle: 'solid', paddingVertical: 6, paddingHorizontal: 6 },
                tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000000', borderBottomStyle: 'solid', paddingVertical: 5, paddingHorizontal: 6, minHeight: 22 },
                tableRowAlt: { flexDirection: 'row', backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#000000', borderBottomStyle: 'solid', paddingVertical: 5, paddingHorizontal: 6, minHeight: 22 },
                tableColHeader: { fontWeight: 'bold', fontSize: 9, color: '#000000', textAlign: 'center' },
                tableCol: { fontSize: 8, color: '#000000', textAlign: 'center' },
                colQstNum: { width: '12%' },
                colAnswer: { width: '28%' },
                colRemarks: { width: '60%', textAlign: 'left', paddingLeft: 6 },
                watermark: { position: 'absolute', fontSize: 60, color: '#e9ecef', transform: 'rotate(-45deg)', top: '40%', left: '25%', opacity: 0.1 },
            });

            // Create combined PDF document
            const CombinedPdfDocument = (
                <Document>
                    {allPdfData.map((item, pageIndex) => {
                        const sortedData = [...item.data].sort((a, b) => a.Qst_Number - b.Qst_Number);
                        const metadata = item.data[0] || {};

                        return (
                            <Page key={pageIndex} size="A4" style={pdfStyles.page}>
                                <Text style={pdfStyles.watermark}>ANSWER KEY</Text>
                                
                                <View style={pdfStyles.header}>
                                    <View style={pdfStyles.logoContainer}>
                                        <Image src={logoImage} style={pdfStyles.logo} />
                                    </View>
                                    <Text style={pdfStyles.institutionTitle}>SRM INSTITUTE OF SCIENCE AND TECHNOLOGY</Text>
                                    <Text style={pdfStyles.institutionSubtitle}>(Deemed to be University u/s 3 of UGC Act, 1956)</Text>
                                    <Text style={pdfStyles.institutionAddress}>S.R.M.Nagar, Kattankulathur - 603 203</Text>
                                </View>

                                <View style={{ marginBottom: 12 }}>
                                    <View style={pdfStyles.infoRow}>
                                        <View style={pdfStyles.infoLeft}>
                                            <Text style={pdfStyles.infoLabel}>Eva Name (Eva Id) :</Text>
                                            <Text style={pdfStyles.infoValue}>{metadata.Eva_Id || item.evaId || 'N/A'}</Text>
                                        </View>
                                        <View style={pdfStyles.infoRight}>
                                            <Text style={pdfStyles.infoLabel}>Month & Year :</Text>
                                            <Text style={pdfStyles.infoValue}>{metadata.Eva_Month ? metadata.Eva_Month.replace(/_/g, ' ') : 'N/A'}</Text>
                                        </View>
                                    </View>

                                    <View style={pdfStyles.infoRow}>
                                        <View style={pdfStyles.infoLeft}>
                                            <Text style={pdfStyles.infoLabel}>Subcode :</Text>
                                            <Text style={pdfStyles.infoValue}>{item.subcode || 'N/A'}</Text>
                                        </View>
                                        <View style={pdfStyles.infoRight}>
                                            <Text style={pdfStyles.infoLabel}>No.Of.Question :</Text>
                                            <Text style={pdfStyles.infoValue}>{sortedData.length}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={pdfStyles.table}>
                                    <View style={pdfStyles.tableHeader}>
                                        <Text style={[pdfStyles.tableColHeader, pdfStyles.colQstNum]}>Q.no</Text>
                                        <Text style={[pdfStyles.tableColHeader, pdfStyles.colAnswer]}>Answer Key</Text>
                                        <Text style={[pdfStyles.tableColHeader, pdfStyles.colRemarks]}>Description Answer Key</Text>
                                    </View>

                                    {sortedData.map((qItem, qIndex) => (
                                        <View key={qIndex} style={qIndex % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
                                            <Text style={[pdfStyles.tableCol, pdfStyles.colQstNum]}>{qItem.Qst_Number}</Text>
                                            <Text style={[pdfStyles.tableCol, pdfStyles.colAnswer]}>{getAnswerDescription(qItem.Qst_Ans)}</Text>
                                            <Text style={[pdfStyles.tableCol, pdfStyles.colRemarks]}>{qItem.Qst_Remarks || '-'}</Text>
                                        </View>
                                    ))}
                                </View>
                            </Page>
                        );
                    })}
                </Document>
            );

            // Generate PDF blob
            const blob = await pdf(CombinedPdfDocument).toBlob();
            
            // Create download link
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `MCQ_All_Answer_Keys_${new Date().toISOString().split('T')[0]}.pdf`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
            
            toast.success(`PDF generated with ${allPdfData.length} answer keys!`);
            
            // Clear selection after successful generation
            setSelectedRows([]);
            setToggleCleared(!toggleCleared);
        } catch (error) {
            console.error('PDF generation error:', error);
            toast.error('Failed to generate PDF');
        } finally {
            setIsGeneratingPdf(false);
            setPdfProgress({ current: 0, total: 0, subcode: '' });
        }
    };

    const handleRowSelected = React.useCallback((state) => {
        setSelectedRows(state.selectedRows);
    }, []);

    const columns = useMemo(() => [
        { name: 'S.No', selector: row => row.__sno, sortable: true, width: '80px', center: true },
        { name: 'Subname', selector: row => row.SUBNAME || '--', sortable: true, grow: 2, wrap: true },
        { name: 'Evaluator ID', selector: row => row.Eva_Id || '--', sortable: true, width: '140px', center: true },
        { name: 'Subcode', selector: row => row.Subcode || '--', sortable: true, width: '160px', center: true },
        { name: 'Key', selector: row => row.__key || '--', sortable: false, grow: 1, cell: (row) => (
            <McqKeyCell subcode={row.Subcode} evaId={row.Eva_Id} onKeyFetched={handleKeyFetched} />
        ) },
    ], [handleKeyFetched]);







    return (
        <div style={{ padding: '12px' }}>
            {/* Progress Modal */}
            <Modal show={isGeneratingPdf} backdrop="static" keyboard={false} centered>
                <Modal.Header>
                    <Modal.Title>Generating PDFs</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ marginBottom: '8px', fontWeight: '500' }}>
                            Processing: {pdfProgress.current} of {pdfProgress.total}
                        </p>
                        <p style={{ marginBottom: '12px', color: '#666', fontSize: '0.9rem' }}>
                            Current: {pdfProgress.subcode}
                        </p>
                        <div style={{ 
                            width: '100%', 
                            height: '24px', 
                            backgroundColor: '#e9ecef', 
                            borderRadius: '4px', 
                            overflow: 'hidden' 
                        }}>
                            <div 
                                style={{ 
                                    width: `${pdfProgress.total > 0 ? (pdfProgress.current / pdfProgress.total) * 100 : 0}%`, 
                                    height: '100%', 
                                    backgroundColor: '#0d6efd', 
                                    transition: 'width 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}
                            >
                                {pdfProgress.total > 0 ? Math.round((pdfProgress.current / pdfProgress.total) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                        Please wait while we fetch and generate PDFs...
                    </div>
                </Modal.Body>
            </Modal>

            {/* Excel Export Progress Modal */}
            <Modal show={isExporting} backdrop="static" keyboard={false} centered>
                <Modal.Header>
                    <Modal.Title>Exporting to Excel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ marginBottom: '8px', fontWeight: '500' }}>
                            Fetching data: {excelProgress.current} of {excelProgress.total}
                        </p>
                        <div style={{ 
                            width: '100%', 
                            height: '24px', 
                            backgroundColor: '#e9ecef', 
                            borderRadius: '4px', 
                            overflow: 'hidden' 
                        }}>
                            <div 
                                style={{ 
                                    width: `${excelProgress.total > 0 ? (excelProgress.current / excelProgress.total) * 100 : 0}%`, 
                                    height: '100%', 
                                    backgroundColor: '#198754', 
                                    transition: 'width 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}
                            >
                                {excelProgress.total > 0 ? Math.round((excelProgress.current / excelProgress.total) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                        Please wait while we prepare your Excel file...
                    </div>
                </Modal.Body>
            </Modal>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0 }}>MCQ Export</h4>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '320px' }}>
                            <input
                                type="text"
                                placeholder="Search subjects..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 40px 8px 12px',
                                    fontSize: '14px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    outline: 'none'
                                }}
                            />
                            {searchText && (
                                <button
                                    onClick={() => setSearchText('')}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        color: '#999'
                                    }}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        {selectedRows.length > 0 && (
                            <button 
                                className="btn btn-outline-secondary btn-sm" 
                                onClick={() => {
                                    setSelectedRows([]);
                                    setToggleCleared(!toggleCleared);
                                }}
                            >
                                Clear Selection ({selectedRows.length})
                            </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={generateAllPDFs} disabled={tableDataWithSno.length === 0 || isGeneratingPdf}>
                            {isGeneratingPdf ? 'Generating PDF...' : selectedRows.length > 0 ? `Generate ${selectedRows.length} PDFs` : 'Generate All PDFs'}
                        </button>
                        <button className="btn btn-success btn-sm" onClick={exportToExcel} disabled={tableDataWithSno.length === 0 || isExporting}>
                            {isExporting ? 'Exporting...' : 'Export to Excel'}
                        </button>
                    </div>
                </div>

            <DataTable
                columns={columns}
                data={filteredBySearch}
                pagination
                paginationPerPage={10}
                highlightOnHover
                pointerOnHover
                responsive
                noDataComponent={noDataComponent}
                selectableRows
                onSelectedRowsChange={handleRowSelected}
                clearSelectedRows={toggleCleared}
                selectableRowsHighlight
            />
        </div>
    )
}

export default McqExport
