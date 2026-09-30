import React, { useMemo } from 'react';
import { Card, Row, Col, Badge, Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useGetAdminDashboardChartDataQuery } from '../../../redux-slice/userDashboardSlice';
import ElegantLoader from '../../../components/ElegantLoader';

/* ── colour palette per valuation type ─────────────────── */
const TYPE_PALETTE = [
  { yes: '#1976d2', no: '#90caf9', bg: '#e3f2fd', text: '#1565c0', grad: 'linear-gradient(135deg,#1976d2,#1565c0)' },
  { yes: '#2e7d32', no: '#a5d6a7', bg: '#e8f5e9', text: '#1b5e20', grad: 'linear-gradient(135deg,#388e3c,#1b5e20)' },
  { yes: '#e65100', no: '#ffcc80', bg: '#fff3e0', text: '#bf360c', grad: 'linear-gradient(135deg,#f57c00,#bf360c)' },
  { yes: '#6a1b9a', no: '#ce93d8', bg: '#f3e5f5', text: '#4a148c', grad: 'linear-gradient(135deg,#7b1fa2,#4a148c)' },
];
const V_LABELS = ['Valuation I', 'Valuation II', 'Valuation III', 'Valuation IV'];
const V_ROMAN  = ['I', 'II', 'III', 'IV'];
const V_ICONS  = ['📘', '📗', '📙', '📕'];

/* ── custom tooltip ─────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 16px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#333', borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>📅 {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.stroke, display: 'inline-block' }} />
          <span style={{ color: '#555' }}>{p.name}:</span>
          <strong style={{ color: p.stroke }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ── stat item inside grand-total banner ── */
const StatItem = ({ label, value, color, icon }) => (
  <div style={{ textAlign: 'center', padding: '8px 4px' }}>
    <div style={{ fontSize: 22, marginBottom: 2 }}>{icon}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', marginTop: 3, fontWeight: 500 }}>{label}</div>
  </div>
);

/* ── main component ─────────────────────────────────────── */
const AdminMainDashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const Dep_Name = userInfo?.selected_course || '01';

  const { data, isLoading } = useGetAdminDashboardChartDataQuery({ Dep_Name });

  const importTotals = data?.importTotals || [];
  const grandTotal   = data?.grandTotal   || {};
  const dateWiseRaw  = data?.dateWiseData  || [];

  /* pivot dateWiseData → { date, v1_yes, v2_yes, … } */
  const chartData = useMemo(() => {
    const map = {};
    dateWiseRaw.forEach((row) => {
      const d = row.check_date;
      if (!map[d]) map[d] = { date: d };
      const t = row.valuation_type;
      map[d][`v${t}_yes`] = parseInt(row.checked_yes || 0);
      map[d][`v${t}_no`]  = parseInt(row.checked_no  || 0);
    });
    return Object.values(map).sort((a, b) => {
      const parse = (s) => { const [dd, mm, yy] = (s || '').split('-').map(Number); return new Date(yy, mm - 1, dd); };
      return parse(a.date) - parse(b.date);
    });
  }, [dateWiseRaw]);

  const importCards = V_LABELS.map((label, i) => ({
    label, icon: V_ICONS[i], palette: TYPE_PALETTE[i],
    row: importTotals.find((r) => r.valuation_type === String(i + 1)) || {},
  }));

  if (isLoading) {
    return (
      <ElegantLoader 
        message="Loading dashboard…" 
        size="large"
        variant="primary"
        fullScreen={false}
      />
    );
  }

  return (
    <Container fluid className="p-0">

      {/* ── Grand-total banner ── */}
      <Card className="border-0 mb-4"
        style={{ background: 'linear-gradient(135deg,#0d47a1 0%,#1565c0 40%,#1976d2 100%)', borderRadius: 16, boxShadow: '0 8px 32px rgba(21,101,192,0.3)' }}>
        <Card.Body style={{ padding: '20px 28px' }}>
          {/* <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '6px 14px', fontSize: '0.8rem', color: '#fff', fontWeight: 600, letterSpacing: 1 }}>
              GRAND TOTAL
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>Department: {Dep_Name}</div>
          </div> */}
          <Row className="g-2">
            {[
              { label: 'Total Scripts',   value: grandTotal.total_scripts       || 0, color: '#fff',      icon: '📋' },
              { label: 'Checked',         value: grandTotal.checked_yes         || 0, color: '#69f0ae',   icon: '✅' },
              { label: 'Pending',         value: grandTotal.checked_no          || 0, color: '#ff6e6e',   icon: '⏳' },
              { label: 'Active Days',     value: grandTotal.checkdate_days_count || 0, color: '#ffe57f',   icon: '📅' },
              { label: 'Total Subcodes',  value: grandTotal.total_subcodes      || 0, color: '#82b1ff',   icon: '📂' },
              { label: 'Completed',       value: grandTotal.completed_subcodes  || 0, color: '#69f0ae',   icon: '🏁' },
              { label: 'Pending Codes',   value: grandTotal.pending_subcodes    || 0, color: '#ff6e6e',   icon: '🔖' },
            ].map((item, i) => (
              <Col key={i}>
                <StatItem {...item} />
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* ── Per-valuation cards ── */}
      <Row className="g-3 mb-4">
        {importCards.map((card, i) => (
          <Col key={i} xs={12} sm={6} xl={3}>
            <Card className="h-100 border-0" style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              {/* card header */}
              <div style={{ background: card.palette.grad, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{card.icon}</span>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{card.label}</div>
              </div>
              <Card.Body style={{ background: '#fff', padding: '14px 18px' }}>
                {[
                  { label: 'Total Scripts',  value: card.row.total_scripts,         color: '#546e7a', bar: '#b0bec5' },
                  { label: 'Checked',        value: card.row.checked_yes,           color: '#2e7d32', bar: '#a5d6a7' },
                  { label: 'Pending',        value: card.row.checked_no,            color: '#c62828', bar: '#ef9a9a' },
                  { label: 'Total Subcodes', value: card.row.total_subcodes,        color: '#1565c0', bar: '#90caf9' },
                  { label: 'Completed',      value: card.row.completed_subcodes,    color: '#1b5e20', bar: '#c8e6c9' },
                  { label: 'Active Days',    value: card.row.checkdate_days_count,  color: '#e65100', bar: '#ffcc80' },
                ].map((row, j) => {
                  const total = parseInt(card.row.total_scripts || 1);
                  const pct   = Math.min(100, Math.round((parseInt(row.value || 0) / total) * 100));
                  return (
                    <div key={j} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 500 }}>{row.label}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: row.color }}>{row.value ?? 0}</span>
                      </div>
                      <div style={{ background: '#f5f5f5', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: row.bar, borderRadius: 6, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Date-wise Line Chart ── */}
      <Card className="border-0" style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#1e3c72,#2a5298)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Date-wise Checked Scripts</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>Valuation I — IV daily progress</div>
          </div>
        </div>
        <Card.Body style={{ background: '#fff', padding: '16px' }}>
          {chartData.length === 0 ? (
            <div className="text-center py-5" style={{ color: '#aaa' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <div>No date-wise data available</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={chartData} margin={{ top: 24, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} axisLine={{ stroke: '#ddd' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 14 }}
                  iconType="circle"
                  formatter={(value, entry) => <span style={{ color: entry.color, fontWeight: 600 }}>{value}</span>}
                />
                {[1, 2, 3, 4].map((t) => (
                  <Line
                    key={`v${t}_yes`}
                    type="monotone"
                    dataKey={`v${t}_yes`}
                    name={`Valuation ${V_ROMAN[t - 1]}`}
                    stroke={TYPE_PALETTE[t - 1].yes}
                    strokeWidth={3}
                    dot={{ r: 5, fill: TYPE_PALETTE[t - 1].yes, stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7, stroke: TYPE_PALETTE[t - 1].yes, strokeWidth: 2, fill: '#fff' }}
                    connectNulls
                    label={{ position: 'top', fontSize: 13, fontWeight: 700, fill: TYPE_PALETTE[t - 1].yes }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>

    </Container>
  );
};

export default AdminMainDashboard;
