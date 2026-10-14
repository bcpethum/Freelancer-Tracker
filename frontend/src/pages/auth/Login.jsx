import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { LuBriefcase, LuMail, LuLock, LuEye, LuEyeOff, LuCircleAlert, LuArrowRight } from 'react-icons/lu';

const ICON_STROKE = 1.75;

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
      toast.success('Welcome back!');
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
          <div className="auth-logo">
            <LuBriefcase size={22} color="#ffffff" strokeWidth={ICON_STROKE} />
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your FreelanceTrack account</p>
        </div>

        {errors.general && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '11px 14px', marginBottom: 20,
            color: '#ef4444', fontSize: '0.855rem', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <LuCircleAlert size={15} strokeWidth={ICON_STROKE} style={{ flexShrink: 0 }} />
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email <span className="required">*</span></label>
            <div className="input-wrapper">
              <span className="input-icon"><LuMail size={14} strokeWidth={ICON_STROKE} /></span>
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
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password <span className="required">*</span></label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <span className="input-icon"><LuLock size={14} strokeWidth={ICON_STROKE} /></span>
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
                  border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', padding: 4,
                }}
                aria-label="Toggle password visibility"
              >
                {showPass
                  ? <LuEyeOff size={15} strokeWidth={ICON_STROKE} />
                  : <LuEye size={15} strokeWidth={ICON_STROKE} />}
              </button>
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <button
            id="login-submit"
            className="btn btn-primary btn-full btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading
              ? <><div className="spinner" /> Signing in...</>
              : <><LuArrowRight size={16} strokeWidth={ICON_STROKE} /> Sign In</>}
          </button>
        </form>

        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">or</span>
          <div className="divider-line" />
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
