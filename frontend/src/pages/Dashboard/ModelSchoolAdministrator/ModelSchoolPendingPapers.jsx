import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiRefreshCw, FiSearch, FiUnlock } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import {
  useGetValuationPendingDetailsQuery,
  usePendingPaperClearMutation,
} from "../../../redux-slice/valuationStatusApiSlice";
import ModelSchoolAdministratorNav from "./ModelSchoolAdministratorNav";
import "./ModelSchoolPendingPapers.css";

const PAGE_SIZE = 25;
const valuationTypes = [
  [1, "First"], [2, "Second"], [3, "Third"], [4, "Fourth"], [5, "Chief"],
];

const ModelSchoolPendingPapers = () => {
  const [valuationType, setValuationType] = useState(1);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetValuationPendingDetailsQuery({ Valuation_Type: valuationType });
  const [clearPending, { isLoading: isClearing }] = usePendingPaperClearMutation();
  const rows = useMemo(() => data?.data || [], [data]);
  const eligibleCount = useMemo(() => rows.filter((row) => row.Can_Clear).length, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "Clear now" && !row.Can_Clear) return false;
      if (filter === "Too recent" && row.Can_Clear) return false;
      if (!term) return true;
      return [row.barcode, row.subcode, row.testcode, row.Evaluator_Id, row.Chief_Valuation_Evaluator_Id, row.FACULTY_NAME, row.Dep_Name]
        .some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [rows, filter, search]);

  useEffect(() => {
    setSelected(new Set());
    setPage(1);
  }, [valuationType, filter, search, data]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectableVisibleIds = visibleRows.filter((row) => row.Can_Clear).map((row) => row.id);
  const allVisibleSelected = selectableVisibleIds.length > 0 && selectableVisibleIds.every((id) => selected.has(id));

  const toggleRow = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleVisible = () => {
    setSelected((current) => {
      const next = new Set(current);
      selectableVisibleIds.forEach((id) => allVisibleSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const handleClear = async () => {
    const selectedRows = rows.filter((row) => selected.has(row.id) && row.Can_Clear);
    if (selectedRows.length === 0) return toast.warning("Select at least one eligible pending paper");
    if (!window.confirm(`Release ${selectedRows.length} selected pending paper${selectedRows.length === 1 ? "" : "s"}? They will return to the available valuation queue.`)) return;
    try {
      const response = await clearPending({ PendingDataDetails: selectedRows, Valuation_Type: valuationType }).unwrap();
      const result = response.data || {};
      if (result.clearedCount) toast.success(`${result.clearedCount} pending paper${result.clearedCount === 1 ? "" : "s"} released`);
      if (result.tooRecentCount) toast.info(`${result.tooRecentCount} paper${result.tooRecentCount === 1 ? "" : "s"} remained protected`);
      if (result.notFoundCount) toast.warning(`${result.notFoundCount} paper${result.notFoundCount === 1 ? "" : "s"} had already changed`);
      setSelected(new Set());
      await refetch();
    } catch (requestError) {
      toast.error(requestError?.data?.message || "Pending papers could not be cleared");
    }
  };

  return (
    <>
      <ModelSchoolAdministratorNav />
      <ToastContainer position="bottom-right" />
      <main className="msp-page">
        <header className="msp-header">
          <div><span>PENDING PAPER CONTROL</span><h1>Release locked papers</h1><p>Only papers assigned for at least five hours can be released.</p></div>
          <button type="button" onClick={refetch} disabled={isFetching}><FiRefreshCw className={isFetching ? "msp-spin" : ""} /> Refresh</button>
        </header>

        <section className="msp-summary">
          <article><FiClock /><span>Total pending<strong>{rows.length}</strong></span></article>
          <article className="is-ready"><FiUnlock /><span>Can clear now<strong>{eligibleCount}</strong></span></article>
          <article className="is-protected"><FiClock /><span>Protected under 5 hours<strong>{rows.length - eligibleCount}</strong></span></article>
          <article className="is-selected"><FiCheckCircle /><span>Selected<strong>{selected.size}</strong></span></article>
        </section>

        <section className="msp-panel">
          <div className="msp-tabs">{valuationTypes.map(([value, label]) => <button type="button" key={value} className={valuationType === value ? "is-active" : ""} onClick={() => setValuationType(value)}>{label}<small>valuation</small></button>)}</div>
          <div className="msp-toolbar">
            <label><span>Eligibility</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option><option>Clear now</option><option>Too recent</option></select></label>
            <label className="msp-search"><span>Search</span><div><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Barcode, examiner, subject" /></div></label>
            <strong>{filtered.length} papers</strong>
            <button type="button" className="msp-clear" disabled={selected.size === 0 || isClearing} onClick={handleClear}><FiUnlock /> {isClearing ? "Clearing..." : `Clear selected (${selected.size})`}</button>
          </div>

          {isLoading ? <div className="msp-state">Loading pending papers...</div> : error ? <div className="msp-state is-error">{error?.data?.message || "Pending papers could not be loaded"}</div> : (
            <div className="msp-table-wrap"><table className="msp-table"><thead><tr><th><input type="checkbox" aria-label="Select visible eligible papers" checked={allVisibleSelected} onChange={toggleVisible} disabled={selectableVisibleIds.length === 0} /></th><th>Barcode</th><th>Subject / Testcode</th><th>Examiner</th><th>Department</th><th>Camp</th><th>Assigned</th><th className="num">Pending Age</th><th>Status</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} className={!row.Can_Clear ? "is-protected" : selected.has(row.id) ? "is-selected" : ""}><td><input type="checkbox" aria-label={`Select ${row.barcode}`} checked={selected.has(row.id)} disabled={!row.Can_Clear} onChange={() => toggleRow(row.id)} /></td><td><strong>{row.barcode}</strong></td><td><b>{row.subcode}</b><small>{row.testcode || row.Subject_Name || "-"}</small></td><td><b>{valuationType === 5 ? row.Chief_Valuation_Evaluator_Id : row.Evaluator_Id}</b><small>{row.FACULTY_NAME || "Name unavailable"}</small></td><td>{row.Dep_Name}</td><td><b>{row.Camp_id || "-"}</b><small>{row.camp_offcer_id_examiner || "-"}</small></td><td>{valuationType === 5 ? row.Chief_A_date : row.A_date}</td><td className="num">{row.Pending_Hours === null ? "-" : `${row.Pending_Hours} h`}</td><td><span className={`msp-status ${row.Can_Clear ? "can-clear" : "protected"}`}>{row.Can_Clear ? "Can clear" : "Wait"}</span></td></tr>)}</tbody></table></div>
          )}
          <footer className="msp-pagination"><span>Rows {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><strong>{page} / {pageCount}</strong><button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></div></footer>
        </section>
      </main>
    </>
  );
};

export default ModelSchoolPendingPapers;