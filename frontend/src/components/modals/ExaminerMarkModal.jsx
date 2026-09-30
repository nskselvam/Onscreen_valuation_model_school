import React, { useState, useEffect } from "react";
import { Modal, Button, Card, Row, Col, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useGetValuationDataWithValDataExaminerQuery, useGenerateValuationPdfMutation } from "../../redux-slice/valuationApiSlice";
import { BASE_URL } from "../../constraint/constraint";
import navbarData from '../../hooks/navbar/navbar.json'
const  { VITE_Institution_Name ,VITE_Institution_No} = import.meta.env;
const ExaminerMarkModal = ({ show, onHide, selectedId }) => {

  const userInfo = useSelector((state) => state.auth.userInfo)

  const Dep_Name = userInfo?.selected_course;
  const Select_Role = userInfo?.selected_role;

   const Institution_Details = navbarData.find(n => String(n._id) === String(VITE_Institution_No)) || {}


  const { data: valuationData, isLoading, isError, error } = useGetValuationDataWithValDataExaminerQuery(
    {
      Evaluator_Id: selectedId?.Evaluator_Id,
      check_date: selectedId?.check_date,
      Valuation_Type: selectedId?.Valuation_Type,
      Dept_Code: selectedId?.Dept_Code,
      Table_Dept_Code: selectedId?.Table_Dept_Code,
      Reports: selectedId?.Reports,
      Select_Role,
      Dep_Name,
      
    },
    {
      skip: !selectedId?.Evaluator_Id
    });


    console.log("Valuation Data:", valuationData);

  const [generatePdf, { isLoading: isPdfGenerating }] = useGenerateValuationPdfMutation();



  const questionsPerPaper = 40;
  const totalPapers = valuationData?.data?.length ? valuationData.data.length : 0;
  const candidatesPerPage = 10;
  const totalPages = Math.ceil(totalPapers / candidatesPerPage);
  const maxColumnsPerTable = 12;

  // Generate papers data with mixed subject codes - replace with your actual data
  const subjectCodes = ['CS', 'IT', 'EC', 'ME', 'CE'];



  const papers = valuationData?.data.map((item, index) => {
    const questions = valuationData?.val_data?.filter(q => q.barcode === item.barcode).map((qItem, qIndex) => ({
      id: qItem.id || qIndex + 1,
      questionNumber: !qItem.sub_section || qItem.sub_section === '' ? qItem.qbno + "-" + qItem.section : qItem.qbno + "-" + qItem.section + "-" + qItem.sub_section,
      //marks: qItem.Marks_Get === 'NA' ? 0 : parseFloat(qItem.Marks_Get) || 0,
      marks: qItem.Marks_Get,
      maxMarks: qItem.max_marks,
      valid_qbs: qItem.valid_qbs,
    })) || [];

    return {
      paperId: index + 1,
      dummyNumber: item.barcode,
      subjectCode: item.subcode,
      tot_round: item.tot_round || 0,
      total: item.total || 0,
      subjectName: item.subject_name || '',
      questions: questions
    };
  }) || [];


  const PrintPdf = async () => {
    try {

      const pdfData = {
        papers: papers,
        evaluatorId: selectedId.Evaluator_Id,
        evaluatorName: userInfo?.name,
        checkDate: selectedId.check_date,
        Institution_Details: Institution_Details?.InstitutionName,
      };

      const blob = await generatePdf(pdfData).unwrap();

      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL);

      // Cleanup the object URL after a delay
      setTimeout(() => URL.revokeObjectURL(fileURL), 100);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Failed to generate PDF: ${error.message || error.data?.message || 'Unknown error'}`);
    }
  };

  // Current page being viewed
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const startIndex = currentPageIndex * candidatesPerPage;
  const endIndex = Math.min(startIndex + candidatesPerPage, totalPapers);
  const currentPagePapers = papers.slice(startIndex, endIndex);

  // For printing, show all papers
  const displayPapers = isPrintMode ? papers : currentPagePapers;

  // State to track columns per row based on screen size
  const [columnsPerRow, setColumnsPerRow] = useState(6);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setColumnsPerRow(3); // Small screens - 3 columns
      } else if (width < 992) {
        setColumnsPerRow(4); // Medium screens - 4 columns
      } else if (width < 1400) {
        setColumnsPerRow(6); // Large screens - 6 columns
      } else {
        setColumnsPerRow(8); // Extra large screens - 8 columns
      }
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handlePageSelect = (e) => {
    setCurrentPageIndex(parseInt(e.target.value));
  };

  const totalColumns = 15; // Fixed number of columns per paper

  return (
    <Modal show={show} onHide={onHide} fullscreen={true} className="examiner-modal-print">
      <Modal.Header closeButton className="print-header">
        <Modal.Title className="w-100">
          <h2 className="mb-3 text-center">{Institution_Details?.InstitutionName }</h2>
          <Row className="mb-3">
            <Col md={6} className="text-start">
              <h5>Examiner Name & ID: {userInfo?.name} - {selectedId?.Evaluator_Id}</h5>
            </Col>
            <Col md={6} className="text-end">
              {selectedId?.Reports === '1' ? (
                <h5>📅 Valuation Date: {selectedId?.check_date} &nbsp;|&nbsp; Type: {selectedId?.Valuation_Type}</h5>
              ) : (
                <h5>📚 Subject Code: {selectedId?.Dept_Code} &nbsp;|&nbsp; Type: {selectedId?.Valuation_Type}</h5>
              )}
            </Col>
          </Row>
          <Row className="mb-3">
            {/* <Col md={6} className="text-start">
              <h5>Subject Name & Code: Computer Science - CS101</h5>
            </Col> */}
            <Col md={12} className="text-end">
              <h5>Page: {currentPageIndex + 1} of {totalPages} | Candidates: {startIndex + 1}-{endIndex} of {totalPapers}</h5>
            </Col>
          </Row>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ height: "calc(100vh - 180px)", overflow: "auto" }}>
        <div className="d-flex justify-content-end mb-3">
          <Form.Group className="mb-0 d-flex align-items-center gap-2">
            <Form.Label className="mb-0">Jump to Page:</Form.Label>
            <Form.Select
              size="sm"
              value={currentPageIndex}
              onChange={handlePageSelect}
              style={{ width: '120px' }}
            >
              {Array.from({ length: totalPages }, (_, index) => (
                <option key={index} value={index}>
                  Page {index + 1}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>

        <style>{`
          .candidates-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
          }
          .page-section {
            display: block;
          }
          .page-section-header {
            display: none;
          }
          .candidate-card {
            border: 3px solid #2c3e50;
            border-radius: 8px;
            overflow-x: auto;
            overflow-y: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          .card-header {
            background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #1e8449;
          }
          .barcode-info {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .subject-badge {
            background-color: #f39c12;
            color: white;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 700;
          }
          .barcode-text {
            font-family: 'Courier New', monospace;
            letter-spacing: 1.5px;
            font-weight: 700;
            font-size: 1rem;
          }
          .total-badge {
            background-color: #3498db;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 1.1rem;
            border: 2px solid #2980b9;
          }
          .questions-grid {
            display: grid;
            grid-template-columns: repeat(15, minmax(60px, 1fr));
            gap: 0;
            background-color: #ecf0f1;
            padding: 15px;
            width: fit-content;
            min-width: 100%;
          }
          .question-column {
            display: flex;
            flex-direction: column;
            gap: 0;
            min-width: 60px;
            max-width: 100px;
          }
          .question-item {
            display: flex;
            flex-direction: column;
            border: 2px solid #2c3e50;
            background-color: white;
            transition: all 0.2s;
            min-height: 65px;
          }
          .question-item:hover {
            background-color: #d5dbdb;
            transform: scale(1.02);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .question-number-box {
            padding: 5px 4px;
            background-color: #34495e;
            color: white;
            font-weight: 700;
            text-align: center;
            border-bottom: 2px solid #2c3e50;
            font-size: 0.8rem;
            word-break: break-word;
          }
          .mark-box {
            padding: 8px 4px;
            background-color: #fef5e7;
            color: #e74c3c;
            font-weight: 700;
            text-align: center;
            font-size: 1rem;
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }          .mark-box.valid-question {
            background-color: white;
            color: #155724;
          }          .mark-box.valid-question {
            background-color: white;
            color: #155724;
          }
          @media (max-width: 1200px) {
            .questions-grid {
              grid-template-columns: repeat(12, minmax(55px, 1fr));
            }
            .question-column {
              min-width: 55px;
            }
            .question-item {
              min-height: 60px;
            }
            .question-number-box {
              padding: 4px 3px;
              font-size: 0.75rem;
            }
            .mark-box {
              padding: 6px 3px;
              font-size: 0.9rem;
            }
          }
          @media (max-width: 768px) {
            .card-header {
              flex-direction: column;
              gap: 10px;
              align-items: flex-start;
            }
            .questions-grid {
              grid-template-columns: repeat(8, minmax(50px, 1fr));
              padding: 10px;
            }
            .question-column {
              min-width: 50px;
            }
            .question-item {
              min-height: 60px;
            }
            .question-number-box {
              padding: 4px 5px;
              font-size: 0.75rem;
            }
            .mark-box {
              padding: 6px 5px;
              font-size: 0.85rem;
            }
            .barcode-text {
              font-size: 0.85rem;
            }
          }
          
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body * {
              visibility: hidden;
            }
            
            .examiner-modal-print,
            .examiner-modal-print * {
              visibility: visible;
            }
            
            .examiner-modal-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .modal-dialog {
              max-width: 100%;
              margin: 0;
            }
            
            .modal-content {
              border: none;
              box-shadow: none;
            }
            
            .no-print,
            .modal-footer {
              display: none !important;
            }
            
            .print-header {
              border: none;
              padding: 0 0 10px 0;
            }
            
            .print-header .btn-close {
              display: none;
            }
            
            .modal-body {
              padding: 0;
              height: auto !important;
              overflow: visible !important;
            }
            
            .candidates-container {
              gap: 15px;
            }
            
            .candidate-card {
              page-break-inside: avoid;
              break-inside: avoid;
              overflow: visible;
              margin-bottom: 10px;
            }
            
            .page-section {
              page-break-after: always;
            }
            
            .page-section:last-child {
              page-break-after: auto;
            }
            
            .page-section-header {
              display: block !important;
              margin-bottom: 15px;
              padding: 10px;
              background-color: #ecf0f1;
              border: 2px solid #2c3e50;
              text-align: center;
              font-weight: 700;
              font-size: 1rem;
            }
            
            .questions-grid {
              overflow: visible;
              page-break-inside: avoid;
            }
            
            .question-item:hover {
              transform: none;
              box-shadow: none;
            }
            
            .print-footer {
              display: flex !important;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #2c3e50;
              page-break-inside: avoid;
            }
            
            .print-footer-left {
              font-size: 0.85rem;
              color: #2c3e50;
            }
            
            .print-footer-right {
              text-align: right;
            }
            
            .signature-line {
              border-top: 2px solid #2c3e50;
              width: 200px;
              margin-top: 40px;
              padding-top: 5px;
              font-size: 0.85rem;
              color: #2c3e50;
              text-align: center;
            }
          }
        `}</style>

        <div className="candidates-container">
          {isLoading ? (
            <p>Loading valuation data...</p>
          ) : isError ? (
            <p>Error loading data: {error?.data?.message || error.error}</p>
          ) : (
            // Screen view - current page only
            currentPagePapers.map((paper) => {
              // const totalMarks = paper.questions.reduce((sum, q) => sum + q.marks, 0);
              // const maxTotalMarks = paper.questions.reduce((sum, q) => sum + q.maxMarks, 0);

              // Distribute questions sequentially into 15 columns
              const columns = [];
              const questionsPerCol = Math.ceil(paper.questions.length / totalColumns);

              for (let i = 0; i < totalColumns; i++) {
                const startIdx = i * questionsPerCol;
                const endIdx = Math.min(startIdx + questionsPerCol, paper.questions.length);
                if (startIdx < paper.questions.length) {
                  columns.push(paper.questions.slice(startIdx, endIdx));
                } else {
                  columns.push([]); // Empty column if no more questions
                }
              }

              return (
                <div key={paper.paperId} className="candidate-card">
                  <div className="card-header">
                    <div className="barcode-info">

                      <span className="barcode-text">Dummy Number : {paper.dummyNumber}</span>
                    </div>
                    <div>
                      <span className="barcode-text">Subject Code & Name : {paper.subjectCode} - {paper.subjectName} </span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <span style={{ marginLeft: '5px', marginRight: '10px' }}>
                        TOTAL: {paper.total}
                      </span>
                      <span style={{ marginLeft: '10px', marginRight: '5px' }}>
                        TOTAL ROUND: {paper.tot_round}
                      </span>
                    </div>

                  </div>
                  <div className="questions-grid">
                    {columns.map((column, colIndex) => (
                      <div key={colIndex} className="question-column">
                        {column.map((question) => (
                          <div key={question.id} className="question-item">
                            <div className="question-number-box">Q({question.questionNumber})</div>
                            <div className={`mark-box ${question.valid_qbs === 'Y' ? 'valid-question' : ''}`}>{question.valid_qbs === 'Y' ? question.marks : (question.valid_qbs == 'N' && question.marks == 'NA') ? question.marks : `${question.marks}(EX)`}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <div>
          <Button
            variant="outline-secondary"
            onClick={handlePreviousPage}
            disabled={currentPageIndex === 0}
          >
            ← Previous Page
          </Button>
        </div>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          <Button variant="primary" onClick={PrintPdf} disabled={isPdfGenerating}>
            {isPdfGenerating ? 'Generating...' : 'Print'}
          </Button>

        </div>
        <div>
          <Button
            variant="outline-secondary"
            onClick={handleNextPage}
            disabled={currentPageIndex === totalPages - 1}
          >
            Next Page →
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ExaminerMarkModal;