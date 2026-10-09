import { useLocation } from 'react-router-dom';
import { MdMenu } from 'react-icons/md';

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
  const title = pageTitles[location.pathname] || 'FreelanceTrack';
  const subtitle = pageSubtitles[location.pathname] || '';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="btn btn-ghost btn-icon"
          onClick={onMenuClick}
          style={{ display: 'none' }}
          id="menu-btn"
          aria-label="Open menu"
        >
          <MdMenu size={22} />
        </button>
        <div>
          <div className="page-title">{title}</div>
          <div className="text-xs text-muted">{subtitle}</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ opacity: 0.5 }}>📅</span>
          {dateStr}
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
