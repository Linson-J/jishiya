import Reveal from './Reveal';

const BEFORE = [
  'Posting on social media with no strategy or results',
  'Spending on ads but getting no quality leads',
  'No idea what content to create or when to post',
  'Fully dependent on word-of-mouth referrals',
  'Getting enquiries but unable to convert them',
  'Watching competitors grow while you stay stuck',
];

const AFTER = [
  'A clear organic lead-generation system that actually works',
  '365-day content calendar with daily ideas ready to go',
  'Use AI tools to create high-converting content fast',
  'Grow on Instagram, LinkedIn & YouTube simultaneously',
  'A proven framework to turn followers into paying customers',
  'Confidence to grow independently, without agencies',
];

export default function Transform() {
  return (
    <section aria-label="Before and after the workshop" className="grid border-b border-ink md:grid-cols-2">
      <Reveal direction="left" className="border-b border-ink bg-white px-4 py-10 sm:px-8 md:border-b-0 md:border-r md:py-14 lg:px-12">
        <h2 className="mb-7 font-serif text-2xl font-bold text-accent-muted md:text-3xl">Struggling Right Now</h2>
        <ul>
          {BEFORE.map((item) => (
            <li key={item} className="flex gap-3.5 border-b border-rule py-3.5 text-[15px] text-ink-mid last:border-b-0">
              <span aria-hidden="true" className="flex-none font-bold text-accent-muted">
                ✗
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal direction="right" className="bg-ink px-4 py-10 text-white sm:px-8 md:py-14 lg:px-12">
        <h2 className="mb-7 font-serif text-2xl font-bold text-gold md:text-3xl">After the Workshop</h2>
        <ul>
          {AFTER.map((item) => (
            <li key={item} className="flex gap-3.5 border-b border-[#333] py-3.5 text-[15px] last:border-b-0">
              <span aria-hidden="true" className="flex-none font-bold text-gold">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
