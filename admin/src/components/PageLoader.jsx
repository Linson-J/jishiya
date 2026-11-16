export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function PageLoader({ fullScreen = false, label = 'Loading…' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-ink-soft ${
        fullScreen ? 'min-h-screen' : 'min-h-[40vh]'
      }`}
    >
      <Spinner className="h-8 w-8 text-ink" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
