import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axiosInstance';
import ConfirmModal from '../components/ConfirmModal';
import Icon from '../components/Icon';
import PageLoader from '../components/PageLoader';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

// Tell the sidebar to refresh its unread badge.
const notifySidebar = () => window.dispatchEvent(new Event('enquiries-changed'));

function when(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function Enquiries() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/enquiries');
      setItems(data);
      setLoadError('');
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Could not load enquiries.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // pick up new messages while the page stays open
    return () => clearInterval(t);
  }, [load]);

  const unread = items.filter((e) => !e.is_read).length;
  const shown = items.filter((e) => (filter === 'unread' ? !e.is_read : filter === 'read' ? e.is_read : true));

  async function setRead(item, isRead) {
    setBusyId(item.id);
    try {
      const { data } = await api.put(`/api/enquiries/${item.id}`, { is_read: isRead });
      setItems((prev) => prev.map((e) => (e.id === data.id ? data : e)));
      notifySidebar();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update this enquiry.'));
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await api.put('/api/enquiries/read-all');
      setItems((prev) => prev.map((e) => ({ ...e, is_read: 1 })));
      notifySidebar();
      toast.success('All enquiries marked as read');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not mark all as read.'));
    } finally {
      setMarkingAll(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/enquiries/${deleteTarget.id}`);
      setItems((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      notifySidebar();
      toast.success('Enquiry deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this enquiry.'));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <PageLoader />;
  if (loadError && items.length === 0) {
    return (
      <div role="alert" className="card mx-auto max-w-3xl p-6 text-sm text-accent-dark">
        {loadError}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter enquiries" className="flex gap-1 border-b border-gray-200">
          {FILTERS.map((f) => {
            const selected = filter === f.key;
            const count = f.key === 'all' ? items.length : f.key === 'unread' ? unread : items.length - unread;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(f.key)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  selected ? 'border-accent text-ink' : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {f.label} <span className="ml-1 text-xs font-normal text-ink-soft">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await load();
              notifySidebar();
              toast.success('Up to date');
            }}
            className="btn btn-ghost"
          >
            ↻ Refresh
          </button>
          <button type="button" onClick={markAllRead} disabled={unread === 0 || markingAll} className="btn btn-ghost">
            <Icon name="check" className="h-4 w-4" />
            Mark all as read
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">
          {items.length === 0
            ? 'No enquiries yet. Messages sent from the contact form on the website will appear here.'
            : filter === 'unread'
              ? 'No unread enquiries. 🎉'
              : 'Nothing here.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((e) => {
            const isRead = Boolean(e.is_read);
            return (
              <li
                key={e.id}
                className={`card border-l-4 p-4 sm:p-5 ${isRead ? 'border-l-gray-200 bg-white' : 'border-l-accent bg-white shadow-sm'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
                      {!isRead && <span aria-label="Unread" className="h-2.5 w-2.5 flex-none rounded-full bg-accent" />}
                      <b className={`truncate text-base ${isRead ? 'font-medium' : 'font-bold'}`}>{e.name}</b>
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-ink-mid">
                      {e.email && (
                        <a href={`mailto:${e.email}`} className="hover:text-accent hover:underline">
                          ✉ {e.email}
                        </a>
                      )}
                      {e.phone && (
                        <a href={`tel:${e.phone.replace(/[^\d+]/g, '')}`} className="hover:text-accent hover:underline">
                          ☎ {e.phone}
                        </a>
                      )}
                    </p>
                  </div>
                  <time dateTime={e.created_at} className="flex-none text-xs text-ink-soft">
                    {when(e.created_at)}
                  </time>
                </div>

                <p className={`mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed ${isRead ? 'text-ink-mid' : 'text-ink'}`}>
                  {e.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setRead(e, !isRead)}
                    disabled={busyId === e.id}
                    className="btn btn-ghost btn-sm"
                  >
                    <Icon name="check" className="h-3.5 w-3.5" />
                    {isRead ? 'Mark as unread' : 'Mark as read'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(e)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium text-accent hover:bg-accent-light"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete enquiry?"
        message="Are you sure? This cannot be undone."
        detail={deleteTarget ? `${deleteTarget.name} — ${deleteTarget.message.slice(0, 80)}` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
