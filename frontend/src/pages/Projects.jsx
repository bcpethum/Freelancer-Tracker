import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  LuPlus, LuSearch, LuPencil, LuTrash2, LuDownload, LuX, LuFolderOpen,
} from 'react-icons/lu';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];
const ICON_STROKE = 1.75;

const statusBadge = (status) => <span className={`badge badge-${status}`}>{status.replace('-', ' ')}</span>;
const priorityBadge = (p) => <span className={`badge badge-${p}`}>{p}</span>;

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ name: '', client: '', fee: '', status: 'pending', priority: 'medium', description: '', deadline: '', startDate: '', category: '' });
  const [formErrors, setFormErrors] = useState({});

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 8 });
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      if (filterClient) params.append('client', filterClient);
      const res = await API.get(`/projects?${params}`);
      setProjects(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }, [page, search, filterStatus, filterClient]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => {
    API.get('/clients?limit=100').then(res => setClients(res.data.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditProject(null);
    setForm({ name: '', client: '', fee: '', status: 'pending', priority: 'medium', description: '', deadline: '', startDate: '', category: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditProject(p);
    setForm({
      name: p.name || '', client: p.client?._id || '', fee: p.fee || '',
      status: p.status || 'pending', priority: p.priority || 'medium',
      description: p.description || '',
      deadline: p.deadline ? format(new Date(p.deadline), 'yyyy-MM-dd') : '',
      startDate: p.startDate ? format(new Date(p.startDate), 'yyyy-MM-dd') : '',
      category: p.category || ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Project name is required';
    if (!form.client) errs.client = 'Client is required';
    if (!form.fee || isNaN(form.fee) || Number(form.fee) < 0) errs.fee = 'Valid fee is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormLoading(true);
    try {
      const payload = { ...form, fee: Number(form.fee) };
      if (editProject) {
        await API.put(`/projects/${editProject._id}`, payload);
        toast.success('Project updated successfully!');
      } else {
        await API.post('/projects', payload);
        toast.success('Project created successfully!');
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/projects/${deleteId}`);
      toast.success('Project deleted');
      setDeleteId(null);
      fetchProjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleInvoice = async (projectId) => {
    try {
      const res = await API.get(`/reports/invoice/${projectId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `invoice-${projectId}.pdf`; a.click();
      toast.success('Invoice downloaded!');
    } catch { toast.error('Failed to generate invoice'); }
  };

  return (
    <div>
      {/* Header */}
      <div className="section-header mb-6">
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Projects</div>
          <div className="section-subtitle">{pagination.total} project{pagination.total !== 1 ? 's' : ''} total</div>
        </div>
        <button id="create-project-btn" className="btn btn-primary" onClick={openCreate}>
          <LuPlus size={16} strokeWidth={ICON_STROKE} /> New Project
        </button>
      </div>

      {/* Filters — all on one responsive row */}
      <div className="filters-bar">
        <div className="search-bar">
          <span className="search-icon"><LuSearch size={15} strokeWidth={ICON_STROKE} /></span>
          <input
            className="form-control"
            id="project-search"
            placeholder="Search projects..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search projects"
          />
        </div>
        <select
          id="filter-status"
          className="form-control filter-select"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        <select
          id="filter-client"
          className="form-control filter-select"
          value={filterClient}
          onChange={e => { setFilterClient(e.target.value); setPage(1); }}
          aria-label="Filter by client"
        >
          <option value="">All Clients</option>
          {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        {(search || filterStatus || filterClient) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterClient(''); setPage(1); }} aria-label="Clear filters">
            <LuX size={14} strokeWidth={ICON_STROKE} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Status</th>
                <th>Priority</th>
                <th style={{ textAlign: 'right' }}>Fee</th>
                <th>Paid</th>
                <th>Deadline</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 6 }} /></td>
                    ))}
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon"><LuFolderOpen size={26} strokeWidth={ICON_STROKE} /></div>
                    <div className="empty-title">No projects found</div>
                    <div className="empty-desc">Create your first project to get started</div>
                    <button className="btn btn-primary btn-sm" onClick={openCreate}><LuPlus size={14} strokeWidth={ICON_STROKE} /> Create Project</button>
                  </div>
                </td></tr>
              ) : projects.map(p => {
                const paidPct = p.fee > 0 ? Math.min(100, Math.round((p.paidAmount / p.fee) * 100)) : 0;
                return (
                  <tr key={p._id} className="animate-fade-in">
                    <td style={{ maxWidth: 200 }}>
                      <div className="primary truncate">{p.name}</div>
                      {p.category && <div className="text-xs text-muted">{p.category}</div>}
                    </td>
                    <td>
                      <div className="truncate" style={{ maxWidth: 140 }}>{p.client?.name}</div>
                      {p.client?.company && <div className="text-xs text-muted truncate">{p.client.company}</div>}
                    </td>
                    <td>{statusBadge(p.status)}</td>
                    <td>{priorityBadge(p.priority)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="amount">${p.fee?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                        ${p.paidAmount?.toFixed(2)}
                        <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{paidPct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${paidPct}%` }} />
                      </div>
                    </td>
                    <td>
                      {p.deadline
                        ? <span style={{ color: new Date(p.deadline) < new Date() ? 'var(--accent-red)' : 'var(--text-secondary)', fontSize: '0.8rem' }}>{format(new Date(p.deadline), 'MMM dd, yyyy')}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <div className="actions" style={{ justifyContent: 'center' }}>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Edit"
                          aria-label="Edit project"
                          onClick={() => openEdit(p)}
                          style={{ width: 32, height: 32 }}
                        >
                          <LuPencil size={15} strokeWidth={ICON_STROKE} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Download Invoice"
                          aria-label="Download invoice"
                          onClick={() => handleInvoice(p._id)}
                          style={{ width: 32, height: 32 }}
                        >
                          <LuDownload size={15} strokeWidth={ICON_STROKE} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          title="Delete"
                          aria-label="Delete project"
                          onClick={() => setDeleteId(p._id)}
                          style={{ width: 32, height: 32 }}
                        >
                          <LuTrash2 size={15} strokeWidth={ICON_STROKE} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">‹</button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(n => (
            <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
          ))}
          <button className="page-btn" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} aria-label="Next page">›</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal modal-lg animate-slide-up">
            <div className="modal-header">
              <div className="modal-title">{editProject ? 'Edit Project' : 'New Project'}</div>
              <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close modal">
                <LuX size={18} strokeWidth={ICON_STROKE} />
              </button>
            </div>
            <form onSubmit={handleSubmit} id="project-form">
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Project Name <span className="required">*</span></label>
                  <input className="form-control" id="project-name" placeholder="e.g. E-commerce Website" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Client <span className="required">*</span></label>
                  <select className="form-control" id="project-client" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}>
                    <option value="">Select a client</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
                  </select>
                  {formErrors.client && <div className="form-error">{formErrors.client}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Project Fee ($) <span className="required">*</span></label>
                  <input className="form-control" id="project-fee" type="number" min="0" step="0.01" placeholder="0.00" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} />
                  {formErrors.fee && <div className="form-error">{formErrors.fee}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" id="project-status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" id="project-priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="form-control" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input className="form-control" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-control" placeholder="e.g. Web Development" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" placeholder="Project details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <><div className="spinner" /> Saving...</> : (editProject ? 'Update Project' : 'Create Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal animate-slide-up" style={{ maxWidth: 400 }}>
            <div className="confirm-icon">
              <LuTrash2 size={26} strokeWidth={ICON_STROKE} />
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.1rem' }}>Delete Project?</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.855rem', marginBottom: 0, lineHeight: 1.6 }}>
              This will permanently delete the project and all associated payments. This action cannot be undone.
            </p>
            <div className="modal-footer" style={{ paddingTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
