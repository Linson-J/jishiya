import Reveal from './Reveal';

export default function Testimonials({ testimonials }) {
  return (
    <section id="reviews" className="py-12 md:py-[72px]">
      <Reveal className="wrap">
        <div className="border-b-[3px] border-double border-ink pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-accent">Reviews</p>
          <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight md:text-5xl">What Attendees Say</h2>
        </div>

        <div className="grid border-l border-rule md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => {
            const rating = Math.max(0, Math.min(5, Number(t.rating) || 5));
            return (
              <figure key={t.id} className="flex flex-col gap-4 border-b border-r border-rule px-7 py-8">
                <div className="text-sm tracking-[3px] text-accent" role="img" aria-label={`${rating} out of 5 stars`}>
                  {'★'.repeat(rating)}
                  <span className="text-rule">{'★'.repeat(5 - rating)}</span>
                </div>
                <blockquote className="flex-1 font-serif text-base italic leading-relaxed">
                  “{t.review}”
                </blockquote>
                <figcaption className="flex items-center gap-3 text-[13px] text-ink-soft">
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 flex-none place-items-center rounded-full border border-rule bg-paper-dark font-serif text-[15px] font-bold text-ink"
                  >
                    {t.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span>
                    <b className="font-semibold text-ink">{t.name}</b> · {t.location}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
