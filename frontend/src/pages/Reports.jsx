import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { MdDownload, MdPictureAsPdf, MdTableChart, MdFilterList } from 'react-icons/md';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_COLORS = {
  pending: '#f59e0b', 'in-progress': '#6366f1',
  completed: '#10b981', cancelled: '#ef4444', 'on-hold': '#9ca3af'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 700 }}>
            {p.name}: ${p.value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
        <div style={{ color: 'var(--text-muted)' }}>Loading reports...</div>
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

  return (
    <div>
      {/* Header */}
      <div className="section-header mb-6">
        <div>
          <div className="section-title" style={{ fontSize: '1.5rem' }}>Reports & Analytics</div>
          <div className="section-subtitle">Visual insights and income exports</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            id="export-csv-btn"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={exportLoading.csv}
          >
            {exportLoading.csv ? <div className="spinner" /> : <MdTableChart />}
            Export CSV
          </button>
          <button
            id="export-pdf-btn"
            className="btn btn-primary"
            onClick={handleExportPDF}
            disabled={exportLoading.pdf}
          >
            {exportLoading.pdf ? <div className="spinner" /> : <MdPictureAsPdf />}
            Export PDF
          </button>
        </div>
      </div>

      {/* Date & Client Filters */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <MdFilterList color="var(--primary-light)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Filter Reports</span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
            <label className="form-label">From Date</label>
            <input type="date" className="form-control" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
            <label className="form-label">To Date</label>
            <input type="date" className="form-control" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 2, minWidth: 200 }}>
            <label className="form-label">Client</label>
            <select className="form-control" value={filters.clientId} onChange={e => setFilters(f => ({ ...f, clientId: e.target.value }))}>
              <option value="">All Clients</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleExportCSV} disabled={exportLoading.csv}>
              {exportLoading.csv ? <div className="spinner" /> : <MdDownload />} CSV
            </button>
            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={exportLoading.pdf}>
              {exportLoading.pdf ? <div className="spinner" /> : <MdPictureAsPdf />} PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        {[
          { label: 'Total Revenue', value: `$${(stats?.totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: '💰', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Total Projects', value: stats?.totalProjects || 0, icon: '📁', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Completed', value: stats?.completedProjects || 0, icon: '✅', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
          { label: 'Total Clients', value: stats?.totalClients || 0, icon: '👥', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ].map((card, i) => (
          <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="stat-card-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Monthly Income (large) + Status Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>
        {/* Monthly Income Area Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📈 Monthly Revenue Trend</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 12 months • received payments</div>
            </div>
          </div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#5f5f7a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5f5f7a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.3)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#6366f1" strokeWidth={2.5} fill="url(#areaGradient)" dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#818cf8' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">No income data yet</div></div>
          )}
        </div>

        {/* Project Status Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🎯 Status Breakdown</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All projects</div>
            </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="43%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={10} formatter={v => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-icon">🎯</div><div className="empty-title">No projects yet</div></div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Top Clients + Monthly Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Top Clients Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🏆 Top Clients by Revenue</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total earnings per client</div>
            </div>
          </div>
          {clientChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={clientChartData} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#5f5f7a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9b9bbb', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="earned" name="Earned" fill="url(#clientGradient)" radius={[0, 6, 6, 0]} />
                <defs>
                  <linearGradient id="clientGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-icon">🏆</div><div className="empty-title">No client data yet</div></div>
          )}
        </div>

        {/* Monthly Payments Bar */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📦 Monthly Payment Count</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Number of payments received</div>
            </div>
          </div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyChartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#5f5f7a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5f5f7a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="payments" name="Payments" fill="url(#payGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="payGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">No payment data yet</div></div>
          )}
        </div>
      </div>

      {/* Top Clients Table */}
      {topClients?.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div className="section-title">📋 Client Income Summary</div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Projects</th>
                  <th>Total Earned</th>
                  <th>Avg per Project</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c, i) => {
                  const pct = stats?.totalIncome > 0 ? ((c.totalEarned / stats.totalIncome) * 100).toFixed(1) : 0;
                  const avg = c.projectCount > 0 ? (c.totalEarned / c.projectCount).toFixed(2) : 0;
                  return (
                    <tr key={c._id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>#{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                        {c.company && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.company}</div>}
                      </td>
                      <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{c.projectCount}</td>
                      <td className="amount">${c.totalEarned?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>${avg}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="progress-bar" style={{ flex: 1, maxWidth: 100 }}>
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 36 }}>{pct}%</span>
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
    </div>
  );
}
