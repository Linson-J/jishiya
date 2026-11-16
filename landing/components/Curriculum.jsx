import Reveal from './Reveal';

export default function Curriculum({ curriculum }) {
  return (
    <section id="curriculum" className="py-12 md:py-[72px]">
      <Reveal className="wrap">
        <div className="border-b-[3px] border-double border-ink pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-accent">What You&apos;ll Learn</p>
          <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight md:text-5xl">The Curriculum</h2>
        </div>

        <ol>
          {curriculum.map((m) => (
            <li
              key={m.id}
              className="grid grid-cols-[56px_1fr] items-baseline gap-x-3 border-b border-rule px-3 py-6 transition-colors hover:bg-paper-dark md:grid-cols-[90px_1fr_1.6fr] md:gap-x-6 md:py-7"
            >
              <span className="font-serif text-3xl text-accent">{String(m.module_no).padStart(2, '0')}</span>
              <h3 className="font-serif text-xl font-bold leading-snug">{m.title}</h3>
              <p className="hidden text-[15px] text-ink-mid md:block">{m.description}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
