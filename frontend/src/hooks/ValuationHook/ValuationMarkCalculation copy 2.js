// Client-side implementation of the server's `valuation_Finalize` summarization logic.
// Accepts `valuationDataMark` (array or object map of marks), optional `markType` (unused),
// and `questiData` (object with `Valid_Question` and optionally `Valid_Section`).
const markCalulation = (valuationDataMark, markType, questiData) => {
    // Normalize marks into an array of entries similar to server `val_data_section` rows
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
            if (!mark.section) return false;
            if (mark.section !== sectionLabel) return false;
            const qbn = parseInt(mark.qbno);
            return parseInt(from) <= qbn && qbn <= parseInt(to);
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
            for (let i = 0; i < C_QST_List.length; i++) {
                C_QST_List[i] = C_QST_List[i].trim();
                sections[newSection].forEach((item) => {
                    if (C_QST_List.includes(item.qbno.toString())) {
                        item.dummy_marks = 99;
                    }
                });
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
                        // Check if both marks are 0 and both check_marks are 0
                        if (itemA.marks === 0 && itemB.marks === 0 && itemA.check_marks === 0 && itemB.check_marks === 0) {
                            // Use decimal comparison - if A's decimal is less than B's, choose B
                            if (itemA.decimal_marks < itemB.decimal_marks) {
                                Section_Qst['Sectionsab'].push({
                                    qbno: itemB.qbno,
                                    sub_subction: 'b',
                                });
                                Final_Marks += itemB.marks;
                                itemB.Qst_Valid = 'Y';
                            } else {
                                // Otherwise choose A
                                Section_Qst['Sectionsab'].push({
                                    qbno: itemA.qbno,
                                    sub_subction: 'a',
                                });
                                itemA.Qst_Valid = 'Y';
                                Final_Marks += itemA.marks;
                            }
                        } else if (itemA.marks >= itemB.marks && itemA.check_marks >= 0) {
                            // A has higher or equal marks and check_marks is non-negative
                            Section_Qst['Sectionsab'].push({
                                qbno: itemA.qbno,
                                sub_subction: 'a',
                            });
                            itemA.Qst_Valid = 'Y';
                            Final_Marks += itemA.marks;
                        } else if (itemB.check_marks >= 0) {
                            // B has higher marks or A's check_marks is negative
                            Section_Qst['Sectionsab'].push({
                                qbno: itemB.qbno,
                                sub_subction: 'b',
                            });
                            Final_Marks += itemB.marks;
                            itemB.Qst_Valid = 'Y';
                        }
                    } else if (itemA && itemA.check_marks >= 0) {
                        // Only A exists and check_marks is valid
                        Section_Qst['Sectionsab'].push({
                            qbno: itemA.qbno,
                            sub_subction: 'a',
                        });
                        itemA.Qst_Valid = 'Y';
                        Final_Marks += itemA.marks;
                    } else if (itemB && itemB.check_marks >= 0) {
                        // Only B exists and check_marks is valid
                        Section_Qst['Sectionsab'].push({
                            qbno: itemB.qbno,
                            sub_subction: 'b',
                        });
                        Final_Marks += itemB.marks;
                        itemB.Qst_Valid = 'Y';
                    }
                }
            }
        } else {
            const foundItem = sections[`Section${question.SECTION}`];
            if (foundItem) {
                for (let i = 0; i < foundItem.length; i++) {
                    if (parseInt(question.NOQST) > i) {
                        Final_Qst['Sections'].push({
                            qbno: foundItem[i].qbno,
                        });
                        Final_Marks += foundItem[i].marks;
                        foundItem[i].Qst_Valid = 'Y';
                    }
                }
            }
        }
    });

    const totalRoundedMarks = Math.round(Final_Marks);

    // Collect all questions with their Qst_Valid status and marks
    const QuestionValidStatus = [];
    allSectionKeys.forEach((key) => {
        // Extract sub_section from key (e.g., "SectionCa" -> "a", "SectionC" -> "")
        const subSectionMatch = key.match(/Section([A-Z]+)([ab]?)$/);
        const subSection = subSectionMatch ? subSectionMatch[2] : '';
        
        sections[key].forEach((item) => {
            QuestionValidStatus.push({
                qbno: item.qbno,
                marks: item.marks,
                Qst_Valid: item.Qst_Valid,
                sub_section: subSection,
                original_Marks_Get: item.original_Marks_Get, // Include original value
            });
        });
    });

    // Calculate total marks for each section (only for selected questions with Qst_Valid = "Y")
    const SectionWiseMarks = {};
    allSectionKeys.forEach((key) => {
        const totalMarks = sections[key]
            .filter((item) => item.Qst_Valid === 'Y')
            .reduce((sum, item) => sum + (item.marks || 0), 0);
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