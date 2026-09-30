import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { useSelector } from "react-redux";
import Select from 'react-select';
import UploadPageLayout from "../DashboardComponents/UploadPageLayout";
import QuestionPaperShow from '../QuestionPaperShow/QuestionPaperShow.jsx';
import ConfirmationModal from '../modals/ConfirmationModal.jsx';
import { McqAnswerKeyPdfDownload } from '../../utils/McqAnswerKeyPdfGenerator.jsx';
import { 
  useMcqMasterDataBySubcodeQuery, 
  useMcqDataUpdateMutation, 
  useGetMcqDataBySubcodeFromTheBackQuery, 
  useUpdateMcqDataFinalMutation 
} from '../../redux-slice/mcqOperationSlice.js';
import { useGetCommonDataQuery } from '../../redux-slice/getDataCommonRouterdata';

const McqOperationData = () => {
  const userInfo = useSelector((state) => state.auth.userInfo);
  const Dep_Name = useSelector((state) => state?.auth?.userInfo?.selected_course);
  const Eva_id = useSelector((state) => state.auth.userInfo.username);

  // Fetch subject master data
  const { data: SubCodedata, error: error2, refetch } = useGetCommonDataQuery(
    { tableId: 'sub_master', Dep_Name },
    { skip: !Dep_Name }
  );

  // Fetch MCQ master data
  const { data: mcqData, error: mcqError } = useMcqMasterDataBySubcodeQuery(
    { Dep_Name },
    { skip: !Dep_Name }
  );

  // Mutations
  const [mcqMasterDataUpdate, { isLoading: isSubmitting, isSuccess, isError, error: submitError }] = useMcqDataUpdateMutation();
  const [updateMcqDataFinal, { isLoading: isUpdating }] = useUpdateMcqDataFinalMutation();

  // Fetch examiner's MCQ data from backend
  const { data: mcqDataFromBack, refetch: refetchMcqData } = useGetMcqDataBySubcodeFromTheBackQuery(
    { Eva_Id: userInfo.username },
    { skip: !userInfo.username }
  );


  useEffect(() => {
    if (error2) {
      console.error("Error fetching sub_master data: ", error2);
    }
  }, [error2]);

  useEffect(() => {
    if (mcqError) {
      console.error("Error fetching MCQ master data: ", mcqError);
    }
  }, [mcqError]);

  // Filter data where mcq_flg is "Y", Eva_Id matches current user, and mcq_updates is not 'Y'
  const filteredMcqData = useMemo(() => {
    if (!SubCodedata?.data || !Array.isArray(SubCodedata.data)) return [];
    return SubCodedata.data.filter(item =>
      item.mcq_flg === "Y" &&
      item.Eva_Id == Eva_id &&
      item.mcq_updates !== 'Y'
    );
  }, [SubCodedata, Eva_id]);


  // Group MCQ data by subcode and check completion status
  const subcodeDataMap = useMemo(() => {
    const map = new Map();
    if (mcqDataFromBack?.data && Array.isArray(mcqDataFromBack.data)) {
      mcqDataFromBack.data.forEach(item => {
        if (!map.has(item.Subcode)) {
          map.set(item.Subcode, {
            data: [],
            count: 0,
            isComplete: false
          });
        }
        const subcodeInfo = map.get(item.Subcode);
        subcodeInfo.data.push(item);
        subcodeInfo.count = subcodeInfo.data.length;
      });
    }
    return map;
  }, [mcqDataFromBack]);

  // Check completion status for each subcode
  const isSubcodeComplete = useCallback((subcode) => {
    const subcodeInfo = subcodeDataMap.get(subcode);
    if (!subcodeInfo) return false;

    const expectedCount = filteredMcqData.find(item => item.Subcode === subcode)?.mcq_qst;
    return expectedCount && subcodeInfo.count === parseInt(expectedCount);
  }, [subcodeDataMap, filteredMcqData]);

  // Build options for react-select - only show subcodes that haven't been fully completed
  const subcodeOptions = useMemo(() =>
    filteredMcqData
      .filter(item => !isSubcodeComplete(item.Subcode))
      .map(item => ({
        value: item.Subcode,
        label: `${item.Subcode} - ${item.SUBNAME}`
      }))
    , [filteredMcqData, isSubcodeComplete]);

  // Derive selected subcode from options - automatically updates when options change
  const autoSelectedSubcode = useMemo(() => {
    if (subcodeOptions.length === 0) return null;
    return subcodeOptions[0];
  }, [subcodeOptions]);

  const [selectedSubcode, setSelectedSubcode] = useState(null);

  // Initialize selected subcode only once
  useEffect(() => {
    if (selectedSubcode === null && autoSelectedSubcode !== null) {
      setSelectedSubcode(autoSelectedSubcode);
    }
  }, []);

  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  // Get selected subcode full data
  const selectedSubcodeData = useMemo(() =>
    filteredMcqData.find(item => item.Subcode === selectedSubcode?.value)
    , [filteredMcqData, selectedSubcode]);

  // Get number of MCQ questions
  const mcqQuestionCount = selectedSubcodeData?.mcq_qst ? parseInt(selectedSubcodeData.mcq_qst) : 0;

  // Helper function to format answer labels with spaces
  const formatAnswerLabel = (label) => {
    if (!label) return label;
    
    // Don't format if it's a single letter (A, B, C, D)
    if (label.length === 1) return label;
    
    // Don't format if it contains special keywords or parentheses (like "ALL CORRECT (ABCD)" or "INVALID QUESTION")
    if (label.includes('(') || label.includes('CORRECT') || label.includes('INVALID') || label.includes('NOT ATTEND')) {
      return label;
    }
    
    // For multi-letter combinations (like ACD, ABC, BCD, etc.), add spaces between letters
    // Check if it's all uppercase letters
    if (/^[A-Z]+$/.test(label) && label.length > 1) {
      return label.split('').join(' ');
    }
    
    return label;
  };

  // Build answer options from mcqData
  const answerOptions = useMemo(() => {
    if (!mcqData?.data || !Array.isArray(mcqData.data)) return [];
    return mcqData.data.map(item => ({
      value: item.ans_Mas,
      label: formatAnswerLabel(item.ans_Des)
    }));
  }, [mcqData]);


  // State to store answers for each question
  const [answers, setAnswers] = useState({});

  // Load existing answers for the selected subcode
  const loadedAnswers = useMemo(() => {
    if (!selectedSubcode?.value || !subcodeDataMap.has(selectedSubcode.value)) {
      return {};
    }
    
    const subcodeInfo = subcodeDataMap.get(selectedSubcode.value);
    const existingAnswers = {};
    
    subcodeInfo.data.forEach(item => {
      existingAnswers[item.Qst_Number] = {
        answer: item.Qst_Ans,
        description: item.Qst_Remarks || ''
      };
    });
    
    return existingAnswers;
  }, [selectedSubcode, subcodeDataMap]);

  // Initialize answers when subcode changes
  useEffect(() => {
    setAnswers(loadedAnswers);
  }, [selectedSubcode?.value]);

  // Handle subcode selection change
  const handleSubcodeChange = useCallback((option) => {
    setSelectedSubcode(option);
  }, []);

  // Handle answer change
  const handleAnswerChange = useCallback((questionNum, field, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionNum]: {
        ...prev[questionNum],
        [field]: value
      }
    }));
  }, []);

  // Check if ALL questions are answered with descriptions
  const areAllQuestionsAnswered = useMemo(() => {
    if (mcqQuestionCount === 0) return false;
    for (let i = 1; i <= mcqQuestionCount; i++) {
      if (!answers[i]?.answer || !answers[i]?.description?.trim()) {
        return false;
      }
    }
    return true;
  }, [answers, mcqQuestionCount]);

  // Handle submit
  const handleSubmit = async () => {
    if (!areAllQuestionsAnswered) {
      alert('Please answer all questions before submitting!');
      return;
    }

    const formattedData = [];
    for (let i = 1; i <= mcqQuestionCount; i++) {
      formattedData.push({
        Qst_Number: i,
        Qst_Ans: answers[i]?.answer,
        Qst_Remarks: answers[i]?.description || '',
        Eva_Id: Eva_id,
        Subcode: selectedSubcode?.value,
        SubName: filteredMcqData.find(item => item.Subcode === selectedSubcode?.value)?.SUBNAME || '',
        Dep_Name: Dep_Name,
        Eva_Month: filteredMcqData.find(item => item.Subcode === selectedSubcode?.value)?.Eva_Mon_Year || ''
      });
    }


    const previousAnswers = { ...answers };

    try {
      setAnswers({});

      const result = await mcqMasterDataUpdate({ answers: formattedData }).unwrap();

      await refetchMcqData();

      // Auto-select next available subcode after successful submission
      if (autoSelectedSubcode) {
        setSelectedSubcode(autoSelectedSubcode);
      }

      alert(`Answer key submitted successfully!\nCreated: ${result.created}\nSkipped: ${result.skipped} (already exists)`);

    } catch (err) {
      console.error('Submit failed:', err);
      setAnswers(previousAnswers);
      alert(`Submission failed: ${err?.data?.message || 'Unknown error'}`);
    }
  };

  // Handle confirm submission modal open
  const handleOpenConfirmModal = (subcode, subname) => {
    setConfirmData({ subcode, subname });
    setShowConfirmModal(true);
  };

  // Handle final confirmation submission
  const handleFinalConfirmation = async () => {
    if (!confirmData) return;

    try {
      const result = await updateMcqDataFinal({
        Subcode: confirmData.subcode,
        Eva_Id: Eva_id
      }).unwrap();


      setShowConfirmModal(false);

      alert(`Answer key for ${confirmData.subname} has been confirmed and submitted successfully!`);

      await Promise.all([
        refetchMcqData(),
        refetch()
      ]);


    } catch (err) {
      console.error('Final confirmation failed:', err);
      alert(`Confirmation failed: ${err?.data?.message || 'Unknown error'}`);
    }
  };

  return (
    <UploadPageLayout
        mainTopic="MCQ AnswerKey Dashboard"
        subTopic="Manage and review MCQ answer keys for assigned subjects"
        cardTitle="Answer Key Details"
      >
        <Row>
          <Col xs={12} className="mb-4">
            <Card style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: '24px' }}>
              <Card.Body style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1e3a6e', whiteSpace: 'nowrap', marginBottom: 0 }}>
                    Select Subject:
                  </label>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    {subcodeOptions.length > 0 ? (
                      <Select
                        options={subcodeOptions}
                        value={selectedSubcode}
                        onChange={handleSubcodeChange}
                        placeholder="Select a subcode..."
                        isSearchable
                        menuPortalTarget={document.body}
                        styles={{
                          control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#dee2e6', boxShadow: 'none', '&:hover': { borderColor: '#2a5298' } }),
                          option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? '#e8edf7' : '#fff', color: '#333' }),
                          singleValue: (base) => ({ ...base, color: '#1e3a6e', fontWeight: '500' }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                    ) : (
                      <div style={{ padding: '12px', background: '#d1e7dd', borderRadius: '8px', color: '#0f5132', fontWeight: '500' }}>
                        All subjects have been submitted ✓
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <div style={{ width: '100%' }}>
          <style>{`
            .custom-scroll::-webkit-scrollbar { width: 6px; }
            .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
            .custom-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
            .custom-scroll::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
            .smooth-transition { transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out; }
            .fade-in { animation: fadeIn 0.3s ease-in-out; }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          {/* Top section: Question Paper (left) + Answer Key Entry (right) */}
          <Row className="g-3 mb-3">
            {/* Left: View Question Paper */}
            <Col md={5}>
              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: 'none', height: '600px', display: 'flex', flexDirection: 'column' }}>
                <Card.Header style={{ background: 'linear-gradient(135deg, #1e3a6e, #2a5298)', color: '#fff', borderRadius: '12px 12px 0 0', padding: '16px 20px', fontWeight: '600', fontSize: '1rem', flexShrink: 0 }}>
                  Question Paper
                </Card.Header>
                <Card.Body className="custom-scroll" style={{ overflowY: 'auto', padding: '20px', flex: 1, minHeight: 0 }}>
                  {selectedSubcode?.value ? (
                    <QuestionPaperShow subcode={selectedSubcode?.value} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <p className="text-muted" style={{ fontSize: '0.95rem' }}>
                        No pending subjects to display
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Right: Enter Answer Key */}
            <Col md={7}>
              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: 'none', height: '600px', display: 'flex', flexDirection: 'column' }}>
                <Card.Header style={{ background: 'linear-gradient(135deg, #1e6e3a, #2a9852)', color: '#fff', borderRadius: '12px 12px 0 0', padding: '16px 20px', fontWeight: '600', fontSize: '1rem', flexShrink: 0 }}>
                  Enter Answer Key
                </Card.Header>
                <Card.Body
                  key={selectedSubcode?.value || 'no-selection'}
                  className="custom-scroll"
                  style={{ overflowY: 'auto', padding: '20px', flex: 1, minHeight: 0 }}
                >
                  {!selectedSubcode ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
                      <span style={{ fontSize: '2rem', color: '#198754' }}>✓</span>
                      <p className="text-success mb-0" style={{ fontSize: '1rem', fontWeight: '500' }}>
                        All answer keys have been submitted
                      </p>
                    </div>
                  ) : mcqQuestionCount > 0 ? (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {Array.from({ length: mcqQuestionCount }, (_, index) => {
                        const questionNum = index + 1;
                        return (
                          <Card key={questionNum} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            <Card.Body style={{ padding: '16px' }}>
                              {/* Question Number */}
                              <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1e3a6e' }}>
                                  Question {questionNum}
                                </label>
                              </div>

                              {/* Horizontal layout: Select on left, Description on right */}
                              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                {/* Left: Answer Select */}
                                <div style={{ flex: '0 0 280px' }}>
                                  <label style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px', display: 'block' }}>
                                    Answer:
                                  </label>
                                  <Select
                                    options={answerOptions}
                                    value={answerOptions.find(opt => opt.value === answers[questionNum]?.answer) || null}
                                    onChange={(option) => handleAnswerChange(questionNum, 'answer', option?.value)}
                                    placeholder="Select..."
                                    isClearable
                                    menuPortalTarget={document.body}
                                    styles={{
                                      control: (base) => ({ ...base, borderRadius: '6px', fontSize: '0.9rem', minHeight: '42px' }),
                                      option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? '#e8edf7' : '#fff', fontSize: '0.9rem' }),
                                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                  />
                                </div>

                                {/* Right: Description Input */}
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px', display: 'block' }}>
                                    Description: <span style={{ color: '#dc3545' }}>*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Add description or remarks..."
                                    value={answers[questionNum]?.description || ''}
                                    onChange={(e) => handleAnswerChange(questionNum, 'description', e.target.value)}
                                    style={{ fontSize: '0.85rem', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dee2e6', minHeight: '42px' }}
                                    required
                                  />
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        );
                      })}

                      {/* Submit Button */}
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', gap: '12px', alignItems: 'center' }}>
                        <Button
                          onClick={handleSubmit}
                          disabled={!areAllQuestionsAnswered || isSubmitting}
                          style={{
                            background: (areAllQuestionsAnswered && !isSubmitting) ? 'linear-gradient(135deg, #1e6e3a, #2a9852)' : '#ccc',
                            border: 'none',
                            padding: '12px 32px',
                            fontWeight: '600',
                            borderRadius: '8px',
                            cursor: (areAllQuestionsAnswered && !isSubmitting) ? 'pointer' : 'not-allowed',
                            opacity: (areAllQuestionsAnswered && !isSubmitting) ? 1 : 0.6
                          }}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Answer Key'}
                        </Button>
                        {!areAllQuestionsAnswered && (
                          <span style={{ color: '#dc3545', fontSize: '0.85rem', fontWeight: '500' }}>
                            All {mcqQuestionCount} questions must be answered with descriptions to submit
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted text-center" style={{ fontSize: '0.95rem' }}>
                      No questions available for this subject.
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Bottom: Status card spanning full width */}
          <Row>
            <Col xs={12}>
              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: 'none' }}>
                <Card.Header style={{ background: 'linear-gradient(135deg, #4a1e6e, #7a2a98)', color: '#fff', borderRadius: '12px 12px 0 0', padding: '16px 20px', fontWeight: '600', fontSize: '1rem' }}>
                  Status
                </Card.Header>
                <Card.Body style={{ padding: '20px' }}>
                  {isSubmitting && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span style={{ color: '#0d6efd', fontWeight: '500', fontSize: '0.95rem' }}>
                        Submitting answer key...
                      </span>
                    </div>
                  )}
                  {isSuccess && !isSubmitting && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <span style={{ color: '#198754', fontSize: '1.2rem' }}>✓</span>
                      <span style={{ color: '#198754', fontWeight: '500', fontSize: '0.95rem' }}>
                        Answer key submitted successfully!
                      </span>
                    </div>
                  )}
                  {isError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <span style={{ color: '#dc3545', fontSize: '1.2rem' }}>✗</span>
                      <span style={{ color: '#dc3545', fontWeight: '500', fontSize: '0.95rem' }}>
                        Submission failed: {submitError?.data?.message || 'Unknown error'}
                      </span>
                    </div>
                  )}

                  {/* Data Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table table-hover" style={{ marginBottom: 0 }}>
                      <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        <tr>
                          <th style={{ padding: '12px', fontWeight: '600', fontSize: '0.9rem', color: '#e0e0e0' }}>Subcode</th>
                          <th style={{ padding: '12px', fontWeight: '600', fontSize: '0.9rem', color: '#e0e0e0' }}>Subject Name</th>
                          <th style={{ padding: '12px', fontWeight: '600', fontSize: '0.9rem', color: '#e0e0e0', textAlign: 'center' }}>Status</th>
                          <th style={{ padding: '12px', fontWeight: '600', fontSize: '0.9rem', color: '#e0e0e0', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMcqData.map((item, index) => {
                          const subcodeInfo = subcodeDataMap.get(item.Subcode);
                          const isComplete = isSubcodeComplete(item.Subcode);
                          const expectedCount = parseInt(item.mcq_qst || 0);
                          const enteredCount = subcodeInfo?.count || 0;

                          return (
                            <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                              <td style={{ padding: '12px', fontSize: '0.9rem', color: '#212529', fontWeight: '500' }}>{item.Subcode}</td>
                              <td style={{ padding: '12px', fontSize: '0.9rem', color: '#495057' }}>{item.SUBNAME}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                {isComplete ? (
                                  <span style={{ color: '#198754', fontSize: '0.85rem', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>✓</span> Entered
                                  </span>
                                ) : enteredCount > 0 ? (
                                  <span style={{ color: '#ffc107', fontSize: '0.85rem', fontWeight: '500' }}>
                                    In Progress ({enteredCount}/{expectedCount})
                                  </span>
                                ) : (
                                  <span style={{ color: '#6c757d', fontSize: '0.85rem', fontWeight: '500' }}>Not Entered</span>
                                )}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                {isComplete ? (
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <McqAnswerKeyPdfDownload
                                      data={subcodeInfo?.data || []}
                                      subcode={item.Subcode}
                                      filename={`MCQ_AnswerKey_${item.Subcode}_${item.SUBNAME.replace(/\s+/g, '_')}.pdf`}
                                    />
                                    <Button
                                      size="sm"
                                      variant="success"
                                      style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                      onClick={() => handleOpenConfirmModal(item.Subcode, item.SUBNAME)}
                                    >
                                      Confirm Submit
                                    </Button>
                                  </div>
                                ) : (
                                  <span style={{ color: '#adb5bd', fontSize: '0.85rem' }}>-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          show={showConfirmModal}
          onHide={() => setShowConfirmModal(false)}
          onConfirm={handleFinalConfirmation}
          title="Confirm Final Submission"
          message={`Are you sure you want to confirm the final submission for ${confirmData?.subname || 'this subject'}? This action cannot be undone.`}
          confirmText="Yes, Confirm"
          cancelText="Cancel"
          confirmVariant="success"
          isLoading={isUpdating}
        />
      </UploadPageLayout>
  )
}

export default McqOperationData
