import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Icon from './Icon';
import { Spinner } from './PageLoader';
import { getErrorMessage } from '../api/axiosInstance';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB — matches the backend limit

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Drag-and-drop / click-to-browse image picker with preview, caption and
 * upload progress.
 *
 *  onUpload — async ({ file, caption, onProgress(percent) }) => void
 */
export default function ImageUploader({
  onUpload,
  idPrefix = 'uploader',
  captionRequired = false,
  captionLabel = 'Caption',
  captionPlaceholder = 'e.g. Digital Marketing Workshop',
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Release the object URL whenever the preview changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pick(selected) {
    setError('');
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Only JPG, PNG or WebP images are allowed.');
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError(`File is ${formatSize(selected.size)}. The maximum size is 5 MB.`);
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function clear() {
    setFile(null);
    setPreview(null);
    setCaption('');
    setProgress(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    pick(e.dataTransfer.files && e.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!file || uploading) return;
    if (captionRequired && !caption.trim()) {
      setError(`${captionLabel} is required — it is shown on the website together with the image.`);
      return;
    }
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      await onUpload({ file, caption, onProgress: setProgress });
      toast.success('Image uploaded');
      clear();
    } catch (err) {
      setError(getErrorMessage(err, 'Upload failed. Please try again.'));
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const openBrowser = () => !uploading && inputRef.current?.click();

  return (
    <div className="card p-4 sm:p-6">
      <input
        ref={inputRef}
        id={`${idPrefix}-file`}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => pick(e.target.files && e.target.files[0])}
      />

      {!file ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose an image to upload, or drag and drop it here"
          onClick={openBrowser}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openBrowser();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            dragOver ? 'border-accent bg-accent-light' : 'border-gray-300 hover:border-ink hover:bg-gray-50'
          }`}
        >
          <Icon name="upload" className="mb-3 h-8 w-8 text-ink-soft" />
          <p className="text-sm font-medium">
            Drag &amp; drop an image here, or <span className="text-accent underline">browse</span>
          </p>
          <p className="mt-1 text-xs text-ink-soft">JPG, PNG or WebP · max 5 MB</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="w-full flex-none overflow-hidden rounded-md border border-gray-200 bg-gray-50 sm:w-56">
            <img src={preview} alt="Selected file preview" className="h-48 w-full object-contain sm:h-56" />
          </div>

          <div className="flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-ink-soft">{formatSize(file.size)}</p>

            <label htmlFor={`${idPrefix}-caption`} className="label mt-4">
              {captionLabel}{' '}
              {captionRequired ? (
                <span className="font-normal text-accent">(required)</span>
              ) : (
                <span className="font-normal text-ink-soft">(optional)</span>
              )}
            </label>
            <input
              id={`${idPrefix}-caption`}
              type="text"
              maxLength={255}
              value={caption}
              disabled={uploading}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={captionPlaceholder}
              className="input"
            />

            {uploading && (
              <div className="mt-4">
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label="Upload progress"
                  className="h-2 overflow-hidden rounded-full bg-gray-200"
                >
                  <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-xs text-ink-soft">{progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? <Spinner className="h-4 w-4" /> : <Icon name="upload" className="h-4 w-4" />}
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={clear} disabled={uploading}>
                Choose another
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
