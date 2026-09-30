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
import { MdArrowBackIos } from "react-icons/md";
import { BiMessageRoundedDetail, BiWifi } from "react-icons/bi";
import { MdOutlineSaveAlt } from "react-icons/md";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { FaArrowCircleDown } from "react-icons/fa";
import { IoIosSave } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useSubmitBarcodeValuationMutation } from '../../redux-slice/valuationLogoutApiSlice'
import { toast } from 'react-toastify'


const ValuationRight = ({ questionMain, barcodeData, viewedCount = 0, totalCount = 0, currentPage, imgNumber, end_image, responseDataFromValuation, onFinalizationComplete, onMarksUpdate, onModalStateChange, onRemarksModalStateChange, basicData, rejectionData, hideRejectionModal = false }) => {
    const [markPassage, isLoading3] = useMarkPassageMutation();

    const navigate = useNavigate();
    const [submitBarcodeValuation] = useSubmitBarcodeValuationMutation()

    // if (basicData?.barcode == null || basicData?.barcode == "") {
    //     navigate("/examiner/valuation-review");
    // }

    const questionPaperInfo = questionMain;
    const [showRemarksModal, setShowRemarksModal] = useState(false)
    const userInfo = useSelector(state => state.auth?.userInfo)
    const questiData = useSelector(state => state.valuaton_Data_basic?.valuationData)

    const markInputs = useSelector((state) => state.mark_giver_info.markInpInfo);
    const examinerStored = useSelector((state) => state.examiner_valuation?.examinerData);
    const Dashboard_Data = useSelector((state) => state.valuaton_Data_basic?.dashboardData);
    const monthyearInfo = useSelector((state) => state.auth.monthyearInfo);
    const activeRecords = Array.isArray(monthyearInfo) ? monthyearInfo.filter((m) => m.Month_Year_Status === 'Y') : [];
    const ExamMonth = [...new Set(activeRecords.map((m) => m.Eva_Month))].map((m) => ({ id: m, name: m }));
    const ExamYear = [...new Set(activeRecords.map((m) => m.Eva_Year))].map((y) => ({ id: y, name: y }));
    let userroleData = userInfo?.role;
    userroleData = userroleData.split(',')
    const userExaminer = userInfo?.selected_role;
    // State for dynamic column count
    const [columnCount, setColumnCount] = useState(5);
    const containerRef = useRef(null);
    const dispatch = useDispatch()
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
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [activeQuestion, setActiveQuestion] = useState(null); // { label, maxMark, section }

    // Auto-open rejection modal if there's rejection data (unless hideRejectionModal is true)
    useEffect(() => {
        if (rejectionData && rejectionData.isDataThere && !hideRejectionModal) {
            setShowRejectionModal(true);
        }
    }, [rejectionData, hideRejectionModal]);

    // Notify parent when modal state changes
    useEffect(() => {
        if (onModalStateChange) {
            onModalStateChange(showFinalizationModal);
        }
    }, [showFinalizationModal, onModalStateChange]);

    // Notify parent when remarks modal state changes
    useEffect(() => {
        if (onRemarksModalStateChange) {
            onRemarksModalStateChange(showRemarksModal);
        }
    }, [showRemarksModal, onRemarksModalStateChange]);
    const validSubstri = Dashboard_Data?.Eva_subject_dashboard;
    const markValuePattern = /^\d+(\.5)?$/;
    const markInProgressPattern = /^\d+\.$/;
    const isValidMarkValue = (value) => markValuePattern.test(value);
    const isInProgressMarkValue = (value) => markInProgressPattern.test(value);

    // Validation function to prevent multiple zeros and restrict to valid patterns
    const isValidInputPattern = (value) => {
        if (value === '') return true;
        // Prevent multiple digits starting with 0 (like 01, 00, 000, etc.)
        if (/^0\d+/.test(value)) return false;
        // Allow single digits 0-9 or two-digit numbers 10-99
        if (/^([0-9]|[1-9][0-9])$/.test(value)) return true;
        // Allow decimal patterns like 0.5, 1.5, ..., 99.5
        if (/^([0-9]|[1-9][0-9])(\.5)?$/.test(value)) return true;
        // Allow in-progress decimal entry like "1.", "10.", "99."
        if (/^([0-9]|[1-9][0-9])\.$/.test(value)) return true;
        return false;
    };
    const handleKeyStatus = (event) => {
        onKeyStatus(event.key);
        return keyStatus;
    }
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
    const deleteDispatch = () => {

                dispatch(markInpInfoRemove())
                navigate("/examiner/valuation-review")

        // submitBarcodeValuation({ basicData })
        //     .unwrap()
        //     .then(() => {

        //         dispatch(markInpInfoRemove())
        //         navigate("/examiner/valuation-review")
        //     })
        //     .catch((error) => {
        //         console.error('Error during barcode valuation submission:', error)
        //     });
    }
    // Safely handle possibly undefined `barcodeData`
    const newDestructe = barcodeData || {};
    const Dep_Name = newDestructe?.data?.Dep_Name || userInfo?.department;
    React.useEffect(() => {
        if (Dep_Name) setDeptName(Dep_Name);
    }, [Dep_Name]);
    // Initialize form data from Valid_Question and Valid_Section
    const initializeFormData = () => {
        if (questionMain?.Valid_Question && questionMain?.Valid_Section) {
            const partsArray = questionMain.Valid_Question.map(question => {
                // Filter Valid_Section rows that fall within this section's range
                const sectionRows = questionMain.Valid_Section.filter(
                    section => section.qstn_num >= question.FROM_QST && section.qstn_num <= question.TO_QST && section.section === question.SECTION
                );

                // Get compulsory question number if exists
                const compulsoryQst = question.C_QST ? parseInt(question.C_QST) : null;

                // Build unique keys including section, sub_section and add_sub_section so subsections are preserved
                const uniqueMap = new Map();
                sectionRows.forEach(r => {
                    const key = `${question.SECTION}:::${r.qstn_num}:::${r.sub_section || ''}:::${r.add_sub_section || ''}`;
                    if (!uniqueMap.has(key)) uniqueMap.set(key, r);
                });
                const questions = Array.from(uniqueMap.entries()).map(([key, q]) => {
                    const qstNum = parseInt(q.qstn_num);
                    const isCompulsory = compulsoryQst !== null && qstNum === compulsoryQst;
                    // Use the individual question's max_mark from Valid_Section
                    const questionMaxMark = parseFloat(q.max_mark);
                    return {
                        // id stores composite key so we can identify subsection rows uniquely (section:::qnum:::sub_section:::add_sub_section)
                        id: key,
                        // user-facing label: e.g., "1-a" or "1-a-1" when subsections exist
                        label: `${q.qstn_num}${q.sub_section ? '-' + q.sub_section : ''}${q.add_sub_section ? '-' + q.add_sub_section : ''}`,
                        value: '',
                        maxMark: questionMaxMark,
                        type: 'n',
                        isCompulsory: isCompulsory
                    };
                });


                return {
                    partName: `Part ${question.SECTION}`,
                    maxMarks: question.MARK_MAX,
                    section: question.SECTION,
                    compulsoryQst: compulsoryQst,
                    questions
                };
            });

            // Consolidate parts with the same section name
            const consolidatedParts = [];
            const sectionMap = new Map();

            partsArray.forEach(part => {
                if (sectionMap.has(part.section)) {
                    // Merge questions into existing part
                    const existingPart = sectionMap.get(part.section);
                    existingPart.questions.push(...part.questions);
                    // Keep compulsory question if it exists
                    if (part.compulsoryQst && !existingPart.compulsoryQst) {
                        existingPart.compulsoryQst = part.compulsoryQst;
                    }
                } else {
                    // New section, add to map
                    sectionMap.set(part.section, part);
                    consolidatedParts.push(part);
                }
            });

            return consolidatedParts;
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

    // Initial data fetch on component mount
    React.useEffect(() => {
        // Fetch saved marks data when component loads
        const fetchInitialData = async () => {
            const subcode = newDestructe?.data?.subcode || userInfo?.subcode;
            const barcode = newDestructe?.data?.barcode || barcodeData?.data?.barcode;
            const department = newDestructe?.data?.Dep_Name || userInfo?.department;

            if (subcode && barcode && userInfo?.username && validSubstri) {
                try {
                    const body = {
                        subcode,
                        Eva_Id: userInfo.username,
                        valuation_type: validSubstri,
                        barcode,
                        Dep_Name: department,
                        Eva_Mon_Year: questionMain?.Valid_Question?.[0]?.Eva_Mon_Year || 'May_2026',
                    };
                    const res = await fetchExaminerData(body).unwrap();
                    if (res && res.data) {
                        dispatch(setExaminerValuationData(res.data));
                    }
                } catch (e) {
                }
            }
        };

        // Only fetch if we don't already have data
        if (!responseDataFromValuation?.data && barcodeData?.data?.barcode) {
            fetchInitialData();
        }
    }, [barcodeData?.data?.barcode, userInfo?.username]);

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
                    // Extract question number from id (format: "section:::qnum:::sub_section:::add_sub_section")
                    const [partSection, qnumStr, sub_section = '', add_sub_section = ''] = String(question.id).split(':::');
                    const qnum = Number(qnumStr);

                    // Find the Valid_Section data for this question to get its database id
                    // IMPORTANT: Must match section, qstn_num, sub_section, and add_sub_section
                    const sectionData = questionMain?.Valid_Section?.find(
                        section => section.section === partSection &&
                            Number(section.qstn_num) === qnum &&
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

    // Sync examiner valuation data from parent-fetched responseDataFromValuation prop into Redux
    React.useEffect(() => {
        if (responseDataFromValuation?.data) {
            dispatch(setExaminerValuationData(responseDataFromValuation.data));
        }
    }, [responseDataFromValuation]);

    const handleInputChange = (questionId, newValue) => {
        const question = formData
            .flatMap(part => part.questions)
            .find(q => q.id === questionId);

        const maxMark = question?.maxMark;

        // parse composite id: "section:::qstn_num:::sub_section:::add_sub_section"
        const [partSection, qnumStr, sub_section = '', add_sub_section = ''] = String(questionId).split(':::');
        const qnum = Number(qnumStr);

        // Find section data for this question (must match section, qstn_num, sub_section, and add_sub_section)
        const sectionData = questionMain?.Valid_Section?.find(
            section => section.section === partSection && Number(section.qstn_num) === qnum && (section.sub_section || '') === (sub_section || '') && (section.add_sub_section || '') === (add_sub_section || '')
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
                        Eva_Id: userInfo?.username || '',
                        sec_id: sectionData.id || '',
                        page_no: Qbs_Page_No || currentPage || '',
                        Qbs_Page_No: currentPage,
                        Dep_Name: departmentName || sectionData.Dep_Name || userInfo?.department || '',
                        Marks_Get: value === 'n' ? 'NA' : value,
                        section: sectionData.section || part?.section || '',
                        sub_section: sectionData.sub_section || '',
                        add_sub_section: sectionData.add_sub_section || '',
                        max_marks: sectionData.max_mark || '',
                        qbno: String(qnum),
                        Eva_Mon_Year: sectionData.Eva_Mon_Year || '',
                        valuation_type: validSubstri,
                        Examiner_type: String(userExaminer),
                        BL_Point: sectionData.BL_Point || "1",
                        CO_Point: sectionData.CO_Point || "1",
                        PO_Point: sectionData.PO_Point || "1"
                    }



                    // Send to backend immediately
                    const responseMarkPassage = await markPassage(responde).unwrap();



                    // Check if the response was successful before updating Redux
                    if (!responseMarkPassage || responseMarkPassage.error) {
                        console.error('Mark passage failed:', responseMarkPassage?.error || 'Unknown error');
                        toast.error('Failed to save marks. Please try again.');
                        return;
                    }

                    // Update local Redux state
                    dispatch(markInpInfo(markData));

                    // Fetch fresh examiner data and update examiner_valuation slice
                    const subcode = subcodeName || newDestructe?.data?.subcode;
                    const barcode = newDestructe?.data?.barcode;
                    if (subcode && barcode && userInfo?.username) {
                        const body = {
                            subcode,
                            Eva_Id: userInfo.username,
                            valuation_type: validSubstri,
                            barcode,
                            Dep_Name: departmentName || sectionData.Dep_Name || userInfo?.department,
                            Eva_Mon_Year: sectionData.Eva_Mon_Year || 'Nov_2025',
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
                    EXAMINER VALUATION
                </div>
                <div className='val_right_design_3'>
                    <span className='val_right_text_1'>Name :</span>  {basicData?.Eva_Name || userInfo?.name || '—'} {basicData?.Eva_Id ? `(${basicData.Eva_Id})` : userInfo?.username ? `(${userInfo.username})` : ''}
                    <br />
                    <span className='val_right_text_1'>Course Code & Title :</span>   {basicData?.sub_code || userInfo?.subcode || '—'} - {basicData?.sub_name}
                    <br />
                    <span className='val_right_text_1'>Dummy Number :</span>    {basicData?.barcode || '—'}
                    <br />
                </div>
                {/*                 
                Name of the Examiner  : {userInfo?.name} ({userInfo?.username})
                <br />
                Subject code : {newDestructe?.data?.subcode || userInfo?.subcode || '—'}
                <br /> */}
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className='val_right_text_2'>
                                    <FaArrowCircleDown className='val_right_icon_1' /> {part.partName}
                                </span>
                                <span className='val_right_text_3' style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                                    {activeQuestion && activeQuestion.section === part.section
                                        ? <>Q&nbsp;{activeQuestion.label}&nbsp;|&nbsp;Max Mark&nbsp;:&nbsp;{activeQuestion.maxMark}</>
                                        : <>Max Mark - {part.maxMarks}</>}
                                </span>
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
                                        <div style={{
                                            textAlign: 'center',
                                            marginBottom: '0.3rem',
                                            color: question.isCompulsory ? '#e319ea' : '#28a745',
                                            fontWeight: question.isCompulsory ? '800' : '600',
                                            fontSize: '0.95rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.3rem'
                                        }}>



                                            {userInfo.selected_course == '18' ? `${part.section}${question.label}` : question.label}
                                        </div>
                                        <Form.Group style={{ marginBottom: 0 }}>
                                            <Form.Control
                                                type="text"
                                                value={question.value === 'n' ? 'NA' : question.value}
                                                required
                                                aria-required="true"
                                                onFocus={() => setActiveQuestion({ label: question.label, maxMark: question.maxMark, section: part.section })}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const currentValue = question.value;
                                                    // If currently 'n' and user backspaces (shows 'N' or 'A'), clear it
                                                    if (currentValue === 'n' && (val === 'N' || val === 'A')) {
                                                        handleInputChange(question.id, '');
                                                    } else {
                                                        const upperVal = val.toUpperCase();
                                                        // Check for N or NA first
                                                        if (upperVal === 'N' || upperVal === 'NA') {
                                                            handleInputChange(question.id, val);
                                                        }
                                                        // Then validate against the new pattern
                                                        else if (isValidInputPattern(val)) {
                                                            handleInputChange(question.id, val);
                                                        }
                                                        // Reject invalid input (do nothing)
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
                                                    border: question.isCompulsory ? '2px solid #e319ea' : '1px solid #999',
                                                    backgroundColor: question.isCompulsory ? '#f6f6f6' : '#ffffff',
                                                    fontSize: '0.85rem',
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
                {/* Chief Rejection Alert Banner */}
                {rejectionData && rejectionData.isDataThere && (
                    <div style={{
                        backgroundColor: '#fff3cd',
                        border: '3px solid #ffc107',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginBottom: '0.75rem',
                        boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⚠️</span>
                            <strong style={{ color: '#856404', fontSize: '1.1rem' }}>
                                Paper Rejected by Chief Examiner
                            </strong>
                        </div>
                        <div style={{
                            backgroundColor: '#fffbf0',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            borderLeft: '4px solid #ffc107'
                        }}>
                            <p style={{
                                margin: 0,
                                color: '#333',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap',
                                fontWeight: '500'
                            }}>
                                <strong>Remarks:</strong> {rejectionData?.remarks?.msg || rejectionData?.data?.remarks || rejectionData?.data?.msg || rejectionData?.message || 'No remarks provided'}
                            </p>
                        </div>
                        {!hideRejectionModal && (
                            <Button
                                variant="warning"
                                size="sm"
                                onClick={() => setShowRejectionModal(true)}
                                style={{
                                    marginTop: '0.75rem',
                                    fontWeight: '600',
                                    width: '100%',
                                    padding: '0.5rem'
                                }}
                            >
                                View Full Details
                            </Button>
                        )}
                    </div>
                )}

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
                {/* <Row style={{ gap: '0.75rem', display: 'flex', width: '100%', margin: '0' }}>
                    <Col style={{ flex: 1, padding: '0' }}>
                        <Button
                            variant="primary"
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
                            Submit
                        </Button>
                    </Col>
                </Row> */}
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
                            Question <strong style={{ color: '#dc3545', fontSize: '1.15rem' }}>{(() => {
                                const question = formData.flatMap(part => part.questions).find(q => q.id === maxMarkQuestionId);
                                const part = formData.find(p => p.questions.some(q => q.id === maxMarkQuestionId));
                                const label = question?.label || maxMarkQuestionId;
                                return userInfo.selected_course == '18' ? `${part?.section || ''}${label}` : label;
                            })()}</strong> cannot exceed the maximum mark of <strong style={{ color: '#dc3545', fontSize: '1.15rem' }}>{formData.flatMap(part => part.questions).find(q => q.id === maxMarkQuestionId)?.maxMark}</strong>
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

            <Modal show={showFinalizationModal} onHide={() => setShowFinalizationModal(false)} centered size="xl" style={{ maxWidth: '95vw', scrollbarWidth: 'none' }}>
                <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa', borderBottom: '3px solid #0066cc', padding: '1.25rem 1.5rem' }}>
                    <Modal.Title style={{ color: '#0066cc', fontWeight: '700', fontSize: '1.5rem', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span>📋 Mark Preview</span>
                            <span style={{ fontSize: '1.2rem', color: '#495057', fontWeight: '600' }}>
                                Dummy Number: {newDestructe?.data?.barcode || '—'}
                            </span>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.5rem', backgroundColor: '#f8f9fa' }}>
                    {calculationResult && (
                        <div>
                            {/* Mark Scored Header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #0066cc 0%, #004999 100%)',
                                color: 'white',
                                padding: '1.5rem 2rem',
                                borderRadius: '12px',
                                marginBottom: '2rem',
                                fontSize: '1.6rem',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                boxShadow: '0 4px 15px rgba(0, 102, 204, 0.3)',
                                border: '3px solid #0052a3'
                            }}>
                                <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem', opacity: '0.95' }}>
                                    Total Mark Scored
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '2px' }}>
                                    {calculationResult.Final_Marks} <span style={{ fontSize: '1.8rem', opacity: '0.9' }}>({calculationResult.Total_Rounded_Marks})</span>
                                </div>
                            </div>

                            {/* Parts Display */}
                            {calculationResult?.QuestionValidStatus && (() => {
                                const questionsToDisplay = calculationResult.QuestionValidStatus || [];

                                // Create a lookup map for calculation results by composite key
                                // Include section to distinguish between Section A Q1, Section B Q1, Section C Q1, etc.
                                const calculationMap = {};
                                questionsToDisplay.forEach(item => {
                                    const key = `${item.section || ''}:::${item.qbno}:::${item.sub_section || ''}:::${item.add_sub_section || ''}`;
                                    calculationMap[key] = item;
                                });

                                // Use form Data as the source of all questions to ensure subsections are shown
                                return formData.map((part, partIndex) => {
                                    // Build calculation map for valid questions
                                    const calcMap = {};
                                    if (calculationResult?.QuestionValidStatus) {
                                        calculationResult.QuestionValidStatus.forEach(item => {
                                            const key = `${item.section}:::${item.qbno}:::${item.sub_section || ''}:::${item.add_sub_section || ''}`;
                                            calcMap[key] = item;
                                        });
                                    }


                                    // Calculate totalMarks by summing only VALID questions from formData
                                    const totalMarks = part.questions.reduce((sum, question) => {
                                        const value = question.value;
                                        if (value && value !== '' && value !== 'n') {
                                            // Check if this question is valid
                                            const [section, qbno, sub_section = '', add_sub_section = ''] = question.id.split(':::');
                                            const lookupKey = `${part.section}:::${qbno}:::${sub_section}:::${add_sub_section}`;
                                            let calcItem = calcMap[lookupKey];

                                            // If not found with exact add_sub_section, look for ANY variant with same section+qbno+sub_section
                                            if (!calcItem && add_sub_section) {
                                                const prefix = `${part.section}:::${qbno}:::${sub_section}:::`;
                                                const matchingKey = Object.keys(calcMap).find(key => key.startsWith(prefix));
                                                if (matchingKey) {
                                                    calcItem = calcMap[matchingKey];
                                                }
                                            }

                                            // If not found, try without the add_sub_section
                                            if (!calcItem) {
                                                const alternateKey = `${part.section}:::${qbno}:::${sub_section}:::`;
                                                calcItem = calcMap[alternateKey];
                                            }

                                            // If still not found, try without sub_section too
                                            if (!calcItem) {
                                                const mainQuestionKey = `${part.section}:::${qbno}:::::`;
                                                calcItem = calcMap[mainQuestionKey];
                                            }

                                            const isValid = calcItem?.Qst_Valid === 'Y';

                                            // Only count valid questions
                                            if (isValid) {
                                                const numValue = parseFloat(value);
                                                if (!isNaN(numValue)) {
                                                    return sum + numValue;
                                                }
                                            }
                                        }
                                        return sum;
                                    }, 0);

                                    return (
                                        <div key={partIndex} style={{
                                            border: '3px solid #28a745',
                                            borderRadius: '12px',
                                            marginBottom: '1.75rem',
                                            padding: '1.5rem',
                                            backgroundColor: 'white',
                                            boxShadow: '0 4px 12px rgba(40, 167, 69, 0.15)',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '1.25rem',
                                                paddingBottom: '1rem',
                                                borderBottom: '3px solid #28a745',
                                                backgroundColor: '#f1f9f3',
                                                padding: '1rem 1.25rem',
                                                marginLeft: '-1.5rem',
                                                marginRight: '-1.5rem',
                                                marginTop: '-1.5rem',
                                                borderRadius: '9px 9px 0 0'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <h5 style={{ margin: 0, color: '#d9534f', fontWeight: '700', fontSize: '1.3rem' }}>
                                                        {part.partName}
                                                    </h5>
                                                </div>
                                                <div style={{
                                                    backgroundColor: '#d9534f',
                                                    color: 'white',
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '8px',
                                                    fontWeight: '700',
                                                    fontSize: '1.3rem',
                                                    boxShadow: '0 2px 8px rgba(217, 83, 79, 0.3)'
                                                }}>
                                                    Mark: {totalMarks}
                                                </div>
                                            </div>

                                            {/* Questions Grid */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                                                gap: '1rem',
                                                padding: '1rem 0'
                                            }}>
                                                {part.questions.map((question, idx) => {
                                                    // Extract the question parts from the new ID format (section:::qbno:::sub_section:::add_sub_section)
                                                    const [section, qbno, sub_section = '', add_sub_section = ''] = question.id.split(':::');

                                                    // Build lookup key WITH section to avoid conflicts between sections
                                                    const lookupKey = `${part.section}:::${qbno}:::${sub_section}:::${add_sub_section}`;
                                                    let calcItem = calculationMap[lookupKey];

                                                    // If not found with exact add_sub_section, look for ANY variant with same section+qbno+sub_section
                                                    // This handles cases like 21-a-i and 21-a-ii being part of the same question
                                                    if (!calcItem && add_sub_section) {
                                                        const prefix = `${part.section}:::${qbno}:::${sub_section}:::`;
                                                        // Find any key that starts with this prefix
                                                        const matchingKey = Object.keys(calculationMap).find(key => key.startsWith(prefix));
                                                        if (matchingKey) {
                                                            calcItem = calculationMap[matchingKey];
                                                        }
                                                    }

                                                    // If not found, try without the add_sub_section
                                                    if (!calcItem) {
                                                        const alternateKey = `${part.section}:::${qbno}:::${sub_section}:::`;
                                                        calcItem = calculationMap[alternateKey];
                                                    }

                                                    // If still not found, try without sub_section too (fallback to main question)
                                                    if (!calcItem) {
                                                        const mainQuestionKey = `${part.section}:::${qbno}:::::`;
                                                        calcItem = calculationMap[mainQuestionKey];
                                                    }

                                                    const isValid = calcItem?.Qst_Valid === 'Y'

                                                    // Determine display value
                                                    let displayValue = question.value === 'n' ? 'NA' : question.value;

                                                    // Use the question label from formData
                                                    const displayLabel = userInfo.selected_course == '18' ? `${part.section}${question.label}` : question.label;

                                                    // Determine colors based on value and validity
                                                    let borderColor, backgroundColor, textColor;
                                                    if (displayValue === 'NA') {
                                                        borderColor = '#28a745';
                                                        backgroundColor = isValid ? '#fff5f5' : '#ffe6e6';
                                                        textColor = '#28a745';
                                                    } else if (displayValue === '0' || displayValue === 0) {
                                                        borderColor = '#28a745';
                                                        backgroundColor = isValid ? '#fff8f0' : '#ffe8d1';
                                                        textColor = '#28a745';
                                                    } else {
                                                        borderColor = '#28a745';
                                                        backgroundColor = isValid ? '#f1f9f3' : '#e6f4ea';
                                                        textColor = '#28a745';
                                                    }

                                                    return (
                                                        <div key={idx} style={{ textAlign: 'center' }}>
                                                            <div style={{
                                                                fontSize: '0.9rem',
                                                                marginBottom: '0.4rem',
                                                                fontWeight: '700',
                                                                color: isValid ? '#28a745' : '#d9534f',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                {displayLabel}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={displayValue}
                                                                readOnly
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.75rem 0.5rem',
                                                                    textAlign: 'center',
                                                                    border: `3px solid ${isValid ? borderColor : '#d9534f'}`,
                                                                    borderRadius: '8px',
                                                                    backgroundColor: isValid ? backgroundColor : '#f8f9fa',
                                                                    fontWeight: '700',
                                                                    fontSize: '1.1rem',
                                                                    color: question.isCompulsory ? '#e319ea' : `${isValid ? borderColor : '#d9534f'}`,
                                                                    cursor: 'default',
                                                                    boxShadow: isValid ? `0 2px 8px ${borderColor}33` : 'none',
                                                                    transition: 'all 0.2s ease'
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
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '3px solid #0066cc', padding: '1.25rem 1.5rem', gap: '1rem' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowFinalizationModal(false)}
                        style={{
                            padding: '0.75rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            borderRadius: '8px',
                            border: '2px solid #6c757d',
                            boxShadow: '0 2px 6px rgba(108, 117, 125, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <IoMdCloseCircleOutline style={{ fontSize: '1.3rem', marginRight: '0.5rem' }} /> Close
                    </Button>
                    <Button
                        variant="success"
                        onClick={async () => {
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
                                        Eva_Id: userInfo.username,
                                        Dep_Name,
                                        Eva_Mon_Year: evaMonYear,
                                        valuation_type: validSubstri,
                                        Examiner_type: String(userExaminer),
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
                                    // setErrorData({ message: 'Failed to submit finalization data. Please try again.' });
                                    setErrorData(e.data || { message: e.message || 'An unexpected error occurred during finalization. Please try again.' });
                                    setShowErrorModal(true);
                                }
                            }
                        }}
                        style={{
                            padding: '0.75rem 2.5rem',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            borderRadius: '8px',
                            border: '2px solid #28a745',
                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                            boxShadow: '0 4px 12px rgba(40, 167, 69, 0.4)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <IoIosSave style={{ fontSize: '1.3rem', marginRight: '0.5rem' }} /> Final Submit
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
                onHide={() => setShowRemarksModal(false)}
                basicData={basicData}
                Modal_Type="2"
            />

            {/* Chief Rejection Modal - Only show if hideRejectionModal is false */}
            {!hideRejectionModal && (
                <Modal
                    show={showRejectionModal}
                    onHide={() => setShowRejectionModal(false)}
                    backdrop="static"
                    centered
                    size="lg"
                >
                    <Modal.Header closeButton style={{ backgroundColor: '#f8d7da', borderBottom: '2px solid #f5c6cb' }}>
                        <Modal.Title style={{ color: '#721c24', fontWeight: '600' }}>
                            ⚠️ Paper Rejected by Chief Examiner
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ padding: '2rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                <strong>Barcode:</strong> {rejectionData?.data?.barcode || basicData?.barcode || 'N/A'}
                            </p>
                            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                                <strong>Subject:</strong> {rejectionData?.remarks?.evaluator_subject || basicData?.sub_code || 'N/A'}
                            </p>
                        </div>
                        <div style={{
                            backgroundColor: '#fff3cd',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            border: '1px solid #ffc107'
                        }}>
                            <h5 style={{ color: '#856404', marginBottom: '1rem' }}>Chief Examiner's Remarks:</h5>
                            <p style={{
                                fontSize: '1.05rem',
                                lineHeight: '1.6',
                                color: '#333',
                                margin: 0,
                                whiteSpace: 'pre-wrap'
                            }}>
                                {rejectionData?.remarks?.msg || 'No remarks provided'}
                            </p>
                        </div>
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            backgroundColor: '#e7f3ff',
                            borderRadius: '8px',
                            border: '1px solid #b3d9ff'
                        }}>
                            <p style={{ margin: 0, color: '#004085', fontSize: '0.95rem' }}>
                                <strong>Note:</strong> Please review the marks and resubmit after making necessary corrections.
                            </p>
                        </div>
                    </Modal.Body>
                    <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
                        <Button
                            variant="primary"
                            onClick={() => setShowRejectionModal(false)}
                            style={{ padding: '0.5rem 2rem' }}
                        >
                            I Understand, Continue
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </div>

    )
}

export default ValuationRight