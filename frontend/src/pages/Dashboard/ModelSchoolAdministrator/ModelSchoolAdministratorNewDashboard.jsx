import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { FiDownload } from "react-icons/fi";
import ModelSchoolAdministratorNav from "./ModelSchoolAdministratorNav";
import { useGetModelSchoolAdministratorDashboardQuery } from "../../../redux-slice/modelSchoolAdministratorApiSlice";
import { useGetModelSchoolUploadInventoryQuery } from "../../../redux-slice/modelSchoolAdministratorApiSlice";
import { useGetAllTestMastersQuery } from "../../../redux-slice/testMasterApiSlice";
import "./ModelSchoolAdministratorDashboard.css";

const normalizeCode = (value) => String(value ?? "").trim().toUpperCase();
const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");
const toS3Subject = (subcode) => {
  const value = String(subcode || "").trim().toUpperCase();
  if (value.startsWith("PHYSICS")) return "PHYSICS_01";
  if (value.startsWith("CHEMISTRY")) return "CHEMISTRY_02";
  if (value.startsWith("MATH")) return "MATHS_03";
  if (value.startsWith("BIOLOGY")) return "BIOLOGY_04";
  return value;
};

const formatAsOf = (value) => new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
}).format(value ? new Date(value) : new Date());

const ModelSchoolAdministratorNewDashboard = () => {
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useGetModelSchoolAdministratorDashboardQuery();
  const { data: uploadData, isLoading: isUploadLoading, error: uploadError } = useGetModelSchoolUploadInventoryQuery();
  const { data: testMasterResponse, isLoading: isTestMasterLoading, error: testMasterError } = useGetAllTestMastersQuery({ limit: 200 });
  const [date, setDate] = useState("");
  const [standard, setStandard] = useState("");
  const [testcode, setTestcode] = useState("");
  const [district, setDistrict] = useState("");
  const [subcode, setSubcode] = useState("");
  const inventory = dashboardData?.district_subject || [];
  const testMasters = testMasterResponse?.data || [];
  const uploadedPapers = (uploadData?.papers || []).filter((paper) => Number(paper.s3_images) > 0);

  const dates = useMemo(
    () => [...new Set(testMasters.map((row) => row.testdate).filter(Boolean))].sort(),
    [testMasters]
  );
  const classes = useMemo(
    () => [...new Set(testMasters
      .filter((row) => !date || row.testdate === date)
      .map((row) => row.std)
      .filter(Boolean))].sort((left, right) => Number(left) - Number(right)),
    [testMasters, date]
  );
  const testcodes = useMemo(
    () => [...new Set(testMasters
      .filter((row) => (!date || row.testdate === date) && (!standard || row.std === standard))
      .map((row) => row.testcode)
      .filter(Boolean))].sort(),
    [testMasters, date, standard]
  );
  const districts = useMemo(
    () => [...new Set(uploadedPapers
      .filter((row) => testcodes.some((code) => normalizeCode(code) === normalizeCode(row.testcode)))
      .filter((row) => !testcode || normalizeCode(row.testcode) === normalizeCode(testcode))
      .map((row) => row.district)
      .filter(Boolean))].sort(),
    [uploadedPapers, testcodes, testcode]
  );
  const subjects = useMemo(
    () => {
      const matchingRows = inventory.filter((row) =>
        normalizeCode(row.testcode) === normalizeCode(testcode) &&
        normalizeCode(row.district) === normalizeCode(district)
      );
      const uniqueSubjects = new Map();
      matchingRows.forEach((row) => {
        const code = String(row.subcode ?? "").trim();
        if (code && !uniqueSubjects.has(code)) uniqueSubjects.set(code, row);
      });
      return [...uniqueSubjects.values()];
    },
    [inventory, testcode, district]
  );
  const reportRows = useMemo(() => testMasters
    .filter((master) => (!date || master.testdate === date) && (!standard || master.std === standard))
    .filter((master) => !testcode || normalizeCode(master.testcode) === normalizeCode(testcode))
    .map((master) => {
      const subjectFilter = subcode ? toS3Subject(subcode) : "";
      const papers = uploadedPapers.filter((paper) =>
        normalizeCode(paper.testcode) === normalizeCode(master.testcode) &&
        (!district || normalizeCode(paper.district) === normalizeCode(district)) &&
        (!subjectFilter || normalizeCode(paper.subject) === subjectFilter)
      );
      const uploaded = papers.length;
      const corrected = papers.filter((paper) => paper.processing_status === "Completed").length;
      const pending = uploaded - corrected;
      return {
        testcode: master.testcode,
        day: master.day,
        stream: master.type_of_exam === "001" ? "JEE" : master.type_of_exam === "002" ? "NEET" : master.type_of_exam,
        standard: master.std,
        uploaded,
        answerSheetFolder: papers.filter((paper) => paper.answer_sheet_uploaded).length,
        moveAnswerSheetFolder: papers.filter((paper) => paper.move_answer_sheet_uploaded).length,
        corrected,
        pending,
        correctionPercent: uploaded ? (corrected / uploaded) * 100 : 0,
        pendingPercent: uploaded ? (pending / uploaded) * 100 : 0,
      };
    })
    .sort((left, right) => Number(left.day) - Number(right.day) || left.stream.localeCompare(right.stream) || Number(left.standard) - Number(right.standard)),
  [testMasters, uploadedPapers, date, standard, testcode, district, subcode]);
  const uploadedTotal = reportRows.reduce((total, row) => total + row.uploaded, 0);
  const answerSheetFolderTotal = reportRows.reduce((total, row) => total + row.answerSheetFolder, 0);
  const moveAnswerSheetFolderTotal = reportRows.reduce((total, row) => total + row.moveAnswerSheetFolder, 0);
  const loadError = dashboardError || uploadError || testMasterError;
  const isLoading = isDashboardLoading || isUploadLoading || isTestMasterLoading;

  const downloadExcel = () => {
    const worksheetData = [
      [`VETRI PALLIGAL ONSREE MARKING - As of ${formatAsOf(uploadData?.generated_at)}`],
      [],
      ["Day", "Stream", "Class", "Uploaded Papers", "", "Corrected Papers", "Pending Papers", "Correction %", "Pending %"],
      ["", "", "", `Roll No uploaded in the cloud (${answerSheetFolderTotal})`, `Answer sheet moved for valuation (${moveAnswerSheetFolderTotal})`, "", "", "", ""],
      ...reportRows.map((row) => [
        `Day ${row.day}`,
        row.stream,
        row.standard,
        row.answerSheetFolder,
        row.moveAnswerSheetFolder,
        row.corrected,
        row.pending,
        Number(row.correctionPercent.toFixed(2)),
        Number(row.pendingPercent.toFixed(2)),
      ]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
      { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
      { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
      { s: { r: 2, c: 3 }, e: { r: 2, c: 4 } },
      { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } },
      { s: { r: 2, c: 6 }, e: { r: 3, c: 6 } },
      { s: { r: 2, c: 7 }, e: { r: 3, c: 7 } },
      { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } },
    ];
    worksheet["!cols"] = [
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 24 }, { wch: 34 },
      { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Marking Summary");
    XLSX.writeFile(workbook, `model-school-marking-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <ModelSchoolAdministratorNav />
      <main className="msa-dashboard" aria-label="New dashboard">
        <section className="msa-new-dashboard-filters" aria-label="Dashboard filters">
          <label>
            <span>Date</span>
            <select value={date} onChange={(event) => { setDate(event.target.value); setStandard(""); setTestcode(""); setDistrict(""); setSubcode(""); }}>
              <option value="">Select date</option>
              {dates.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>Class</span>
            <select value={standard} onChange={(event) => { setStandard(event.target.value); setTestcode(""); setDistrict(""); setSubcode(""); }}>
              <option value="">Select class</option>
              {classes.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>Testcode</span>
            <select value={testcode} onChange={(event) => { setTestcode(event.target.value); setDistrict(""); setSubcode(""); }}>
              <option value="">Select testcode</option>
              {testcodes.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>District Code</span>
            <select value={district} onChange={(event) => { setDistrict(event.target.value); setSubcode(""); }} disabled={!testcode}>
              <option value="">Select district code</option>
              {districts.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>Subject</span>
            <select value={subcode} onChange={(event) => setSubcode(event.target.value)} disabled={!district}>
              <option value="">Select subject</option>
              {subjects.map((row) => <option key={row.subcode} value={row.subcode}>{row.subcode}</option>)}
            </select>
          </label>
        </section>
        <section className="msa-marking-report" aria-label="Marking summary">
          <header className="msa-marking-report__header">
            <h1>VETRI PALLIGAL ONSREE MARKING - As of {formatAsOf(uploadData?.generated_at)}</h1>
            <button type="button" className="msa-marking-report__download" onClick={downloadExcel} disabled={isLoading || !!loadError || reportRows.length === 0}>
              <FiDownload /> Download Excel
            </button>
          </header>
          <div className="msa-marking-table-wrap">
            <table className="msa-marking-table">
              <thead>
                <tr>
                  <th rowSpan="2">Day</th>
                  <th rowSpan="2">Stream</th>
                  <th rowSpan="2">Class</th>
                  <th colSpan="2">Uploaded Papers<small>{formatNumber(uploadedTotal)} unique S3 papers</small></th>
                  <th rowSpan="2">Corrected Papers</th>
                  <th rowSpan="2">Pending Papers</th>
                  <th rowSpan="2">Correction %</th>
                  <th rowSpan="2">Pending %</th>
                </tr>
                <tr><th>Roll No uploaded in the cloud<small>{formatNumber(answerSheetFolderTotal)}</small></th><th>Answer sheet moved for valuation<small>{formatNumber(moveAnswerSheetFolderTotal)}</small></th></tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="9">Loading live S3 marking data...</td></tr>
                ) : loadError ? (
                  <tr><td colSpan="9">Marking data could not be loaded.</td></tr>
                ) : reportRows.length === 0 ? (
                  <tr><td colSpan="9">No testcodes match the selected filters.</td></tr>
                ) : reportRows.map((row) => (
                  <tr key={row.testcode}>
                    <td>Day {row.day}</td>
                    <td>{row.stream}</td>
                    <td>{row.standard}</td>
                    <td>{formatNumber(row.answerSheetFolder)}</td>
                    <td>{formatNumber(row.moveAnswerSheetFolder)}</td>
                    <td>{formatNumber(row.corrected)}</td>
                    <td>{formatNumber(row.pending)}</td>
                    <td>{row.correctionPercent.toFixed(2)}</td>
                    <td>{row.pendingPercent.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
};

export default ModelSchoolAdministratorNewDashboard;
