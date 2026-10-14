import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LuLayoutDashboard, LuBriefcase, LuUsers, LuCreditCard,
  LuChartColumn, LuUser, LuDoorOpen,
} from 'react-icons/lu';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', icon: LuLayoutDashboard, label: 'Dashboard', end: true },
  { to: '/projects', icon: LuBriefcase, label: 'Projects' },
  { to: '/clients', icon: LuUsers, label: 'Clients' },
  { to: '/payments', icon: LuCreditCard, label: 'Payments' },
  { to: '/reports', icon: LuChartColumn, label: 'Reports' },
];

const accountItems = [
  { to: '/profile', icon: LuUser, label: 'Profile' },
];

const ICON_SIZE = 18;
const ICON_STROKE = 1.75;

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'FT';

  return (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <LuBriefcase size={18} color="#ffffff" strokeWidth={ICON_STROKE} />
        </div>
        <span className="logo-text">FreelanceTrack</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="nav-section-title">Main Menu</div>
        {navItems.map(item => {
          const IconComp = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              aria-label={item.label}
            >
              <span className="nav-icon">
                <IconComp size={ICON_SIZE} strokeWidth={ICON_STROKE} />
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: 8 }}>Account</div>
        {accountItems.map(item => {
          const IconComp = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              aria-label={item.label}
            >
              <span className="nav-icon">
                <IconComp size={ICON_SIZE} strokeWidth={ICON_STROKE} />
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-card" onClick={() => navigate('/profile')} role="button" tabIndex={0} aria-label="Go to profile">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.profession || 'Freelancer'}</div>
          </div>
        </div>
        <button
          className="nav-link w-full"
          style={{ marginTop: 4, color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.05)' }}
          onClick={handleLogout}
          aria-label="Logout"
        >
          <span className="nav-icon">
            <LuDoorOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </>
  );
}
