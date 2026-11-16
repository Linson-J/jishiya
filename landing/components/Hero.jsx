import Image from 'next/image';
import { assetUrl } from '../lib/api';

/** First screen: the trainer's introduction. */
export default function Hero({ workshop, stats = [], gallery = [] }) {
  const portrait = gallery.find((g) => g.category === 'portrait');
  const enrollHref = workshop.cta_link || '#enroll';

  // "Worked with": text only — the organisation names entered in the admin panel (Trusted By). Hidden when none.
  const workedWith = gallery
    .filter((g) => g.category === 'logo' && g.caption && g.caption.trim())
    .map((g) => ({ id: g.id, name: g.caption.trim() }));

  return (
    <section id="about" aria-label="Meet your trainer" className="border-b border-ink">
      <div className="wrap grid md:h-[calc(100vh-11rem)] md:min-h-[500px] md:grid-cols-[45fr_55fr]">
        {/* Portrait */}
        <div className="relative h-[60vh] min-h-[360px] bg-paper-dark md:h-auto md:min-h-0 md:border-x md:border-rule">
          {portrait ? (
            <Image
              src={assetUrl(portrait.image_url)}
              alt="Dr. G.B. Jishya, digital marketing trainer"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-top"
            />
          ) : (
            <div role="img" aria-label="Portrait placeholder" className="grid h-full w-full place-items-center">
              <span className="font-serif text-[10rem] font-bold leading-none">J</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent px-5 pb-5 pt-16 text-white">
            <span className="mb-2 inline-block bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.16em]">
              Digital Marketing
            </span>
            <b className="block font-serif text-xl">Dr. G.B. Jishya</b>
            <small className="text-[11px] uppercase tracking-[.14em] text-white/80">Ph.D · Consumer Psychology</small>
          </div>
        </div>

        {/* Introduction */}
        <div className="flex flex-col justify-center gap-4 py-8 md:gap-4 md:py-4 md:pl-10 lg:pl-14">
          <div>
            <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.14em] text-accent">
              <span aria-hidden="true" className="h-0.5 w-8 bg-accent" />
              Meet Your Trainer
            </p>
            <h1 className="font-serif text-[2.4rem] font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Dr. G.B. Jishya
            </h1>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[.1em] text-ink-mid md:text-[15px]">
              Ph.D in Digital Marketing · Consumer Psychology
            </p>
          </div>

          <p className="max-w-[560px] text-base leading-relaxed text-ink-mid lg:text-lg">
            Helped 70,000+ students and professionals across India grow their career and business online. On a mission
            to help 1 million people.
          </p>

          {stats.length > 0 && (
            <dl className="grid max-w-[620px] grid-cols-2 border-t border-rule md:grid-cols-4">
              {stats.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="border-b border-r border-rule px-3 py-3 max-md:[&:nth-child(2n)]:border-r-0 md:[&:nth-child(4n)]:border-r-0 md:[&:nth-child(4n+1)]:pl-0"
                >
                  <dd className="font-serif text-2xl font-bold leading-tight md:text-3xl">{s.value}</dd>
                  <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-ink-soft">
                    {s.label.replace(/ (Trained|Empowered|Reached)$/, '')}
                  </dt>
                </div>
              ))}
            </dl>
          )}

          {workedWith.length > 0 && (
            <div className="max-w-[620px]">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-ink-soft">Worked with</p>
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {workedWith.slice(0, 5).map((w) => (
                  <li key={w.id} className="font-serif text-sm font-bold uppercase tracking-wide text-ink-mid">
                    {w.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={enrollHref}
              className="inline-block border-[1.5px] border-accent bg-accent px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wider text-white transition-colors hover:border-ink hover:bg-ink"
            >
              Reserve My Seat — {workshop.price}
            </a>
            <a
              href="#workshop"
              className="border-b border-ink text-[13px] font-semibold uppercase tracking-wider hover:border-accent hover:text-accent"
            >
              See the workshop ↓
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
