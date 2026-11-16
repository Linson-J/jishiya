const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

const monthIndex = (name) => MONTHS.findIndex((m) => m.toLowerCase().startsWith(String(name).slice(0, 3).toLowerCase()));

/** "October 22–23" | "October 28 – November 2" | "October 22, 2027" -> { start, end } as YYYY-MM-DD, or null. */
export function parseDates(text) {
  const m = String(text || '')
    .trim()
    .match(/^([A-Za-z]+)\.?\s+(\d{1,2})(?:\s*[–—-]\s*(?:([A-Za-z]+)\.?\s+)?(\d{1,2}))?(?:,?\s*(\d{4}))?$/);
  if (!m) return null;
  const year = m[5] ? Number(m[5]) : new Date().getFullYear();
  const sm = monthIndex(m[1]);
  if (sm < 0) return null;
  const start = iso(year, sm, Number(m[2]));
  if (!m[4]) return { start, end: '' };
  const em = m[3] ? monthIndex(m[3]) : sm;
  if (em < 0) return null;
  const endYear = em < sm ? year + 1 : year;
  return { start, end: iso(endYear, em, Number(m[4])) };
}

/** { start, end } (YYYY-MM-DD) -> "October 22–23" style text shown on the website. */
export function formatDates(start, end) {
  if (!start) return '';
  const [sy, sm, sd] = start.split('-').map(Number);
  const yearSuffix = (y) => (y !== new Date().getFullYear() ? `, ${y}` : '');
  const s = `${MONTHS[sm - 1]} ${sd}`;
  if (!end || end === start) return `${s}${yearSuffix(sy)}`;
  const [ey, em, ed] = end.split('-').map(Number);
  if (ey === sy && em === sm) return `${s}–${ed}${yearSuffix(sy)}`;
  if (ey === sy) return `${s} – ${MONTHS[em - 1]} ${ed}${yearSuffix(sy)}`;
  return `${s}, ${sy} – ${MONTHS[em - 1]} ${ed}, ${ey}`;
}

/**
 * Pick a start date and an optional end date with the browser's calendar.
 * The value stays a plain string (e.g. "October 22–23"), so the website needs no changes.
 */
export default function DateRangeInput({ id, value, onChange, invalid }) {
  const parsed = parseDates(value);
  const start = parsed ? parsed.start : '';
  const end = parsed ? parsed.end : '';
  const unparsed = value && !parsed;
  const cls = `input ${invalid ? 'input-error' : ''}`;

  const setStart = (s) => {
    if (!s) return onChange('');
    onChange(formatDates(s, end && end >= s ? end : ''));
  };
  const setEnd = (e) => onChange(formatDates(start, e && e >= start ? e : ''));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-ink-soft">
          From
          <input id={id} type="date" value={start} onChange={(e) => setStart(e.target.value)} className={`${cls} mt-1`} aria-invalid={invalid ? 'true' : 'false'} />
        </label>
        <label className="block text-xs font-medium text-ink-soft">
          To <span className="font-normal">(optional)</span>
          <input type="date" value={end} min={start || undefined} disabled={!start} onChange={(e) => setEnd(e.target.value)} className={`${cls} mt-1`} />
        </label>
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">
        {value ? (
          <>
            Shown on the website as <b className="text-ink">{value}</b>
            {unparsed && ' — pick a date above to replace it with a calendar date.'}
          </>
        ) : (
          'Pick the workshop date (or a start and end date for a multi-day workshop).'
        )}
      </p>
    </div>
  );
}
