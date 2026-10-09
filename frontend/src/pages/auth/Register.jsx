import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdPerson, MdWork, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', profession: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, profession: form.profession });
      toast.success('Account created! Welcome to FreelanceTrack 🎉');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strength = passwordStrength();
  const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#10b981'][strength];

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
      </div>
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="auth-header">
          <div className="auth-logo">🚀</div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start tracking your freelance business</p>
        </div>

        {errors.general && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#ef4444', fontSize: '0.875rem' }}>
            ⚠️ {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name <span className="required">*</span></label>
              <div className="input-wrapper">
                <MdPerson className="input-icon" />
                <input id="reg-name" className="form-control" type="text" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} autoComplete="name" />
              </div>
              {errors.name && <div className="form-error">⚠ {errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-profession">Profession</label>
              <div className="input-wrapper">
                <MdWork className="input-icon" />
                <input id="reg-profession" className="form-control" type="text" name="profession" placeholder="e.g. Web Developer" value={form.profession} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email <span className="required">*</span></label>
            <div className="input-wrapper">
              <MdEmail className="input-icon" />
              <input id="reg-email" className="form-control" type="email" name="email" placeholder="your@email.com" value={form.email} onChange={handleChange} autoComplete="email" />
            </div>
            {errors.email && <div className="form-error">⚠ {errors.email}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password <span className="required">*</span></label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <MdLock className="input-icon" />
                <input id="reg-password" className="form-control" type={showPass ? 'text' : 'password'} name="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} autoComplete="new-password" style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>
                  {showPass ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              {form.password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? strengthColor : 'var(--border)', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: strengthColor }}>{strengthLabel}</div>
                </div>
              )}
              {errors.password && <div className="form-error">⚠ {errors.password}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password <span className="required">*</span></label>
              <div className="input-wrapper">
                <MdLock className="input-icon" />
                <input id="reg-confirm" className="form-control" type={showPass ? 'text' : 'password'} name="confirmPassword" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
              </div>
              {errors.confirmPassword && <div className="form-error">⚠ {errors.confirmPassword}</div>}
            </div>
          </div>

          <button id="register-submit" className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><div className="spinner" /> Creating account...</> : '✨ Create Account'}
          </button>
        </form>

        <div className="divider"><div className="divider-line" /><span className="divider-text">or</span><div className="divider-line" /></div>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
