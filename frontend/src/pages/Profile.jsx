import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  LuUser, LuMail, LuBriefcase, LuDollarSign, LuLock, LuSave, LuShield, LuBuilding2,
} from 'react-icons/lu';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED'];
const ICON_STROKE = 1.75;

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
    { id: 'profile', label: 'Profile Info', icon: LuUser },
    { id: 'security', label: 'Security', icon: LuShield },
  ];

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.07))', border: '1px solid rgba(99,102,241,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 800, color: 'white',
            boxShadow: '0 6px 24px rgba(99,102,241,0.35)',
            fontFamily: 'var(--font-display)',
          }}>
            {initials}
          </div>
          <div>
            <h2 style={{ margin: 0, marginBottom: 6, fontSize: '1.3rem' }}>{user?.name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <LuMail size={13} strokeWidth={ICON_STROKE} /> {user?.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <LuBriefcase size={13} strokeWidth={ICON_STROKE} /> {user?.profession || 'Freelancer'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <LuDollarSign size={13} strokeWidth={ICON_STROKE} /> {user?.currency || 'USD'}
              </span>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {tabs.map(tab => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? 'linear-gradient(135deg, var(--primary-dark), var(--primary))' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.855rem', transition: 'all 0.15s',
                boxShadow: activeTab === tab.id ? '0 2px 10px rgba(99,102,241,0.25)' : 'none',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <IconComp size={15} strokeWidth={ICON_STROKE} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card animate-fade-in">
          <div className="section-header" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LuUser size={16} color="var(--text-muted)" strokeWidth={ICON_STROKE} />
              <span className="section-title">Update Profile Information</span>
            </div>
          </div>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <div className="input-wrapper">
                <span className="input-icon"><LuUser size={14} strokeWidth={ICON_STROKE} /></span>
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
                <span className="input-icon"><LuMail size={14} strokeWidth={ICON_STROKE} /></span>
                <input
                  className="form-control"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.55, cursor: 'not-allowed' }}
                />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed</div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Profession</label>
                <div className="input-wrapper">
                  <span className="input-icon"><LuBriefcase size={14} strokeWidth={ICON_STROKE} /></span>
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
                  <span className="input-icon"><LuDollarSign size={14} strokeWidth={ICON_STROKE} /></span>
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
                {profileLoading ? <><div className="spinner" /> Saving...</> : <><LuSave size={15} strokeWidth={ICON_STROKE} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card animate-fade-in">
          <div className="section-header" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LuShield size={16} color="var(--text-muted)" strokeWidth={ICON_STROKE} />
              <span className="section-title">Change Password</span>
            </div>
          </div>

          <div className="info-banner" style={{ marginBottom: 24 }}>
            <LuShield size={15} color="var(--primary-light)" strokeWidth={ICON_STROKE} style={{ flexShrink: 0 }} />
            Use a strong password with at least 8 characters, including uppercase, numbers, and symbols.
          </div>

          <form onSubmit={handlePwSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password <span className="required">*</span></label>
              <div className="input-wrapper">
                <span className="input-icon"><LuLock size={14} strokeWidth={ICON_STROKE} /></span>
                <input
                  id="current-password"
                  className="form-control"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your current password"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                />
              </div>
              {pwErrors.current && <div className="form-error">{pwErrors.current}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <span className="input-icon"><LuLock size={14} strokeWidth={ICON_STROKE} /></span>
                  <input
                    id="new-password"
                    className="form-control"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  />
                </div>
                {pwErrors.new && <div className="form-error">{pwErrors.new}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <span className="input-icon"><LuLock size={14} strokeWidth={ICON_STROKE} /></span>
                  <input
                    id="confirm-password"
                    className="form-control"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  />
                </div>
                {pwErrors.confirm && <div className="form-error">{pwErrors.confirm}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" id="change-password-btn" disabled={pwLoading}>
                {pwLoading ? <><div className="spinner" /> Changing...</> : <><LuShield size={15} strokeWidth={ICON_STROKE} /> Change Password</>}
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.855rem', color: 'var(--text-muted)', userSelect: 'none' }}>
                <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} style={{ accentColor: 'var(--primary)', width: 15, height: 15 }} />
                Show passwords
              </label>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
