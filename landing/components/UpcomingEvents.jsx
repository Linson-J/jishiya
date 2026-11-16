import Reveal from './Reveal';

/**
 * "More Workshops" list. The priority workshop is shown big in the hero / workshop band
 * (and drives the header price), so it is excluded here. The section only renders
 * when at least one other active workshop exists.
 */
export default function UpcomingEvents({ workshops, priorityId }) {
  const others = (workshops || []).filter((w) => w.id !== priorityId);
  if (others.length === 0) return null;

  return (
    <section id="more-workshops" aria-labelledby="more-workshops-heading" className="border-b border-ink">
      <div className="wrap py-12 md:py-16">
        <Reveal>
          <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.14em] text-accent">
            <span aria-hidden="true" className="h-0.5 w-8 bg-accent" />
            Next Batches
          </p>
          <h2 id="more-workshops-heading" className="mb-8 font-serif text-3xl font-bold leading-tight md:text-4xl">
            Upcoming Workshops
          </h2>
        </Reveal>

        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {others.map((w) => {
            const isExternal = w.cta_link && /^https?:\/\//i.test(w.cta_link);
            return (
              <li key={w.id}>
                <Reveal className="flex h-full flex-col border border-rule bg-white p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="bg-ink px-2.5 py-1 font-serif text-sm font-bold text-white">{w.date}</span>
                    <strong className="font-serif text-2xl leading-none">{w.price}</strong>
                  </div>
                  <h3 className="font-serif text-xl font-bold leading-snug">{w.title}</h3>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                    {[w.time_slot, w.platform, w.duration, w.language].filter(Boolean).join(' · ')}
                  </p>
                  {w.subtitle && <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-mid">{w.subtitle}</p>}
                  <a
                    href={w.cta_link || '#enroll'}
                    {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="mt-4 inline-block self-start border-b border-ink text-[12px] font-semibold uppercase tracking-wider hover:border-accent hover:text-accent"
                  >
                    Reserve — {w.price}
                  </a>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
