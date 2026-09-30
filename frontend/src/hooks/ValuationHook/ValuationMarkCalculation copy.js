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
        return {
            qbno: isNaN(qbno) ? (Number(m.qbno) || 0) : qbno,
            section,
            sub_section,
            add_sub_section,
            Marks_Get: Marks_Get === '' ? 'NA' : Marks_Get,
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
                if (existingMark) {
                    existingMark.marks += mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get);
                    existingMark.dummy_marks += mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get);
                } else {
                    sections[key].push({
                        qbno: mark.qbno,
                        marks: mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get),
                        dummy_marks: mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get),
                        Qst_Valid: "N",
                    });
                }
            } else {
                const keyA = `Section${sectionLabel}a`;
                const keyB = `Section${sectionLabel}b`;
                if (mark.sub_section === 'a') {
                    existingMark = sections[keyA].find((m) => m.qbno === mark.qbno);
                    if (existingMark) {
                        existingMark.marks += mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get);
                        existingMark.dummy_marks += mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get);
                    } else {
                        sections[keyA].push({
                            qbno: mark.qbno,
                            marks: mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get),
                            dummy_marks: mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get),
                            Qst_Valid: "N",
                        });
                    }
                } else if (mark.sub_section === 'b') {
                    existingMark = sections[keyB].find((m) => m.qbno === mark.qbno);
                    if (existingMark) {
                        existingMark.marks += mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get);
                        existingMark.dummy_marks += mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get);
                    } else {
                        sections[keyB].push({
                            qbno: mark.qbno,
                            marks: mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get),
                            dummy_marks: mark.Marks_Get == 'NA' ? 0 : parseFloat(mark.Marks_Get),
                            Qst_Valid: "N",
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

    // Sort each section based on dummy_marks in descending order
    allSectionKeys.forEach((key) => {
        sections[key] = sections[key].sort(
            (a, b) => parseFloat(b.dummy_marks) - parseFloat(a.dummy_marks)
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
                for (let i = 0; i < foundItemA.length; i++) {
                    if (foundItemA[i] >= foundItemB[i]) {
                        Section_Qst['Sectionsab'].push({
                            qbno: foundItemA[i].qbno,
                            sub_subction: 'a',
                        });
                        foundItemA[i].Qst_Valid = 'Y';
                        Final_Marks += foundItemA[i].marks;
                    } else {
                        Section_Qst['Sectionsab'].push({
                            qbno: foundItemB[i].qbno,
                            sub_subction: 'b',
                        });
                        Final_Marks += foundItemB[i].marks;
                        foundItemB[i].Qst_Valid = 'Y';
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