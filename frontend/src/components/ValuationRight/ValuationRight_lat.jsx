import React, { useState, useEffect, useRef } from 'react'
import { Form, Row, Col, Button, Modal } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'
import { markInpInfo, markInpInfoRemove } from '../../redux-slice/markApiSlice'
import { useMarkPassageMutation } from '../../redux-slice/markPassageSlice'
import markCalulation from '../../hooks/ValuationHook/ValuationMarkCalculation'
import ValuationRemarksModal from '../modals/ValuationRemarksModal'
import { useGetExaminerValuetionDataMutation, useSendFrontendFinalizedDataMutation, useValuationCountCheckMutation } from '../../redux-slice/valuationApiSlice'
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
    userroleData = (userroleData || '').split(',')
    const userExaminer = userInfo?.selected_role;
    // State for dynamic column count
    const [columnCount, setColumnCount] = useState(5);
    const containerRef = useRef(null);
    // Tracks last backend-confirmed value per question — used to skip redundant API calls
    const confirmedValuesRef = useRef(new Map());
    const dispatch = useDispatch()
    const [sendFrontendFinalizedData, isLoadingFinalized] = useSendFrontendFinalizedDataMutation();
    const [checkValuationCount] = useValuationCountCheckMutation();
    const [isCountChecking, setIsCountChecking] = useState(false);
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
    const [showReenterModal, setShowReenterModal] = useState(false);
    const [reenterQuestion, setReenterQuestion] = useState(null); // { label, questionId }
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [activeQuestion, setActiveQuestion] = useState(null); // { label, maxMark, section }
    // Track which question IDs are currently being saved to backend (allows concurrent saves)
    const [savingIds, setSavingIds] = useState(new Set());
    // Track which question IDs have been successfully confirmed by backend
    const [savedQuestionIds, setSavedQuestionIds] = useState(new Set());

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

    // Check if ALL questions have been confirmed saved by the backend
    const allSavedToBackend = React.useMemo(() => {
        const allQuestionIds = formData.flatMap(part => part.questions.map(q => q.id));
        if (allQuestionIds.length === 0) return false;
        return allQuestionIds.every(id => savedQuestionIds.has(id));
    }, [formData, savedQuestionIds]);

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

        // Always fetch examiner data once on mount to populate examiner_valuation Redux state
        if (barcodeData?.data?.barcode) {
            fetchInitialData();
        }
    }, [barcodeData?.data?.barcode, userInfo?.username]);

    // Update formData whenever questionMain changes
    React.useEffect(() => {
        const initialData = initializeFormData();
        // Always reset confirmed values map when paper changes — prevents stale skip-save on new paper
        confirmedValuesRef.current = new Map();

        // If there's saved response data, restore the values
        if (responseDataFromValuation?.data && Array.isArray(responseDataFromValuation.data)) {
            // Create a map of sec_id to saved data for quick lookup
            const savedDataMap = {};
            responseDataFromValuation.data.forEach(item => {
                savedDataMap[item.sec_id] = item;
            });

            // Track which question IDs are already confirmed in backend
            const restoredIds = new Set();

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
                        // Compute the restored value — treat null/undefined/empty as not entered
                        // NOTE: Do NOT use `|| ''` here — it would incorrectly treat '0' (zero marks) as empty
                        const restoredValue = savedData.Marks_Get === 'NA'
                            ? 'n'
                            : (savedData.Marks_Get !== null && savedData.Marks_Get !== undefined && savedData.Marks_Get !== ''
                                ? String(savedData.Marks_Get)
                                : '');
                        // Only mark as saved-to-backend if the mark is actually present
                        if (restoredValue !== '') {
                            restoredIds.add(question.id);
                            confirmedValuesRef.current.set(question.id, restoredValue);
                        }
                        return {
                            ...question,
                            value: restoredValue
                        };
                    }

                    return question;
                })
            }));

            setFormData(restoreFormData);
            setSavedQuestionIds(restoredIds);
        } else {
            setFormData(initialData);
            setSavedQuestionIds(new Set());
        }
    }, [questionMain, responseDataFromValuation])

    // Sync examiner valuation data from parent-fetched responseDataFromValuation prop into Redux
    React.useEffect(() => {
        if (responseDataFromValuation?.data) {
            dispatch(setExaminerValuationData(responseDataFromValuation.data));
        }
    }, [responseDataFromValuation]);

    // commit=false → only update local state (called from onChange)
    // commit=true  → also persist to backend (called from onBlur)
    const handleInputChange = (questionId, newValue, commit = false) => {
        // EARLY GUARD (onChange only): if the new value differs from the last backend-confirmed
        // value, immediately remove this question from savedQuestionIds.
        // This prevents Submit from staying enabled while the user:
        //   • has cleared a field (newValue === '')
        //   • is typing an in-progress value like "1."
        //   • has changed the value but hasn't blurred yet
        if (!commit && savedQuestionIds.has(questionId)) {
            const confirmed = confirmedValuesRef.current.get(questionId);
            const normalizedNew =
                (typeof newValue === 'string' && (newValue.toUpperCase() === 'N' || newValue.toUpperCase() === 'NA'))
                    ? 'n'
                    : newValue;
            if (normalizedNew !== confirmed) {
                setSavedQuestionIds(prev => { const next = new Set(prev); next.delete(questionId); return next; });
            }
        }

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

                // Skip redundant save — only if mark is ALREADY backend-confirmed AND value is unchanged.
                // If savedQuestionIds does NOT have this question (e.g. after a failed save that cleared
                // the field and user re-entered the same value), we MUST still call the backend.
                if (confirmedValuesRef.current.get(questionId) === value && savedQuestionIds.has(questionId)) return;

                // Lock only this question's input while saving
                setSavingIds(prev => new Set([...prev, questionId]));

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
                        // Revert the field value and remove from saved set
                        setFormData(prev =>
                            prev.map(p => ({
                                ...p,
                                questions: p.questions.map(q =>
                                    q.id === questionId ? { ...q, value: '' } : q
                                )
                            }))
                        );
                        setSavedQuestionIds(prev => {
                            const next = new Set(prev);
                            next.delete(questionId);
                            return next;
                        });
                        setReenterQuestion({ label: sectionData.qstn_num, questionId });
                        setShowReenterModal(true);
                        setSavingIds(prev => { const next = new Set(prev); next.delete(questionId); return next; });
                        return;
                    }

                    // Update local Redux state
                    dispatch(markInpInfo(markData));
                    // Mark as confirmed by backend and record the confirmed value
                    setSavedQuestionIds(prev => new Set([...prev, questionId]));
                    confirmedValuesRef.current.set(questionId, value);
                    setSavingIds(prev => { const next = new Set(prev); next.delete(questionId); return next; });

                } catch (e) {
                    console.error('Error saving mark data:', e);
                    // Revert the field value on network/server error
                    setFormData(prev =>
                        prev.map(p => ({
                            ...p,
                            questions: p.questions.map(q =>
                                q.id === questionId ? { ...q, value: '' } : q
                            )
                        }))
                    );
                    setSavedQuestionIds(prev => {
                        const next = new Set(prev);
                        next.delete(questionId);
                        return next;
                    });
                    setReenterQuestion({ label: sectionData.qstn_num, questionId });
                    setShowReenterModal(true);
                    setSavingIds(prev => { const next = new Set(prev); next.delete(questionId); return next; });
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
            if (commit) dispatchMarkData('n');
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
                if (commit) {
                    // Clear the over-limit value that slipped in through state
                    setFormData(prev =>
                        prev.map(part => ({
                            ...part,
                            questions: part.questions.map(q =>
                                q.id === questionId ? { ...q, value: '' } : q
                            )
                        }))
                    );
                }
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
                if (commit) dispatchMarkData(newValue);
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
            if (commit) dispatchMarkData(newValue);
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

            {/* Saving indicator banner */}


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
                                                className="val-mark-input"
                                                value={question.value === 'n' ? 'NA' : question.value}
                                                required
                                                aria-required="true"
                                                disabled={savingIds.has(question.id)}
                                                onFocus={(e) => {
                                                    e.target.select();
                                                    setActiveQuestion({ label: question.label, maxMark: question.maxMark, section: part.section });
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        e.target.blur();
                                                        const all = Array.from(document.querySelectorAll('.val-mark-input:not(:disabled)'));
                                                        const idx = all.indexOf(e.target);
                                                        if (idx !== -1 && idx < all.length - 1) all[idx + 1].focus();
                                                    }
                                                }}
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
                                                onBlur={() => {
                                                    // Read from React state (source of truth) not DOM value
                                                    const currentQ = formData.flatMap(p => p.questions).find(q => q.id === question.id);
                                                    let finalVal = currentQ?.value ?? '';
                                                    // Trim trailing decimal point from in-progress entry (e.g. "1.")
                                                    if (isInProgressMarkValue(finalVal)) {
                                                        finalVal = finalVal.slice(0, -1);
                                                    }
                                                    // Nothing to save
                                                    if (finalVal === '') return;
                                                    // Commit the finalised value to backend
                                                    handleInputChange(question.id, finalVal, true);
                                                }}
                                                style={{
                                                    textAlign: 'center',
                                                    minHeight: '2.3rem',
                                                    borderRadius: '4px',
                                                    border: savingIds.has(question.id)
                                                        ? '2px solid #0066cc'
                                                        : question.isCompulsory ? '2px solid #e319ea' : '1px solid #999',
                                                    backgroundColor: savingIds.has(question.id)
                                                        ? '#e8f4ff'
                                                        : question.isCompulsory ? '#f6f6f6' : '#ffffff',
                                                    fontSize: '0.85rem',
                                                    color: question.value === 0 || String(question.value).toLowerCase() === '0' || question.value === 'n' || String(question.value).toUpperCase() === 'NA' ? "red" : "black",
                                                    opacity: savingIds.has(question.id) ? 0.6 : 1,
                                                    cursor: savingIds.has(question.id) ? 'not-allowed' : 'text',
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

                {/* Real-time saved marks status bar */}
                {(() => {
                    const totalQ = formData.flatMap(p => p.questions).length;
                    const savedQ = savedQuestionIds.size;
                    const allSaved = totalQ > 0 && savedQ === totalQ;
                    return (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            backgroundColor: allSaved ? '#d4edda' : savingIds.size > 0 ? '#cce5ff' : '#fff3cd',
                            border: `1px solid ${allSaved ? '#28a745' : savingIds.size > 0 ? '#0066cc' : '#ffc107'}`,
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: allSaved ? '#155724' : savingIds.size > 0 ? '#004085' : '#856404',
                            marginBottom: '0.5rem',
                        }}>
                            {savingIds.size > 0
                                ? `\u23F3 Saving\u2026 ${savedQ}/${totalQ} marks confirmed to server`
                                : allSaved
                                ? `\u2713 All ${totalQ} marks saved `
                                : `\u26A0 ${savedQ}/${totalQ} marks saved \u2014 enter remaining marks`}
                        </div>
                    );
                })()}

                <Row style={{ gap: '0.75rem', display: 'flex', marginBottom: '0', width: '100%', margin: '0' }}>

                    <Col style={{ flex: 1, padding: '0' }}>
                        <Button
                            variant="success"
                            disabled={!(end_image - 2 <= currentPage && allSavedToBackend) || savingIds.size > 0 || isCountChecking}
                            title={
                                savingIds.size > 0 ? 'Saving marks... please wait' :
                                !allSavedToBackend ? 'All marks must be saved to server before submitting' :
                                !(end_image - 2 <= currentPage) ? 'View all pages first' :
                                isCountChecking ? 'Verifying marks with server...' : ''
                            }
                            onClick={async () => {
                                // Calculate marks and show preview modal only
                                const subcode = subcodeName || newDestructe?.data?.subcode;
                                const barcode = newDestructe?.data?.barcode;
                                const Dep_Name = newDestructe?.data?.Dep_Name || userInfo?.department;

                                if (subcode && barcode && userInfo?.username) {
                                    setIsCountChecking(true);
                                    try {
                                        // Use backend-confirmed count (savedQuestionIds) — NOT local form state.
                                        // This is the safest count: only marks the server has actually confirmed.
                                        const frontendFilledCount = savedQuestionIds.size;

                                        

                                        // --- DB count check via API ---
                                        const countResult = await checkValuationCount({
                                            subcode,
                                            Eva_Id: userInfo.username,
                                            barcode,
                                            Dep_Name,
                                            valuation_type: validSubstri,
                                            Examiner_type: String(userExaminer),
                                        }).unwrap();

                                        const { valid_sections_count, val_data_count } = countResult;

                                        // All three must match: valid_sections == val_data DB == frontend filled
                                        if (
                                            valid_sections_count !== val_data_count ||
                                            val_data_count !== frontendFilledCount
                                        ) {
                                            const msg =
                                                `Marks count mismatch detected:\n` +
                                                `\u2022 Expected (valid_sections): ${valid_sections_count}\n` +
                                                `\u2022 Saved in database: ${val_data_count}\n` +
                                                `\u2022 Entered on screen: ${frontendFilledCount}\n\n` +
                                                `Please ensure all marks are entered and saved before submitting.`;
                                            setErrorData({ countMismatch: true, missingMarks: true, message: msg });
                                            setShowErrorModal(true);
                                            return;
                                        }

                                        // Build mark source directly from formData (always current, never stale)
                                        const source = formData.flatMap(part =>
                                            part.questions.map(q => {
                                                const [, qnumStr, sub_section = '', add_sub_section = ''] = String(q.id).split(':::');
                                                return {
                                                    qbno: Number(qnumStr),
                                                    section: part.section,
                                                    sub_section,
                                                    add_sub_section,
                                                    Marks_Get: q.value === 'n' || q.value === '' ? 'NA' : q.value
                                                };
                                            })
                                        );

                                        // Compute marks
                                        const result = markCalulation(source, subcodeName, questiData);
                                        setCalculationResult(result);
                                        setTotalMarks(result);

                                        // Show preview modal
                                        setShowFinalizationModal(true);
                                    } catch (e) {
                                        console.error('Count check or mark calculation failed:', e);
                                        setErrorData({ message: 'Unable to verify marks with server. Please try again.' });
                                        setShowErrorModal(true);
                                    } finally {
                                        setIsCountChecking(false);
                                    }
                                }
                            }}
                            style={{ width: '100%', height: '2.8rem', padding: '0', fontSize: '1rem', fontWeight: '600', borderRadius: '10px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        >
                            {isCountChecking ? 'Verifying...' : <><MdOutlineSaveAlt />&nbsp;Save Progress</>}
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
                                        // Build mark source directly from formData (always current, never stale)
                                        const source = formData.flatMap(part =>
                                            part.questions.map(q => {
                                                const [, qnumStr, sub_section = '', add_sub_section = ''] = String(q.id).split(':::');
                                                return {
                                                    qbno: Number(qnumStr),
                                                    section: part.section,
                                                    sub_section,
                                                    add_sub_section,
                                                    Marks_Get: q.value === 'n' || q.value === '' ? 'NA' : q.value
                                                };
                                            })
                                        );

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

                            {/* Section-wise Summary Table */}
                            {calculationResult?.SectionWiseMarks && Object.keys(calculationResult.SectionWiseMarks).length > 0 && (() => {
                                // Build calculation map for valid questions
                                const calcMap = {};
                                if (calculationResult?.QuestionValidStatus) {
                                    calculationResult.QuestionValidStatus.forEach(item => {
                                        const key = `${item.section}:::${item.qbno}:::${item.sub_section || ''}:::${item.add_sub_section || ''}`;
                                        calcMap[key] = item;
                                    });
                                }
                                
                                // Calculate total max marks ONLY from VALID questions in formData
                                const totalMaxMarks = formData.reduce((sum, part) => {
                                    const validMaxMarks = part.questions.reduce((qSum, question) => {
                                        const [, qbno, sub_section = '', add_sub_section = ''] = question.id.split(':::');
                                        const lookupKey = `${part.section}:::${qbno}:::${sub_section}:::${add_sub_section}`;
                                        let calcItem = calcMap[lookupKey];

                                        // Only try alternate lookups if NO sub_section exists
                                        // This prevents Q22-b from matching Q22 (main) and being counted incorrectly
                                        if (!calcItem && !sub_section) {
                                            // Try alternate lookups only for questions without subsections
                                            if (add_sub_section) {
                                                const prefix = `${part.section}:::${qbno}:::${sub_section}:::`;
                                                const matchingKey = Object.keys(calcMap).find(key => key.startsWith(prefix));
                                                if (matchingKey) calcItem = calcMap[matchingKey];
                                            }
                                            if (!calcItem) {
                                                const alternateKey = `${part.section}:::${qbno}:::${sub_section}:::`;
                                                calcItem = calcMap[alternateKey];
                                            }
                                            if (!calcItem) {
                                                const mainQuestionKey = `${part.section}:::${qbno}:::::`;
                                                calcItem = calcMap[mainQuestionKey];
                                            }
                                        }

                                        const isValid = calcItem?.Qst_Valid === 'Y';
                                        if (isValid && question.maxMark) {
                                            return qSum + (parseFloat(question.maxMark) || 0);
                                        }
                                        return qSum;
                                    }, 0);
                                    return sum + validMaxMarks;
                                }, 0);
                                
                                return (
                                    <div style={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #0066cc',
                                        borderRadius: '10px',
                                        padding: '1.5rem',
                                        marginBottom: '2rem',
                                        boxShadow: '0 2px 8px rgba(0, 102, 204, 0.15)'
                                    }}>
                            
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                            {Object.entries(calculationResult.SectionWiseMarks)
                                                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                                                .map(([sectionKey, marks]) => {
                                                    // Extract section name (e.g., "SectionA" -> "Part A", "SectionCa" -> "Part C-a")
                                                    const sectionMatch = sectionKey.match(/Section([A-Z])([ab])?/);
                                                    const sectionLetter = sectionMatch ? sectionMatch[1] : '';
                                                    const subSection = sectionMatch && sectionMatch[2] ? sectionMatch[2] : '';
                                                    const sectionLabel = sectionMatch 
                                                        ? `Part ${sectionMatch[1]}${sectionMatch[2] ? `-${sectionMatch[2]}` : ''}`
                                                        : sectionKey;
                                                    
                                                    // Calculate max marks ONLY for VALID questions in this section
                                                    const matchingPart = formData.find(part => part.section === sectionLetter);
                                                    let maxMarksForSection = 0;
                                                    if (matchingPart) {
                                                        maxMarksForSection = matchingPart.questions.reduce((qSum, question) => {
                                                            const [, qbno, sub_section = '', add_sub_section = ''] = question.id.split(':::');
                                                            
                                                            // For subsections (a/b), only count questions from matching subsection
                                                            if (subSection && sub_section !== subSection) {
                                                                return qSum;
                                                            }
                                                            
                                                            const lookupKey = `${matchingPart.section}:::${qbno}:::${sub_section}:::${add_sub_section}`;
                                                            let calcItem = calcMap[lookupKey];

                                                            // Only try alternate lookups if NO sub_section exists
                                                            // This prevents Q22-b from matching Q22 (main) and being counted incorrectly
                                                            if (!calcItem && !sub_section) {
                                                                // Try alternate lookups only for questions without subsections
                                                                if (add_sub_section) {
                                                                    const prefix = `${matchingPart.section}:::${qbno}:::${sub_section}:::`;
                                                                    const matchingKey = Object.keys(calcMap).find(key => key.startsWith(prefix));
                                                                    if (matchingKey) calcItem = calcMap[matchingKey];
                                                                }
                                                                if (!calcItem) {
                                                                    const alternateKey = `${matchingPart.section}:::${qbno}:::${sub_section}:::`;
                                                                    calcItem = calcMap[alternateKey];
                                                                }
                                                                if (!calcItem) {
                                                                    const mainQuestionKey = `${matchingPart.section}:::${qbno}:::::`;
                                                                    calcItem = calcMap[mainQuestionKey];
                                                                }
                                                            }

                                                            const isValid = calcItem?.Qst_Valid === 'Y';
                                                            if (isValid && question.maxMark) {
                                                                return qSum + (parseFloat(question.maxMark) || 0);
                                                            }
                                                            return qSum;
                                                        }, 0);
                                                    }
                                                    
                                                    return (
                                                        <>
                                                    
                                                        {/* <div key={sectionKey} style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '0.75rem 1rem',
                                                            backgroundColor: '#f0f7ff',
                                                            borderRadius: '8px',
                                                            border: '2px solid #b3d9ff'
                                                        }}>
                                                            <span style={{ fontWeight: '600', color: '#004999', fontSize: '1rem' }}>
                                                                {sectionLabel}:
                                                            </span>
                                                            <span style={{ fontWeight: '700', color: '#0066cc', fontSize: '1.1rem' }}>
                                                                {marks}/{maxMarksForSection}
                                                            </span>
                                                        </div> */}
                                                            </>
                                                    );
                                                })}
                                        </div>
                                        <div style={{
                                            marginTop: '1rem',
                                            paddingTop: '1rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontWeight: '700', color: '#004999', fontSize: '1.2rem' }}>
                                                Grand Total:
                                            </span>
                                            <span style={{ fontWeight: '800', color: '#0066cc', fontSize: '1.4rem' }}>
                                                {calculationResult.Total_Rounded_Marks}/{totalMaxMarks} 
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

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

                                    // Get total marks for this section from SectionWiseMarks (already calculated correctly)
                                    // Handle both regular sections (e.g., "SectionA") and subsections (e.g., "SectionCa", "SectionCb")
                                    let totalMarks = 0;
                                    if (calculationResult?.SectionWiseMarks) {
                                        const sectionKey = `Section${part.section}`;
                                        const sectionKeyA = `Section${part.section}a`;
                                        const sectionKeyB = `Section${part.section}b`;
                                        
                                        // If this section has a/b subsections, sum them AND the main section
                                        // (main section may contain questions without subsection like Q21)
                                        if (calculationResult.SectionWiseMarks[sectionKeyA] !== undefined || 
                                            calculationResult.SectionWiseMarks[sectionKeyB] !== undefined) {
                                            totalMarks = (calculationResult.SectionWiseMarks[sectionKey] || 0) +
                                                         (calculationResult.SectionWiseMarks[sectionKeyA] || 0) + 
                                                         (calculationResult.SectionWiseMarks[sectionKeyB] || 0);
                                        } else {
                                            // Regular section without subsections
                                            totalMarks = calculationResult.SectionWiseMarks[sectionKey] || 0;
                                        }
                                    }

                                    // Calculate max marks ONLY for VALID questions in this section
                                    const totalMaxMarks = part.questions.reduce((qSum, question) => {
                                        const [, qbno, sub_section = '', add_sub_section = ''] = question.id.split(':::');
                                        const lookupKey = `${part.section}:::${qbno}:::${sub_section}:::${add_sub_section}`;
                                        let calcItem = calcMap[lookupKey];

                                        // Only try alternate lookups if NO sub_section exists
                                        // This prevents Q22-b from matching Q22 (main) and being counted incorrectly
                                        if (!calcItem && !sub_section) {
                                            // Try alternate lookups only for questions without subsections
                                            if (add_sub_section) {
                                                const prefix = `${part.section}:::${qbno}:::${sub_section}:::`;
                                                const matchingKey = Object.keys(calcMap).find(key => key.startsWith(prefix));
                                                if (matchingKey) calcItem = calcMap[matchingKey];
                                            }
                                            if (!calcItem) {
                                                const alternateKey = `${part.section}:::${qbno}:::${sub_section}:::`;
                                                calcItem = calcMap[alternateKey];
                                            }
                                            if (!calcItem) {
                                                const mainQuestionKey = `${part.section}:::${qbno}:::::`;
                                                calcItem = calcMap[mainQuestionKey];
                                            }
                                        }

                                        const isValid = calcItem?.Qst_Valid === 'Y';
                                        if (isValid && question.maxMark) {
                                            return qSum + (parseFloat(question.maxMark) || 0);
                                        }
                                        return qSum;
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
                                                    Mark: {totalMarks}/{totalMaxMarks}
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
                                    // Use backend-confirmed count — the only count that matters for finalization
                                    const frontendFilledCount = savedQuestionIds.size;

                                     // Build a single object with subcode, barcode and matched valid sections
                                    const matchedValidQuestions = questionMain?.Valid_Question?.filter(q => q.SUBCODE === subcode) || [];
                                    const validSectionsPayload = {
                                        subcode,
                                        barcode,
                                        sections: matchedValidQuestions.flatMap(q => {
                                            const sectionRows = questionMain?.Valid_Section?.filter(
                                                s => s.qstn_num >= q.FROM_QST && s.qstn_num <= q.TO_QST && s.section === q.SECTION
                                            ) || [];
                                            return sectionRows.map(s => {
                                                const compositeKey = `${q.SECTION}:::${s.qstn_num}:::${s.sub_section || ''}:::${s.add_sub_section || ''}`;
                                                const matchedQ = formData
                                                    .flatMap(p => p.questions)
                                                    .find(fq => fq.id === compositeKey);
                                                const mark = matchedQ
                                                    ? (matchedQ.value === 'n' || matchedQ.value === '' ? 'NA' : matchedQ.value)
                                                    : 'NA';
                                                return {
                                                    section: q.SECTION,
                                                    id: s.id,
                                                    mark,
                                                };
                                            });
                                        }),
                                    };

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
                                        frontendFilledCount,
                                        validSectionsPayload,
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
                                    setShowFinalizationModal(false);
                                    const errData = e?.data || {};
                                    if (errData.countMismatch) {
                                        // Backend rejected because saved mark count != expected question count
                                        setErrorData({ countMismatch: true, missingMarks: true, message: errData.message || `Marks count mismatch detected (found ${errData.found ?? '?'}, expected ${errData.expected ?? '?'}). Please ensure all marks are entered and saved before submitting.` });
                                    } else if (errData.missingMarks) {
                                        // Backend rejected due to missing/empty marks — show guidance, not "server error"
                                        setErrorData({ missingMarks: true, message: errData.message || 'Some marks are missing. Please go back and ensure all marks are entered before submitting.' });
                                    } else {
                                        setErrorData(errData.message ? errData : { message: e?.message || 'An unexpected error occurred during finalization. Please try again.' });
                                    }
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
                        {errorData?.countMismatch ? '⚠ Marks Count Mismatch' : errorData?.missingMarks ? '⚠ Incomplete Marks' : '✗ Submission Error'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {errorData && (
                        <div style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                            <div style={{
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                backgroundColor: errorData.missingMarks ? '#fff8e1' : '#fff5f5',
                                borderRadius: '8px',
                                border: `1px solid ${errorData.missingMarks ? '#f59e0b' : '#dc3545'}`
                            }}>
                                <p style={{ color: errorData.missingMarks ? '#92400e' : '#dc3545', margin: '0.5rem 0', fontSize: '0.95rem', fontWeight: '500' }}>
                                    {errorData.message || 'An error occurred while processing your submission.'}
                                </p>
                                {errorData.missingMarks ? (
                                    <p style={{ color: '#92400e', margin: '1rem 0 0 0', fontSize: '0.9rem', backgroundColor: '#fef3c7', padding: '0.75rem', borderRadius: '4px', border: '1px solid #f59e0b' }}>
                                        <strong>Please close this dialog, enter all missing marks, and then try submitting again.</strong>
                                    </p>
                                ) : (
                                    <p style={{ color: '#856404', margin: '1rem 0 0 0', fontSize: '0.9rem', backgroundColor: '#fff3cd', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
                                        <strong>Please do not reload the page. Close this dialog and try submitting again.</strong>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={errorData?.missingMarks ? 'warning' : 'danger'} onClick={() => setShowErrorModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Re-enter mark modal — shown when backend fails to save a mark */}
            <Modal show={showReenterModal} onHide={() => setShowReenterModal(false)} centered backdrop="static">
                <Modal.Header style={{ backgroundColor: '#dc3545', color: 'white' }}>
                    <Modal.Title style={{ fontWeight: '700' }}>⚠ Mark Save Failed</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '1.5rem' }}>
                    <p style={{ marginBottom: '0.75rem', fontSize: '1rem', color: '#333' }}>
                        The mark for <strong style={{ color: '#dc3545' }}>Q {reenterQuestion?.label}</strong> could not be saved to the server.
                    </p>
                    <p style={{ marginBottom: 0, color: '#666', fontSize: '0.9rem', backgroundColor: '#fff3cd', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ffc107' }}>
                        The field has been cleared. Please <strong>re-enter the mark</strong> and move focus out of the field to save again.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={() => setShowReenterModal(false)}>
                        OK, I'll Re-enter
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