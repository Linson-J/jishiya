import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axiosInstance';
import ConfirmModal from '../components/ConfirmModal';
import FormField from '../components/FormField';
import Icon from '../components/Icon';
import PageLoader, { Spinner } from '../components/PageLoader';
import Toggle from '../components/Toggle';
import { TimeSlotInput, DurationInput } from '../components/TimeSlotInput';
import DateRangeInput from '../components/DateRangeInput';

// Mirrors the backend rule: http(s) URL, site-relative path, or in-page anchor.
const SAFE_LINK = /^(https?:\/\/[^\s]+|[#/][^\s]*)$/i;

const FIELDS = [
  { name: 'title', label: 'Title', max: 255, full: true },
  { name: 'subtitle', label: 'Subtitle', max: 5000, full: true, textarea: true, hint: 'The short paragraph under the headline.' },
  { name: 'date', label: 'Date', max: 100 },
  { name: 'platform', label: 'Platform', max: 100, hint: 'e.g. Zoom' },
  { name: 'time_slot', label: 'Time slot', max: 100 },
  { name: 'duration', label: 'Duration', max: 50 },
  { name: 'language', label: 'Language', max: 50, hint: 'e.g. Tamil' },
  { name: 'price', label: 'Price', max: 50, hint: 'e.g. ₹999' },
  {
    name: 'cta_link',
    label: 'Enroll / CTA link',
    max: 255,
    full: true,
    hint: 'Where this workshop’s Enroll button goes. Must start with https://, http://, / or #.',
    pattern: { value: SAFE_LINK, message: 'Must start with https://, http://, / or # and contain no spaces' },
  },
  { name: 'seats_note', label: 'Seats note', max: 100, hint: 'e.g. Few left' },
];

const EMPTY = {
  ...Object.fromEntries(FIELDS.map((f) => [f.name, ''])),
  language: 'Tamil',
  platform: 'Zoom',
  is_active: true,
  is_priority: false,
};

const toForm = (w) => ({
  ...Object.fromEntries(FIELDS.map((f) => [f.name, w[f.name] ?? ''])),
  is_active: Boolean(w.is_active),
  is_priority: Boolean(w.is_priority),
});

const sortList = (list) => [...list].sort((a, b) => Number(b.is_priority) - Number(a.is_priority) || a.id - b.id);

export default function Workshops() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const formRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/workshop/list', { params: { all: 'true' } });
        if (!cancelled) setItems(sortList(data));
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load workshops.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openForm = () => setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  const startNew = () => {
    reset({ ...EMPTY, is_priority: items.length === 0 });
    setEditing('new');
    openForm();
  };
  const startEdit = (w) => {
    reset(toForm(w));
    setEditing(w.id);
    openForm();
  };
  const cancelForm = () => {
    setEditing(null);
    reset(EMPTY);
  };

  // After any change that may move the priority flag, refetch so the table is the server's truth.
  async function refresh() {
    const { data } = await api.get('/api/workshop/list', { params: { all: 'true' } });
    setItems(sortList(data));
  }

  async function onSubmit(values) {
    const payload = Object.fromEntries(FIELDS.map((f) => [f.name, String(values[f.name]).trim()]));
    payload.is_active = Boolean(values.is_active);
    if (values.is_priority) payload.is_priority = true;
    try {
      if (editing === 'new') {
        await api.post('/api/workshop', payload);
        toast.success('Workshop added');
      } else {
        await api.put(`/api/workshop/${editing}`, payload);
        toast.success('Workshop saved');
      }
      await refresh();
      cancelForm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save the workshop.'));
    }
  }

  async function makePriority(w) {
    setBusyId(w.id);
    try {
      await api.put(`/api/workshop/${w.id}`, { is_priority: true, is_active: true });
      await refresh();
      toast.success('Priority workshop updated — the site now shows this one big, with its price everywhere');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change the priority workshop.'));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(w) {
    setBusyId(w.id);
    try {
      await api.put(`/api/workshop/${w.id}`, { is_active: !w.is_active });
      await refresh();
      toast.success(w.is_active ? 'Hidden from the website' : 'Now visible on the website');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change visibility.'));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/workshop/${deleteTarget.id}`);
      if (editing === deleteTarget.id) cancelForm();
      await refresh();
      toast.success('Workshop deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the workshop.'));
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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-soft">
          The <b>priority</b> workshop is shown big at the top of the website, and its price and enroll link are used in
          the header, buttons and the final call-to-action. Every other active workshop appears in the “Upcoming
          Workshops” list — that list is hidden when there are none.
        </p>
        <button type="button" onClick={startNew} disabled={editing === 'new'} className="btn btn-primary">
          <Icon name="plus" className="h-4 w-4" />
          Add Workshop
        </button>
      </div>

      {editing !== null && (
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label={editing === 'new' ? 'Add workshop' : 'Edit workshop'}
          className="card mb-6 scroll-mt-24 space-y-5 border-ink p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold">{editing === 'new' ? 'Add workshop' : 'Edit workshop'}</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((f) => {
              const id = `ws-${f.name}`;
              const err = errors[f.name];
              const rules = {
                required: `${f.label} is required`,
                maxLength: { value: f.max, message: `${f.label} must be ${f.max} characters or fewer` },
                validate: (v) => String(v).trim() !== '' || `${f.label} is required`,
                ...(f.pattern ? { pattern: f.pattern } : {}),
              };
              const shared = {
                id,
                'aria-invalid': err ? 'true' : 'false',
                className: `input ${err ? 'input-error' : ''}`,
                ...register(f.name, rules),
              };
              const setField = (name) => (v) => setValue(name, v, { shouldDirty: true, shouldValidate: true });
              return (
                <div key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
                  <FormField label={f.label} htmlFor={id} error={err && err.message} hint={f.hint}>
                    {f.name === 'date' ? (
                      <DateRangeInput id={id} invalid={!!err} value={watch('date')} onChange={setField('date')} />
                    ) : f.name === 'time_slot' ? (
                      <TimeSlotInput id={id} invalid={!!err} value={watch('time_slot')} onChange={setField('time_slot')} />
                    ) : f.name === 'duration' ? (
                      <DurationInput id={id} invalid={!!err} value={watch('duration')} onChange={setField('duration')} />
                    ) : f.textarea ? (
                      <textarea rows={3} {...shared} />
                    ) : (
                      <input type="text" {...shared} />
                    )}
                  </FormField>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="rounded border-gray-300 text-accent focus:ring-accent" {...register('is_priority')} />
              Make this the priority workshop
              <span className="font-normal text-ink-soft">(shown big; its price is used everywhere)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-gray-300 text-accent focus:ring-accent" {...register('is_active')} />
              Show on the website
            </label>
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-5">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {isSubmitting ? 'Saving…' : editing === 'new' ? 'Add workshop' : 'Save changes'}
            </button>
            <button type="button" onClick={cancelForm} disabled={isSubmitting} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              <th className="th">Workshop</th>
              <th className="th w-32">Date</th>
              <th className="th w-24">Price</th>
              <th className="th w-36 text-center">Priority</th>
              <th className="th w-24 text-center">Active</th>
              <th className="th w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="td py-10 text-center text-ink-soft">
                  No workshops yet. Click “Add Workshop”.
                </td>
              </tr>
            )}
            {items.map((w, i) => (
              <tr key={w.id} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                <td className="td">
                  <b className="block font-medium">{w.title}</b>
                  <span className="text-xs text-ink-soft">{[w.time_slot, w.platform, w.language].filter(Boolean).join(' · ')}</span>
                </td>
                <td className="td whitespace-nowrap">{w.date}</td>
                <td className="td whitespace-nowrap font-semibold">{w.price}</td>
                <td className="td text-center">
                  {w.is_priority ? (
                    <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">★ Priority</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makePriority(w)}
                      disabled={busyId === w.id}
                      className="rounded border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-ink-mid hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      Make priority
                    </button>
                  )}
                </td>
                <td className="td">
                  <div className="flex justify-center">
                    <Toggle
                      checked={Boolean(w.is_active)}
                      disabled={busyId === w.id}
                      onChange={() => toggleActive(w)}
                      label={`"${w.title}" is ${w.is_active ? 'visible' : 'hidden'} on the website`}
                    />
                  </div>
                </td>
                <td className="td">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => startEdit(w)} aria-label="Edit workshop" title="Edit" className="rounded p-2 text-ink-mid hover:bg-gray-200 hover:text-ink">
                      <Icon name="pencil" className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(w)} aria-label="Delete workshop" title="Delete" className="rounded p-2 text-accent hover:bg-accent-light">
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete workshop?"
        message="Are you sure? This cannot be undone."
        detail={deleteTarget ? deleteTarget.title : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
