import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axiosInstance';
import ConfirmModal from '../components/ConfirmModal';
import FormField from '../components/FormField';
import Icon from '../components/Icon';
import PageLoader, { Spinner } from '../components/PageLoader';
import Toggle from '../components/Toggle';
import useDragReorder from '../hooks/useDragReorder';

const EMPTY = { name: '', location: '', review: '', rating: 5, is_active: true, sort_order: 1 };

const bySortOrder = (a, b) => a.sort_order - b.sort_order || a.id - b.id;

export default function Testimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | item id
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const formRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/testimonials', { params: { all: 'true' } });
        if (!cancelled) setItems([...data].sort(bySortOrder));
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load testimonials.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistOrder = useCallback(
    (changes) => Promise.all(changes.map((c) => api.put(`/api/testimonials/${c.id}`, { sort_order: c.sort_order }))),
    []
  );
  const { getRowProps, move, dragging, overIndex } = useDragReorder({ items, setItems, persist: persistOrder });

  function openForm() {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  function startNew() {
    const nextOrder = items.reduce((max, t) => Math.max(max, t.sort_order), 0) + 1;
    reset({ ...EMPTY, sort_order: nextOrder });
    setEditing('new');
    openForm();
  }

  function startEdit(item) {
    reset({
      name: item.name,
      location: item.location,
      review: item.review,
      rating: item.rating,
      is_active: Boolean(item.is_active),
      sort_order: item.sort_order,
    });
    setEditing(item.id);
    openForm();
  }

  function cancelForm() {
    setEditing(null);
    reset(EMPTY);
  }

  async function onSubmit(values) {
    const payload = {
      name: values.name.trim(),
      location: values.location.trim(),
      review: values.review.trim(),
      rating: Number(values.rating),
      is_active: Boolean(values.is_active),
      sort_order: Number(values.sort_order),
    };
    try {
      if (editing === 'new') {
        const { data } = await api.post('/api/testimonials', payload);
        setItems((prev) => [...prev, data].sort(bySortOrder));
        toast.success('Testimonial added');
      } else {
        const { data } = await api.put(`/api/testimonials/${editing}`, payload);
        setItems((prev) => prev.map((t) => (t.id === data.id ? data : t)).sort(bySortOrder));
        toast.success('Testimonial updated');
      }
      cancelForm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save the testimonial.'));
    }
  }

  async function toggleActive(item) {
    const next = !item.is_active;
    setTogglingId(item.id);
    try {
      const { data } = await api.put(`/api/testimonials/${item.id}`, { is_active: next });
      setItems((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      toast.success(next ? 'Now visible on the website' : 'Hidden from the website');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change visibility.'));
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/testimonials/${deleteTarget.id}`);
      setItems((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      if (editing === deleteTarget.id) cancelForm();
      toast.success('Testimonial deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the testimonial.'));
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
        <p className="text-sm text-ink-soft">
          {items.length} testimonial{items.length === 1 ? '' : 's'} · drag rows (or use the arrows) to change the order
          shown on the website.
        </p>
        <button type="button" onClick={startNew} disabled={editing === 'new'} className="btn btn-primary">
          <Icon name="plus" className="h-4 w-4" />
          Add New
        </button>
      </div>

      {editing !== null && (
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label={editing === 'new' ? 'Add testimonial' : 'Edit testimonial'}
          className="card mb-6 scroll-mt-24 space-y-5 border-ink p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold">{editing === 'new' ? 'Add testimonial' : 'Edit testimonial'}</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Name" htmlFor="t-name" error={errors.name && errors.name.message}>
              <input
                id="t-name"
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                aria-invalid={errors.name ? 'true' : 'false'}
                {...register('name', {
                  required: 'Name is required',
                  maxLength: { value: 100, message: 'Name must be 100 characters or fewer' },
                  validate: (v) => v.trim() !== '' || 'Name is required',
                })}
              />
            </FormField>

            <FormField label="Location" htmlFor="t-location" error={errors.location && errors.location.message}>
              <input
                id="t-location"
                type="text"
                className={`input ${errors.location ? 'input-error' : ''}`}
                aria-invalid={errors.location ? 'true' : 'false'}
                {...register('location', {
                  required: 'Location is required',
                  maxLength: { value: 100, message: 'Location must be 100 characters or fewer' },
                  validate: (v) => v.trim() !== '' || 'Location is required',
                })}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Review" htmlFor="t-review" error={errors.review && errors.review.message}>
                <textarea
                  id="t-review"
                  rows={4}
                  className={`input ${errors.review ? 'input-error' : ''}`}
                  aria-invalid={errors.review ? 'true' : 'false'}
                  {...register('review', {
                    required: 'Review is required',
                    maxLength: { value: 2000, message: 'Review must be 2000 characters or fewer' },
                    validate: (v) => v.trim() !== '' || 'Review is required',
                  })}
                />
              </FormField>
            </div>

            <FormField label="Rating" htmlFor="t-rating" error={errors.rating && errors.rating.message}>
              <select
                id="t-rating"
                className="input"
                {...register('rating', { required: 'Rating is required', valueAsNumber: true })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {'★'.repeat(n)} ({n})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Display order"
              htmlFor="t-order"
              hint="Lower numbers appear first."
              error={errors.sort_order && errors.sort_order.message}
            >
              <input
                id="t-order"
                type="number"
                min={0}
                max={100000}
                step={1}
                className={`input ${errors.sort_order ? 'input-error' : ''}`}
                aria-invalid={errors.sort_order ? 'true' : 'false'}
                {...register('sort_order', {
                  required: 'Display order is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Must be 0 or more' },
                  max: { value: 100000, message: 'Must be 100000 or less' },
                  validate: (v) => Number.isInteger(v) || 'Must be a whole number',
                })}
              />
            </FormField>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="rounded border-gray-300 text-accent focus:ring-accent" {...register('is_active')} />
              Show on the website
            </label>
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-5">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {isSubmitting ? 'Saving…' : editing === 'new' ? 'Add testimonial' : 'Save changes'}
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
              <th className="th w-24">Order</th>
              <th className="th">Name</th>
              <th className="th">Location</th>
              <th className="th">Review</th>
              <th className="th w-24 text-center">Active</th>
              <th className="th w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="td py-10 text-center text-ink-soft">
                  No testimonials yet. Click “Add New” to create the first one.
                </td>
              </tr>
            )}
            {items.map((item, index) => (
              <tr
                key={item.id}
                {...getRowProps(index)}
                className={`${index % 2 ? 'bg-gray-50' : 'bg-white'} ${dragging === index ? 'opacity-40' : ''} ${
                  overIndex === index && dragging !== null && dragging !== index ? '!bg-accent-light' : ''
                } ${!item.is_active ? 'text-ink-soft' : ''}`}
              >
                <td className="td">
                  <div className="flex items-center gap-1">
                    <span className="cursor-grab text-ink-soft" title="Drag to reorder" aria-hidden="true">
                      <Icon name="grip" className="h-5 w-5" />
                    </span>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        aria-label={`Move ${item.name} up`}
                        className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30"
                      >
                        <Icon name="chevronUp" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, index + 1)}
                        disabled={index === items.length - 1}
                        aria-label={`Move ${item.name} down`}
                        className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30"
                      >
                        <Icon name="chevronDown" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="td font-medium">{item.name}</td>
                <td className="td whitespace-nowrap">{item.location}</td>
                <td className="td max-w-md">
                  <p className="line-clamp-2">{item.review}</p>
                </td>
                <td className="td">
                  <div className="flex justify-center">
                    <Toggle
                      checked={Boolean(item.is_active)}
                      disabled={togglingId === item.id}
                      onChange={() => toggleActive(item)}
                      label={`${item.name} is ${item.is_active ? 'visible' : 'hidden'} on the website`}
                    />
                  </div>
                </td>
                <td className="td">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      aria-label={`Edit ${item.name}`}
                      title="Edit"
                      className="rounded p-2 text-ink-mid hover:bg-gray-200 hover:text-ink"
                    >
                      <Icon name="pencil" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Delete ${item.name}`}
                      title="Delete"
                      className="rounded p-2 text-accent hover:bg-accent-light"
                    >
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
        title="Delete testimonial?"
        message="Are you sure? This cannot be undone."
        detail={deleteTarget ? `${deleteTarget.name} — ${deleteTarget.location}` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
