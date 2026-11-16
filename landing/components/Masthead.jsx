'use client';

import { useEffect, useRef, useState } from 'react';
import { NAV_LINKS, SITE } from '../lib/site';

/**
 * Three-row newspaper masthead.
 * Rows 1 and 2 scroll away; row 3 (the tab nav) sticks to the top and, once
 * stuck, grows a compact logo and Enroll button so the masthead stays useful.
 */
export default function Masthead({ workshop }) {
  const [stuck, setStuck] = useState(false);
  const [active, setActive] = useState('');
  const sentinelRef = useRef(null);

  // Detect when the nav has reached the top of the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Highlight the tab for the section currently in view.
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    function onScroll() {
      const y = window.scrollY + 140;
      let current = '';
      ids.forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= y) current = id;
      });
      setActive(current);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const infoLine = `Live Workshop · ${workshop.date} · ${workshop.time_slot} · ${workshop.platform}`;
  const enrollHref = workshop.cta_link || '#enroll';

  return (
    <>
      {/* Row 1 — thin top bar (hidden on mobile) */}
      <div className="hidden border-b border-rule text-xs text-ink-mid md:block">
        <div className="wrap flex items-center justify-between gap-4 py-2">
          <span>{infoLine}</span>
          <span className="flex gap-5">
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
              Instagram
            </a>
            <a href={`mailto:${SITE.email}`} className="hover:text-accent">
              {SITE.email}
            </a>
          </span>
        </div>
      </div>

      {/* Row 2 — logo bar */}
      <div className="border-b-[3px] border-double border-ink">
        <div className="wrap flex items-center justify-between gap-4 py-4 md:py-3">
          <a href="#top" aria-label="Dr. Jishya — home" className="block leading-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Dr. Jishya" className="h-14 w-auto md:h-14" />
            <span className="mt-2 block font-sans text-[10px] font-medium uppercase tracking-[.2em] text-ink-soft md:text-[11px]">
              AI + Digital Marketing Specialist
            </span>
          </a>
          <a
            href={enrollHref}
            className="shrink-0 border border-accent bg-accent px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:border-ink hover:bg-ink md:px-6 md:py-3 md:text-[13px]"
          >
            Enroll — {workshop.price}
          </a>
        </div>
      </div>

      {/* Sentinel: leaves the viewport at the moment the nav becomes stuck */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      {/* Row 3 — sticky tab nav */}
      <nav
        aria-label="Primary"
        className={`sticky top-0 z-50 border-b border-ink bg-paper transition-shadow ${stuck ? 'shadow-sm' : ''}`}
      >
        <div className="wrap flex items-stretch">
          <a
            href="#top"
            aria-hidden={!stuck}
            tabIndex={stuck ? 0 : -1}
            className={`hidden items-center overflow-hidden whitespace-nowrap font-serif text-lg font-bold transition-all duration-300 md:flex ${
              stuck ? 'mr-4 max-w-[160px] opacity-100' : 'max-w-0 opacity-0'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Dr. Jishya" className="h-8 w-auto" />
          </a>

          <div className="no-scrollbar flex flex-1 overflow-x-auto">
            {NAV_LINKS.map((link, i) => {
              const isActive = active === link.href.slice(1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'true' : undefined}
                  className={`-mb-px flex-none whitespace-nowrap border-b-[3px] border-r border-r-rule px-5 py-3.5 text-xs font-semibold uppercase tracking-[.12em] transition-colors hover:border-b-accent hover:bg-paper-dark hover:text-accent ${
                    i === 0 ? 'border-l border-l-rule' : ''
                  } ${isActive ? 'border-b-accent bg-paper-dark text-accent' : 'border-b-transparent text-ink-mid'}`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          <a
            href={enrollHref}
            aria-hidden={!stuck}
            tabIndex={stuck ? 0 : -1}
            className={`hidden items-center overflow-hidden whitespace-nowrap bg-accent text-[11px] font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-ink md:flex ${
              stuck ? 'ml-4 max-w-[220px] px-5 opacity-100' : 'max-w-0 px-0 opacity-0'
            }`}
          >
            Enroll — {workshop.price}
          </a>
        </div>
      </nav>
    </>
  );
}
