import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FaFileExcel, FaUpload, FaDownload, FaCalculator } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import {
  useEnrichTemplateExcelRowsMutation,
  useCalculateTemplateStatisticsRowsMutation,
} from '../../redux-slice/exceluploadOperationApiSlice';

const readExcelFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = rawRows[0] || [];
        const bodyRows = rawRows
          .slice(1)
          .filter((row) =>
            row.some(
              (cell) => cell !== undefined && cell !== null && String(cell).trim() !== '',
            ),
          );

        const formattedRows = bodyRows.map((row) => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] !== undefined && row[index] !== null ? row[index] : '';
          });
          return obj;
        });

        resolve({
          headers,
          rows: formattedRows,
          totalRows: formattedRows.length,
          sheetName: firstSheet,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });

const normalizeHeaderKey = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value)
    .replace(/\*/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase();
};

const findValueByAliases = (row, aliases = []) => {
  if (!row || typeof row !== 'object') {
    return '';
  }

  const normalizedAliasSet = new Set(aliases.map((alias) => normalizeHeaderKey(alias)));

  for (const key of Object.keys(row)) {
    if (normalizedAliasSet.has(normalizeHeaderKey(key))) {
      return row[key];
    }
  }

  return '';
};

const buildStatisticsInputRow = (row) => ({
  TESTCODE: String(findValueByAliases(row, ['TESTCODE', 'TEST CODE', 'Test_Code', 'Test Code', 'Testcode']) ?? ''),
  'Emis NO': String(findValueByAliases(row, ['Emis NO', 'Emis_id', 'EMIS ID', 'EMIS_ID', 'EMIS Number', 'EMIS', 'Roll No', 'ROLLNO', 'ROLL NO']) ?? ''),
  student_name: String(findValueByAliases(row, ['student_name', 'Student Name', 'Candidate_Name', 'Candidate Name']) ?? ''),
  Question_set_id: String(findValueByAliases(row, ['Question_set_id', 'Question Set Id', 'Question Set ID', 'Q_SET_ID']) ?? ''),
  'Exam Name': String(findValueByAliases(row, ['Exam Name', 'Exam_Name', 'ExamName']) ?? ''),
  q_format: String(findValueByAliases(row, ['q_format', 'Q_FORMAT', 'Question Format']) ?? ''),
  format_name: String(findValueByAliases(row, ['format_name', 'Format Name', 'FORMAT_NAME']) ?? ''),
  subject: String(findValueByAliases(row, ['subject', 'Subject']) ?? ''),
  Question_id: String(findValueByAliases(row, ['Question_id', 'Question ID', 'QUESTION_ID']) ?? ''),
  sequence_id: String(findValueByAliases(row, ['sequence_id', 'Sequence ID', 'SEQUENCE_ID']) ?? ''),
  correct_options: String(findValueByAliases(row, ['correct_options', 'Correct Options', 'correct option', 'Correct_Options']) ?? ''),
  Given_Answer: String(findValueByAliases(row, ['Given_Answer', 'Given Answer', 'given_answer', 'Given Option', 'Given_Option']) ?? ''),
});

const normalizeStatisticsOption = (value) => String(value || '').trim().toUpperCase();

const buildAcceptedStatisticsAnswers = (correctOptions) => {
  const normalized = normalizeStatisticsOption(correctOptions);

  if (!normalized) {
    return [];
  }

  const splitTokens = normalized
    .replace(/\bOR\b/g, '|')
    .replace(/\bAND\b/g, '|')
    .replace(/[/,&|]+/g, '|')
    .split('|')
    .map((token) => normalizeStatisticsOption(token))
    .filter(Boolean);

  if (splitTokens.length) {
    return [...new Set(splitTokens)];
  }

  return [normalized];
};

const calculateStatisticsLocally = (rows) => {
  const computedRows = rows.map((row) => {
    const normalizedTestCode = String(row.TESTCODE || '').trim().toUpperCase();
    const positiveMark = normalizedTestCode.charAt(2) === 'C' ? 5 : 4;
    const correctOptions = String(row.correct_options || '').trim();
    const acceptedAnswers = buildAcceptedStatisticsAnswers(correctOptions);
    const givenAnswer = normalizeStatisticsOption(row.Given_Answer);

    let correctOrIncorrect = 'Wrong';
    let correctMark = -1;
    let outputGivenAnswer = givenAnswer;

    if (!givenAnswer) {
      correctOrIncorrect = 'Blank';
      correctMark = 0;
      outputGivenAnswer = '';
    } else if (acceptedAnswers.includes(givenAnswer)) {
      correctOrIncorrect = 'Correct';
      correctMark = positiveMark;
    }

    return {
      TESTCODE: row.TESTCODE,
      'Emis NO': row['Emis NO'],
      student_name: row.student_name,
      Question_set_id: row.Question_set_id,
      'Exam Name': row['Exam Name'],
      q_format: row.q_format,
      format_name: row.format_name,
      subject: row.subject,
      Question_id: row.Question_id,
      sequence_id: row.sequence_id,
      correct_options: correctOptions,
      Given_Answer: outputGivenAnswer,
      Correct_or_Incorrect: correctOrIncorrect,
      correct_Mark: correctMark,
    };
  });

  const summary = computedRows.reduce(
    (accumulator, row) => {
      accumulator.totalRows += 1;
      if (row.Correct_or_Incorrect === 'Correct') accumulator.correct += 1;
      else if (row.Correct_or_Incorrect === 'Wrong') accumulator.wrong += 1;
      else accumulator.blank += 1;
      accumulator.totalMarks += Number(row.correct_Mark) || 0;
      return accumulator;
    },
    { totalRows: 0, correct: 0, wrong: 0, blank: 0, totalMarks: 0 },
  );

  return { rows: computedRows, summary };
};

const TemplateExcelUpload = () => {
  const [examType, setExamType] = useState('jee');
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [sourceHeaders, setSourceHeaders] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [resultRows, setResultRows] = useState([]);
  const [enrichTemplateExcelRows, { isLoading: isEnriching }] = useEnrichTemplateExcelRowsMutation();

  const [statsFile, setStatsFile] = useState(null);
  const [statsParsedRows, setStatsParsedRows] = useState([]);
  const [statsSourceHeaders, setStatsSourceHeaders] = useState([]);
  const [statsResultRows, setStatsResultRows] = useState([]);
  const [statsSummary, setStatsSummary] = useState(null);
  const [isStatsParsing, setIsStatsParsing] = useState(false);
  const [calculateTemplateStatisticsRows, { isLoading: isStatisticsCalculating }] =
    useCalculateTemplateStatisticsRowsMutation();

  const examLabelMap = {
    jee: 'JEE',
    neet: 'NEET',
    cuet: 'CUET',
    currentaffairs: 'CURRENT AFFAIRS',
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setResultRows([]);
    setIsParsing(true);

    readExcelFile(file)
      .then((excelPayload) => {
        setSourceHeaders(excelPayload.headers);
        setParsedRows(excelPayload.rows);
        toast.success(`Loaded ${excelPayload.totalRows} rows from template.`);
      })
      .catch((error) => {
        console.error(error);
        toast.error('Failed to parse excel file. Please check file format.');
      })
      .finally(() => {
        setIsParsing(false);
      });
  };

  const handleEnrich = async () => {
    if (!parsedRows.length) {
      toast.error('Please upload a template file first.');
      return;
    }

    try {
      const response = await enrichTemplateExcelRows({
        examType,
        rows: parsedRows,
      }).unwrap();

      const rows = response?.data?.rows || [];
      setResultRows(rows);
      toast.success(`Enriched ${rows.length} rows.`);
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.message || 'Failed to enrich template data.');
    }
  };

  const handleDownload = () => {
    if (!resultRows.length) {
      toast.error('No enriched data to download.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(resultRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Data');

    const dateTag = new Date().toISOString().slice(0, 10);
    const fileName = `${examType.toUpperCase()}_Template_Filled_${dateTag}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleStatsFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatsFile(file);
    setStatsResultRows([]);
    setStatsSummary(null);
    setIsStatsParsing(true);

    readExcelFile(file)
      .then((excelPayload) => {
        setStatsSourceHeaders(excelPayload.headers);
        setStatsParsedRows(excelPayload.rows);
        toast.success(`Loaded ${excelPayload.totalRows} statistics rows.`);
      })
      .catch((error) => {
        console.error(error);
        toast.error('Failed to parse statistics excel file.');
      })
      .finally(() => {
        setIsStatsParsing(false);
      });
  };

  const handleStatisticsEnrich = async () => {
    if (!statsParsedRows.length) {
      toast.error('Please upload a statistics file first.');
      return;
    }

    const trimmedRows = statsParsedRows.map(buildStatisticsInputRow);

    try {
      const response = await calculateTemplateStatisticsRows({
        rows: trimmedRows,
      }).unwrap();

      const rows = response?.data?.rows || [];
      setStatsResultRows(rows);
      setStatsSummary(response?.data?.summary || null);
      toast.success(`Calculated statistics for ${rows.length} rows.`);
    } catch (error) {
      console.error(error);
      const fallback = calculateStatisticsLocally(trimmedRows);
      setStatsResultRows(fallback.rows);
      setStatsSummary(fallback.summary);
      toast.warning(error?.data?.message || 'Backend rejected the request. Statistics were calculated locally instead.');
    }
  };

  const handleStatsDownload = () => {
    if (!statsResultRows.length) {
      toast.error('No statistics data to download.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(statsResultRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistics Data');

    const dateTag = new Date().toISOString().slice(0, 10);
    const fileName = `Statistics_Data_${dateTag}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h4 className="mb-0"><FaFileExcel className="me-2" />Template Excel Upload</h4>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Exam Type</Form.Label>
                <Form.Select value={examType} onChange={(e) => setExamType(e.target.value)}>
                  <option value="jee">JEE</option>
                  <option value="neet">NEET</option>
                  <option value="cuet">CUET</option>
                  <option value="currentaffairs">Current Affairs</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Upload Template Excel</Form.Label>
                <Form.Control type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex gap-2 mt-4">
            <Button onClick={handleEnrich} disabled={isParsing || isEnriching || !selectedFile}>
              {isEnriching ? <Spinner size="sm" className="me-2" /> : <FaUpload className="me-2" />}Fill Template Data
            </Button>
            <Button variant="success" onClick={handleDownload} disabled={!resultRows.length}>
              <FaDownload className="me-2" />Download Excel
            </Button>
          </div>

          <Alert variant="info" className="mt-4 mb-0">
            <div><strong>Uploaded File:</strong> {selectedFile?.name || 'None'}</div>
            <div><strong>Selected Exam:</strong> {examLabelMap[examType] || examType.toUpperCase()}</div>
            <div><strong>Headers:</strong> {sourceHeaders.length}</div>
            <div><strong>Input Rows:</strong> {parsedRows.length}</div>
            <div><strong>Enriched Rows:</strong> {resultRows.length}</div>
            <div className="mt-2">Supported on this route: JEE, NEET, CUET and Current Affairs. Use the exam selector before uploading the template.</div>
          </Alert>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h4 className="mb-0"><FaCalculator className="me-2" />Statistics Data Calculator</h4>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Upload Statistics Excel</Form.Label>
                <Form.Control type="file" accept=".xlsx,.xls" onChange={handleStatsFileChange} />
                <Form.Text className="text-muted">
                  Required columns: TESTCODE, Emis NO, student_name, Question_set_id, Exam Name, q_format, format_name, subject, Question_id, sequence_id, correct_options, Given_Answer.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex gap-2 mt-4 flex-wrap">
            <Button
              type="button"
              onClick={handleStatisticsEnrich}
              disabled={isStatsParsing || isStatisticsCalculating || !statsFile}
            >
              {isStatisticsCalculating ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Calculating...
                </>
              ) : isStatsParsing ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Parsing...
                </>
              ) : (
                <>
                  <FaCalculator className="me-2" />Generate Statistics
                </>
              )}
            </Button>
            <Button variant="success" type="button" onClick={handleStatsDownload} disabled={!statsResultRows.length}>
              <FaDownload className="me-2" />Download Statistics Excel
            </Button>
          </div>

          <Alert variant="info" className="mt-4 mb-0">
            <div><strong>Uploaded File:</strong> {statsFile?.name || 'None'}</div>
            <div><strong>Headers:</strong> {statsSourceHeaders.length}</div>
            <div><strong>Input Rows:</strong> {statsParsedRows.length}</div>
            <div><strong>Output Rows:</strong> {statsResultRows.length}</div>
            <div className="mt-2">Scoring logic: matching answer = +4, wrong answer = -1, blank answer = 0.</div>
            {statsSummary && (
              <div className="mt-2">
                <strong>Summary:</strong> Correct {statsSummary.correct}, Wrong {statsSummary.wrong}, Blank {statsSummary.blank}, Total Marks {statsSummary.totalMarks}
              </div>
            )}
          </Alert>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TemplateExcelUpload;
