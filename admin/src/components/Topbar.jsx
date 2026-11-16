import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/workshop': 'Workshops',
  '/dashboard/enquiries': 'Enquiries',
  '/dashboard/stats': 'Stats',
  '/dashboard/testimonials': 'Testimonials',
  '/dashboard/faq': 'FAQ',
  '/dashboard/curriculum': 'Curriculum',
  '/dashboard/gallery': 'Gallery',
};

export default function Topbar({ onMenuClick, menuOpen }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const title = TITLES[pathname.replace(/\/+$/, '')] || 'Dashboard';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          aria-controls="admin-sidebar"
          aria-expanded={menuOpen}
          className="-ml-1 rounded p-1.5 hover:bg-gray-100 md:hidden"
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
        <h1 className="truncate text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {user && <span className="hidden text-sm text-ink-soft sm:block">{user.email}</span>}
        <button type="button" onClick={logout} className="btn btn-ghost btn-sm">
          <Icon name="logout" className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
