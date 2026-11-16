import Reveal from './Reveal';

function Cell({ label, children }) {
  return (
    <div className="border-b border-r border-rule px-4 py-4 lg:border-b-0 lg:px-5">
      <small className="block text-[10px] font-semibold uppercase tracking-[.16em] text-ink-soft">{label}</small>
      <div className="mt-0.5 text-[15px] font-semibold leading-snug">{children}</div>
    </div>
  );
}

/** Full-width workshop announcement with a horizontal details rail. */
export default function WorkshopBand({ workshop }) {
  const enrollHref = workshop.cta_link || '#enroll';

  return (
    <section id="workshop" aria-labelledby="workshop-heading" className="border-b border-ink">
      <div className="wrap py-12 md:py-16">
        <Reveal>
          <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.14em] text-accent">
            <span aria-hidden="true" className="h-0.5 w-8 bg-accent" />
            Certified Live Workshop · Tamil · Limited Seats
          </p>
          <h2
            id="workshop-heading"
            className="mb-5 max-w-[980px] font-serif text-[2rem] font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.6rem]"
          >
            {workshop.title}
          </h2>
          <p className="mb-9 max-w-[720px] text-lg leading-relaxed text-ink-mid">{workshop.subtitle}</p>
        </Reveal>

        <Reveal
          aria-label="Workshop details"
          className="grid grid-cols-2 border-l border-t border-ink sm:grid-cols-3 lg:grid-cols-[repeat(6,minmax(0,1fr))_auto] lg:border-b"
        >
          <Cell label="Platform">{workshop.platform}</Cell>
          <Cell label="Dates">{workshop.date}</Cell>
          <Cell label="Time">{workshop.time_slot}</Cell>
          <Cell label="Duration">{workshop.duration}</Cell>
          <Cell label="Language">{workshop.language}</Cell>
          <Cell label="Seats">
            <span className="font-serif text-xl text-accent">{workshop.seats_note}</span>
          </Cell>
          <div className="col-span-2 flex flex-wrap items-center gap-4 border-b border-r border-ink bg-paper-dark px-5 py-4 sm:col-span-3 lg:col-span-1 lg:border-b-0 lg:border-r">
            <div>
              <strong className="block font-serif text-3xl leading-none">{workshop.price}</strong>
              <small className="text-[10px] uppercase tracking-wider text-ink-soft">One-time · No recordings</small>
            </div>
            <a
              href={enrollHref}
              className="inline-block whitespace-nowrap border-[1.5px] border-accent bg-accent px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-white transition-colors hover:border-ink hover:bg-ink"
            >
              Reserve My Seat
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
