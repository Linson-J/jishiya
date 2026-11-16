import { NAV_LINKS, SITE } from '../lib/site';

export default function Footer() {
  return (
    <footer className="bg-ink text-[#bbb]">
      <div className="wrap grid items-center gap-6 py-9 text-center text-[13px] md:grid-cols-[1fr_auto_1fr] md:text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Dr. Jishya" className="h-14 w-auto" />

        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
          <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
            LinkedIn
          </a>
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
            Instagram
          </a>
          <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-white">
            Email
          </a>
        </nav>

        <div className="md:text-right">© Soul Spring Digital 2026 · All Rights Reserved</div>
      </div>
    </footer>
  );
}
