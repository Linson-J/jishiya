import { useEffect, useState } from 'react';

const ZONES = ['IST', 'UTC', 'GST', 'SGT', 'GMT', 'EST', 'PST'];
const UNITS = ['Minutes', 'Hours', 'Days'];

// "6:30–9:00 PM IST" | "6:30 PM – 9:00 PM IST" | "6:30 PM - 9 PM IST"
const SLOT_RE = /^\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[–—-]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*([A-Za-z]{2,5})?\s*$/i;

const pad = (n) => String(n).padStart(2, '0');

function to24(h, m, ap) {
  let hh = Number(h) % 12;
  if (ap.toUpperCase() === 'PM') hh += 12;
  return `${pad(hh)}:${pad(m || 0)}`;
}

function to12(t) {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return { text: `${h % 12 || 12}:${pad(m)}`, ap };
}

export function parseSlot(value) {
  const m = SLOT_RE.exec(value || '');
  if (!m) return null;
  const endAp = m[6];
  // If the start has no AM/PM it shares the end's, unless that would put start after end.
  let startAp = m[3] || endAp;
  const end = to24(m[4], m[5], endAp);
  let start = to24(m[1], m[2], startAp);
  if (!m[3] && start > end) {
    startAp = endAp.toUpperCase() === 'PM' ? 'AM' : 'PM';
    start = to24(m[1], m[2], startAp);
  }
  return { start, end, zone: (m[7] || 'IST').toUpperCase() };
}

export function formatSlot({ start, end, zone }) {
  if (!start || !end) return '';
  const s = to12(start);
  const e = to12(end);
  const startPart = s.ap === e.ap ? s.text : `${s.text} ${s.ap}`;
  return `${startPart}–${e.text} ${e.ap} ${zone}`;
}

/** Start / end time pickers + timezone. Emits e.g. "6:30–9:00 PM IST". */
export function TimeSlotInput({ id, value, onChange, invalid }) {
  const parsed = parseSlot(value);
  const [raw, setRaw] = useState(!parsed && !!value); // legacy free-text value we can't parse
  const [state, setState] = useState(parsed || { start: '', end: '', zone: 'IST' });

  useEffect(() => {
    // external reset (load / discard) — resync
    const p = parseSlot(value);
    if (p && formatSlot(p) !== formatSlot(state)) setState(p);
    if (!p && value && !raw) setRaw(true);
    if (!value && !raw) setState({ start: '', end: '', zone: state.zone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function update(patch) {
    const next = { ...state, ...patch };
    setState(next);
    onChange(formatSlot(next));
  }

  if (raw) {
    return (
      <div className="space-y-1">
        <input id={id} type="text" className={`input ${invalid ? 'input-error' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} />
        <button
          type="button"
          className="text-xs font-medium text-accent hover:underline"
          onClick={() => {
            setRaw(false);
            setState({ start: '', end: '', zone: 'IST' });
            onChange('');
          }}
        >
          Use time pickers instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          type="time"
          aria-label="Start time"
          className={`input w-auto flex-1 ${invalid ? 'input-error' : ''}`}
          value={state.start}
          onChange={(e) => update({ start: e.target.value })}
        />
        <span className="text-sm text-ink-soft">to</span>
        <input
          type="time"
          aria-label="End time"
          className={`input w-auto flex-1 ${invalid ? 'input-error' : ''}`}
          value={state.end}
          onChange={(e) => update({ end: e.target.value })}
        />
        <select aria-label="Time zone" className="input w-auto" value={state.zone} onChange={(e) => update({ zone: e.target.value })}>
          {ZONES.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-ink-soft">
        Shown as: <strong>{formatSlot(state) || '—'}</strong>
      </p>
    </div>
  );
}

// "5 Hours", "90 Minutes", "2.5 hrs"
const DUR_RE = /^\s*(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|h(?:ou)?rs?|hours?|days?)\s*$/i;

function parseDuration(v) {
  const m = DUR_RE.exec(v || '');
  if (!m) return null;
  const u = m[2].toLowerCase();
  return { amount: m[1], unit: u.startsWith('m') ? 'Minutes' : u.startsWith('d') ? 'Days' : 'Hours' };
}

function formatDuration({ amount, unit }) {
  if (amount === '' || Number(amount) <= 0) return '';
  const singular = Number(amount) === 1 ? unit.replace(/s$/, '') : unit;
  return `${amount} ${singular}`;
}

/** Number + unit with quick presets. Emits e.g. "5 Hours". */
export function DurationInput({ id, value, onChange, invalid }) {
  const parsed = parseDuration(value);
  const [raw, setRaw] = useState(!parsed && !!value);
  const [state, setState] = useState(parsed || { amount: '', unit: 'Hours' });

  useEffect(() => {
    const p = parseDuration(value);
    if (p && formatDuration(p) !== formatDuration(state)) setState(p);
    if (!p && value && !raw) setRaw(true);
    if (!value && !raw) setState({ amount: '', unit: state.unit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function update(patch) {
    const next = { ...state, ...patch };
    setState(next);
    onChange(formatDuration(next));
  }

  if (raw) {
    return (
      <div className="space-y-1">
        <input id={id} type="text" className={`input ${invalid ? 'input-error' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} />
        <button
          type="button"
          className="text-xs font-medium text-accent hover:underline"
          onClick={() => {
            setRaw(false);
            setState({ amount: '', unit: 'Hours' });
            onChange('');
          }}
        >
          Use number + unit instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          id={id}
          type="number"
          min="0.5"
          step="0.5"
          inputMode="decimal"
          aria-label="Duration amount"
          className={`input flex-1 ${invalid ? 'input-error' : ''}`}
          value={state.amount}
          onChange={(e) => update({ amount: e.target.value })}
        />
        <select aria-label="Duration unit" className="input w-auto" value={state.unit} onChange={(e) => update({ unit: e.target.value })}>
          {UNITS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[
          ['1', 'Hours'],
          ['2', 'Hours'],
          ['3', 'Hours'],
          ['5', 'Hours'],
          ['1', 'Days'],
        ].map(([a, u]) => (
          <button key={a + u} type="button" className="btn btn-ghost px-2 py-0.5 text-xs" onClick={() => update({ amount: a, unit: u })}>
            {a} {a === '1' ? u.replace(/s$/, '') : u}
          </button>
        ))}
      </div>
    </div>
  );
}
