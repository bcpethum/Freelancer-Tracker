import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { MdPerson, MdEmail, MdWork, MdMonetizationOn, MdLock, MdSave, MdShield } from 'react-icons/md';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', profession: user?.profession || '', currency: user?.currency || 'USD' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { toast.error('Name is required'); return; }
    setProfileLoading(true);
    try {
      const res = await API.put('/auth/profile', profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setProfileLoading(false); }
  };

  const validatePw = () => {
    const errs = {};
    if (!pwForm.currentPassword) errs.current = 'Current password is required';
    if (!pwForm.newPassword) errs.new = 'New password is required';
    else if (pwForm.newPassword.length < 6) errs.new = 'Minimum 6 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwLoading(true);
    try {
      await API.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'FT';

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: <MdPerson /> },
    { id: 'security', label: 'Security', icon: <MdShield /> },
  ];

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: 'white',
            boxShadow: '0 8px 30px rgba(99,102,241,0.4)'
          }}>
            {initials}
          </div>
          <div>
            <h2 style={{ margin: 0, marginBottom: 4 }}>{user?.name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MdEmail size={14} />{user?.email}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MdWork size={14} />{user?.profession || 'Freelancer'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MdMonetizationOn size={14} />{user?.currency || 'USD'}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? 'linear-gradient(135deg, var(--primary-dark), var(--primary))' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
              boxShadow: activeTab === tab.id ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
            }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card animate-fade-in">
          <div className="section-header" style={{ marginBottom: 24 }}>
            <div className="section-title">Update Profile Information</div>
          </div>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <div className="input-wrapper">
                <MdPerson className="input-icon" />
                <input
                  id="profile-name"
                  className="form-control"
                  type="text"
                  placeholder="Your full name"
                  value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <MdEmail className="input-icon" />
                <input
                  className="form-control"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed</div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Profession</label>
                <div className="input-wrapper">
                  <MdWork className="input-icon" />
                  <input
                    id="profile-profession"
                    className="form-control"
                    type="text"
                    placeholder="e.g. Web Developer"
                    value={profileForm.profession}
                    onChange={e => setProfileForm(f => ({ ...f, profession: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Default Currency</label>
                <div className="input-wrapper">
                  <MdMonetizationOn className="input-icon" />
                  <select
                    id="profile-currency"
                    className="form-control"
                    value={profileForm.currency}
                    onChange={e => setProfileForm(f => ({ ...f, currency: e.target.value }))}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" id="save-profile-btn" disabled={profileLoading}>
                {profileLoading ? <><div className="spinner" /> Saving...</> : <><MdSave /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card animate-fade-in">
          <div className="section-header" style={{ marginBottom: 24 }}>
            <div className="section-title">Change Password</div>
          </div>

          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            🔐 Use a strong password with at least 8 characters, including uppercase, numbers, and symbols.
          </div>

          <form onSubmit={handlePwSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password <span className="required">*</span></label>
              <div className="input-wrapper">
                <MdLock className="input-icon" />
                <input
                  id="current-password"
                  className="form-control"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your current password"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                />
              </div>
              {pwErrors.current && <div className="form-error">⚠ {pwErrors.current}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <MdLock className="input-icon" />
                  <input
                    id="new-password"
                    className="form-control"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  />
                </div>
                {pwErrors.new && <div className="form-error">⚠ {pwErrors.new}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <MdLock className="input-icon" />
                  <input
                    id="confirm-password"
                    className="form-control"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  />
                </div>
                {pwErrors.confirm && <div className="form-error">⚠ {pwErrors.confirm}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="submit" className="btn btn-primary" id="change-password-btn" disabled={pwLoading}>
                {pwLoading ? <><div className="spinner" /> Changing...</> : <><MdShield /> Change Password</>}
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                Show passwords
              </label>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
