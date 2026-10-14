import { useLocation, useNavigate } from 'react-router-dom';
import { LuMenu, LuCalendarDays } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/clients': 'Clients',
  '/payments': 'Payments',
  '/reports': 'Reports & Analytics',
  '/profile': 'Profile Settings'
};

const pageSubtitles = {
  '/': 'Overview of your freelance business',
  '/projects': 'Manage your active and past projects',
  '/clients': 'Manage your client relationships',
  '/payments': 'Track income and payment history',
  '/reports': 'Visual insights and export tools',
  '/profile': 'Update your personal information'
};

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const title = pageTitles[location.pathname] || 'FreelanceTrack';
  const subtitle = pageSubtitles[location.pathname] || '';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'FT';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="btn btn-ghost btn-icon"
          onClick={onMenuClick}
          id="menu-btn"
          aria-label="Open sidebar menu"
          style={{ display: 'none' }}
        >
          <LuMenu size={22} strokeWidth={1.75} />
        </button>
        <div>
          <div className="page-title">{title}</div>
          <div className="page-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-date">
          <LuCalendarDays size={14} strokeWidth={1.75} />
          <span>{dateStr}</span>
        </div>
        <div
          className="topbar-avatar"
          onClick={() => navigate('/profile')}
          role="button"
          tabIndex={0}
          aria-label="Go to profile"
          title={user?.name || 'Profile'}
        >
          {initials}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          #menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
