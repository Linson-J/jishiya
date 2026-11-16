import Reveal from './Reveal';

const AUDIENCE = [
  { icon: '🏢', text: 'Business owners looking to promote their brand online' },
  { icon: '🎓', text: 'Fresh graduates looking for ways to make money online' },
  { icon: '💼', text: 'Professionals wanting to build a strong personal brand' },
  { icon: '🏠', text: 'Homemakers looking to support family with a new skill' },
  { icon: '💻', text: 'Aspiring freelancers wanting to earn extra income online' },
  { icon: '🔄', text: 'Career changers who want a successful future in digital marketing' },
];

export default function WhoFor() {
  return (
    <section aria-labelledby="who-heading" className="pb-12 md:pb-[72px]">
      <Reveal className="wrap">
        <div className="border-b-[3px] border-double border-ink pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-accent">Audience</p>
          <h2 id="who-heading" className="font-serif text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Who Should Attend
          </h2>
        </div>

        <ul className="mt-8 grid border-l border-t border-rule sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCE.map((a) => (
            <li
              key={a.text}
              className="border-b border-r border-rule px-7 py-8 transition-colors hover:bg-paper-dark"
            >
              <span aria-hidden="true" className="mb-3 block text-3xl">
                {a.icon}
              </span>
              <p className="text-[15px] text-ink-mid">{a.text}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
