import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiFileText,
  FiImage,
  FiPackage,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { useGetModelSchoolAdministratorDashboardQuery } from "../../../redux-slice/modelSchoolAdministratorApiSlice";
import ModelSchoolAdministratorNav from "./ModelSchoolAdministratorNav";
import "./ModelSchoolAdministratorDashboard.css";

const PAGE_SIZE = 25;

const number = (value) => Number(value || 0).toLocaleString("en-IN");

const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const downloadCsv = (rows) => {
  const columns = [
    ["Test Code", "testcode"],
    ["District", "district"],
    ["District Name", "district_name"],
    ["Subject", "subject"],
    ["Paper Count", "paper_count"],
    ["Expected Image Count", "expected_image_count"],
    ["Valuated", "valuated"],
    ["Opened Not Finished", "opened_not_finished"],
    ["Ready", "ready"],
    ["Image Pending", "image_pending"],
  ];
  const csv = [
    columns.map(([label]) => escapeCsv(label)).join(","),
    ...rows.map((row) => columns.map(([, key]) => escapeCsv(row[key])).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `model-school-valuation-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const MetricCard = ({ icon: Icon, label, value, detail, tone }) => (
  <article className={`msa-metric msa-metric--${tone}`}>
    <span className="msa-metric__icon"><Icon /></span>
    <div>
      <p>{label}</p>
      <strong>{number(value)}</strong>
      <small>{detail}</small>
    </div>
  </article>
);

const ModelSchoolAdministratorDashboard = () => {
  const userInfo = useSelector((state) => state.auth.userInfo);
  const { data, isLoading, isFetching, error, refetch } = useGetModelSchoolAdministratorDashboardQuery();
  const [view, setView] = useState("inventory");
  const [testcode, setTestcode] = useState("All");
  const [district, setDistrict] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const inventory = useMemo(() => data?.district_subject || [], [data]);
  const testcodes = useMemo(
    () => [...new Set(inventory.map((row) => row.testcode))].sort(),
    [inventory]
  );
  const districts = useMemo(
    () => [...new Set(inventory.map((row) => row.district))].sort(),
    [inventory]
  );

  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();
    return inventory.filter((row) => {
      if (testcode !== "All" && row.testcode !== testcode) return false;
      if (district !== "All" && row.district !== district) return false;
      if (!term) return true;
      return [row.testcode, row.district, row.district_name, row.subject, row.subject_name]
        .some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [inventory, testcode, district, search]);

  useEffect(() => setPage(1), [testcode, district, search, view]);

  const pageCount = Math.max(1, Math.ceil(filteredInventory.length / PAGE_SIZE));
  const visibleRows = filteredInventory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const maxDaily = Math.max(1, ...(data?.daily_activity || []).map((row) => Number(row.valuated)));

  if (isLoading) {
    return <><ModelSchoolAdministratorNav /><div className="msa-state"><span className="msa-spinner" />Loading live valuation report...</div></>;
  }

  if (error) {
    return (
      <><ModelSchoolAdministratorNav /><div className="msa-state msa-state--error">
        <FiAlertCircle />
        <strong>Dashboard data could not be loaded</strong>
        <span>{error?.data?.message || "Please check the backend connection."}</span>
        <button type="button" onClick={refetch}><FiRefreshCw /> Retry</button>
      </div></>
    );
  }

  const summary = data?.summary || {};

  return (
    <><ModelSchoolAdministratorNav /><main className="msa-dashboard">
      <header className="msa-header">
        <div>
          <span className="msa-header__eyebrow">LIVE VALUATION CONTROL</span>
          <h1>Model School Operations</h1>
          <p>{userInfo?.User_Name || "Administrator"} · Updated {new Date(data.generated_at).toLocaleString("en-IN")}</p>
        </div>
        <div className="msa-header__actions">
          <button type="button" className="msa-button msa-button--secondary" onClick={() => downloadCsv(filteredInventory)}>
            <FiDownload /> Export CSV
          </button>
          <button type="button" className="msa-button" onClick={refetch} disabled={isFetching}>
            <FiRefreshCw className={isFetching ? "msa-spin" : ""} /> Refresh live data
          </button>
        </div>
      </header>

      <section className="msa-metrics" aria-label="Valuation summary">
        <MetricCard icon={FiPackage} label="All papers" value={summary.total} detail="Imported for valuation" tone="ink" />
        <MetricCard icon={FiCheckCircle} label="Valuated" value={summary.valuated} detail={`${summary.completion_percentage || 0}% complete`} tone="success" />
        <MetricCard icon={FiClock} label="Pending" value={summary.pending} detail="Not yet finalized" tone="warning" />
        <MetricCard icon={FiActivity} label="Opened" value={summary.opened_not_finished} detail="Started but not finished" tone="danger" />
        <MetricCard icon={FiFileText} label="Ready" value={summary.ready} detail="Waiting for an evaluator" tone="info" />
        <MetricCard icon={FiImage} label="Expected images" value={summary.expected_images} detail={`${number(summary.s3_indexed_images)} in S3 upload index`} tone="teal" />
      </section>

      <section className="msa-overview">
        <div className="msa-panel msa-panel--testcodes">
          <div className="msa-panel__heading">
            <div><span>TESTCODE PROGRESS</span><h2>Exam inventory</h2></div>
            <strong>{data.testcodes.length} testcodes</strong>
          </div>
          <div className="msa-testcode-grid">
            {data.testcodes.map((item) => (
              <button
                type="button"
                key={item.testcode}
                className={`msa-testcode ${testcode === item.testcode ? "is-active" : ""}`}
                onClick={() => setTestcode(testcode === item.testcode ? "All" : item.testcode)}
              >
                <div><strong>{item.testcode}</strong><span>{number(item.total)} papers</span></div>
                <div className="msa-progress"><i style={{ width: `${item.completion_percentage}%` }} /></div>
                <footer><span>{item.completion_percentage}% done</span><b>{number(item.opened_not_finished)} open</b></footer>
              </button>
            ))}
          </div>
        </div>

        <div className="msa-panel msa-activity">
          <div className="msa-panel__heading">
            <div><span>DAILY OUTPUT</span><h2>Correction activity</h2></div>
          </div>
          <div className="msa-bars">
            {(data.daily_activity || []).map((item) => (
              <div className="msa-bar" key={item.correction_date} title={`${item.correction_date}: ${item.valuated}`}>
                <strong>{number(item.valuated)}</strong>
                <i style={{ height: `${Math.max(8, (Number(item.valuated) / maxDaily) * 100)}%` }} />
                <span>{String(item.correction_date || "").slice(0, 5)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="msa-panel msa-report">
        <div className="msa-report__topline">
          <div className="msa-segmented" aria-label="Report view">
            <button type="button" className={view === "inventory" ? "is-active" : ""} onClick={() => setView("inventory")}>District inventory</button>
            <button type="button" className={view === "open" ? "is-active" : ""} onClick={() => setView("open")}>Opened papers <span>{number(summary.opened_not_finished)}</span></button>
          </div>
          {view === "inventory" && <span className="msa-result-count">{number(filteredInventory.length)} groups</span>}
        </div>

        {view === "inventory" ? (
          <>
            <div className="msa-filters">
              <label><span>Test code</span><select value={testcode} onChange={(event) => setTestcode(event.target.value)}><option>All</option>{testcodes.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>District</span><select value={district} onChange={(event) => setDistrict(event.target.value)}><option>All</option>{districts.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="msa-search"><span>Search</span><div><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Subject, district, testcode" /></div></label>
            </div>
            <div className="msa-table-wrap">
              <table className="msa-table">
                <thead><tr><th>Test Code</th><th>District</th><th>Subject</th><th className="num">Count</th><th className="num">Image Count</th><th className="num success">Valuated</th><th className="num danger">Opened</th><th className="num">Ready</th><th className="num">Image Pending</th></tr></thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={`${row.testcode}-${row.district}-${row.subcode}`}>
                      <td><strong>{row.testcode}</strong></td>
                      <td><b>{row.district}</b><small>{row.district_name}</small></td>
                      <td>{row.subject}<small>{row.subject_name}</small></td>
                      <td className="num">{number(row.paper_count)}</td>
                      <td className="num">{number(row.expected_image_count)}</td>
                      <td className="num success">{number(row.valuated)}</td>
                      <td className="num danger">{number(row.opened_not_finished)}</td>
                      <td className="num">{number(row.ready)}</td>
                      <td className="num">{number(row.image_pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="msa-pagination">
              <span>Rows {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredInventory.length)} of {filteredInventory.length}</span>
              <div><button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><FiChevronLeft /></button><strong>{page} / {pageCount}</strong><button type="button" aria-label="Next page" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}><FiChevronRight /></button></div>
            </div>
          </>
        ) : (
          <div className="msa-table-wrap">
            <table className="msa-table">
              <thead><tr><th>Dummy Number</th><th>Test Code</th><th>District</th><th>Subject</th><th>Evaluator</th><th>Opened At</th><th className="num">Images</th></tr></thead>
              <tbody>{(data.open_papers || []).map((row) => <tr key={`${row.barcode}-${row.testcode}`}><td><strong>{row.barcode}</strong></td><td>{row.testcode}</td><td><b>{row.dcode}</b><small>{row.district_name}</small></td><td>{row.subject}</td><td>{row.Evaluator_Id}</td><td>{row.A_date || "Not recorded"}</td><td className="num">{number(row.ImgCnt)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="msa-legend" aria-label="Status definitions">
        <strong>How to read this report</strong>
        {Object.entries(data.definitions || {}).slice(0, 5).map(([key, value]) => <span key={key}><i className={`status-${key}`} /> <b>{key.replaceAll("_", " ")}:</b> {value}</span>)}
      </section>
    </main></>
  );
};

export default ModelSchoolAdministratorDashboard;