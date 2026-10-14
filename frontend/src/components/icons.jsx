/**
 * Icon System — FreelanceTrack
 * Single source of truth for all icons.
 * Uses Lucide icons from react-icons/lu.
 * Stroke width is controlled via CSS (--icon-stroke).
 */
import {
  LuLayoutDashboard,
  LuBriefcase,
  LuUsers,
  LuCreditCard,
  LuChartColumn,
  LuUser,
  LuDoorOpen,
  LuSearch,
  LuCalendarDays,
  LuDollarSign,
  LuFolderKanban,
  LuClock,
  LuPencil,
  LuTrash2,
  LuDownload,
  LuMail,
  LuPhone,
  LuPlus,
  LuTrendingUp,
  LuMenu,
  LuX,
  LuChevronRight,
  LuTriangleAlert,
  LuShield,
  LuLock,
  LuSave,
  LuBuilding2,
  LuFileText,
  LuTableProperties,
  LuFilter,
  LuCheck,
  LuStar,
} from 'react-icons/lu';

export const Icons = {
  Dashboard: LuLayoutDashboard,
  Projects: LuBriefcase,
  Clients: LuUsers,
  Payments: LuCreditCard,
  Reports: LuChartColumn,
  Profile: LuUser,
  Logout: LuDoorOpen,
  Search: LuSearch,
  Calendar: LuCalendarDays,
  Income: LuDollarSign,
  FolderKanban: LuFolderKanban,
  Clock: LuClock,
  Edit: LuPencil,
  Delete: LuTrash2,
  Download: LuDownload,
  Mail: LuMail,
  Phone: LuPhone,
  Add: LuPlus,
  Trend: LuTrendingUp,
  Menu: LuMenu,
  Close: LuX,
  ChevronRight: LuChevronRight,
  Warning: LuTriangleAlert,
  Shield: LuShield,
  Lock: LuLock,
  Save: LuSave,
  Building: LuBuilding2,
  FileText: LuFileText,
  Table: LuTableProperties,
  Filter: LuFilter,
  Check: LuCheck,
  Star: LuStar,
};

/**
 * Icon wrapper with consistent sizing and color.
 * size: 'xs'=14, 'sm'=16, 'md'=18, 'lg'=20, 'xl'=22
 */
export function Icon({ name, size = 'md', color = 'currentColor', className = '' }) {
  const sizes = { xs: 14, sm: 16, md: 18, lg: 20, xl: 22 };
  const px = typeof size === 'number' ? size : sizes[size] ?? 18;
  const Component = Icons[name];
  if (!Component) return null;
  return (
    <Component
      size={px}
      color={color}
      strokeWidth={1.75}
      className={className}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
}

/**
 * IconContainer — soft rounded container for stat/card icons
 * variant: 'default' | 'indigo' | 'green' | 'amber' | 'red' | 'cyan'
 */
export function IconContainer({ name, size = 'xl', containerSize = 44, variant = 'default' }) {
  const variantStyles = {
    default: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' },
    indigo:  { background: 'rgba(99,102,241,0.12)',  border: '1px solid rgba(99,102,241,0.2)' },
    green:   { background: 'rgba(34,197,94,0.12)',   border: '1px solid rgba(34,197,94,0.2)' },
    amber:   { background: 'rgba(245,158,11,0.12)',  border: '1px solid rgba(245,158,11,0.2)' },
    red:     { background: 'rgba(239,68,68,0.12)',   border: '1px solid rgba(239,68,68,0.2)' },
    cyan:    { background: 'rgba(6,182,212,0.12)',   border: '1px solid rgba(6,182,212,0.2)' },
  };
  const style = variantStyles[variant] || variantStyles.default;
  return (
    <div style={{
      width: containerSize,
      height: containerSize,
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...style,
    }}>
      <Icon name={name} size={size} color="#ffffff" />
    </div>
  );
}
