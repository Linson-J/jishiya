import Reveal from './Reveal';

/** Her full story: the longer bio plus a pull quote (stats live in the hero). */
export default function About() {
  return (
    <section id="story" aria-labelledby="story-heading" className="border-y border-ink">
      <Reveal className="wrap grid gap-8 py-12 md:grid-cols-[1.2fr_1fr] md:gap-14 md:py-16">
        <div>
          <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.14em] text-accent">
            <span aria-hidden="true" className="h-0.5 w-8 bg-accent" />
            Her Story
          </p>
          <h2 id="story-heading" className="mb-5 font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            Psychology of the buyer, craft of the marketer
          </h2>
          <p className="text-ink-mid">
            Jishya holds a PhD in Digital Marketing, specialising in consumer psychology in online shopping. She has
            managed social media for globally recognised brands including GOD TV Asia, ODB, Toastmasters International,
            GO Movement, Campus Crusade and Essar Logistics — generating over 100,000+ interactions in a single campaign
            year. That mix of research and real campaigns is what she teaches, step by step.
          </p>
        </div>
        <blockquote className="self-center border-l-[3px] border-accent pl-6 font-serif text-2xl font-bold leading-snug md:text-[1.7rem]">
          “Anyone can grow their career or business online — they just need the right system.”
          <footer className="mt-3 font-sans text-xs font-semibold uppercase tracking-[.14em] text-ink-soft">
            — Dr. G.B. Jishya
          </footer>
        </blockquote>
      </Reveal>
    </section>
  );
}
