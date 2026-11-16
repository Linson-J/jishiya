import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axiosInstance';
import ConfirmModal from '../components/ConfirmModal';
import Icon from '../components/Icon';
import PageLoader, { Spinner } from '../components/PageLoader';

const MAX_STATS = 8;

export default function StatsEdit() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Add form
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  // Row edit
  const [editingId, setEditingId] = useState(null);
  const [draftValue, setDraftValue] = useState('');
  const [draftLabel, setDraftLabel] = useState('');
  const [draftError, setDraftError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/stats');
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load stats.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addStat(e) {
    e.preventDefault();
    const value = newValue.trim();
    const label = newLabel.trim();
    if (!value || !label) {
      setAddError('Enter both a number/value and a label.');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const { data } = await api.post('/api/stats', { value, label });
      setStats((prev) => [...prev, data]);
      setNewValue('');
      setNewLabel('');
      toast.success('Stat added');
    } catch (err) {
      setAddError(getErrorMessage(err, 'Could not add this stat.'));
    } finally {
      setAdding(false);
    }
  }

  function startEdit(stat) {
    setEditingId(stat.id);
    setDraftValue(stat.value);
    setDraftLabel(stat.label);
    setDraftError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftError('');
  }

  async function save(stat) {
    const value = draftValue.trim();
    const label = draftLabel.trim();
    if (!value || !label) {
      setDraftError('Value and label are both required');
      return;
    }
    if (value === stat.value && label === stat.label) {
      cancelEdit();
      return;
    }
    setBusyId(stat.id);
    try {
      const { data } = await api.put(`/api/stats/${stat.id}`, { value, label });
      setStats((prev) => prev.map((s) => (s.id === stat.id ? data : s)));
      toast.success('Stat updated');
      cancelEdit();
    } catch (err) {
      setDraftError(getErrorMessage(err, 'Could not save this stat.'));
    } finally {
      setBusyId(null);
    }
  }

  // Give every stat a clean 0..n-1 position, saving only the ones that changed.
  async function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= stats.length) return;
    const next = [...stats];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((s, i) => ({ ...s, sort_order: i }));
    setBusyId(-1);
    try {
      await Promise.all(
        reordered
          .filter((s) => stats.find((o) => o.id === s.id).sort_order !== s.sort_order)
          .map((s) => api.put(`/api/stats/${s.id}`, { sort_order: s.sort_order }))
      );
      setStats(reordered);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change the order.'));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/stats/${deleteTarget.id}`);
      setStats((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success('Stat deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this stat.'));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <PageLoader />;
  if (loadError) {
    return (
      <div role="alert" className="card mx-auto max-w-3xl p-6 text-sm text-accent-dark">
        {loadError}
      </div>
    );
  }

  const full = stats.length >= MAX_STATS;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 text-sm text-ink-soft">
        These numbers appear in the introduction at the top of the website (up to {MAX_STATS}). Add a new one below, or
        edit, reorder and delete the existing ones. Values like <b>1500+</b> or <b>70K+</b> are shown as typed; text
        such as <b>PhD</b> works too.
      </p>

      <form onSubmit={addStat} noValidate className="card mb-6 p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-soft">Add a stat</h2>
        <div className="grid gap-3 sm:grid-cols-[150px_1fr_auto] sm:items-end">
          <label className="block text-xs font-medium text-ink-soft">
            Number / value
            <input
              type="text"
              value={newValue}
              maxLength={50}
              disabled={full || adding}
              placeholder="e.g. 500+"
              onChange={(e) => {
                setNewValue(e.target.value);
                setAddError('');
              }}
              className="input mt-1"
            />
          </label>
          <label className="block text-xs font-medium text-ink-soft">
            Label
            <input
              type="text"
              value={newLabel}
              maxLength={100}
              disabled={full || adding}
              placeholder="e.g. Workshops Conducted"
              onChange={(e) => {
                setNewLabel(e.target.value);
                setAddError('');
              }}
              className="input mt-1"
            />
          </label>
          <button type="submit" disabled={full || adding} className="btn btn-primary">
            {adding ? <Spinner className="h-4 w-4" /> : <Icon name="plus" className="h-4 w-4" />}
            Add
          </button>
        </div>
        {addError && (
          <p role="alert" className="mt-2 text-xs text-accent">
            {addError}
          </p>
        )}
        {full && <p className="mt-2 text-xs text-ink-soft">You have reached the maximum of {MAX_STATS} stats. Delete one to add another.</p>}
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <th className="th w-40">Value</th>
              <th className="th">Label</th>
              <th className="th w-44 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 && (
              <tr>
                <td colSpan={3} className="td py-10 text-center text-ink-soft">
                  No stats yet. Add one above — the stats row stays hidden on the website until you do.
                </td>
              </tr>
            )}
            {stats.map((stat, i) => {
              const editing = editingId === stat.id;
              const saving = busyId === stat.id;
              return (
                <tr key={stat.id} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                  {editing ? (
                    <>
                      <td className="td">
                        <input
                          type="text"
                          autoFocus
                          maxLength={50}
                          value={draftValue}
                          disabled={saving}
                          aria-label="Value"
                          onChange={(e) => {
                            setDraftValue(e.target.value);
                            setDraftError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') save(stat);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className={`input max-w-[140px] ${draftError ? 'input-error' : ''}`}
                        />
                      </td>
                      <td className="td">
                        <input
                          type="text"
                          maxLength={100}
                          value={draftLabel}
                          disabled={saving}
                          aria-label="Label"
                          onChange={(e) => {
                            setDraftLabel(e.target.value);
                            setDraftError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') save(stat);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className={`input ${draftError ? 'input-error' : ''}`}
                        />
                        {draftError && (
                          <p role="alert" className="mt-1 text-xs text-accent">
                            {draftError}
                          </p>
                        )}
                      </td>
                      <td className="td text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={() => save(stat)}>
                            {saving ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="check" className="h-3.5 w-3.5" />}
                            Save
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="td font-serif text-xl font-semibold">{stat.value}</td>
                      <td className="td font-medium">{stat.label}</td>
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => move(i, -1)}
                            disabled={i === 0 || busyId !== null}
                            aria-label="Move up"
                            title="Move earlier"
                            className="rounded px-2 py-1 text-sm text-ink-mid hover:bg-gray-200 disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => move(i, 1)}
                            disabled={i === stats.length - 1 || busyId !== null}
                            aria-label="Move down"
                            title="Move later"
                            className="rounded px-2 py-1 text-sm text-ink-mid hover:bg-gray-200 disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button type="button" onClick={() => startEdit(stat)} aria-label={`Edit ${stat.label}`} title="Edit" className="rounded p-2 text-ink-mid hover:bg-gray-200 hover:text-ink">
                            <Icon name="pencil" className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(stat)} aria-label={`Delete ${stat.label}`} title="Delete" className="rounded p-2 text-accent hover:bg-accent-light">
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete stat?"
        message="Are you sure? This cannot be undone."
        detail={deleteTarget ? `${deleteTarget.value} — ${deleteTarget.label}` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
