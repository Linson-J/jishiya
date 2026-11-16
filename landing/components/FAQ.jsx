'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';
import { SITE } from '../lib/site';

export default function FAQ({ faq }) {
  const [openId, setOpenId] = useState(null);
  const [, forceRender] = useState(0);
  const panels = useRef({});

  // Keep the open panel's height correct if the viewport (and so text wrapping) changes.
  useEffect(() => {
    const onResize = () => forceRender((n) => n + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <section id="faq" className="pb-12 md:pb-[72px]">
      <div className="wrap grid gap-8 lg:grid-cols-[1fr_1.8fr] lg:gap-16">
        <Reveal direction="left" className="self-start lg:sticky lg:top-24">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-accent">FAQ</p>
          <h2 className="mb-4 mt-2.5 font-serif text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Frequently Asked
          </h2>
          <p className="text-[15px] text-ink-mid">
            Can&apos;t find what you&apos;re looking for? Write to us at{' '}
            <a href={`mailto:${SITE.email}`} className="border-b border-accent text-accent">
              {SITE.email}
            </a>{' '}
            and we&apos;ll get back to you.
          </p>
        </Reveal>

        <Reveal direction="right" className="border-t border-ink">
          {faq.map((item) => {
            const open = openId === item.id;
            const panel = panels.current[item.id];
            return (
              <div key={item.id} className="border-b border-rule">
                <h3>
                  <button
                    type="button"
                    id={`faq-btn-${item.id}`}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${item.id}`}
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left font-serif text-lg font-bold"
                  >
                    <span>{item.question}</span>
                    <span
                      aria-hidden="true"
                      className={`flex-none font-sans text-2xl font-normal text-accent transition-transform duration-300 ${
                        open ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-btn-${item.id}`}
                  ref={(el) => {
                    panels.current[item.id] = el;
                  }}
                  style={{ maxHeight: open && panel ? `${panel.scrollHeight}px` : 0 }}
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                >
                  <p className="max-w-[560px] pb-5 text-[15px] text-ink-mid">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
