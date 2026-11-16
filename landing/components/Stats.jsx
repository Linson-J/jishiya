'use client';

import { useEffect, useRef, useState } from 'react';

const DURATION = 1600;

/** "1500+" -> { target: 1500, suffix: "+", decimals: 0 }; "PhD" -> null (shown as-is). */
function parseValue(value) {
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const decimals = (match[1].split('.')[1] || '').length;
  return { target: parseFloat(match[1]), suffix: match[2], decimals };
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function Stat({ label, value }) {
  const parsed = parseValue(value);
  const ref = useRef(null);
  // Server render (and no-JS) shows the final number; animation restarts from 0 on scroll-in.
  const [display, setDisplay] = useState(parsed ? parsed.target : 0);

  useEffect(() => {
    const el = ref.current;
    if (!parsed || !el) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) return undefined;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / DURATION, 1);
          setDisplay(parsed.target * easeOutCubic(progress));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        setDisplay(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const text = parsed ? `${display.toFixed(parsed.decimals)}${parsed.suffix}` : String(value);

  return (
    <div
      ref={ref}
      className="border-r border-[#333] px-3 py-8 text-center last:border-r-0 max-md:[&:nth-child(2)]:border-r-0 max-md:[&:nth-child(-n+2)]:border-b md:px-6 md:py-12"
    >
      <div className="font-serif text-4xl font-bold leading-none md:text-6xl" aria-label={`${value} ${label}`}>
        {text}
      </div>
      <small className="mt-3 block text-[11px] font-semibold uppercase tracking-[.16em] text-[#aaa]">{label}</small>
    </div>
  );
}

export default function Stats({ stats }) {
  return (
    <section aria-label="Impact" className="mt-10 bg-ink text-white md:mt-12">
      <div className="wrap grid grid-cols-2 md:grid-cols-4">
        {stats.map((s) => (
          <Stat key={s.id} label={s.label} value={s.value} />
        ))}
      </div>
    </section>
  );
}
