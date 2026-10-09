import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdClose, MdFilterList } from 'react-icons/md';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['pending', 'received', 'overdue', 'cancelled'];
const PAYMENT_METHODS = ['bank_transfer', 'paypal', 'stripe', 'cash', 'check', 'crypto', 'other'];

const methodLabel = (m) => m.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [totalReceived, setTotalReceived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ project: '', amount: '', status: 'pending', paymentMethod: 'bank_transfer', invoiceNumber: '', notes: '', dueDate: '', receivedDate: '' });
  const [formErrors, setFormErrors] = useState({});

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (filterStatus) params.append('status', filterStatus);
      if (filterProject) params.append('project', filterProject);
      const res = await API.get(`/payments?${params}`);
      setPayments(res.data.data);
      setPagination(res.data.pagination);
      setTotalReceived(res.data.totalReceived || 0);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [page, filterStatus, filterProject]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => {
    Promise.all([
      API.get('/projects?limit=100'),
      API.get('/clients?limit=100')
    ]).then(([pr, cl]) => {
      setProjects(pr.data.data);
      setClients(cl.data.data);
    }).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditPayment(null);
    setForm({ project: '', amount: '', status: 'pending', paymentMethod: 'bank_transfer', invoiceNumber: '', notes: '', dueDate: '', receivedDate: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditPayment(p);
    setForm({
      project: p.project?._id || '',
      amount: p.amount || '',
      status: p.status || 'pending',
      paymentMethod: p.paymentMethod || 'bank_transfer',
      invoiceNumber: p.invoiceNumber || '',
      notes: p.notes || '',
      dueDate: p.dueDate ? format(new Date(p.dueDate), 'yyyy-MM-dd') : '',
      receivedDate: p.receivedDate ? format(new Date(p.receivedDate), 'yyyy-MM-dd') : ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.project) errs.project = 'Project is required';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) errs.amount = 'Valid amount is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormLoading(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editPayment) {
        await API.put(`/payments/${editPayment._id}`, payload);
        toast.success('Payment updated!');
      } else {
        await API.post('/payments', payload);
        toast.success('Payment recorded!');
      }
      setModalOpen(false);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/payments/${deleteId}`);
      toast.success('Payment deleted');
      setDeleteId(null);
      fetchPayments();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const pendingTotal = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const overdueTotal = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="section-header mb-6">
        <div>
          <div className="section-title" style={{ fontSize: '1.5rem' }}>Payments</div>
          <div className="section-subtitle">{pagination.total} payment records</div>
        </div>
        <button id="create-payment-btn" className="btn btn-primary" onClick={openCreate}>
          <MdAdd size={18} /> Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
        {[
          { label: 'Total Received', value: `$${totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '💰' },
          { label: 'Pending', value: `$${pendingTotal.toFixed(2)}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⏳' },
          { label: 'Overdue', value: `$${overdueTotal.toFixed(2)}`, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '⚠️' },
        ].map((card, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-icon" style={{ background: card.bg, color: card.color, fontSize: '1.3rem' }}>{card.icon}</div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="form-control filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        <select className="form-control filter-select" style={{ minWidth: 200 }} value={filterProject} onChange={e => { setFilterProject(e.target.value); setPage(1); }}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        {(filterStatus || filterProject) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterProject(''); setPage(1); }}>
            <MdClose size={16} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Project</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={9}><div className="skeleton" style={{ height: 20, margin: '8px 0' }} /></td></tr>
                ))
              ) : payments.length === 0 ? (
                <tr><td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-icon">💰</div>
                    <div className="empty-title">No payments found</div>
                    <div className="empty-desc">Record your first payment to start tracking income</div>
                    <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Record Payment</button>
                  </div>
                </td></tr>
              ) : payments.map(p => (
                <tr key={p._id}>
                  <td style={{ color: 'var(--primary-light)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {p.invoiceNumber || `INV-${p._id.slice(-6).toUpperCase()}`}
                  </td>
                  <td className="primary">{p.project?.name}</td>
                  <td>{p.client?.name}</td>
                  <td className={p.status === 'received' ? 'amount' : 'amount-pending'}>
                    ${p.amount?.toFixed(2)}
                  </td>
                  <td><span className="text-sm">{methodLabel(p.paymentMethod || 'bank_transfer')}</span></td>
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {p.receivedDate ? format(new Date(p.receivedDate), 'MMM dd, yyyy') : (p.createdAt ? format(new Date(p.createdAt), 'MMM dd, yyyy') : '—')}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {p.dueDate ? (
                      <span style={{ color: new Date(p.dueDate) < new Date() && p.status !== 'received' ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                        {format(new Date(p.dueDate), 'MMM dd, yyyy')}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(p)}><MdEdit /></button>
                      <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => setDeleteId(p._id)}><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal modal-lg animate-slide-up">
            <div className="modal-header">
              <div className="modal-title">{editPayment ? '✏️ Edit Payment' : '💰 Record Payment'}</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Project <span className="required">*</span></label>
                  <select className="form-control" id="payment-project" value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}>
                    <option value="">Select project</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  {formErrors.project && <div className="form-error">⚠ {formErrors.project}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($) <span className="required">*</span></label>
                  <input className="form-control" id="payment-amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  {formErrors.amount && <div className="form-error">⚠ {formErrors.amount}</div>}
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
                  <label className="form-label">Payment Method</label>
                  <select className="form-control" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{methodLabel(m)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input className="form-control" placeholder="INV-001" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-control" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              {form.status === 'received' && (
                <div className="form-group">
                  <label className="form-label">Received Date</label>
                  <input className="form-control" type="date" value={form.receivedDate} onChange={e => setForm(f => ({ ...f, receivedDate: e.target.value }))} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" placeholder="Payment notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <><div className="spinner" /> Saving...</> : (editPayment ? 'Update' : 'Record Payment')}
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
            <h3 style={{ textAlign: 'center', marginBottom: 12 }}>Delete Payment?</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              This will reverse the payment amount from the project's paid total.
            </p>
            <div className="modal-footer" style={{ paddingTop: 0, borderTop: 'none' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
