import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../api/axiosInstance';
import Icon from './Icon';

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home', end: true },
  { to: '/dashboard/workshop', label: 'Workshops', icon: 'calendar' },
  { to: '/dashboard/enquiries', label: 'Enquiries', icon: 'chat', badge: 'enquiries' },
  { to: '/dashboard/stats', label: 'Stats', icon: 'chart' },
  { to: '/dashboard/testimonials', label: 'Testimonials', icon: 'chat' },
  { to: '/dashboard/faq', label: 'FAQ', icon: 'question' },
  { to: '/dashboard/curriculum', label: 'Curriculum', icon: 'list' },
  { to: '/dashboard/gallery', label: 'Gallery', icon: 'photo' },
];

/** 240px dark sidebar on desktop; slides in over the page on mobile. */
export default function Sidebar({ open, onClose }) {
  const [unread, setUnread] = useState(0);
  const refreshUnread = useCallback(async () => {
    try {
      const { data } = await api.get('/api/enquiries/unread-count');
      setUnread(Number(data.unread) || 0);
    } catch {
      /* badge is optional */
    }
  }, []);
  useEffect(() => {
    refreshUnread();
    const t = setInterval(refreshUnread, 30000);
    window.addEventListener('enquiries-changed', refreshUnread);
    return () => {
      clearInterval(t);
      window.removeEventListener('enquiries-changed', refreshUnread);
    };
  }, [refreshUnread]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-ink/50 transition-opacity md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-60 transform flex-col bg-ink text-white transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 flex-none items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="Dr. Jishya" className="h-10 w-auto rounded bg-white p-1" />
            <p className="text-[11px] uppercase tracking-[.16em] text-white/50">Admin</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded p-1 text-white/70 hover:text-white md:hidden"
          >
            <Icon name="x" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 border-l-4 px-5 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-accent bg-accent/20 text-white'
                        : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon name={item.icon} className="h-5 w-5 flex-none" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && unread > 0 && (
                    <span aria-label={`${unread} unread`} className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
