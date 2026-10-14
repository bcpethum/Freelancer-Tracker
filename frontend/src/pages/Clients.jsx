import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { LuPlus, LuSearch, LuPencil, LuTrash2, LuX, LuMail, LuPhone, LuUsers } from 'react-icons/lu';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['active', 'inactive', 'prospect'];
const ICON_STROKE = 1.75;

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '', notes: '', status: 'active' });
  const [formErrors, setFormErrors] = useState({});

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      const res = await API.get(`/clients?${params}`);
      setClients(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  }, [page, search, filterStatus]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openCreate = () => {
    setEditClient(null);
    setForm({ name: '', email: '', phone: '', company: '', address: '', notes: '', status: 'active' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditClient(c);
    setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', company: c.company || '', address: c.address || '', notes: c.notes || '', status: c.status || 'active' });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Client name is required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormLoading(true);
    try {
      if (editClient) {
        await API.put(`/clients/${editClient._id}`, form);
        toast.success('Client updated successfully!');
      } else {
        await API.post('/clients', form);
        toast.success('Client added successfully!');
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/clients/${deleteId}`);
      toast.success('Client deleted');
      setDeleteId(null);
      fetchClients();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const avatarColor = (name) => {
    const colors = ['#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#f97316', '#ec4899', '#8b5cf6'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div>
      {/* Header */}
      <div className="section-header mb-6">
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Clients</div>
          <div className="section-subtitle">{pagination.total} client{pagination.total !== 1 ? 's' : ''} total</div>
        </div>
        <button id="create-client-btn" className="btn btn-primary" onClick={openCreate}>
          <LuPlus size={16} strokeWidth={ICON_STROKE} /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-bar">
          <span className="search-icon"><LuSearch size={15} strokeWidth={ICON_STROKE} /></span>
          <input
            className="form-control"
            id="client-search"
            placeholder="Search by name, email, company..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search clients"
          />
        </div>
        <select
          className="form-control filter-select"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        {(search || filterStatus) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setPage(1); }} aria-label="Clear filters">
            <LuX size={14} strokeWidth={ICON_STROKE} /> Clear
          </button>
        )}
      </div>

      {/* Client Cards Grid */}
      {loading ? (
        <div className="grid clients-grid">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 11, width: '60%', borderRadius: 6 }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: 12, marginBottom: 8, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-icon"><LuUsers size={26} strokeWidth={ICON_STROKE} /></div>
          <div className="empty-title">No clients found</div>
          <div className="empty-desc">Add your first client to start managing your freelance relationships</div>
          <button className="btn btn-primary" onClick={openCreate}><LuPlus size={16} strokeWidth={ICON_STROKE} /> Add Client</button>
        </div>
      ) : (
        <div className="grid clients-grid">
          {clients.map(c => (
            <div key={c._id} className="card animate-fade-in" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* Status badge top-right */}
              <span className={`badge badge-${c.status}`} style={{ position: 'absolute', top: 20, right: 20 }}>{c.status}</span>

              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingRight: 56 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${avatarColor(c.name)}, ${avatarColor(c.name)}aa)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.95rem', color: 'white', flexShrink: 0,
                  boxShadow: `0 4px 12px ${avatarColor(c.name)}40`,
                }}>
                  {initials(c.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.93rem', lineHeight: 1.3 }}>{c.name}</div>
                  {c.company && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.company}</div>}
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
                {c.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <LuMail size={13} color="var(--text-muted)" strokeWidth={ICON_STROKE} style={{ flexShrink: 0 }} />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <LuPhone size={13} color="var(--text-muted)" strokeWidth={ICON_STROKE} style={{ flexShrink: 0 }} />
                    <span>{c.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats block */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0, padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 10, marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center', paddingRight: 8 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-green)', fontSize: '1rem', lineHeight: 1.2 }}>
                    ${c.totalEarned?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Total Earned</div>
                </div>
                <div style={{ background: 'var(--border)', width: 1 }} />
                <div style={{ textAlign: 'center', paddingLeft: 8 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--primary-light)', fontSize: '1rem', lineHeight: 1.2 }}>
                    {c.projectCount || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Projects</div>
                </div>
              </div>

              {/* Actions */}
              <div className="actions" style={{ marginTop: 'auto', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => openEdit(c)}
                  aria-label={`Edit ${c.name}`}
                  style={{ flex: 1 }}
                >
                  <LuPencil size={13} strokeWidth={ICON_STROKE} /> Edit
                </button>
                <button
                  className="btn btn-danger btn-icon btn-sm"
                  onClick={() => setDeleteId(c._id)}
                  aria-label={`Delete ${c.name}`}
                  style={{ width: 34, height: 34 }}
                >
                  <LuTrash2 size={14} strokeWidth={ICON_STROKE} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal modal-lg animate-slide-up">
            <div className="modal-header">
              <div className="modal-title">{editClient ? 'Edit Client' : 'New Client'}</div>
              <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close modal">
                <LuX size={18} strokeWidth={ICON_STROKE} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input className="form-control" id="client-name" placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-control" placeholder="Company Inc." value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" placeholder="email@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  {formErrors.email && <div className="form-error">{formErrors.email}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" placeholder="+1 234 567 890" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-control" placeholder="City, Country" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <><div className="spinner" /> Saving...</> : (editClient ? 'Update Client' : 'Add Client')}
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
            <h3 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.1rem' }}>Delete Client?</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.855rem', lineHeight: 1.6 }}>
              This will permanently delete the client. Projects associated with this client must be deleted first.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
