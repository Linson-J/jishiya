import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { assetUrl, getErrorMessage } from '../api/axiosInstance';
import ConfirmModal from '../components/ConfirmModal';
import Icon from '../components/Icon';
import ImageUploader from '../components/ImageUploader';
import PageLoader from '../components/PageLoader';

const TABS = [
  {
    key: 'portrait',
    label: 'Portrait',
    category: 'portrait',
    hint: 'The landing page uses the first portrait photo (hero strip and About section). A 3:4 vertical photo works best.',
    aspect: 'aspect-[3/4]',
    fit: 'object-cover',
  },
  {
    key: 'workshop',
    label: 'Workshop Photos',
    category: 'workshop',
    hint: 'Shown on the website under “Workshops, Awards & Stage Talks” (up to 8, in this order). Landscape 4:3 photos work best. A caption is optional — without one, only the photo shows. Use ✎ to edit the caption or replace a photo, and ← → to change the order.',
    aspect: 'aspect-[4/3]',
    fit: 'object-cover',
  },
  {
    key: 'logo',
    label: 'Trusted By',
    category: 'logo',
    hint: 'Shown on the website under “Trusted By — Reputed Institutions She Has Worked With”. Add a photo of the institution and its name (optional). The section stays hidden until at least one photo is added.',
    captionLabel: 'Organisation name',
    captionPlaceholder: 'e.g. Madras Christian College',
    aspect: 'aspect-[5/2]',
    fit: 'object-contain p-3',
  },
];

export default function Gallery() {
  const [activeKey, setActiveKey] = useState('portrait');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [draftCaption, setDraftCaption] = useState('');
  const [draftFile, setDraftFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const tab = TABS.find((t) => t.key === activeKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    (async () => {
      try {
        const { data } = await api.get('/api/gallery', { params: { category: tab.category } });
        if (!cancelled) setImages(data);
      } catch (err) {
        if (!cancelled) {
          setImages([]);
          setLoadError(getErrorMessage(err, 'Could not load images.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab.category]);

  async function uploadImage({ file, caption, onProgress }) {
    const form = new FormData();
    form.append('image', file);
    form.append('category', tab.category);
    if (caption.trim()) form.append('caption', caption.trim());

    const { data } = await api.post('/api/gallery/upload', form, {
      timeout: 0, // large files on slow connections must not be cut off
      onUploadProgress: (e) => {
        if (e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    setImages((prev) => [...prev, data]);
  }

  function startEdit(img) {
    setEditId(img.id);
    setDraftCaption(img.caption || '');
    setDraftFile(null);
  }
  function cancelEdit() {
    setEditId(null);
    setDraftFile(null);
  }

  async function saveEdit() {
    if (tab.captionRequired && !draftCaption.trim()) {
      toast.error(`${tab.captionLabel || 'Caption'} is required.`);
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append('caption', draftCaption.trim());
      if (draftFile) form.append('image', draftFile);
      const { data } = await api.put(`/api/gallery/${editId}`, form, { timeout: 0 });
      setImages((prev) => prev.map((img) => (img.id === data.id ? data : img)));
      toast.success('Saved');
      cancelEdit();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save the changes.'));
    } finally {
      setSaving(false);
    }
  }

  // Reorder: give every photo a clean 0..n-1 position, saving only the ones that changed.
  async function moveImage(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((img, i) => ({ ...img, sort_order: i }));
    setSaving(true);
    try {
      await Promise.all(
        reordered
          .filter((img, i) => images.find((o) => o.id === img.id).sort_order !== i)
          .map((img) => {
            const form = new FormData();
            form.append('sort_order', String(img.sort_order));
            return api.put(`/api/gallery/${img.id}`, form);
          })
      );
      setImages(reordered);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change the order.'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/gallery/${deleteTarget.id}`);
      setImages((prev) => prev.filter((img) => img.id !== deleteTarget.id));
      toast.success('Image deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the image.'));
    } finally {
      setDeleting(false);
    }
  }

  function onTabKeyDown(e) {
    const index = TABS.findIndex((t) => t.key === activeKey);
    let next = null;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    if (next !== null) {
      e.preventDefault();
      setActiveKey(TABS[next].key);
      document.getElementById(`gallery-tab-${TABS[next].key}`)?.focus();
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div role="tablist" aria-label="Gallery categories" onKeyDown={onTabKeyDown} className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((t) => {
          const selected = t.key === activeKey;
          return (
            <button
              key={t.key}
              id={`gallery-tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="gallery-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveKey(t.key)}
              className={`-mb-px whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                selected ? 'border-accent text-ink' : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div id="gallery-panel" role="tabpanel" aria-labelledby={`gallery-tab-${activeKey}`}>
        <p className="mb-4 text-sm text-ink-soft">{tab.hint}</p>

        <ImageUploader
          key={tab.key}
          idPrefix={`gallery-${tab.key}`}
          onUpload={uploadImage}
          captionRequired={Boolean(tab.captionRequired)}
          captionLabel={tab.captionLabel}
          captionPlaceholder={tab.captionPlaceholder}
        />

        <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-ink-soft">
          Uploaded {tab.label.toLowerCase()} {!loading && `(${images.length})`}
        </h2>

        {loading ? (
          <PageLoader label="Loading images…" />
        ) : loadError ? (
          <div role="alert" className="card p-6 text-sm text-accent-dark">
            {loadError}
          </div>
        ) : images.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-soft">Nothing uploaded in this category yet.</div>
        ) : (
          <ul className={`grid gap-4 ${tab.key === 'portrait' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {images.map((img, i) => (
              <li key={img.id} className="card group relative overflow-hidden">
                <div className={`${tab.aspect} bg-gray-100`}>
                  <img
                    src={assetUrl(img.image_url)}
                    alt={img.caption || `${tab.label} ${i + 1}`}
                    loading="lazy"
                    className={`h-full w-full ${tab.fit}`}
                  />
                </div>
                {editId === img.id ? (
                  <div className="space-y-2 border-t border-gray-100 p-3">
                    <label className="block text-xs font-medium text-ink-soft">
                      {tab.captionLabel || 'Caption'}
                      {!tab.captionRequired && <span className="font-normal"> (leave empty for no caption)</span>}
                      <input
                        type="text"
                        value={draftCaption}
                        maxLength={255}
                        onChange={(e) => setDraftCaption(e.target.value)}
                        placeholder={tab.captionPlaceholder || 'Optional caption'}
                        className="input mt-1"
                      />
                    </label>
                    <label className="block text-xs font-medium text-ink-soft">
                      Replace photo <span className="font-normal">(optional · jpg, png, webp)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setDraftFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                        className="mt-1 block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
                      />
                    </label>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={saveEdit} disabled={saving} className="btn btn-primary !px-3 !py-1.5 text-xs">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" onClick={cancelEdit} disabled={saving} className="btn btn-ghost !px-3 !py-1.5 text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1 border-t border-gray-100 px-3 py-2">
                    <p className="min-w-0 flex-1 truncate text-sm" title={img.caption || ''}>
                      {img.caption || <span className="text-ink-soft">No caption</span>}
                    </p>
                    {images.length > 1 && tab.key !== 'portrait' && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveImage(i, -1)}
                          disabled={i === 0 || saving}
                          aria-label="Move earlier"
                          title="Move earlier"
                          className="flex-none rounded px-1.5 py-1 text-sm text-ink-mid hover:bg-gray-200 disabled:opacity-30"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(i, 1)}
                          disabled={i === images.length - 1 || saving}
                          aria-label="Move later"
                          title="Move later"
                          className="flex-none rounded px-1.5 py-1 text-sm text-ink-mid hover:bg-gray-200 disabled:opacity-30"
                        >
                          →
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(img)}
                      aria-label={`Edit ${img.caption || 'this image'}`}
                      title="Edit caption / replace photo"
                      className="flex-none rounded p-1.5 text-ink-mid hover:bg-gray-200 hover:text-ink"
                    >
                      <Icon name="pencil" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(img)}
                      aria-label={`Delete ${img.caption || 'this image'}`}
                      title="Delete"
                      className="flex-none rounded p-1.5 text-accent hover:bg-accent-light"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete image?"
        message="Are you sure? This cannot be undone."
        detail="The image file will also be permanently removed from the server."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
