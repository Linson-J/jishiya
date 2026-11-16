const SKILLS = [
  'SEO Strategy',
  'AI + Marketing',
  'Content Strategy',
  'Personal Branding',
  'Social Media Growth',
  'Freelancing',
  'YouTube Monetisation',
  'Keyword Research',
];

export default function Ticker() {
  // Two identical halves: the keyframe moves the track by -50% for a seamless loop.
  const loop = [...SKILLS, ...SKILLS, ...SKILLS, ...SKILLS];
  const items = [...loop, ...loop];

  return (
    <div className="group overflow-hidden whitespace-nowrap bg-ink py-2.5 text-white" aria-hidden="true">
      <div className="inline-flex animate-ticker group-hover:[animation-play-state:paused]">
        {items.map((skill, i) => (
          <span key={i} className="flex items-center text-[11px] font-semibold uppercase tracking-[.2em]">
            <span className="px-5">{skill}</span>
            <span className="text-accent">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
