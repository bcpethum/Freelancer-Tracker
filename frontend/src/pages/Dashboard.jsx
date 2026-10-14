import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import {
  LuDollarSign, LuFolderKanban, LuClock, LuUsers,
  LuTrendingUp, LuTriangleAlert, LuPlus, LuChartColumn,
  LuFolderOpen, LuCreditCard, LuCalendarDays,
} from 'react-icons/lu';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Build full 12-month data so all months show on x-axis
const buildFullMonthlyData = (monthlyIncome) => {
  const now = new Date();
  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const found = monthlyIncome?.find(m => m._id.month === month && m._id.year === year);
    result.push({ name: MONTHS[month - 1], income: found ? found.total : 0 });
  }
  return result;
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  'in-progress': '#6366f1',
  completed: '#22c55e',
  cancelled: '#ef4444',
  'on-hold': '#9ca3af'
};

const CustomBarTooltip = ({ active, payload, label, symbol }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
          {symbol} {payload[0].value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>
    );
  }
  return null;
};

const ICON_STROKE = 1.75;

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
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading dashboard...</div>
      </div>
    </div>
  );

  const { stats, monthlyIncome, projectStatusDist, recentProjects, recentPayments, topClients, upcomingDeadlines } = data || {};
  const currency = user?.currency || 'LKR';

  const monthlyChartData = buildFullMonthlyData(monthlyIncome);

  const pieData = projectStatusDist?.map(s => ({
    name: s._id.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: s.count,
    color: STATUS_COLORS[s._id] || '#6366f1'
  })) || [];

  const totalProjects = pieData.reduce((s, p) => s + p.value, 0);

  const statCards = [
    {
      label: 'Total Income',
      value: formatCurrency(stats?.totalIncome || 0, currency),
      icon: LuDollarSign,
      iconBg: 'rgba(34,197,94,0.12)',
      iconBorder: 'rgba(34,197,94,0.2)',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Active Projects',
      value: stats?.activeProjects || 0,
      icon: LuFolderKanban,
      iconBg: 'rgba(99,102,241,0.12)',
      iconBorder: 'rgba(99,102,241,0.2)',
    },
    {
      label: 'Pending Payments',
      value: formatCurrency(stats?.pendingPayments || 0, currency),
      icon: LuClock,
      iconBg: 'rgba(245,158,11,0.12)',
      iconBorder: 'rgba(245,158,11,0.2)',
    },
    {
      label: 'Total Clients',
      value: stats?.totalClients || 0,
      icon: LuUsers,
      iconBg: 'rgba(6,182,212,0.12)',
      iconBorder: 'rgba(6,182,212,0.2)',
    },
  ];

  const getStatusBadge = (status) => {
    const cls = `badge badge-${status}`;
    return <span className={cls}>{status.replace('-', ' ')}</span>;
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.1))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        position: 'relative',
        overflow: 'hidden',
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div>
          <h1 style={{ fontSize: '1.35rem', marginBottom: 5, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.855rem', lineHeight: 1.5 }}>
            Here's your freelance business overview for today.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Link to="/projects" className="btn btn-primary" id="new-project-btn">
            <LuPlus size={16} strokeWidth={ICON_STROKE} /> New Project
          </Link>
          <Link to="/clients" className="btn btn-secondary" id="add-client-btn">
            <LuUsers size={16} strokeWidth={ICON_STROKE} /> Add Client
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 28 }}>
        {statCards.map((card, i) => {
          const IconComp = card.icon;
          return (
            <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: card.iconBg, border: `1px solid ${card.iconBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconComp size={20} color="#ffffff" strokeWidth={ICON_STROKE} />
                </div>
                {card.trend && (
                  <span className={`stat-change ${card.trendUp ? 'positive' : 'negative'}`}>
                    <LuTrendingUp size={11} strokeWidth={2} /> {card.trend}
                  </span>
                )}
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Overdue Warning */}
      {stats?.overduePayments > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)', padding: '13px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.855rem', color: '#ef4444'
        }}>
          <LuTriangleAlert size={18} strokeWidth={ICON_STROKE} style={{ flexShrink: 0 }} />
          <span>You have <strong>{formatCurrency(stats.overduePayments, currency)}</strong> in overdue payments.</span>
          <Link to="/payments" className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }}>Review</Link>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }} className="dashboard-charts-row">
        {/* Monthly Income Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuChartColumn size={16} color="#22c55e" strokeWidth={ICON_STROKE} />
                </div>
                <span className="card-title">Monthly Income</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, marginLeft: 40 }}>Last 12 months</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LuTrendingUp size={15} color="var(--accent-green)" strokeWidth={ICON_STROKE} />
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                {formatCurrency(stats?.totalIncome || 0, currency, { compact: true })}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChartData} barSize={26} barCategoryGap="30%">
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${getCurrencySymbol(currency)} ${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={52} />
              <Tooltip content={<CustomBarTooltip symbol={getCurrencySymbol(currency)} />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 6 }} />
              <Bar dataKey="income" fill="url(#incomeGrad)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuFolderKanban size={16} color="var(--primary-light)" strokeWidth={ICON_STROKE} />
                </div>
                <span className="card-title">Project Status</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, marginLeft: 40 }}>Distribution</div>
            </div>
          </div>
          {pieData.length > 0 ? (
            <>
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={75} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{totalProjects}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>Total</div>
                </div>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
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
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-icon"><LuFolderOpen size={24} strokeWidth={ICON_STROKE} /></div>
              <div className="empty-title">No projects yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Projects, Recent Payments, Top Clients */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }} className="dashboard-bottom-row">
        {/* Recent Projects */}
        <div className="card">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LuFolderKanban size={16} color="var(--text-muted)" strokeWidth={ICON_STROKE} />
              <span className="section-title">Recent Projects</span>
            </div>
            <Link to="/projects" style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>View all →</Link>
          </div>
          {recentProjects?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentProjects.map(p => (
                <div key={p._id} style={{ padding: '11px 14px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text-primary)' }} className="truncate">{p.name}</div>
                    {getStatusBadge(p.status)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.client?.name}</div>
                    <div style={{ fontSize: '0.83rem', color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatCurrency(p.fee, currency)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '28px 0' }}>
              <div className="empty-icon"><LuFolderOpen size={24} strokeWidth={ICON_STROKE} /></div>
              <div className="empty-title">No projects yet</div>
              <Link to="/projects" className="btn btn-primary btn-sm"><LuPlus size={14} strokeWidth={ICON_STROKE} /> Create Project</Link>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LuCreditCard size={16} color="var(--text-muted)" strokeWidth={ICON_STROKE} />
              <span className="section-title">Recent Payments</span>
            </div>
            <Link to="/payments" style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>View all →</Link>
          </div>
          {recentPayments?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentPayments.map(p => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.82rem', color: 'var(--text-primary)' }} className="truncate">{p.client?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} className="truncate">{p.project?.name}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <div style={{ color: p.status === 'received' ? 'var(--accent-green)' : 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
                      {formatCurrency(p.amount, currency)}
                    </div>
                    <span className={`badge badge-${p.status}`} style={{ fontSize: '0.62rem' }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '28px 0' }}>
              <div className="empty-icon"><LuCreditCard size={24} strokeWidth={ICON_STROKE} /></div>
              <div className="empty-title">No payments yet</div>
              <Link to="/payments" className="btn btn-primary btn-sm"><LuPlus size={14} strokeWidth={ICON_STROKE} /> Add Payment</Link>
            </div>
          )}
        </div>

        {/* Top Clients */}
        <div className="card">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LuUsers size={16} color="var(--text-muted)" strokeWidth={ICON_STROKE} />
              <span className="section-title">Top Clients</span>
            </div>
            <Link to="/clients" style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>View all →</Link>
          </div>
          {topClients?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topClients.map((c, i) => (
                <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `linear-gradient(135deg, hsl(${i * 55 + 210}, 65%, 45%), hsl(${i * 55 + 250}, 65%, 55%))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 700, color: 'white', flexShrink: 0
                  }}>
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }} className="truncate">{c.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.projectCount} project{c.projectCount !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '0.875rem', flexShrink: 0 }}>
                    {formatCurrency(c.totalEarned, currency, { compact: true })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '28px 0' }}>
              <div className="empty-icon"><LuUsers size={24} strokeWidth={ICON_STROKE} /></div>
              <div className="empty-title">No clients yet</div>
              <Link to="/clients" className="btn btn-primary btn-sm"><LuPlus size={14} strokeWidth={ICON_STROKE} /> Add Client</Link>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines?.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LuCalendarDays size={16} color="var(--text-muted)" strokeWidth={ICON_STROKE} />
              <span className="section-title">Upcoming Deadlines</span>
            </div>
            <span className="badge badge-pending">Next 30 days</span>
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
                        <span style={{ color: days <= 7 ? 'var(--accent-red)' : days <= 14 ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '0.855rem' }}>
                          {format(new Date(p.deadline), 'MMM dd, yyyy')}
                          <span style={{ marginLeft: 6, opacity: 0.7, fontSize: '0.72rem' }}>({days}d)</span>
                        </span>
                      </td>
                      <td className="amount">{formatCurrency(p.fee, currency)}</td>
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
          .dashboard-charts-row { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .dashboard-bottom-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
