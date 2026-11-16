'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const COLS = {
  1: 'md:grid-cols-1 md:max-w-md',
  2: 'md:grid-cols-2 md:max-w-3xl',
  3: 'md:grid-cols-3 md:max-w-5xl',
  4: 'md:grid-cols-4',
};

/**
 * Workshop photos. Mobile: swipeable snap carousel with scroll-in animations and dots.
 * Desktop: an even grid with staggered reveal. Tapping a photo opens a preview popup.
 * Captions are shown only for photos that actually have one.
 */
export default function PhotoShowcase({ tiles }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [active, setActive] = useState(0);
  const closeRef = useRef(null);
  const lastFocus = useRef(null);
  const scrollerRef = useRef(null);

  const slides = tiles.map((t) => ({ src: t.src, caption: t.caption }));

  const open = (i) => {
    lastFocus.current = document.activeElement;
    setOpenIndex(i);
  };
  const close = useCallback(() => {
    setOpenIndex(null);
    if (lastFocus.current && lastFocus.current.focus) lastFocus.current.focus();
  }, []);
  const step = useCallback(
    (dir) => setOpenIndex((i) => (i === null ? i : (i + dir + slides.length) % slides.length)),
    [slides.length]
  );

  // Lightbox: keys + scroll lock.
  useEffect(() => {
    if (openIndex === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [openIndex, close, step]);

  // Scroll-in animation: each tile animates when it enters the screen (vertically or while swiping).
  useEffect(() => {
    const els = scrollerRef.current ? [...scrollerRef.current.querySelectorAll('.photo-tile')] : [];
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tiles.length]);

  // Mobile carousel: which photo is centred (for the dots).
  const onScroll = (e) => {
    const el = e.currentTarget;
    const first = el.firstElementChild;
    if (!first) return;
    const w = first.getBoundingClientRect().width + 12;
    setActive(Math.min(tiles.length - 1, Math.max(0, Math.round(el.scrollLeft / w))));
  };
  const goTo = (i) => {
    const el = scrollerRef.current;
    const child = el && el.children[i];
    if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft - 16, behavior: 'smooth' });
  };

  const current = openIndex !== null ? slides[openIndex] : null;
  const cols = COLS[Math.min(tiles.length, 4)] || COLS[4];

  return (
    <>
      <noscript>
        <style>{'.photo-tile{opacity:1!important;transform:none!important}'}</style>
      </noscript>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className={`no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-auto md:grid md:snap-none md:gap-6 md:overflow-visible md:px-0 ${cols}`}
      >
        {tiles.map((tile, i) => (
          <figure
            key={tile.key}
            style={{ '--i': i }}
            className="photo-tile relative aspect-[4/3] w-[78%] flex-none snap-center overflow-hidden border border-rule bg-paper-dark sm:w-[46%] md:w-auto"
          >
            <button
              type="button"
              onClick={() => open(i)}
              aria-label={tile.caption ? `Preview photo: ${tile.caption}` : `Preview photo ${i + 1}`}
              className="block h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Image
                src={tile.src}
                alt={tile.caption || 'Workshop photo'}
                width={800}
                height={600}
                sizes="(max-width: 768px) 80vw, 30vw"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </button>
            {tile.caption && (
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white">
                {tile.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {tiles.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 md:hidden" role="tablist" aria-label="Photo position">
          {tiles.map((tile, i) => (
            <button
              key={tile.key}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Photo ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-accent' : 'w-1.5 bg-rule'}`}
            />
          ))}
        </div>
      )}

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 sm:p-8"
          onClick={close}
        >
          <figure className="relative flex max-h-full max-w-4xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.caption || 'Photo preview'}
              className="max-h-[78vh] w-auto max-w-full border border-white/20 bg-black object-contain shadow-2xl"
            />
            {current.caption && (
              <figcaption className="mt-3 text-center text-xs font-semibold uppercase tracking-[.14em] text-white/90">
                {current.caption}
              </figcaption>
            )}
          </figure>

          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close preview"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-2xl leading-none text-white hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:top-6"
          >
            ×
          </button>

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), step(-1))}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), step(1))}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
