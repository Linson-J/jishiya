import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

// "?all=true" (with the admin token) counts inactive rows too.
const COUNTS = [
  { key: 'testimonials', label: 'Testimonials', url: '/api/testimonials', params: { all: 'true' }, icon: 'chat', to: '/dashboard/testimonials' },
  { key: 'faq', label: 'FAQ Items', url: '/api/faq', params: { all: 'true' }, icon: 'question', to: '/dashboard/faq' },
  { key: 'curriculum', label: 'Curriculum Modules', url: '/api/curriculum', params: { all: 'true' }, icon: 'list', to: '/dashboard/curriculum' },
  { key: 'gallery', label: 'Gallery Photos', url: '/api/gallery', params: {}, icon: 'photo', to: '/dashboard/gallery' },
];

const QUICK_LINKS = [
  { to: '/dashboard/workshop', title: 'Workshops', text: 'Add workshops, set the priority one, dates, price and enroll links.', icon: 'calendar' },
  { to: '/dashboard/stats', title: 'Stats band', text: 'Update the headline numbers.', icon: 'chart' },
  { to: '/dashboard/testimonials', title: 'Testimonials', text: 'Add, edit, hide or reorder reviews.', icon: 'chat' },
  { to: '/dashboard/faq', title: 'FAQ', text: 'Manage questions and answers.', icon: 'question' },
  { to: '/dashboard/enquiries', title: 'Enquiries', text: 'Messages from the website contact form — read, mark and delete.', icon: 'chat' },
  { to: '/dashboard/curriculum', title: 'Curriculum', text: 'Edit the workshop modules.', icon: 'list' },
  { to: '/dashboard/gallery', title: 'Gallery', text: 'Upload portraits, workshop photos and logos.', icon: 'photo' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(COUNTS.map((c) => api.get(c.url, { params: c.params })));
      if (cancelled) return;
      const next = {};
      results.forEach((r, i) => {
        next[COUNTS[i].key] = r.status === 'fulfilled' && Array.isArray(r.value.data) ? r.value.data.length : null;
      });
      setCounts(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-2xl font-semibold">Welcome back, Admin</h2>
      {user && <p className="mt-1 text-sm text-ink-soft">Signed in as {user.email}</p>}

      <section aria-label="Content totals" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COUNTS.map((c) => (
          <Link key={c.key} to={c.to} className="card group p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-soft">{c.label}</span>
              <Icon name={c.icon} className="h-5 w-5 text-ink-soft group-hover:text-accent" />
            </div>
            <p className="mt-3 text-4xl font-bold tabular-nums">
              {loading ? (
                <span className="inline-block h-9 w-12 animate-pulse rounded bg-gray-200" aria-label="Loading" />
              ) : counts[c.key] === null || counts[c.key] === undefined ? (
                <span title="Could not load">—</span>
              ) : (
                counts[c.key]
              )}
            </p>
          </Link>
        ))}
      </section>

      <section aria-label="Quick links" className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-soft">Quick links</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="card flex items-start gap-3 p-5 transition-colors hover:border-ink"
            >
              <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md bg-ink text-white">
                <Icon name={l.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold">{l.title}</span>
                <span className="mt-0.5 block text-sm text-ink-soft">{l.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
