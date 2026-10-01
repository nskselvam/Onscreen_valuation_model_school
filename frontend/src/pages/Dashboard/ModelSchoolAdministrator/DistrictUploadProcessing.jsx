import { createElement, Fragment, useMemo, useState } from "react";
import {
  FiAlertTriangle, FiCheckCircle, FiChevronDown, FiChevronLeft, FiChevronRight,
  FiDownload, FiImage, FiInbox, FiMapPin, FiRefreshCw, FiSearch, FiUploadCloud, FiUsers,
} from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useGetModelSchoolUploadInventoryQuery } from "../../../redux-slice/modelSchoolAdministratorApiSlice";
import { useGetAllTestMastersQuery } from "../../../redux-slice/testMasterApiSlice";
import ModelSchoolAdministratorNav from "./ModelSchoolAdministratorNav";
import "./DistrictUploadProcessing.css";

const number = (value) => Number(value || 0).toLocaleString("en-IN");
const statusClass = (status) => status.toLowerCase().replaceAll(" ", "-");
const PAPER_PAGE_SIZE = 50;
const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const exportPapers = (papers) => {
  const columns = [
    ["Day", "day"], ["Stream", "stream"], ["Class", "standard"],
    ["Roll Number", "roll_number"], ["District", "district"], ["Test Code", "testcode"],
    ["Subject", "subject"], ["Roll No uploaded in the cloud", "roll_no_uploaded"],
    ["Answer sheet moved for valuation", "answer_moved"], ["Corrected Papers", "corrected"],
    ["Pending Papers", "pending"], ["Correction %", "correction_percentage"],
    ["Pending %", "pending_percentage"], ["Processing status", "processing_status"],
    ["Next Action", "next_action"], ["Last Upload", "last_upload_at"],
  ];
  const csv = [columns.map(([label]) => escapeCsv(label)).join(","), ...papers.map((row) => columns.map(([, key]) => escapeCsv(row[key])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `model-school-roll-processing-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const UploadMetric = ({ icon, label, value, detail, tone }) => (
  <article className={`msu-metric msu-metric--${tone}`}>{createElement(icon)}<div><span>{label}</span><strong>{number(value)}</strong><small>{detail}</small></div></article>
);

const DistrictUploadProcessing = () => {
  const location = useLocation();
  const processingMode = location.pathname.endsWith("/processing");
  const [refreshToken, setRefreshToken] = useState(0);
  const { data, isLoading, isFetching, error } = useGetModelSchoolUploadInventoryQuery(refreshToken);
  const { data: testMasterResponse } = useGetAllTestMastersQuery({ limit: 200 });
  const [view, setView] = useState(processingMode ? "papers" : "districts");
  const [testcode, setTestcode] = useState("");
  const [paperStatus, setPaperStatus] = useState(processingMode ? "Action required" : "All");
  const [district, setDistrict] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [page, setPage] = useState(1);

  const testcodes = useMemo(() => [...new Set((data?.districts || []).flatMap((row) => row.testcodes))].sort(), [data]);
  const activeTestcode = testcodes.includes(testcode) ? testcode : testcodes[0] || "";
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!activeTestcode) return [];
    const districtMap = new Map((data?.districts || []).map((row) => [row.district, row]));
    const testMasterMap = new Map((testMasterResponse?.data || []).map((row) => [row.testcode, row]));
    const groups = new Map();

    (testMasterResponse?.data || []).forEach((master) => {
      if (master.testcode !== activeTestcode) return;
      String(master.test_districts || "").split(",").map((value) => value.trim()).filter(Boolean).forEach((districtCode) => {
        const districtRow = districtMap.get(districtCode);
        const key = `${master.testcode}|${districtCode}`;
        groups.set(key, {
          testcode: master.testcode,
          day: master.day ? `Day ${master.day}` : "Data not available",
          stream: master.type_of_exam === "001" ? "JEE" : master.type_of_exam === "002" ? "NEET" : "Data not available",
          standard: master.std || "Data not available",
          district: districtCode,
          district_name: districtRow?.district_name || "",
          uploaded: 0,
          answerSheetFolder: 0,
          moveAnswerSheetFolder: 0,
          corrected: 0,
          last_upload_at: null,
        });
      });
    });

    (data?.papers || []).forEach((paper) => {
      if (Number(paper.s3_images) <= 0 || paper.testcode !== activeTestcode) return;
      const districtCode = String(paper.district || "").trim();
      const districtRow = districtMap.get(districtCode);
      const key = `${paper.testcode}|${districtCode}`;
      const master = testMasterMap.get(paper.testcode);
      if (!groups.has(key)) {
        groups.set(key, {
          testcode: paper.testcode,
          day: master?.day ? `Day ${master.day}` : "Data not available",
          stream: master?.type_of_exam === "001" ? "JEE" : master?.type_of_exam === "002" ? "NEET" : "Data not available",
          standard: master?.std || "Data not available",
          district: districtCode,
          district_name: paper.district_name || districtRow?.district_name || "",
          uploaded: 0,
          answerSheetFolder: 0,
          moveAnswerSheetFolder: 0,
          corrected: 0,
          last_upload_at: null,
        });
      }
      const group = groups.get(key);
      group.uploaded += 1;
      if (paper.answer_sheet_uploaded) group.answerSheetFolder += 1;
      if (paper.move_answer_sheet_uploaded) group.moveAnswerSheetFolder += 1;
      if (paper.processing_status === "Completed") group.corrected += 1;
      if (paper.last_upload_at && (!group.last_upload_at || paper.last_upload_at > group.last_upload_at)) {
        group.last_upload_at = paper.last_upload_at;
      }
    });

    return [...groups.values()]
      .map((row) => {
        const pending = row.uploaded - row.corrected;
        return {
          ...row,
          pending,
          correction_percentage: row.uploaded ? (row.corrected / row.uploaded) * 100 : 0,
          pending_percentage: row.uploaded ? (pending / row.uploaded) * 100 : 0,
        };
      })
      .filter((row) => !term || [row.district, row.district_name, row.testcode, row.day, row.stream, row.standard]
        .some((value) => String(value || "").toLowerCase().includes(term)))
      .sort((left, right) => left.district.localeCompare(right.district) || left.testcode.localeCompare(right.testcode));
  }, [data, testMasterResponse, activeTestcode, search]);
  const paperStatuses = useMemo(() => [...new Set((data?.papers || []).map((row) => row.processing_status))].sort(), [data]);
  const paperDistricts = useMemo(() => [...new Set((data?.papers || []).map((row) => row.district))].sort(), [data]);
  const papers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.papers || []).filter((row) => {
      if (row.testcode !== activeTestcode) return false;
      if (district !== "All" && row.district !== district) return false;
      if (paperStatus === "Action required" && row.processing_status === "Completed") return false;
      if (paperStatus !== "All" && paperStatus !== "Action required" && row.processing_status !== paperStatus) return false;
      if (term && ![row.roll_number, row.district, row.district_name, row.testcode, row.subject, row.evaluator_id].some((value) => String(value || "").toLowerCase().includes(term))) return false;
      return true;
    });
  }, [data, activeTestcode, district, paperStatus, search]);
  const testMastersByCode = useMemo(
    () => new Map((testMasterResponse?.data || []).map((row) => [row.testcode, row])),
    [testMasterResponse]
  );
  const markingPapers = useMemo(() => papers.map((paper) => {
    const master = testMastersByCode.get(paper.testcode);
    const uploaded = Number(paper.s3_images) > 0 ? 1 : 0;
    const corrected = uploaded && paper.processing_status === "Completed" ? 1 : 0;
    const pending = uploaded ? uploaded - corrected : 0;
    return {
      ...paper,
      day: master?.day ? `Day ${master.day}` : "Data not available",
      stream: master?.type_of_exam === "001" ? "JEE" : master?.type_of_exam === "002" ? "NEET" : "Data not available",
      standard: master?.std || "Data not available",
      roll_no_uploaded: paper.answer_sheet_uploaded ? "Yes" : "No",
      answer_moved: paper.move_answer_sheet_uploaded ? "Yes" : "No",
      corrected,
      pending,
      correction_percentage: uploaded ? ((corrected / uploaded) * 100).toFixed(2) : "0.00",
      pending_percentage: uploaded ? ((pending / uploaded) * 100).toFixed(2) : "0.00",
    };
  }), [papers, testMastersByCode]);
  const pageCount = Math.max(1, Math.ceil(papers.length / PAPER_PAGE_SIZE));

  if (isLoading) return <><ModelSchoolAdministratorNav /><div className="msu-state"><span />Scanning live S3 answer sheets...</div></>;
  if (error) return <><ModelSchoolAdministratorNav /><div className="msu-state msu-state--error"><FiAlertTriangle /><strong>Could not read the S3 inventory</strong><p>{error?.data?.message || "Check the backend and bucket connection."}</p></div></>;

  const summary = data?.summary || {};
  const s3Papers = (data?.papers || []).filter((paper) => Number(paper.s3_images) > 0);
  const rollNosUploadedInCloud = s3Papers.filter((paper) => paper.answer_sheet_uploaded).length;
  const answerSheetsMovedForValuation = s3Papers.filter((paper) => paper.move_answer_sheet_uploaded).length;
  return (
    <>
      <ModelSchoolAdministratorNav />
      <main className="msu-page">
        <header className="msu-header">
          <div><span>{processingMode ? "PROCESSING CONTROL" : "S3 UPLOAD CONTROL"}</span><h1>{processingMode ? "Papers waiting for action" : "District answer-sheet uploads"}</h1><p>Exact bucket inventory · Updated {new Date(data.generated_at).toLocaleString("en-IN")} {data.cached && "· cached"}</p></div>
          <button type="button" onClick={() => setRefreshToken(Date.now())} disabled={isFetching}><FiRefreshCw className={isFetching ? "msu-spin" : ""} /> Scan S3 now</button>
        </header>

        <section className="msu-metrics">
          <UploadMetric icon={FiMapPin} label="Districts uploaded" value={summary.uploaded_districts} detail={`${number(summary.districts_not_uploaded)} not uploaded`} tone="green" />
          <UploadMetric icon={FiUsers} label="Unique roll numbers" value={summary.roll_numbers} detail={`${number(summary.roll_number_uploads)} upload occurrences`} tone="blue" />
          <UploadMetric icon={FiImage} label="S3 images" value={summary.s3_images} detail={`${number(summary.s3_papers)} answer papers`} tone="teal" />
          <UploadMetric icon={FiInbox} label="Not imported" value={summary.not_imported} detail="Uploaded, waiting for TXT import" tone="amber" />
          <UploadMetric icon={FiCheckCircle} label="Ready / completed" value={Number(summary.ready || 0) + Number(summary.completed || 0)} detail={`${number(summary.opened)} currently open`} tone="green" />
          <UploadMetric icon={FiAlertTriangle} label="Needs attention" value={Number(summary.image_incomplete || 0) + Number(summary.database_without_s3 || 0)} detail="Image or database mismatch" tone="red" />
          <UploadMetric icon={FiUploadCloud} label="Roll No uploaded in the cloud" value={rollNosUploadedInCloud} detail="All testcodes · Answer folder in S3" tone="blue" />
          <UploadMetric icon={FiCheckCircle} label="Answer sheet moved for valuation" value={answerSheetsMovedForValuation} detail="All testcodes · Move folder in S3" tone="green" />
        </section>

        <section className="msu-panel">
          <div className="msu-view-switch">
            <div><button type="button" className={view === "districts" ? "is-active" : ""} onClick={() => { setView("districts"); setSearch(""); }}>District summary</button><button type="button" className={view === "papers" ? "is-active" : ""} onClick={() => { setView("papers"); setPage(1); setSearch(""); }}>Roll-number details <span>{number(data.papers?.length)}</span></button></div>
            {view === "papers" && <button type="button" className="msu-export" onClick={() => exportPapers(markingPapers)}><FiDownload /> Export {number(papers.length)}</button>}
          </div>
          <div className="msu-toolbar">
            <label><span>Test code</span><select value={activeTestcode} onChange={(event) => setTestcode(event.target.value)}>{testcodes.map((value) => <option key={value}>{value}</option>)}</select></label>
            {view === "papers" && <label><span>Processing status</span><select value={paperStatus} onChange={(event) => { setPaperStatus(event.target.value); setPage(1); }}><option>All</option><option>Action required</option>{paperStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>}
            {view === "papers" && <label><span>District</span><select value={district} onChange={(event) => { setDistrict(event.target.value); setPage(1); }}><option>All</option>{paperDistricts.map((value) => <option key={value}>{value}</option>)}</select></label>}
            <label className="msu-search"><span>{view === "papers" ? "Search roll number" : "Search district or roll number"}</span><div><FiSearch /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={view === "papers" ? "Roll, subject, evaluator" : "District, roll or testcode"} /></div></label>
            <strong>{view === "papers" ? `${number(papers.length)} papers` : `${rows.length} marking groups`}</strong>
          </div>
          {view === "districts" ? <div className="msu-table-wrap">
            <table className="msu-table">
              <thead><tr><th>District</th><th>Day</th><th>Stream</th><th>Class</th><th>Test Code</th><th className="num">Roll No uploaded in the cloud</th><th className="num">Answer sheet moved for valuation</th><th className="num">Corrected Papers</th><th className="num">Pending Papers</th><th className="num">Correction %</th><th className="num">Pending %</th></tr></thead>
              <tbody>{rows.map((row) => {
                const groupKey = `${row.district}-${row.testcode}`;
                const expanded = expandedGroup === groupKey;
                const detailPapers = (data?.papers || [])
                  .filter((paper) => paper.testcode === row.testcode && paper.district === row.district && Number(paper.s3_images) > 0)
                  .map((paper) => {
                    const master = testMastersByCode.get(paper.testcode);
                    const uploaded = 1;
                    const corrected = paper.processing_status === "Completed" ? 1 : 0;
                    const pending = uploaded - corrected;
                    return {
                      ...paper,
                      day: master?.day ? `Day ${master.day}` : "Data not available",
                      stream: master?.type_of_exam === "001" ? "JEE" : master?.type_of_exam === "002" ? "NEET" : "Data not available",
                      standard: master?.std || "Data not available",
                      roll_no_uploaded: paper.answer_sheet_uploaded ? "Yes" : "No",
                      answer_moved: paper.move_answer_sheet_uploaded ? "Yes" : "No",
                      corrected,
                      pending,
                      correction_percentage: (corrected * 100).toFixed(2),
                      pending_percentage: (pending * 100).toFixed(2),
                    };
                  });
                return (
                  <Fragment key={groupKey}>
                    <tr>
                      <td><strong>{row.district}</strong><small>{row.district_name || "District name unavailable"}</small></td>
                      <td>{row.day}</td>
                      <td>{row.stream}</td>
                      <td>{row.standard}</td>
                      <td><button type="button" className="msu-testcode-toggle" aria-expanded={expanded} onClick={() => setExpandedGroup(expanded ? null : groupKey)}>{row.testcode}<FiChevronDown className={expanded ? "is-expanded" : ""} /></button></td>
                      <td className="num">{number(row.answerSheetFolder)}</td>
                      <td className="num">{number(row.moveAnswerSheetFolder)}</td>
                      <td className="num success">{number(row.corrected)}</td>
                      <td className="num warning">{number(row.pending)}</td>
                      <td className="num">{row.correction_percentage.toFixed(2)}</td>
                      <td className="num">{row.pending_percentage.toFixed(2)}</td>
                    </tr>
                    {expanded && <tr className="msu-marking-detail"><td colSpan="13">{detailPapers.length ? <PaperTable papers={detailPapers} /> : <div>No S3 paper details are available for this testcode and district.</div>}</td></tr>}
                  </Fragment>
                );
              })}</tbody>
            </table>
          </div> : <PaperTable papers={markingPapers.slice((page - 1) * PAPER_PAGE_SIZE, page * PAPER_PAGE_SIZE)} />}
          {view === "papers" && <div className="msu-pagination"><span>Rows {(page - 1) * PAPER_PAGE_SIZE + 1}-{Math.min(page * PAPER_PAGE_SIZE, papers.length)} of {number(papers.length)}</span><div><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><FiChevronLeft /></button><strong>{page} / {pageCount}</strong><button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}><FiChevronRight /></button></div></div>}
        </section>

        <aside className="msu-note"><strong>How processing works</strong><span><b>Not imported</b> means images are in S3 but the TXT paper record is not available.</span><span><b>Ready</b> means images passed verification and can be assigned.</span><span><b>Open</b> means an evaluator started but has not finalized.</span></aside>
      </main>
    </>
  );
};

const PaperTable = ({ papers }) => (
  <div className="msu-table-wrap">
    <table className="msu-table msu-paper-table">
      <thead><tr><th>Day</th><th>Stream</th><th>Class</th><th>Roll Number</th><th>District</th><th>Test Code</th><th>Subject</th><th>Roll No uploaded in the cloud</th><th>Answer sheet moved for valuation</th><th className="num">Corrected Papers</th><th className="num">Pending Papers</th><th className="num">Correction %</th><th className="num">Pending %</th><th>Processing Status</th><th>Next Action</th><th>Last Upload</th></tr></thead>
      <tbody>{papers.map((row) => <tr key={`${row.testcode}-${row.district}-${row.subject}-${row.roll_number}`}><td>{row.day}</td><td>{row.stream}</td><td>{row.standard}</td><td><strong>{row.roll_number}</strong></td><td><b>{row.district}</b><small>{row.district_name}</small></td><td>{row.testcode}</td><td>{row.subject}</td><td>{row.roll_no_uploaded}</td><td>{row.answer_moved}</td><td className="num">{number(row.corrected)}</td><td className="num">{number(row.pending)}</td><td className="num">{row.correction_percentage}</td><td className="num">{row.pending_percentage}</td><td><span className={`msu-status msu-paper-status--${statusClass(row.processing_status)}`}>{row.processing_status}</span></td><td><strong>{row.next_action}</strong></td><td>{row.last_upload_at ? new Date(row.last_upload_at).toLocaleString("en-IN") : "-"}</td></tr>)}</tbody>
    </table>
  </div>
);

export default DistrictUploadProcessing;