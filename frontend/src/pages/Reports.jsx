import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  LuDownload, LuFileText, LuTableProperties, LuFilter, LuDollarSign,
  LuFolderKanban, LuCheck, LuUsers, LuChartColumn, LuTrendingUp,
} from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_COLORS = {
  pending: '#f59e0b', 'in-progress': '#6366f1',
  completed: '#22c55e', cancelled: '#ef4444', 'on-hold': '#9ca3af'
};
const ICON_STROKE = 1.75;

const CustomTooltip = ({ active, payload, label, symbol = 'Rs' }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 700 }}>
            {p.name}: {symbol} {p.value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [dashData, setDashData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState({ csv: false, pdf: false });
  const [filters, setFilters] = useState({ startDate: '', endDate: '', clientId: '' });
  const { user } = useAuth();
  const currency = user?.currency || 'LKR';

  useEffect(() => {
    Promise.all([
      API.get('/dashboard'),
      API.get('/clients?limit=100')
    ]).then(([dash, cl]) => {
      setDashData(dash.data.data);
      setClients(cl.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleExportCSV = async () => {
    setExportLoading(e => ({ ...e, csv: true }));
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.clientId) params.append('client', filters.clientId);
      const res = await API.get(`/reports/export-csv?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = `income-report-${Date.now()}.csv`; a.click();
      toast.success('CSV exported successfully!');
    } catch { toast.error('Failed to export CSV'); }
    finally { setExportLoading(e => ({ ...e, csv: false })); }
  };

  const handleExportPDF = async () => {
    setExportLoading(e => ({ ...e, pdf: true }));
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.clientId) params.append('client', filters.clientId);
      const res = await API.get(`/reports/export-pdf?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `income-report-${Date.now()}.pdf`; a.click();
      toast.success('PDF exported successfully!');
    } catch { toast.error('Failed to export PDF'); }
    finally { setExportLoading(e => ({ ...e, pdf: false })); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading reports...</div>
      </div>
    </div>
  );

  const { stats, monthlyIncome, projectStatusDist, topClients } = dashData || {};

  const monthlyChartData = monthlyIncome?.map(m => ({
    name: MONTHS[m._id.month - 1],
    income: m.total,
    payments: m.count
  })) || [];

  const pieData = projectStatusDist?.map(s => ({
    name: s._id.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: s.count,
    color: STATUS_COLORS[s._id] || '#6366f1'
  })) || [];

  const clientChartData = topClients?.slice(0, 6).map(c => ({
    name: c.name.split(' ')[0],
    earned: c.totalEarned,
    projects: c.projectCount
  })) || [];

  const kpiCards = [
    { label: 'Total Revenue', value: formatCurrency(stats?.totalIncome || 0, currency), icon: LuDollarSign, iconBg: 'rgba(34,197,94,0.12)', iconBorder: 'rgba(34,197,94,0.2)' },
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: LuFolderKanban, iconBg: 'rgba(99,102,241,0.12)', iconBorder: 'rgba(99,102,241,0.2)' },
    { label: 'Completed', value: stats?.completedProjects || 0, icon: LuCheck, iconBg: 'rgba(6,182,212,0.12)', iconBorder: 'rgba(6,182,212,0.2)' },
    { label: 'Total Clients', value: stats?.totalClients || 0, icon: LuUsers, iconBg: 'rgba(245,158,11,0.12)', iconBorder: 'rgba(245,158,11,0.2)' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="section-header mb-6">
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Reports & Analytics</div>
          <div className="section-subtitle">Visual insights and income exports</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            id="export-csv-btn"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={exportLoading.csv}
          >
            {exportLoading.csv ? <div className="spinner" /> : <LuTableProperties size={15} strokeWidth={ICON_STROKE} />}
            Export CSV
          </button>
          <button
            id="export-pdf-btn"
            className="btn btn-primary"
            onClick={handleExportPDF}
            disabled={exportLoading.pdf}
          >
            {exportLoading.pdf ? <div className="spinner" /> : <LuFileText size={15} strokeWidth={ICON_STROKE} />}
            Export PDF
          </button>
        </div>
      </div>

      {/* Date & Client Filters */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <LuFilter size={15} color="var(--primary-light)" strokeWidth={ICON_STROKE} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Filter Reports</span>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
            <label className="form-label">From Date</label>
            <input type="date" className="form-control" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
            <label className="form-label">To Date</label>
            <input type="date" className="form-control" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 2, minWidth: 190 }}>
            <label className="form-label">Client</label>
            <select className="form-control" value={filters.clientId} onChange={e => setFilters(f => ({ ...f, clientId: e.target.value }))}>
              <option value="">All Clients</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 0 }}>
            <button className="btn btn-primary" onClick={handleExportCSV} disabled={exportLoading.csv}>
              {exportLoading.csv ? <div className="spinner" /> : <LuDownload size={14} strokeWidth={ICON_STROKE} />} CSV
            </button>
            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={exportLoading.pdf}>
              {exportLoading.pdf ? <div className="spinner" /> : <LuFileText size={14} strokeWidth={ICON_STROKE} />} PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }} className="dashboard-grid">
        {kpiCards.map((card, i) => {
          const IconComp = card.icon;
          return (
            <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: card.iconBg, border: `1px solid ${card.iconBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <IconComp size={20} color="#ffffff" strokeWidth={ICON_STROKE} />
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1: Monthly Income (large) + Status Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }} className="reports-charts-row">
        {/* Monthly Income Area Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuTrendingUp size={15} color="var(--primary-light)" strokeWidth={ICON_STROKE} />
                </div>
                <span className="card-title">Monthly Revenue Trend</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, marginLeft: 40 }}>Last 12 months · received payments</div>
            </div>
          </div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${getCurrencySymbol(currency)} ${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={52} />
                <Tooltip content={<CustomTooltip symbol={getCurrencySymbol(currency)} />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#6366f1" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#818cf8' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><LuChartColumn size={26} strokeWidth={ICON_STROKE} /></div>
              <div className="empty-title">No income data yet</div>
            </div>
          )}
        </div>

        {/* Project Status Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuFolderKanban size={15} color="#f59e0b" strokeWidth={ICON_STROKE} />
                </div>
                <span className="card-title">Status Breakdown</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, marginLeft: 40 }}>All projects</div>
            </div>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
                {pieData.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><LuFolderKanban size={26} strokeWidth={ICON_STROKE} /></div>
              <div className="empty-title">No projects yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Top Clients + Monthly Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }} className="reports-charts-row2">
        {/* Top Clients Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuUsers size={15} color="var(--accent-green)" strokeWidth={ICON_STROKE} />
                </div>
                <span className="card-title">Top Clients by Revenue</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, marginLeft: 40 }}>Total earnings per client</div>
            </div>
          </div>
          {clientChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={clientChartData} layout="vertical" barSize={16}>
                <defs>
                  <linearGradient id="clientGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${getCurrencySymbol(currency)} ${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1b5', fontSize: 12 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip content={<CustomTooltip symbol={getCurrencySymbol(currency)} />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                <Bar dataKey="earned" name="Earned" fill="url(#clientGrad)" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><LuUsers size={26} strokeWidth={ICON_STROKE} /></div>
              <div className="empty-title">No client data yet</div>
            </div>
          )}
        </div>

        {/* Monthly Payments Bar */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuChartColumn size={15} color="var(--accent-cyan)" strokeWidth={ICON_STROKE} />
                </div>
                <span className="card-title">Monthly Payment Count</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, marginLeft: 40 }}>Number of payments received</div>
            </div>
          </div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyChartData} barSize={24}>
                <defs>
                  <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="payments" name="Payments" fill="url(#payGrad)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><LuChartColumn size={26} strokeWidth={ICON_STROKE} /></div>
              <div className="empty-title">No payment data yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Top Clients Table */}
      {topClients?.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LuUsers size={16} color="var(--text-muted)" strokeWidth={ICON_STROKE} />
              <span className="section-title">Client Income Summary</span>
            </div>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Projects</th>
                  <th style={{ textAlign: 'right' }}>Total Earned</th>
                  <th style={{ textAlign: 'right' }}>Avg per Project</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c, i) => {
                  const pct = stats?.totalIncome > 0 ? ((c.totalEarned / stats.totalIncome) * 100).toFixed(1) : 0;
                  const avg = c.projectCount > 0 ? (c.totalEarned / c.projectCount).toFixed(2) : 0;
                  return (
                    <tr key={c._id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem' }}>#{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                        {c.company && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.company}</div>}
                      </td>
                      <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{c.projectCount}</td>
                      <td className="amount" style={{ textAlign: 'right' }}>{formatCurrency(c.totalEarned, currency)}</td>
                      <td style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>{formatCurrency(c.totalEarned / c.projectCount, currency)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="progress-bar" style={{ flex: 1, maxWidth: 100 }}>
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', minWidth: 36 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .reports-charts-row { grid-template-columns: 1fr !important; }
          .reports-charts-row2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
