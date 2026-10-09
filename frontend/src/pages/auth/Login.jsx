import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 👋');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
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

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">💼</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your FreelanceTrack account</p>
        </div>

        {errors.general && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 20,
            color: '#ef4444', fontSize: '0.875rem'
          }}>
            ⚠️ {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email <span className="required">*</span></label>
            <div className="input-wrapper">
              <MdEmail className="input-icon" />
              <input
                id="login-email"
                className="form-control"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            {errors.email && <div className="form-error">⚠ {errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password <span className="required">*</span></label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <MdLock className="input-icon" />
              <input
                id="login-password"
                className="form-control"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem'
                }}
                aria-label="Toggle password visibility"
              >
                {showPass ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
            {errors.password && <div className="form-error">⚠ {errors.password}</div>}
          </div>

          <button
            id="login-submit"
            className="btn btn-primary btn-full btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <><div className="spinner" /> Signing in...</> : '🚀 Sign In'}
          </button>
        </form>

        <div className="divider"><div className="divider-line" /><span className="divider-text">or</span><div className="divider-line" /></div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
