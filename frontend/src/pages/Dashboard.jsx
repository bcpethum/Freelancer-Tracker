import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { MdWork, MdPeople, MdAttachMoney, MdPendingActions, MdTrendingUp, MdWarning } from 'react-icons/md';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_COLORS = {
  pending: '#f59e0b',
  'in-progress': '#6366f1',
  completed: '#10b981',
  cancelled: '#ef4444',
  'on-hold': '#9ca3af'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#10b981', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
          ${payload[0].value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <div style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>
      </div>
    </div>
  );

  const { stats, monthlyIncome, projectStatusDist, recentProjects, recentPayments, topClients, upcomingDeadlines } = data || {};

  // Prepare chart data
  const monthlyChartData = monthlyIncome?.map(m => ({
    name: MONTHS[m._id.month - 1],
    income: m.total
  })) || [];

  const pieData = projectStatusDist?.map(s => ({
    name: s._id.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: s.count,
    color: STATUS_COLORS[s._id] || '#6366f1'
  })) || [];

  const statCards = [
    { label: 'Total Income', value: `$${(stats?.totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <MdAttachMoney />, bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    { label: 'Active Projects', value: stats?.activeProjects || 0, icon: <MdWork />, bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
    { label: 'Pending Payments', value: `$${(stats?.pendingPayments || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <MdPendingActions />, bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    { label: 'Total Clients', value: stats?.totalClients || 0, icon: <MdPeople />, bg: 'rgba(6,182,212,0.15)', color: '#06b6d4' },
  ];

  const getStatusBadge = (status) => {
    const cls = `badge badge-${status}`;
    return <span className={cls}>{status.replace('-', ' ')}</span>;
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)', borderRadius: '50%' }} />
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>
            👋 Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Here's your freelance business overview for today.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          <Link to="/projects" className="btn btn-primary">+ New Project</Link>
          <Link to="/clients" className="btn btn-secondary">+ Add Client</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 28 }}>
        {statCards.map((card, i) => (
          <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="stat-card-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Overdue Warning */}
      {stats?.overduePayments > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.875rem', color: '#ef4444'
        }}>
          <MdWarning size={20} />
          <span>You have <strong>${stats.overduePayments.toFixed(2)}</strong> in overdue payments.</span>
          <Link to="/payments" className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }}>Review</Link>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Monthly Income Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📈 Monthly Income</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Last 12 months</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdTrendingUp color="var(--accent-green)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                ${(stats?.totalIncome || 0).toLocaleString()}
              </span>
            </div>
          </div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyChartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#5f5f7a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5f5f7a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="income" fill="url(#incomeGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">📊</div>
              <div className="empty-title">No income data yet</div>
              <div className="empty-desc">Start recording payments to see your monthly income chart</div>
            </div>
          )}
        </div>

        {/* Project Status Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🎯 Project Status</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Distribution</div>
            </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                <Legend formatter={(value) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">🎯</div>
              <div className="empty-title">No projects yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Projects, Recent Payments, Top Clients */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
        {/* Recent Projects */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Recent Projects</div>
            <Link to="/projects" style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>View all →</Link>
          </div>
          {recentProjects?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentProjects.map(p => (
                <div key={p._id} style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }} className="truncate">{p.name}</div>
                    {getStatusBadge(p.status)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{p.client?.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-green)', fontWeight: 700, marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>${p.fee?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-icon">📁</div>
              <div className="empty-title">No projects yet</div>
              <Link to="/projects" className="btn btn-primary btn-sm">Create Project</Link>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Recent Payments</div>
            <Link to="/payments" style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>View all →</Link>
          </div>
          {recentPayments?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentPayments.map(p => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.82rem', color: 'var(--text-primary)' }} className="truncate">{p.client?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.project?.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: p.status === 'received' ? 'var(--accent-green)' : 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif' }}>
                      ${p.amount?.toFixed(2)}
                    </div>
                    <span className={`badge badge-${p.status}`} style={{ fontSize: '0.65rem' }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-icon">💰</div>
              <div className="empty-title">No payments yet</div>
              <Link to="/payments" className="btn btn-primary btn-sm">Add Payment</Link>
            </div>
          )}
        </div>

        {/* Top Clients */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Top Clients</div>
            <Link to="/clients" style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>View all →</Link>
          </div>
          {topClients?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topClients.map((c, i) => (
                <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `linear-gradient(135deg, hsl(${i * 60 + 200}, 70%, 45%), hsl(${i * 60 + 240}, 70%, 55%))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0
                  }}>
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }} className="truncate">{c.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.projectCount} project{c.projectCount !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.875rem' }}>
                    ${c.totalEarned?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-icon">👥</div>
              <div className="empty-title">No clients yet</div>
              <Link to="/clients" className="btn btn-primary btn-sm">Add Client</Link>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines?.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div className="section-title">⏰ Upcoming Deadlines (30 days)</div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Fee</th>
                </tr>
              </thead>
              <tbody>
                {upcomingDeadlines.map(p => {
                  const days = Math.ceil((new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={p._id}>
                      <td className="primary">{p.name}</td>
                      <td>{p.client?.name}</td>
                      <td>{getStatusBadge(p.status)}</td>
                      <td>
                        <span style={{ color: days <= 7 ? 'var(--accent-red)' : days <= 14 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {format(new Date(p.deadline), 'MMM dd, yyyy')} ({days}d)
                        </span>
                      </td>
                      <td className="amount">${p.fee?.toLocaleString()}</td>
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
