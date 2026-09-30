import React, { useState, useEffect, useRef } from 'react'
import { Form, Row, Col, Button, Modal } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'
import { markInpInfo, markInpInfoRemove } from '../../redux-slice/markApiSlice'
import { useMarkPassageMutation } from '../../redux-slice/markPassageSlice'
import markCalulation from '../../hooks/ValuationHook/ValuationMarkCalculation'
import ValuationRemarksModal from '../modals/ValuationRemarksModal'
import { useGetExaminerValuetionDataMutation, useSendFrontendFinalizedDataMutation } from '../../redux-slice/valuationApiSlice'
import { setExaminerValuationData } from '../../redux-slice/examinerValuationSlice'
import '../../style/design/val_right.css'
import { FaArrowCircleDown } from "react-icons/fa";
import { MdOutlineSaveAlt, MdArrowBackIos } from "react-icons/md";
import { BiMessageRoundedDetail } from "react-icons/bi";
import { IoIosSave } from "react-icons/io";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";

const ValuationChiefRight = ({ questionMain, barcodeData, viewedCount = 0, totalCount = 0, currentPage, imgNumber, end_image, responseDataFromValuation, onFinalizationComplete, onMarksUpdate, basicData }) => {
    const [markPassage, isLoading3] = useMarkPassageMutation();
    const questionPaperInfo = questionMain;
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const navigate = useNavigate();

    const userInfo = useSelector(state => state.auth?.userInfo);
    const questiData = useSelector(state => state.valuaton_Data_basic?.valuationData);
    const dataChield = useSelector(state => state.valuaton_Data_basic?.chiefValuationBarcodeData);
    const markInputs = useSelector((state) => state.mark_giver_info.markInpInfo);
    const examinerStored = useSelector((state) => state.examiner_valuation?.examinerData);

    const Examiner_type = userInfo?.selected_role;

    let userroleData = userInfo?.role;
    userroleData = userroleData.split(',');

    const userExaminer = userInfo?.selected_role;

    // State for dynamic column count
    const [columnCount, setColumnCount] = useState(5);
    const containerRef = useRef(null);
    const dispatch = useDispatch();

    const [sendFrontendFinalizedData, isLoadingFinalized] = useSendFrontendFinalizedDataMutation();

    const [keyStatus, onKeyStatus] = useState();
    const [inputText, setInputText] = useState('');
    const [totalMarks, setTotalMarks] = useState(0);
    const [subcodeName, setSubcodeName] = useState('');
    const [deptName, setDeptName] = useState('');
    const [showFinalizationModal, setShowFinalizationModal] = useState(false);
    const [finalizationData, setFinalizationData] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorData, setErrorData] = useState(null);

    const validSubstri = deptName ? deptName.substring(1, 2) : '';
    const markValuePattern = /^\d+(\.5)?$/;
    const markInProgressPattern = /^\d+\.$/;
    const isValidMarkValue = (value) => markValuePattern.test(value);
    const isInProgressMarkValue = (value) => markInProgressPattern.test(value);

    const bgColors = [
        "forestgreen",
        "tomato",
        "mediumblue",
        "pink",
        "blue",
        "white",
        "black",
    ];
    const bgColors1 = [
        "cornsilk",
        "#f5f5f5",
        "antiquewhite",
        "pink",
        "blue",
        "white",
        "black",
    ];
    const textcolor = [
        "white",
        "red",
        "white",
    ];

    const handleKeyStatus = (event) => {
        onKeyStatus(event.key);
        return keyStatus;
    };

    const deleteDispatch = () => {
        dispatch(markInpInfoRemove());
        navigate('/valuation/chief-valuation-review');
    };
    const newDestructe = barcodeData || {};
    const Dep_Name = newDestructe?.data?.Dep_Name || userInfo?.department;
    React.useEffect(() => {
        if (Dep_Name) setDeptName(Dep_Name);
    }, [Dep_Name]);

    const initializeFormData = () => {
        if (questionMain?.Valid_Question && questionMain?.Valid_Section) {
            return questionMain.Valid_Question.map(question => {
                // Filter Valid_Section rows that fall within this section's range
                const sectionRows = questionMain.Valid_Section.filter(
                    section => section.qstn_num >= question.FROM_QST && section.qstn_num <= question.TO_QST
                );

                // Build unique keys including sub_section and add_sub_section so subsections are preserved
                const uniqueMap = new Map();
                sectionRows.forEach(r => {
                    const key = `${r.qstn_num}:::${r.sub_section || ''}:::${r.add_sub_section || ''}`;
                    if (!uniqueMap.has(key)) uniqueMap.set(key, r);
                });

                const questions = Array.from(uniqueMap.entries()).map(([key, q]) => ({
                    // id stores composite key so we can identify subsection rows uniquely
                    id: key,
                    // user-facing label: e.g., "1-a" or "1-a-1" when subsections exist
                    label: `${q.qstn_num}${q.sub_section ? '-' + q.sub_section : ''}${q.add_sub_section ? '-' + q.add_sub_section : ''}`,
                    value: '',
                    maxMark: q.max_mark ? parseFloat(q.max_mark) : null,
                    type: 'n'
                }));

                return {
                    partName: `Part ${question.SECTION}`,
                    maxMarks: question.MARK_MAX,
                    section: question.SECTION,
                    questions
                };
            });
        }

        return [{
            partName: 'Part C',
            maxMarks: 20,
            section: 'C',
            questions: [
                { id: 1, value: '', type: 'n', maxMark: 20 },
                { id: 2, value: '', type: 'n', maxMark: 20 },
                { id: 3, value: '', type: 'n', maxMark: 20 },
                { id: 4, value: '', type: 'n', maxMark: 20 },
                { id: 5, value: '', type: 'n', maxMark: 20 },
                { id: 6, value: '', type: 'n', maxMark: 20 }
            ]
        }];
    };

    const [formData, setFormData] = useState(initializeFormData())
    const [showMaxMarkModal, setShowMaxMarkModal] = useState(false)
    const [maxMarkQuestionId, setMaxMarkQuestionId] = useState(null)
    const [fetchExaminerData] = useGetExaminerValuetionDataMutation();

    // Derived: are all input fields filled? (treat 'n' as filled)
    const allInputsFilled = React.useMemo(() => {
        const questions = formData.flatMap(part => part.questions);
        if (!questions || questions.length === 0) return false;
        return questions.every(q => {
            if (q.value === 'n') return true;
            if (q.value === '' || q.value === null || q.value === undefined) return false;
            return isValidMarkValue(String(q.value));
        });
    }, [formData]);

    // Calculate total marks from formData
    const totalMarksScored = React.useMemo(() => {
        let total = 0;
        formData.forEach(part => {
            part.questions.forEach(question => {
                const val = question.value;
                if (val !== '' && val !== 'n' && val !== null && val !== undefined) {
                    if (isValidMarkValue(String(val))) {
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal)) total += numVal;
                    }
                }
            });
        });
        return total;
    }, [formData]);

    // Send marks update to parent whenever totalMarksScored changes
    React.useEffect(() => {
        if (onMarksUpdate) {
            onMarksUpdate(totalMarksScored);
        }
    }, [totalMarksScored, onMarksUpdate]);

    // Dynamic column count based on container width
    React.useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const width = entry.contentRect.width;
              
                if (width < 50) {
                    setColumnCount(1);
                }
                else if (width < 150) {
                    setColumnCount(2);
                } else if (width < 250) {
                    setColumnCount(3);
                } else if (width < 350) {
                    setColumnCount(4);
                } else if (width < 450) {
                    setColumnCount(5);
                } else if (width < 600) {
                    setColumnCount(6);
                } else if (width < 650) {
                    setColumnCount(7);
                }
                else if (width < 750) {
                    setColumnCount(8);
                }
                else {
                    setColumnCount(10);
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Update formData whenever questionMain changes
    React.useEffect(() => {
        const initialData = initializeFormData();

        // If there's saved response data, restore the values
        if (responseDataFromValuation?.data && Array.isArray(responseDataFromValuation.data)) {
            // Create a map of sec_id to saved data for quick lookup
            const savedDataMap = {};
            responseDataFromValuation.data.forEach(item => {
                savedDataMap[item.sec_id] = item;
            });

            const restoreFormData = initialData.map(part => ({
                ...part,
                questions: part.questions.map(question => {
                    // Extract question number from id (format: "qnum:::sub_section:::add_sub_section")
                    const [qnumStr, sub_section = '', add_sub_section = ''] = String(question.id).split(':::');
                    const qnum = Number(qnumStr);

                    // Find the Valid_Section data for this question to get its database id
                    const sectionData = questionMain?.Valid_Section?.find(
                        section => Number(section.qstn_num) === qnum &&
                            (section.sub_section || '') === (sub_section || '') &&
                            (section.add_sub_section || '') === (add_sub_section || '')
                    );

                    // If we have the section database id, look up the saved data using sec_id
                    if (sectionData && sectionData.id && savedDataMap[sectionData.id]) {
                        const savedData = savedDataMap[sectionData.id];
                        // Restore the saved mark value (preserve decimals as strings)
                        return {
                            ...question,
                            value: savedData.Marks_Get === 'NA' ? 'n' : String(savedData.Marks_Get || '')
                        };
                    }

                    return question;
                })
            }));

            setFormData(restoreFormData);
        } else {
            setFormData(initialData);
        }
    }, [questionMain, responseDataFromValuation])

    // Fetch CHIEF examiner's own valuation data (Examiner_type = 2) to continue where they left off
    React.useEffect(() => {
        const subcode = subcodeName || newDestructe?.data?.subcode;
        const barcode = newDestructe?.data?.barcode;
        // Get the CHIEF examiner's ID (600309)
        const chiefExaminerId = userInfo?.username || dataChield?.Examiner_Id;
        // Calculate valuation_type directly from Dep_Name
        const depName = newDestructe?.data?.Dep_Name || userInfo?.department;
        const valuationType = depName ? depName.substring(1, 2) : '';

        if (!subcode || !barcode || !chiefExaminerId || !valuationType) return;

        (async () => {
            try {
                const body = {
                    subcode,
                    Eva_Id: chiefExaminerId, // Get chief examiner's (600309) data
                    valuation_type: valuationType,
                    barcode,
                    Dep_Name: depName,
                    Examiner_type: Examiner_type // Fetch Examiner_type = 2 (chief's own corrections)
                };

                const res = await fetchExaminerData(body).unwrap();
                if (res && res.data) {
                    dispatch(setExaminerValuationData(res.data));
                }
            } catch (e) {
                // ignore fetch errors here; existing flow still works with local inputs
                console.error('Failed to fetch examiner valuation data', e);
            }
        })();
    }, [subcodeName, newDestructe?.data?.barcode, userInfo?.username, dataChield?.Examiner_Id, newDestructe?.data?.Dep_Name, userInfo?.department]);

    const handleInputChange = (questionId, newValue) => {
        const question = formData
            .flatMap(part => part.questions)
            .find(q => q.id === questionId);

        const maxMark = question?.maxMark;

        // parse composite id: "qstn_num:::sub_section:::add_sub_section"
        const [qnumStr, sub_section = '', add_sub_section = ''] = String(questionId).split(':::');
        const qnum = Number(qnumStr);

        // Find section data for this question (match sub_section/add_sub_section)
        const sectionData = questionMain?.Valid_Section?.find(
            section => Number(section.qstn_num) === qnum && (section.sub_section || '') === (sub_section || '') && (section.add_sub_section || '') === (add_sub_section || '')
        );

        // Find the part this question belongs to
        const part = formData.find(p => p.questions.some(q => q.id === questionId));

        // Get department name from questiData and compare subcodes
        let departmentName = '';
        const Qbs_Page_No = '50';
        if (questiData?.Valid_Question && questiData.Valid_Question.length > 0) {

            const questionDataEntry = questiData.Valid_Question.find(
                q => q.SUBCODE === sectionData?.sub_code && q.Dep_Name
            );


            if (questionDataEntry) {
                departmentName = questionDataEntry.Dep_Name;
                // setDeptName(departmentName);
            }
        }





        setSubcodeName(sectionData?.sub_code || '');


        // Helper function to dispatch to Redux and update backend
        const dispatchMarkData = async (value) => {
            if (sectionData) {
                const markData = {
                    id: sectionData.id,
                    sub_code: sectionData.sub_code,
                    Dep_Name: departmentName || sectionData.Dep_Name || userInfo?.department,
                    subcode_raw: sectionData.subcode_raw || null,
                    qstn_num: qnum,
                    max_mark: maxMark?.toString() || sectionData.max_mark,
                    valid_qstn: sectionData.valid_qstn || null,
                    section: sectionData.section || part?.section,
                    sub_section: sectionData.sub_section || '',
                    add_sub_section: sectionData.add_sub_section || '',
                    Eva_Mon_Year: sectionData.Eva_Mon_Year || 'Jan-2026',
                    BL_Point: sectionData.BL_Point || '1',
                    CO_Point: sectionData.CO_Point || '1',
                    PO_Point: sectionData.PO_Point || '10',
                    createdAt: sectionData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    Mark: value === 'n' ? 'NA' : value
                };

                try {

                    const responde = {
                        barcode: barcodeData?.data?.barcode || '',
                        subcode: sectionData.sub_code || '',
                        Eva_Id: dataChield?.Examiner_Id || basicData?.Examiner_Id || '',
                        evid_ce: userInfo?.username || dataChield?.Evaluator_Id || basicData?.Eva_Id || '',
                        sec_id: sectionData.id || '',
                        page_no: Qbs_Page_No || currentPage || '',
                        Qbs_Page_No: currentPage,
                        Dep_Name: departmentName || sectionData.Dep_Name || '',
                        Marks_Get: value === 'n' ? 'NA' : value,
                        section: sectionData.section || part?.section || '',
                        sub_section: sectionData.sub_section || '',
                        add_sub_section: sectionData.add_sub_section || '',
                        max_marks: sectionData.max_mark || '',
                        qbno: String(qnum),
                        Eva_Mon_Year: sectionData.Eva_Mon_Year || '',
                        valuation_type: validSubstri,
                        Examiner_type: Examiner_type || '',
                        BL_Point: sectionData.BL_Point || "1",
                        CO_Point: sectionData.CO_Point || "1",
                        PO_Point: sectionData.PO_Point || "1"
                    }



                    // Send to backend immediately
                    const responseMarkPassage = await markPassage(responde).unwrap();



                    // Update local Redux state
                    dispatch(markInpInfo(markData));

                    // Fetch fresh CHIEF examiner data (Examiner_type = 2) after saving
                    const subcode = subcodeName || newDestructe?.data?.subcode;
                    const barcode = newDestructe?.data?.barcode;
                    const chiefExaminerId = userInfo?.username;
                    if (subcode && barcode && chiefExaminerId) {
                        const body = {
                            subcode,
                            Eva_Id: chiefExaminerId,
                            valuation_type: validSubstri,
                            barcode,
                            Dep_Name: departmentName || sectionData.Dep_Name || userInfo?.department,
                            Eva_Mon_Year: sectionData.Eva_Mon_Year || 'Nov_2025',
                            Examiner_type: Examiner_type || '' // Fetch chief's own saved data
                        };


                        
                        const res = await fetchExaminerData(body).unwrap();
                        

                        if (res && res.data) {
                            dispatch(setExaminerValuationData(res.data));
                        }
                    }

                } catch (e) {
                    console.error('Error saving mark data:', e);
                }
            }
        };

        // Check if user entered N or NA
        if (newValue.toUpperCase() === 'N' || newValue.toUpperCase() === 'NA') {
            setFormData(prev =>
                prev.map(part => ({
                    ...part,
                    questions: part.questions.map(q =>
                        q.id === questionId ? { ...q, value: 'n' } : q
                    )
                }))
            );
            dispatchMarkData('n');
            return;
        }

        // If maxMark is defined, validate numeric input
        if (maxMark !== null && maxMark !== undefined) {
            if (newValue === '' || isInProgressMarkValue(newValue)) {
                setFormData(prev =>
                    prev.map(part => ({
                        ...part,
                        questions: part.questions.map(q =>
                            q.id === questionId ? { ...q, value: newValue } : q
                        )
                    }))
                );
                return;
            }

            if (!isValidMarkValue(newValue)) {
                return;
            }

            const numValue = parseFloat(newValue);

            // Show modal if trying to enter a value higher than max mark
            if (newValue !== '' && numValue > maxMark) {
                setMaxMarkQuestionId(questionId);
                setShowMaxMarkModal(true);
                return; // Don't update the value
            }

            // Allow empty value or values within range (only numbers)
            if (!isNaN(numValue) && numValue >= 0 && numValue <= maxMark) {
                setFormData(prev =>
                    prev.map(part => ({
                        ...part,
                        questions: part.questions.map(q =>
                            q.id === questionId ? { ...q, value: newValue } : q
                        )
                    }))
                );
                dispatchMarkData(newValue);
            }
        } else {
            if (newValue === '' || isInProgressMarkValue(newValue)) {
                setFormData(prev =>
                    prev.map(part => ({
                        ...part,
                        questions: part.questions.map(q =>
                            q.id === questionId ? { ...q, value: newValue } : q
                        )
                    }))
                );
                return;
            }

            if (!isValidMarkValue(newValue)) {
                return;
            }

            setFormData(prev =>
                prev.map(part => ({
                    ...part,
                    questions: part.questions.map(q =>
                        q.id === questionId ? { ...q, value: newValue } : q
                    )
                }))
            );
            dispatchMarkData(newValue);
        }
    }

    return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0', padding: '0', margin: '0' }}>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.4', paddingLeft: '0.5rem', paddingRight: '0.5rem', color: 'white', marginBottom: '1', padding: '0.5rem 0.5rem 0 0.5rem' }}>
                <div className='val_right_design_2'>
                    CHIEF EXAMINER VALUATION
                </div>
                <div className='val_right_design_3'>
                    <span className='val_right_text_1'>Name :</span>  {userInfo?.name || '—'} {userInfo?.username ? `(${userInfo.username})` : ''}
                    <br />
                    <span className='val_right_text_1'>Course Code & Title :</span>   {basicData?.sub_code || userInfo?.subcode || '—'} - {basicData?.sub_name}
                    <br />
                    <span className='val_right_text_1'>Dummy Number :</span>    {basicData?.barcode || '—'}
                    <br />
                </div>
            </div>
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                margin: 0,
                padding: 0,
                borderRadius: '0px',
                boxShadow: 'none',
                border: 'none',
                overflow: 'auto'
            }}>
                {formData.map((part, partIndex) => (
                    <div key={partIndex} style={{ marginBottom: '1rem' }}>
                        <div style={{
                            padding: '0.8rem 1rem',
                            backgroundColor: bgColors[partIndex % bgColors.length],
                            borderBottom: '1px solid #e9ecef',
                            margin: 0
                        }}>
                            <div style={{ marginBottom: '0' }}>
                                <Row >
                                    <Col>
                                        <span className='val_right_text_2' >
                                            <FaArrowCircleDown className='val_right_icon_1' /> {part.partName}
                                        </span>
                                    </Col>
                                    <Col>
                                        <span className='val_right_text_3' >
                                            Max Mark - {part.maxMarks}
                                        </span>
                                    </Col>
                                </Row>
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: bgColors1[partIndex % bgColors1.length],
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0.8rem',
                            gap: '0.6rem',
                            margin: 0
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columnCount}, 1fr)`, gap: '0.6rem' }}>
                                {part.questions.map(question => (
                                    <div key={question.id}>
                                        <div style={{ textAlign: 'center', marginBottom: '0.3rem', color: '#28a745', fontWeight: '600', fontSize: '0.95rem' }}>
                                            {question.label}
                                        </div>
                                        <Form.Group style={{ marginBottom: 0 }}>
                                            <Form.Control
                                                type="text"
                                                value={question.value === 'n' ? 'NA' : question.value}
                                                required
                                                aria-required="true"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const currentValue = question.value;

                                                    // If currently 'n' and user backspaces (shows 'N' or 'A'), clear it
                                                    if (currentValue === 'n' && (val === 'N' || val === 'A')) {
                                                        handleInputChange(question.id, '');
                                                    } else {
                                                        const upperVal = val.toUpperCase();
                                                        if (
                                                            val === '' ||
                                                            upperVal === 'N' ||
                                                            upperVal === 'NA' ||
                                                            isValidMarkValue(val) ||
                                                            isInProgressMarkValue(val)
                                                        ) {
                                                            handleInputChange(question.id, val);
                                                        }
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const val = e.target.value;
                                                    if (isInProgressMarkValue(val)) {
                                                        handleInputChange(question.id, val.slice(0, -1));
                                                    }
                                                }}
                                                style={{
                                                    textAlign: 'center',
                                                    minHeight: '2.3rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid #999',
                                                    backgroundColor: '#ffffff',
                                                    fontSize: '0.85rem',
                                                    padding: '0.3rem'
                                                }}
                                            />
                                        </Form.Group>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', margin: '0', width: '100%' }}>
                <Row style={{ gap: '0.75rem', display: 'flex', marginBottom: '0', width: '100%', margin: '0' }}>

                    <Col style={{ flex: 1, padding: '0' }}>
                        <Button
                            variant="success"
                            disabled={!(end_image - 2 <= currentPage && allInputsFilled)}
                            onClick={() => {
                                // Calculate marks and show preview modal only
                                const subcode = subcodeName || newDestructe?.data?.subcode;
                                const barcode = newDestructe?.data?.barcode;

                                if (subcode && barcode && userInfo?.username) {
                                    try {
                                        // Use examiner stored data if available, otherwise use local markInputs
                                        let source = examinerStored && Object.keys(examinerStored).length ? examinerStored : markInputs;

                                        // Compute marks
                                        const result = markCalulation(source, subcodeName, questiData);
                                        setCalculationResult(result);
                                        setTotalMarks(result);


                                        // Show preview modal
                                        setShowFinalizationModal(true);
                                    } catch (e) {
                                        console.error('Failed to calculate marks:', e);
                                    }
                                }
                            }}
                            style={{ width: '100%', height: '2.8rem', padding: '0', fontSize: '1rem', fontWeight: '600', borderRadius: '10px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        >
                            < MdOutlineSaveAlt />&nbsp;Save Progress
                        </Button>
                    </Col>

                    <Col style={{ flex: 1, padding: '0' }}>
                        <Button outline="true" variant="primary" style={{ width: '100%', height: '2.8rem', padding: '0', fontSize: '1rem', fontWeight: '600', borderRadius: '10px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={() => setShowRemarksModal(true)}>
                            <BiMessageRoundedDetail /> &nbsp; Malpractice
                        </Button>
                    </Col>
                    <Col style={{ flex: 1, padding: '0' }}>
                        <Button variant="danger" style={{ width: '100%', height: '2.8rem', padding: '0', fontSize: '1rem', fontWeight: '600', borderRadius: '10px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={() => deleteDispatch()}>
                            <MdArrowBackIos />  Back
                        </Button>
                    </Col>
                </Row>
            </div>

            <div className=' bg-warning d-flex justify-content-center align-items-center' style={{ height: '2rem', fontSize: '0.9rem', fontWeight: '600', color: 'black' }}>
                Dummy Number :  {newDestructe?.data?.barcode || '—'}
            </div>

            <Modal show={showMaxMarkModal} onHide={() => setShowMaxMarkModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#fff5f5', borderBottom: '3px solid #dc3545' }}>
                    <Modal.Title style={{ color: '#dc3545', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                        <span>Invalid Mark</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #ffc9c9' }}>
                        <p style={{ margin: 0, color: '#333' }}>
                            Question <strong style={{ color: '#dc3545', fontSize: '1.15rem' }}>{formData.flatMap(part => part.questions).find(q => q.id === maxMarkQuestionId)?.label || maxMarkQuestionId}</strong> cannot exceed the maximum mark of <strong style={{ color: '#dc3545', fontSize: '1.15rem' }}>{formData.flatMap(part => part.questions).find(q => q.id === maxMarkQuestionId)?.maxMark}</strong>
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', padding: '1rem 1.5rem' }}>
                    <Button 
                        variant="danger" 
                        onClick={() => setShowMaxMarkModal(false)}
                        style={{ 
                            padding: '0.5rem 2rem', 
                            fontWeight: '600', 
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(220, 53, 69, 0.2)'
                        }}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showFinalizationModal} onHide={() => setShowFinalizationModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title style={{ color: '#333', fontWeight: '600' }}>
                        Mark Preview Dummy Number : {newDestructe?.data?.barcode || '—'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {calculationResult && (
                        <div>
                            {/* Mark Scored Header */}
                            <div style={{
                                backgroundColor: '#0066cc',
                                color: 'white',
                                padding: '1rem',
                                borderRadius: '4px',
                                marginBottom: '1.5rem',
                                fontSize: '1.3rem',
                                fontWeight: 'bold',
                                textAlign: 'center'
                            }}>
                                Mark Scored : {calculationResult.Final_Marks}({calculationResult.Total_Rounded_Marks})
                            </div>

                            {/* Parts Display */}
                            {calculationResult?.QuestionValidStatus && (() => {
                                const questionsToDisplay = calculationResult.QuestionValidStatus || [];

                                // Create part groups using Valid_Question data
                                const partGroups = {};
                                if (questiData?.Valid_Question) {
                                    questiData.Valid_Question.forEach(question => {
                                        const partName = `Part ${question.SECTION}`;
                                        partGroups[partName] = {
                                            from: Number(question.FROM_QST || 0),
                                            to: Number(question.TO_QST || 0),
                                            section: question.SECTION,
                                            subSec: question.SUB_SEC,
                                            noqst: Number(question.NOQST || 0),
                                            mandatorty: (question.TO_QST - (question.FROM_QST - 1)) - Number(question.NOQST || 0),
                                            questions: []
                                        };
                                    });
                                }




                                // Assign questions to parts
                                questionsToDisplay.forEach(item => {
                                    for (const [partName, partData] of Object.entries(partGroups)) {
                                        if (item.qbno >= partData.from && item.qbno <= partData.to) {
                                            partData.questions.push(item);
                                            break;
                                        }
                                    }
                                });




                                // Sort each part's questions in ascending order by qbno
                                Object.values(partGroups).forEach(partData => {
                                    partData.questions.sort((a, b) => parseFloat(a.qbno) - parseFloat(b.qbno));
                                });

                                return Object.entries(partGroups).map(([partName, partData]) => {
                                    const items = partData.questions;
                                    const totalMarks = items.reduce((sum, item) => sum + (item.marks || 0), 0);

                                    return (
                                        <div key={partName} style={{
                                            border: '2px solid #28a745',
                                            borderRadius: '8px',
                                            marginBottom: '1.5rem',
                                            padding: '1rem',
                                            backgroundColor: '#f9fff9'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '1rem',
                                                paddingBottom: '0.75rem',
                                                borderBottom: '2px solid #28a745'
                                            }}>
                                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                                    <h5 style={{ margin: 0, color: '#d9534f', fontWeight: '600', fontSize: '1.1rem' }}>
                                                        {partName}
                                                    </h5>
                                                    <span style={{ color: '#666', fontWeight: '500', fontSize: '0.95rem' }}>
                                                        {(partData.subSec == 'ab' ? "Either a or b question   " : "") + (partData.subSec == 'ab' && partData.mandatorty ? " and " : "") + (partData.mandatorty != 0 ? `The mandatory questions are ${partData.noqst}` : ``)}
                                                    </span>
                                                </div>
                                                <span style={{ color: '#d9534f', fontWeight: '600', fontSize: '1.1rem' }}>
                                                    Mark : {totalMarks}
                                                </span>
                                            </div>

                                            {/* Questions Grid */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                                                gap: '0.75rem'
                                            }}>
                                                {items.map((item, idx) => {
                                                    const isValid = item.Qst_Valid === 'Y';

                                                    // Build the composite ID to match formData
                                                    const compositeId = `${item.qbno}:::${item.sub_section || ''}:::`;

                                                    // Find the exact matching question from formData
                                                    const matchingQuestion = formData
                                                        .flatMap(part => part.questions)
                                                        .find(q => {
                                                            const [qno, subSec] = q.id.split(':::');
                                                            return Number(qno) === item.qbno && (subSec || '') === (item.sub_section || '');
                                                        });

                                                    // Determine display value
                                                    let displayValue = item.marks;
                                                    if (matchingQuestion) {
                                                        displayValue = matchingQuestion.value === 'n' ? 'NA' : matchingQuestion.value;
                                                    }

                                                    // Build display label with sub_section if present
                                                    const displayLabel = item.sub_section ? `${item.qbno}-${item.sub_section}` : item.qbno;

                                                    return (
                                                        <div key={idx} style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '600', color: '#28a745' }}>
                                                                {displayLabel}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={displayValue}
                                                                readOnly
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.5rem',
                                                                    textAlign: 'center',
                                                                    border: isValid ? '2px solid #28a745' : '2px solid #dc3545',
                                                                    borderRadius: '4px',
                                                                    backgroundColor: 'white',
                                                                    fontWeight: '600',
                                                                    color: isValid ? '#28a745' : '#dc3545',
                                                                    cursor: 'default'
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowFinalizationModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={async () => {
                        const subcode = subcodeName || newDestructe?.data?.subcode;
                        const barcode = newDestructe?.data?.barcode;
                        const Dep_Name = newDestructe?.data?.Dep_Name || userInfo?.department;

                        if (subcode && barcode && userInfo?.username && calculationResult) {
                            try {
                                const evaMonYearFromValid = questionMain?.Valid_Question?.find(q => q.SUBCODE === subcode && q.Eva_Mon_Year)?.Eva_Mon_Year;
                                const evaMonYear = evaMonYearFromValid || newDestructe?.data?.Eva_Mon_Year || 'Nov_2025';
                                // Send finalization data to backend
                                const responseFinalization = await sendFrontendFinalizedData({
                                    barcode,
                                    subcode,
                                    Chief_Eva_Id: dataChield?.Evaluator_Id || basicData?.Eva_Id || userInfo?.username,
                                    Eva_Id: dataChield?.Examiner_Id || basicData?.Examiner_Id || '',
                                    Dep_Name,
                                    Eva_Mon_Year: evaMonYear,
                                    valuation_type: validSubstri,
                                    Examiner_type: Examiner_type,
                                    Final_Marks_Front: calculationResult.Final_Marks,
                                    Regular_Questions: calculationResult.Regular_Questions,
                                    AB_Questions: calculationResult.AB_Questions,
                                    Total_Rounded_Marks_Front: calculationResult.Total_Rounded_Marks,
                                }).unwrap();


                                // Check if backend validation passed
                                if (responseFinalization && responseFinalization.Mark_Error === false) {
                                    // Success - close modal and complete
                                    setShowFinalizationModal(false);
                                    if (onFinalizationComplete) {
                                        onFinalizationComplete();
                                    }
                                } else if (responseFinalization && responseFinalization.Mark_Error === true) {
                                    // Error - show error modal
                                    setShowFinalizationModal(false);
                                    setFinalizationData(responseFinalization);
                                    setErrorData(responseFinalization);
                                    setShowErrorModal(true);
                                }
                            } catch (e) {
                                console.error('Finalization failed:', e);
                                // Show error modal on exception
                                setShowFinalizationModal(false);
                                setErrorData({ message: 'Failed to submit finalization data. Please try again.' });
                                setShowErrorModal(true);
                            }
                        }
                    }}>
                        Final Submit
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ color: '#dc3545', fontWeight: '600' }}>
                        ✗ Server Error
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {errorData && (
                        <div style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #dc3545' }}>
                                <p style={{ color: '#dc3545', margin: '0.5rem 0', fontSize: '0.95rem', fontWeight: '500' }}>
                                    {errorData.message || 'An error occurred while processing your submission.'}
                                </p>
                                <p style={{ color: '#856404', margin: '1rem 0 0 0', fontSize: '0.9rem', backgroundColor: '#fff3cd', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
                                    <strong>SERVER ERROR PLEASE RESUBMIT.</strong>
                                </p>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={() => setShowErrorModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <ValuationRemarksModal
                show={showRemarksModal}
                handleClose={() => setShowRemarksModal(false)}
                barcodeData={barcodeData}
                basicData={basicData}
            />
        </div>
    )
}

export default ValuationChiefRight