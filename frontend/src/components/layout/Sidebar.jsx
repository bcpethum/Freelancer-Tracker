import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdWork, MdPeople, MdPayment,
  MdBarChart, MdPerson, MdLogout
} from 'react-icons/md';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', icon: <MdDashboard />, label: 'Dashboard', end: true },
  { to: '/projects', icon: <MdWork />, label: 'Projects' },
  { to: '/clients', icon: <MdPeople />, label: 'Clients' },
  { to: '/payments', icon: <MdPayment />, label: 'Payments' },
  { to: '/reports', icon: <MdBarChart />, label: 'Reports' },
];

const accountItems = [
  { to: '/profile', icon: <MdPerson />, label: 'Profile' },
];

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
      <div className="sidebar-logo">
        <div className="logo-icon">💼</div>
        <span className="logo-text">FreelanceTrack</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Main Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="nav-section-title" style={{ marginTop: 8 }}>Account</div>
        {accountItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={() => navigate('/profile')}>
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.profession || 'Freelancer'}</div>
          </div>
        </div>
        <button
          className="nav-link w-full mt-2"
          onClick={handleLogout}
          style={{ background: 'rgba(239,68,68,0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <span className="nav-icon"><MdLogout /></span>
          <span>Logout</span>
        </button>
      </div>
    </>
  );
}
