const markCalulation = (valuationDataMark, markType, questiData) => {
    const normalizeMarks = (input) => {
        if (!input) return [];
        if (Array.isArray(input)) return input;
        if (typeof input === 'object') return Object.values(input);
        return [];
    };

    const marksArray = normalizeMarks(valuationDataMark).map((m) => {
        // accept various possible property names produced by client code
        const qbno = parseFloat(m.qbno || m.qstn_num || m.qstnNum || m.qstn || m.qbNo || m.qstn_num);
        const section = m.section || m.sectionName || m.SECTION || null;
        const sub_section = m.sub_section || m.subSection || m.SUB_SECTION || '';
        const add_sub_section = m.add_sub_section || m.addSubSection || m.ADD_SUB_SECTION || '';
        const Marks_Get = (m.Marks_Get || m.Mark || m.Marks || m.Mark_Get || m.MarksGet || '').toString();
        const marksValue = Marks_Get === '' || Marks_Get === 'NA' ? 'NA' : Marks_Get;
        return {
            qbno: isNaN(qbno) ? (Number(m.qbno) || 0) : qbno,
            section,
            sub_section,
            add_sub_section,
            Marks_Get: marksValue,
            original_Marks_Get: marksValue, // Keep track of original value
        };
    });

    const valid_Question = (questiData && questiData.Valid_Question) || [];

    // Build sections structure
    const sections = {};

    for (const question of valid_Question) {
        const from = Number((question.FROM_QST || question.FROMQST || question.FROM) || 0);
        const to = Number((question.TO_QST || question.TOQST || question.TO) || 0);
        const sectionLabel = String(question.SECTION || question.section || '');

        const matchingMarks = marksArray.filter((mark) => {
            const qbn = parseInt(mark.qbno);
            const isInRange = qbn >= parseInt(from) && qbn <= parseInt(to);
            
            // If mark has section, it must match the sectionLabel
            // If mark has no section, just check if in range (for backward compatibility)
            if (mark.section) {
                return mark.section === sectionLabel && isInRange;
            }
            
            // No section field - just verify it's in the correct range
            return isInRange;
        });

        if (question.SUB_SEC === 'ab') {
            const keyA = `Section${sectionLabel}a`;
            const keyB = `Section${sectionLabel}b`;
            if (!sections[keyA]) sections[keyA] = [];
            if (!sections[keyB]) sections[keyB] = [];
        } else {
            const key = `Section${sectionLabel}`;
            if (!sections[key]) sections[key] = [];
        }

        // Aggregate matching marks
        for (const mark of matchingMarks) {
            let existingMark;
            if (question.SUB_SEC !== 'ab') {
                const key = `Section${sectionLabel}`;
                // For non-ab sections, aggregate by qbno only (matching backend behavior)
                existingMark = sections[key].find((m) => m.qbno === mark.qbno);
                const markValue = mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get);
                const markValueForDecimal = mark.Marks_Get == 'NA' ? -0.001 : parseFloat(mark.Marks_Get);
                if (existingMark) {
                    existingMark.marks += markValue;
                    existingMark.dummy_marks += markValue;
                    existingMark.decimal_marks += markValueForDecimal;
                } else {
                    sections[key].push({
                        qbno: mark.qbno,
                        marks: markValue,
                        dummy_marks: markValue,
                        decimal_marks: markValueForDecimal,
                        Qst_Valid: "N",
                        section: mark.section || sectionLabel,
                        sub_section: mark.sub_section || '',
                        add_sub_section: mark.add_sub_section || '',
                        original_Marks_Get: mark.original_Marks_Get, // Preserve original value
                    });
                }
            } else {
                const keyA = `Section${sectionLabel}a`;
                const keyB = `Section${sectionLabel}b`;
                // For 'ab' sections, implement three-tier mark tracking
                const markValue = mark.Marks_Get == 'NA' ? 0.001 : parseFloat(mark.Marks_Get);
                const markValueForDecimal = mark.Marks_Get == 'NA' ? -0.001 : parseFloat(mark.Marks_Get);
                const markCheckValue = mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get);
                if (mark.sub_section === 'a') {
                    existingMark = sections[keyA].find((m) => m.qbno === mark.qbno);
                    if (existingMark) {
                        existingMark.marks += markValue;
                        existingMark.dummy_marks += markValue;
                        existingMark.decimal_marks += markValueForDecimal;
                        existingMark.check_marks += markCheckValue;
                    } else {
                        sections[keyA].push({
                            qbno: mark.qbno,
                            marks: markValue,
                            dummy_marks: markValue,
                            decimal_marks: markValueForDecimal,
                            check_marks: markCheckValue,
                            Qst_Valid: "N",
                            section: mark.section || sectionLabel,
                            sub_section: mark.sub_section || 'a',
                            add_sub_section: mark.add_sub_section || '',
                            original_Marks_Get: mark.original_Marks_Get, // Preserve original value
                        });
                    }
                } else if (mark.sub_section === 'b') {
                    existingMark = sections[keyB].find((m) => m.qbno === mark.qbno);
                    if (existingMark) {
                        existingMark.marks += markValue;
                        existingMark.dummy_marks += markValue;
                        existingMark.decimal_marks += markValueForDecimal;
                        existingMark.check_marks += markCheckValue;
                    } else {
                        sections[keyB].push({
                            qbno: mark.qbno,
                            marks: markValue,
                            dummy_marks: markValue,
                            decimal_marks: markValueForDecimal,
                            check_marks: markCheckValue,
                            Qst_Valid: "N",
                            section: mark.section || sectionLabel,
                            sub_section: mark.sub_section || 'b',
                            add_sub_section: mark.add_sub_section || '',
                            original_Marks_Get: mark.original_Marks_Get, // Preserve original value
                        });
                    }
                }
            }
        }
    }

    // All section keys
    const allSectionKeys = Object.keys(sections);

    // Compulsory Questions Handling C_QST
    let C_QST_List = [];
    valid_Question.forEach((question) => {
        if (question.C_QST) {
            C_QST_List = question.C_QST.split(',');
            let newSection = 'Section' + question.SECTION;
            if (sections[newSection]) {
                for (let i = 0; i < C_QST_List.length; i++) {
                    C_QST_List[i] = C_QST_List[i].trim();
                    sections[newSection].forEach((item) => {
                        if (C_QST_List.includes(item.qbno.toString())) {
                            item.dummy_marks = 99;
                        }
                    });
                }
            }
        }
    });

    // Sort each section based on decimal_marks in descending order
    allSectionKeys.forEach((key) => {
        sections[key] = sections[key].sort(
            (a, b) => parseFloat(b.decimal_marks) - parseFloat(a.decimal_marks)
        );
    });

    // Element Selection Based on Valid Questions
    let Final_Qst = { Sections: [] };
    let Final_Marks = 0;
    let Section_Qst = { Sectionsab: [] };

    valid_Question.forEach((question) => {
        if (question.SUB_SEC == 'ab') {
            const foundItemA = sections[`Section${question.SECTION}a`];
            const foundItemB = sections[`Section${question.SECTION}b`];
            if (foundItemA && foundItemB) {
                const from = Number((question.FROM_QST || question.FROMQST || question.FROM) || 0);
                const to = Number((question.TO_QST || question.TOQST || question.TO) || 0);
                
                // Loop through each question number in the range
                for (let qNum = from; qNum <= to; qNum++) {
                    const itemA = foundItemA.find(item => item.qbno === qNum);
                    const itemB = foundItemB.find(item => item.qbno === qNum);
                    
                    // If both items exist, compare them
                    if (itemA && itemB) {
                        // Check if both check_marks are 0 (both are NA or both are 0)
                        if (itemA.check_marks === 0 && itemB.check_marks === 0) {
                            // Use decimal comparison - if A's decimal is less than B's, choose B
                            if (itemA.decimal_marks < itemB.decimal_marks) {
                                Section_Qst['Sectionsab'].push({
                                    qbno: itemB.qbno,
                                    sub_subction: 'b',
                                });
                                Final_Marks += itemB.check_marks;
                                itemB.Qst_Valid = 'Y';
                            } else {
                                // Otherwise choose A
                                Section_Qst['Sectionsab'].push({
                                    qbno: itemA.qbno,
                                    sub_subction: 'a',
                                });
                                itemA.Qst_Valid = 'Y';
                                Final_Marks += itemA.check_marks;
                            }
                        } else if (itemA.check_marks >= itemB.check_marks && itemA.check_marks >= 0) {
                            // A has higher or equal check_marks and check_marks is non-negative
                            Section_Qst['Sectionsab'].push({
                                qbno: itemA.qbno,
                                sub_subction: 'a',
                            });
                            itemA.Qst_Valid = 'Y';
                            Final_Marks += itemA.check_marks;
                        } else if (itemB.check_marks >= 0) {
                            // B has higher check_marks or A's check_marks is negative
                            Section_Qst['Sectionsab'].push({
                                qbno: itemB.qbno,
                                sub_subction: 'b',
                            });
                            Final_Marks += itemB.check_marks;
                            itemB.Qst_Valid = 'Y';
                        }
                    } else if (itemA && itemA.check_marks >= 0) {
                        // Only A exists and check_marks is valid
                        Section_Qst['Sectionsab'].push({
                            qbno: itemA.qbno,
                            sub_subction: 'a',
                        });
                        itemA.Qst_Valid = 'Y';
                        Final_Marks += itemA.check_marks;
                    } else if (itemB && itemB.check_marks >= 0) {
                        // Only B exists and check_marks is valid
                        Section_Qst['Sectionsab'].push({
                            qbno: itemB.qbno,
                            sub_subction: 'b',
                        });
                        Final_Marks += itemB.check_marks;
                        itemB.Qst_Valid = 'Y';
                    }
                }
            }
        } else {
            const foundItem = sections[`Section${question.SECTION}`];
            if (foundItem) {
                const numQuestions = parseInt(question.NOQST);
                const compulsoryQst = question.C_QST ? parseInt(question.C_QST) : null;
                const from = Number(question.FROM_QST || 0);
                const to = Number(question.TO_QST || 0);
                
                // Filter items to only those in the current question range (FROM_QST to TO_QST)
                const itemsInRange = foundItem.filter(item => {
                    const qbn = parseInt(item.qbno);
                    return qbn >= from && qbn <= to;
                });
                
                // Track which questions have been selected
                const selectedQuestions = [];
                
                // First, if there's a compulsory question, always include it
                if (compulsoryQst !== null) {
                    const compulsoryItem = itemsInRange.find(item => item.qbno === compulsoryQst);
                    if (compulsoryItem) {
                        selectedQuestions.push(compulsoryItem);
                        Final_Qst['Sections'].push({
                            qbno: compulsoryItem.qbno,
                            isCompulsory: true
                        });
                        Final_Marks += compulsoryItem.marks;
                        compulsoryItem.Qst_Valid = 'Y';
                    }
                }
                
                // Then, select the remaining questions based on highest marks from this range only
                // Exclude already selected compulsory questions
                const remainingItems = itemsInRange.filter(item =>
                    !selectedQuestions.some(selected => selected.qbno === item.qbno)
                );
                
                const questionsToSelect = numQuestions - selectedQuestions.length;
                for (let i = 0; i < Math.min(questionsToSelect, remainingItems.length); i++) {
                    Final_Qst['Sections'].push({
                        qbno: remainingItems[i].qbno,
                    });
                    Final_Marks += remainingItems[i].marks;
                    remainingItems[i].Qst_Valid = 'Y';
                }
            }
        }
    });

    const totalRoundedMarks = Math.round(Final_Marks);

    // Collect all questions with their Qst_Valid status and marks
    const QuestionValidStatus = [];
    allSectionKeys.forEach((key) => {
        sections[key].forEach((item) => {
            QuestionValidStatus.push({
                qbno: item.qbno,
                marks: item.marks,
                Qst_Valid: item.Qst_Valid,
                section: item.section || '',
                sub_section: item.sub_section || '',
                add_sub_section: item.add_sub_section || '',
                original_Marks_Get: item.original_Marks_Get, // Include original value
            });
        });
    });

    // Calculate total marks for each section (only for selected questions with Qst_Valid = "Y")
    const SectionWiseMarks = {};
    allSectionKeys.forEach((key) => {
        const totalMarks = sections[key]
            .filter((item) => item.Qst_Valid === 'Y')
            .reduce((sum, item) => {
                // For ab sections, use check_marks to avoid 0.001 from NA values
                const marksToAdd = item.check_marks !== undefined ? item.check_marks : item.marks;
                return sum + (marksToAdd || 0);
            }, 0);
        SectionWiseMarks[key] = totalMarks;
    });

    return {
        message: 'Finalization successful frontend',
        Final_Marks,
        Regular_Questions: Final_Qst.Sections.length,
        AB_Questions: Section_Qst.Sectionsab.length,
        Total_Rounded_Marks: totalRoundedMarks,
        QuestionValidStatus,
        SectionWiseMarks,
    };
};

export default markCalulation;