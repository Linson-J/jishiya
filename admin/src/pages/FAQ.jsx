import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axiosInstance';
import ConfirmModal from '../components/ConfirmModal';
import FormField from '../components/FormField';
import Icon from '../components/Icon';
import PageLoader, { Spinner } from '../components/PageLoader';
import Toggle from '../components/Toggle';
import useDragReorder from '../hooks/useDragReorder';

const EMPTY = { question: '', answer: '', is_active: true, sort_order: 1 };

const bySortOrder = (a, b) => a.sort_order - b.sort_order || a.id - b.id;

export default function FAQ() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | item id
  const [expandedId, setExpandedId] = useState(null);
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
        const { data } = await api.get('/api/faq', { params: { all: 'true' } });
        if (!cancelled) setItems([...data].sort(bySortOrder));
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Could not load FAQ items.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistOrder = useCallback(
    (changes) => Promise.all(changes.map((c) => api.put(`/api/faq/${c.id}`, { sort_order: c.sort_order }))),
    []
  );
  const { getRowProps, move, dragging, overIndex } = useDragReorder({ items, setItems, persist: persistOrder });

  function openForm() {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  function startNew() {
    const nextOrder = items.reduce((max, f) => Math.max(max, f.sort_order), 0) + 1;
    reset({ ...EMPTY, sort_order: nextOrder });
    setEditing('new');
    openForm();
  }

  function startEdit(item) {
    reset({
      question: item.question,
      answer: item.answer,
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
      question: values.question.trim(),
      answer: values.answer.trim(),
      is_active: Boolean(values.is_active),
      sort_order: Number(values.sort_order),
    };
    try {
      if (editing === 'new') {
        const { data } = await api.post('/api/faq', payload);
        setItems((prev) => [...prev, data].sort(bySortOrder));
        toast.success('FAQ added');
      } else {
        const { data } = await api.put(`/api/faq/${editing}`, payload);
        setItems((prev) => prev.map((f) => (f.id === data.id ? data : f)).sort(bySortOrder));
        toast.success('FAQ updated');
      }
      cancelForm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save the FAQ.'));
    }
  }

  async function toggleActive(item) {
    const next = !item.is_active;
    setTogglingId(item.id);
    try {
      const { data } = await api.put(`/api/faq/${item.id}`, { is_active: next });
      setItems((prev) => prev.map((f) => (f.id === data.id ? data : f)));
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
      await api.delete(`/api/faq/${deleteTarget.id}`);
      setItems((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      if (editing === deleteTarget.id) cancelForm();
      toast.success('FAQ deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the FAQ.'));
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
          {items.length} question{items.length === 1 ? '' : 's'} · drag rows (or use the arrows) to reorder · click a
          question to preview its answer.
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
          aria-label={editing === 'new' ? 'Add FAQ' : 'Edit FAQ'}
          className="card mb-6 scroll-mt-24 space-y-5 border-ink p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold">{editing === 'new' ? 'Add FAQ' : 'Edit FAQ'}</h2>

          <FormField label="Question" htmlFor="f-question" error={errors.question && errors.question.message}>
            <input
              id="f-question"
              type="text"
              className={`input ${errors.question ? 'input-error' : ''}`}
              aria-invalid={errors.question ? 'true' : 'false'}
              {...register('question', {
                required: 'Question is required',
                maxLength: { value: 1000, message: 'Question must be 1000 characters or fewer' },
                validate: (v) => v.trim() !== '' || 'Question is required',
              })}
            />
          </FormField>

          <FormField label="Answer" htmlFor="f-answer" error={errors.answer && errors.answer.message}>
            <textarea
              id="f-answer"
              rows={4}
              className={`input ${errors.answer ? 'input-error' : ''}`}
              aria-invalid={errors.answer ? 'true' : 'false'}
              {...register('answer', {
                required: 'Answer is required',
                maxLength: { value: 5000, message: 'Answer must be 5000 characters or fewer' },
                validate: (v) => v.trim() !== '' || 'Answer is required',
              })}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Display order"
              htmlFor="f-order"
              hint="Lower numbers appear first."
              error={errors.sort_order && errors.sort_order.message}
            >
              <input
                id="f-order"
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

            <label className="flex items-center gap-2 text-sm sm:mt-7">
              <input type="checkbox" className="rounded border-gray-300 text-accent focus:ring-accent" {...register('is_active')} />
              Show on the website
            </label>
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-5">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {isSubmitting ? 'Saving…' : editing === 'new' ? 'Add FAQ' : 'Save changes'}
            </button>
            <button type="button" onClick={cancelForm} disabled={isSubmitting} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <th className="th w-24">Order</th>
              <th className="th">Question</th>
              <th className="th w-24 text-center">Active</th>
              <th className="th w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="td py-10 text-center text-ink-soft">
                  No FAQ items yet. Click “Add New” to create the first one.
                </td>
              </tr>
            )}
            {items.map((item, index) => {
              const expanded = expandedId === item.id;
              const zebra = index % 2 ? 'bg-gray-50' : 'bg-white';
              return (
                <Fragment key={item.id}>
                  <tr
                    {...getRowProps(index)}
                    className={`${zebra} ${dragging === index ? 'opacity-40' : ''} ${
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
                            aria-label="Move question up"
                            className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30"
                          >
                            <Icon name="chevronUp" className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(index, index + 1)}
                            disabled={index === items.length - 1}
                            aria-label="Move question down"
                            className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30"
                          >
                            <Icon name="chevronDown" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        aria-expanded={expanded}
                        aria-controls={`faq-answer-${item.id}`}
                        className="flex w-full items-center justify-between gap-3 text-left font-medium"
                      >
                        <span>{item.question}</span>
                        <Icon
                          name="chevronDown"
                          className={`h-4 w-4 flex-none transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </td>
                    <td className="td">
                      <div className="flex justify-center">
                        <Toggle
                          checked={Boolean(item.is_active)}
                          disabled={togglingId === item.id}
                          onChange={() => toggleActive(item)}
                          label={`"${item.question}" is ${item.is_active ? 'visible' : 'hidden'} on the website`}
                        />
                      </div>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          aria-label="Edit question"
                          title="Edit"
                          className="rounded p-2 text-ink-mid hover:bg-gray-200 hover:text-ink"
                        >
                          <Icon name="pencil" className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          aria-label="Delete question"
                          title="Delete"
                          className="rounded p-2 text-accent hover:bg-accent-light"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded && (
                    <tr id={`faq-answer-${item.id}`} className={zebra}>
                      <td />
                      <td colSpan={3} className="border-b border-gray-100 px-4 pb-4 pt-0 text-sm text-ink-mid">
                        <p className="max-w-2xl whitespace-pre-line rounded-md border-l-4 border-accent bg-white px-4 py-3">
                          {item.answer}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete FAQ item?"
        message="Are you sure? This cannot be undone."
        detail={deleteTarget ? deleteTarget.question : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
