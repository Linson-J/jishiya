import Reveal from './Reveal';
import { SITE } from '../lib/site';

const LINKS = [
  {
    label: 'Instagram',
    href: SITE.instagram,
    sub: `@${SITE.instagramHandle}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: SITE.linkedin,
    sub: 'Dr. Jishya',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.75 9.75h3.8v1.55h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.75 2.63 4.75 6.05V21h-4v-4.9c0-1.17-.02-2.67-1.63-2.67-1.63 0-1.88 1.27-1.88 2.58V21h-4z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: `mailto:${SITE.email}`,
    sub: SITE.email,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
];

export default function SocialFeed() {
  return (
    <section id="social" aria-labelledby="social-heading" className="border-b border-ink">
      <div className="wrap grid gap-10 py-12 md:grid-cols-[1fr_1.2fr] md:py-16">
        <Reveal direction="left">
          <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.14em] text-accent">
            <span aria-hidden="true" className="h-0.5 w-8 bg-accent" />
            Stay Connected
          </p>
          <h2 id="social-heading" className="mb-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
            Follow along on social media
          </h2>
          <p className="mb-6 max-w-md text-ink-mid">
            Tips, behind-the-scenes and workshop updates — see the latest posts from Soul Spring Digital.
          </p>
          <ul className="space-y-3">
            {LINKS.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target={l.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 border border-rule px-4 py-3 transition-colors hover:border-ink hover:bg-paper-dark"
                >
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-ink text-paper transition-colors group-hover:bg-accent">
                    {l.icon}
                  </span>
                  <span>
                    <b className="block text-sm">{l.label}</b>
                    <small className="text-xs text-ink-soft">{l.sub}</small>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal direction="right">
          <div className="mx-auto w-full max-w-[540px] border border-rule bg-white">
            <iframe
              title={`Latest posts from @${SITE.instagramHandle} on Instagram`}
              src={`https://www.instagram.com/${SITE.instagramHandle}/embed`}
              loading="lazy"
              scrolling="yes"
              className="block h-[560px] w-full border-0 md:h-[640px]"
            />
          </div>
          <p className="mt-2 text-center text-xs text-ink-soft">
            Live from{' '}
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
              @{SITE.instagramHandle}
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
