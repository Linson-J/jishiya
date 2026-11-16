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

const EMPTY = { module_no: 1, title: '', description: '', is_active: true };

const byModule = (a, b) => a.module_no - b.module_no || a.id - b.id;

export default function Curriculum() {
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
        const { data } = await api.get('/api/curriculum', { params: { all: 'true' } });
        if (!cancelled) setItems([...data].sort(byModule));
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load curriculum modules.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Drag-and-drop ordering: the shared hook works on sort_order, so map it to/from module_no.
  const dragItems = items.map((m) => ({ ...m, sort_order: m.module_no }));
  const setDragItems = useCallback(
    (next) => setItems(next.map(({ sort_order, ...rest }) => ({ ...rest, module_no: sort_order }))),
    []
  );
  const persistOrder = useCallback(
    async (changes) => {
      const newNo = new Map(changes.map((c) => [c.id, c.sort_order]));
      const ids = items
        .map((m) => ({ id: m.id, no: newNo.has(m.id) ? newNo.get(m.id) : m.module_no }))
        .sort((a, b) => a.no - b.no || a.id - b.id)
        .map((m) => m.id);
      await api.put('/api/curriculum/reorder', { ids });
    },
    [items]
  );
  const { getRowProps, move, dragging, overIndex } = useDragReorder({
    items: dragItems,
    setItems: setDragItems,
    persist: persistOrder,
  });

  function openForm() {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  function startNew() {
    const nextNumber = items.reduce((max, m) => Math.max(max, m.module_no), 0) + 1;
    reset({ ...EMPTY, module_no: nextNumber });
    setEditing('new');
    openForm();
  }

  function startEdit(item) {
    reset({
      module_no: item.module_no,
      title: item.title,
      description: item.description,
      is_active: Boolean(item.is_active),
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
      module_no: Number(values.module_no),
      title: values.title.trim(),
      description: values.description.trim(),
      is_active: Boolean(values.is_active),
    };
    try {
      if (editing === 'new') {
        const { data } = await api.post('/api/curriculum', payload);
        setItems((prev) => [...prev, data].sort(byModule));
        toast.success('Module added');
      } else {
        const { data } = await api.put(`/api/curriculum/${editing}`, payload);
        setItems((prev) => prev.map((m) => (m.id === data.id ? data : m)).sort(byModule));
        toast.success('Module updated');
      }
      cancelForm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save the module.'));
    }
  }

  async function toggleActive(item) {
    const next = !item.is_active;
    setTogglingId(item.id);
    try {
      const { data } = await api.put(`/api/curriculum/${item.id}`, { is_active: next });
      setItems((prev) => prev.map((m) => (m.id === data.id ? data : m)));
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
      await api.delete(`/api/curriculum/${deleteTarget.id}`);
      setItems((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      if (editing === deleteTarget.id) cancelForm();
      toast.success('Module deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the module.'));
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
          {items.length} module{items.length === 1 ? '' : 's'} · drag rows (or use the arrows) to change the order; module numbers renumber automatically.
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
          aria-label={editing === 'new' ? 'Add module' : 'Edit module'}
          className="card mb-6 scroll-mt-24 space-y-5 border-ink p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold">{editing === 'new' ? 'Add module' : 'Edit module'}</h2>

          <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
            <FormField label="Module no." htmlFor="c-no" error={errors.module_no && errors.module_no.message}>
              <input
                id="c-no"
                type="number"
                min={1}
                max={1000}
                step={1}
                className={`input ${errors.module_no ? 'input-error' : ''}`}
                aria-invalid={errors.module_no ? 'true' : 'false'}
                {...register('module_no', {
                  required: 'Module number is required',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Must be 1 or more' },
                  max: { value: 1000, message: 'Must be 1000 or less' },
                  validate: (v) => Number.isInteger(v) || 'Must be a whole number',
                })}
              />
            </FormField>

            <FormField label="Title" htmlFor="c-title" error={errors.title && errors.title.message}>
              <input
                id="c-title"
                type="text"
                className={`input ${errors.title ? 'input-error' : ''}`}
                aria-invalid={errors.title ? 'true' : 'false'}
                {...register('title', {
                  required: 'Title is required',
                  maxLength: { value: 100, message: 'Title must be 100 characters or fewer' },
                  validate: (v) => v.trim() !== '' || 'Title is required',
                })}
              />
            </FormField>
          </div>

          <FormField label="Description" htmlFor="c-desc" error={errors.description && errors.description.message}>
            <textarea
              id="c-desc"
              rows={4}
              className={`input ${errors.description ? 'input-error' : ''}`}
              aria-invalid={errors.description ? 'true' : 'false'}
              {...register('description', {
                required: 'Description is required',
                maxLength: { value: 5000, message: 'Description must be 5000 characters or fewer' },
                validate: (v) => v.trim() !== '' || 'Description is required',
              })}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded border-gray-300 text-accent focus:ring-accent" {...register('is_active')} />
            Show on the website
          </label>

          <div className="flex gap-3 border-t border-gray-100 pt-5">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {isSubmitting ? 'Saving…' : editing === 'new' ? 'Add module' : 'Save changes'}
            </button>
            <button type="button" onClick={cancelForm} disabled={isSubmitting} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse">
          <thead>
            <tr>
              <th className="th w-24">Order</th>
              <th className="th w-16">No.</th>
              <th className="th">Title</th>
              <th className="th">Description</th>
              <th className="th w-24 text-center">Active</th>
              <th className="th w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="td py-10 text-center text-ink-soft">
                  No modules yet. Click “Add New” to create the first one.
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
                        aria-label="Move module up"
                        className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30"
                      >
                        <Icon name="chevronUp" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, index + 1)}
                        disabled={index === items.length - 1}
                        aria-label="Move module down"
                        className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30"
                      >
                        <Icon name="chevronDown" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="td font-semibold tabular-nums">{String(item.module_no).padStart(2, '0')}</td>
                <td className="td font-medium">{item.title}</td>
                <td className="td max-w-md">
                  <p className="line-clamp-2">{item.description}</p>
                </td>
                <td className="td">
                  <div className="flex justify-center">
                    <Toggle
                      checked={Boolean(item.is_active)}
                      disabled={togglingId === item.id}
                      onChange={() => toggleActive(item)}
                      label={`${item.title} is ${item.is_active ? 'visible' : 'hidden'} on the website`}
                    />
                  </div>
                </td>
                <td className="td">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      aria-label={`Edit ${item.title}`}
                      title="Edit"
                      className="rounded p-2 text-ink-mid hover:bg-gray-200 hover:text-ink"
                    >
                      <Icon name="pencil" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Delete ${item.title}`}
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
        title="Delete module?"
        message="Are you sure? This cannot be undone."
        detail={deleteTarget ? `Module ${deleteTarget.module_no} — ${deleteTarget.title}` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
