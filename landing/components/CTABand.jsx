import Reveal from './Reveal';

export default function CTABand({ workshop }) {
  const enrollHref = workshop.cta_link || '#enroll';

  return (
    <section id="enroll" className="bg-accent px-4 py-20 text-center text-white md:py-24">
      <Reveal>
        <h2 className="mb-4 font-serif text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          This Won&apos;t Be Available Forever
        </h2>
        <p className="mb-8 text-lg opacity-90">Seats are limited. Once full, the next batch could be months away.</p>
        <a
          href={enrollHref}
          className="inline-block border-[1.5px] border-white px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wider transition-colors hover:bg-white hover:text-accent"
        >
          Reserve My Seat — {workshop.price}
        </a>
        <small className="mt-7 block text-xs uppercase tracking-[.1em] opacity-85">
          {workshop.date} · {workshop.time_slot} · {workshop.platform} LIVE · No recordings
        </small>
      </Reveal>
    </section>
  );
}
