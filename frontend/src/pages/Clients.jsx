import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdClose, MdEmail, MdPhone, MdBusiness } from 'react-icons/md';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['active', 'inactive', 'prospect'];

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
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ec4899', '#8b5cf6'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div>
      <div className="section-header mb-6">
        <div>
          <div className="section-title" style={{ fontSize: '1.5rem' }}>Clients</div>
          <div className="section-subtitle">{pagination.total} client{pagination.total !== 1 ? 's' : ''} total</div>
        </div>
        <button id="create-client-btn" className="btn btn-primary" onClick={openCreate}>
          <MdAdd size={18} /> Add Client
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <MdSearch className="search-icon" />
          <input className="form-control" id="client-search" placeholder="Search by name, email, company..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-control filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        {(search || filterStatus) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setPage(1); }}>
            <MdClose size={16} /> Clear
          </button>
        )}
      </div>

      {/* Client Cards Grid */}
      {loading ? (
        <div className="grid grid-auto">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '60%' }} />
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">No clients found</div>
          <div className="empty-desc">Add your first client to start managing your freelance relationships</div>
          <button className="btn btn-primary" onClick={openCreate}>+ Add Client</button>
        </div>
      ) : (
        <div className="grid grid-auto">
          {clients.map(c => (
            <div key={c._id} className="card animate-fade-in" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${avatarColor(c.name)}, ${avatarColor(c.name)}99)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1rem', color: 'white', flexShrink: 0
                  }}>
                    {initials(c.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{c.name}</div>
                    {c.company && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.company}</div>}
                  </div>
                </div>
                <span className={`badge badge-${c.status}`}>{c.status}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {c.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <MdEmail size={14} color="var(--text-muted)" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <MdPhone size={14} color="var(--text-muted)" />
                    <span>{c.phone}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px', background: 'var(--bg-input)', borderRadius: 10, marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--accent-green)', fontSize: '1rem' }}>
                    ${c.totalEarned?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Earned</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--primary-light)', fontSize: '1rem' }}>
                    {c.projectCount || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Projects</div>
                </div>
              </div>

              <div className="actions" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}><MdEdit size={14} /> Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(c._id)}><MdDelete size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(n => (
            <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
          ))}
          <button className="page-btn" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal modal-lg animate-slide-up">
            <div className="modal-header">
              <div className="modal-title">{editClient ? '✏️ Edit Client' : '👤 New Client'}</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input className="form-control" id="client-name" placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  {formErrors.name && <div className="form-error">⚠ {formErrors.name}</div>}
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
                  {formErrors.email && <div className="form-error">⚠ {formErrors.email}</div>}
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
          <div className="modal animate-slide-up" style={{ maxWidth: 420 }}>
            <div className="confirm-icon">🗑️</div>
            <h3 style={{ textAlign: 'center', marginBottom: 12 }}>Delete Client?</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              This will permanently delete the client. Projects associated with this client must be deleted first.
            </p>
            <div className="modal-footer" style={{ paddingTop: 0, borderTop: 'none' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
