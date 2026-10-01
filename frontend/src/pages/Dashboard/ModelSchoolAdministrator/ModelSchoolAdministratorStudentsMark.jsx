import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiDownload,
  FiSearch,
  FiUsers,
} from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ModelSchoolAdministratorNav from "./ModelSchoolAdministratorNav";
import { useGetModelSchoolStudentMarksQuery } from "../../../redux-slice/modelSchoolAdministratorApiSlice";
import { useGetAllTestMastersQuery } from "../../../redux-slice/testMasterApiSlice";
import "./ModelSchoolAdministratorDashboard.css";

const PAGE_SIZE = 50;
const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";
const displayValue = (value) => hasValue(value) ? String(value) : "Data not available";
const displayStatus = (value) => {
  if (!hasValue(value)) return "Data not available";
  const status = String(value).trim().toUpperCase();
  if (status === "YES") return "Marked";
  if (status === "NO" || status === "N") return "Not checked";
  return String(value);
};
const numericValue = (value) => hasValue(value) && Number.isFinite(Number(value)) ? Number(value) : null;
const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const downloadMarks = (testcode, district, subjects, students) => {
  const rows = [
    [`Student Marks | Testcode ${testcode} | District ${district}`],
    [],
    ["District Code", "EMIS / Roll No.", ...subjects.flatMap((subject) => [
      `${subject} Subcode`, `${subject} Mark`, `${subject} Rounded`, `${subject} Status`,
    ])],
    ...students.map((student) => [
      student.dcode,
      student.batchname,
      ...subjects.flatMap((subject) => {
        const records = student.marks[subject] || [];
        if (records.length === 0) return ["Data not available", "Data not available", "Data not available", "Data not available"];
        return [
          records.map((record) => displayValue(record.subcode)).join(", "),
          records.map((record) => displayValue(record.total)).join(", "),
          records.map((record) => displayValue(record.tot_round)).join(", "),
          records.map((record) => displayStatus(record.Checked)).join(", "),
        ];
      }),
    ]),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Student Marks");
  XLSX.writeFile(workbook, `student-marks-${testcode}-${district}.xlsx`);
};

const Stat = ({ icon: Icon, label, value, detail, tone }) => (
  <article className={`sm-stat sm-stat--${tone}`}>
    <span className="sm-stat__icon"><Icon /></span>
    <div className="sm-stat__body">
      <span className="sm-stat__label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  </article>
);

const ModelSchoolAdministratorStudentsMark = () => {
  const { data: testMasterResponse } = useGetAllTestMastersQuery({ limit: 200 });
  const [testcode, setTestcode] = useState("");
  const [district, setDistrict] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const {
    data: marksData,
    isFetching: isMarksFetching,
    error: marksError,
  } = useGetModelSchoolStudentMarksQuery(
    { testcode, district },
    { skip: !testcode }
  );

  const testcodes = useMemo(
    () => [...new Set((testMasterResponse?.data || []).map((row) => row.testcode).filter(Boolean))].sort(),
    [testMasterResponse]
  );
  const districts = useMemo(
    () => marksData?.districts || [],
    [marksData]
  );
  const subjects = marksData?.subjects || [];
  const rawRows = marksData?.rows || [];

  const students = useMemo(() => {
    const studentsByBatch = new Map();
    rawRows.forEach((row) => {
      const studentKey = `${row.dcode || ""}\u0000${row.batchname || ""}`;
      if (!studentsByBatch.has(studentKey)) {
        studentsByBatch.set(studentKey, { dcode: row.dcode, batchname: row.batchname, marks: {} });
      }
      const student = studentsByBatch.get(studentKey);
      if (!student.marks[row.subject]) student.marks[row.subject] = [];
      student.marks[row.subject].push(row);
    });
    return [...studentsByBatch.values()].sort((left, right) =>
      String(left.dcode).localeCompare(String(right.dcode), undefined, { numeric: true }) ||
      String(left.batchname).localeCompare(String(right.batchname), undefined, { numeric: true })
    );
  }, [rawRows]);

  const subjectStats = useMemo(() => subjects.map((subject) => {
    const rows = rawRows.filter((row) => row.subject === subject);
    const scores = rows.map((row) => numericValue(row.total)).filter((value) => value !== null);
    const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
    return {
      subject,
      records: rows.length,
      scored: scores.length,
      average,
      chartAverage: average ?? 0,
    };
  }), [subjects, rawRows]);

  const markedRecords = rawRows.filter((row) => numericValue(row.total) !== null).length;
  const allScores = rawRows.map((row) => numericValue(row.total)).filter((value) => value !== null);
  const overallAverage = allScores.length ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : null;
  const missingSubjectCells = students.reduce((missing, student) => missing + subjects.filter((subject) =>
    !(student.marks[subject] || []).some((record) => numericValue(record.total) !== null)
  ).length, 0);

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) =>
      String(student.batchname).toLowerCase().includes(term) ||
      String(student.dcode).toLowerCase().includes(term) ||
      subjects.some((subject) => (student.marks[subject] || []).some((record) => String(record.subcode || "").toLowerCase().includes(term)))
    );
  }, [students, subjects, search]);

  const pageCount = Math.max(1, Math.ceil(visibleStudents.length / PAGE_SIZE));
  const pageStudents = visibleStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isInitialSelection = !testcode;

  return (
    <>
      <ModelSchoolAdministratorNav />
      <main className="msa-dashboard sm-dashboard" aria-label="Students Mark">
        <header className="sm-header">
          <div>
            <span className="sm-eyebrow">STUDENT PERFORMANCE</span>
            <h1>Marks overview</h1>
            <p>Compare subject marks and inspect each student record.</p>
          </div>
          <button
            type="button"
            className="sm-export"
            onClick={() => downloadMarks(testcode, district, subjects, visibleStudents)}
            disabled={isInitialSelection || isMarksFetching || !!marksError || students.length === 0}
          >
            <FiDownload /> Export Excel
          </button>
        </header>

        <section className="msa-new-dashboard-filters msa-students-mark-filters" aria-label="Students Mark filters">
          <label>
            <span>Testcode</span>
            <select value={testcode} onChange={(event) => { setTestcode(event.target.value); setDistrict(""); setSearch(""); setPage(1); }}>
              <option value="">Select testcode</option>
              {testcodes.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>District Code</span>
            <select value={district} onChange={(event) => { setDistrict(event.target.value); setSearch(""); setPage(1); }} disabled={!testcode}>
              <option value="">All districts</option>
              {districts.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </section>

        {testcode && (
          isMarksFetching ? (
            <div className="sm-state"><span className="msa-spinner" />Loading student marks...</div>
          ) : marksError ? (
            <div className="sm-state sm-state--error"><FiAlertCircle />Student marks could not be loaded.</div>
          ) : students.length === 0 ? (
            <div className="sm-state">No student mark data is available for this selection.</div>
          ) : (
            <>
              <section className="sm-stats" aria-label="Student marks summary">
                <Stat icon={FiUsers} label="Students" value={formatNumber(students.length)} detail={`Testcode ${testcode}`} tone="blue" />
                <Stat icon={FiCheckCircle} label="Marks recorded" value={formatNumber(markedRecords)} detail={`of ${formatNumber(rawRows.length)} subject records`} tone="green" />
                <Stat icon={FiActivity} label="Average mark" value={overallAverage === null ? "Data not available" : overallAverage.toFixed(2)} detail="Across available subject marks" tone="amber" />
                <Stat icon={FiAlertCircle} label="Missing subject marks" value={formatNumber(missingSubjectCells)} detail="Student and subject combinations" tone="red" />
              </section>

              <section className="sm-analysis" aria-label="Subject performance">
                <div className="sm-panel sm-chart-panel">
                  <div className="sm-panel__heading">
                    <div><span>SUBJECT PERFORMANCE</span><h2>Average mark by subject</h2></div>
                    <small>{formatNumber(allScores.length)} scored records</small>
                  </div>
                  <div className="sm-chart">
                    {allScores.length === 0 ? (
                      <div className="sm-chart-empty">
                        <FiActivity />
                        <strong>No marks entered yet</strong>
                        <span>Subject averages will appear once marks are available.</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectStats} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
                          <CartesianGrid stroke="#e8eeeb" vertical={false} />
                          <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: "#64717d", fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64717d", fontSize: 11 }} />
                          <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                          <Bar dataKey="chartAverage" name="Average mark" fill="#177a4c" radius={[4, 4, 0, 0]} maxBarSize={54} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                <div className="sm-panel sm-subject-panel">
                  <div className="sm-panel__heading"><div><span>SUBJECT BREAKDOWN</span><h2>Coverage</h2></div></div>
                  {subjectStats.map((subject) => (
                    <div className="sm-subject-row" key={subject.subject}>
                      <div><strong>{subject.subject}</strong><small>{formatNumber(subject.records)} records · {formatNumber(subject.scored)} marks</small></div>
                      <b>{subject.average === null ? "Data not available" : subject.average.toFixed(2)}</b>
                    </div>
                  ))}
                </div>
              </section>

              <section className="sm-records" aria-label="Student marks records">
                <div className="sm-records__toolbar">
                  <div><span>STUDENT RECORDS</span><h2>Marks by EMIS / roll number</h2><small>{formatNumber(visibleStudents.length)} students</small></div>
                  <label className="sm-search"><FiSearch /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search EMIS or subcode" /></label>
                </div>
                <div className="sm-table-wrap">
                  <table className="sm-table">
                    <thead>
                      <tr><th rowSpan="2">District Code</th><th rowSpan="2">EMIS / Roll No.</th>{subjects.map((subject) => <th key={subject} colSpan="3">{subject}</th>)}</tr>
                      <tr>{subjects.flatMap((subject) => [<th key={`${subject}-mark`}>Mark</th>, <th key={`${subject}-rounded`}>Rounded</th>, <th key={`${subject}-status`} title="Marked means Checked = Yes; Not checked means awaiting marking">Marking status</th>])}</tr>
                    </thead>
                    <tbody>
                      {pageStudents.map((student) => (
                        <tr key={`${student.dcode}-${student.batchname}`}>
                          <td>{student.dcode}</td>
                          <td><strong>{student.batchname}</strong></td>
                          {subjects.flatMap((subject) => {
                            const records = student.marks[subject] || [];
                            if (records.length === 0) {
                              return [
                                <td key={`${subject}-missing-mark`}>Data not available</td>,
                                <td key={`${subject}-missing-rounded`}>Data not available</td>,
                                <td key={`${subject}-missing-status`}>Data not available</td>,
                              ];
                            }
                            return [
                              <td key={`${subject}-mark`}>{records.map((record) => <span className="sm-value" key={record.subcode}>{displayValue(record.total)}</span>)}</td>,
                              <td key={`${subject}-rounded`}>{records.map((record) => <span className="sm-value" key={record.subcode}>{displayValue(record.tot_round)}</span>)}</td>,
                              <td key={`${subject}-status`}>{records.map((record) => <span className="sm-value" key={record.subcode}>{displayStatus(record.Checked)}</span>)}</td>,
                            ];
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <footer className="sm-pagination">
                  <span>Showing {visibleStudents.length ? (page - 1) * PAGE_SIZE + 1 : 0}-{Math.min(page * PAGE_SIZE, visibleStudents.length)} of {formatNumber(visibleStudents.length)}</span>
                  <div><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><FiArrowLeft /></button><strong>{page} / {pageCount}</strong><button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}><FiArrowRight /></button></div>
                </footer>
              </section>
            </>
          )
        )}
      </main>
    </>
  );
};

export default ModelSchoolAdministratorStudentsMark;