import Image from 'next/image';
import { assetUrl } from '../lib/api';

/**
 * "Trusted By" strip. Rendered only when at least one logo (image + organisation
 * name) has been added in the admin panel — otherwise the whole block is hidden.
 */
export default function LogoStrip({ logos }) {
  const items = (logos || [])
    .filter((l) => l.image_url)
    .map((l) => ({ key: l.id, name: (l.caption || '').trim(), src: assetUrl(l.image_url) }));

  if (items.length === 0) return null;

  // Duplicated so the -50% keyframe loops seamlessly.
  const loop = [...items, ...items, ...items, ...items];
  const track = [...loop, ...loop];

  return (
    <div className="mt-12 md:mt-14">
      <div className="mb-6 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-accent">Trusted By</p>
        <h2 className="font-serif text-2xl font-bold leading-tight md:text-3xl">
          Reputed Institutions She Has Worked With
        </h2>
      </div>

      <div
        className="group overflow-hidden border-y border-rule py-5"
        role="region"
        aria-label="Organisations Dr. Jishya has worked with"
      >
        <div className="flex w-max animate-logos gap-4 group-hover:[animation-play-state:paused]">
          {track.map((item, i) => (
            <div
              key={`${item.key}-${i}`}
              aria-hidden={i >= items.length ? 'true' : undefined}
              className="group/card relative flex h-28 w-44 flex-none items-center justify-center overflow-hidden border border-rule bg-paper-dark p-3 text-center"
            >
              <Image
                src={item.src}
                alt={item.name ? `${item.name} logo` : 'Partner logo'}
                width={160}
                height={56}
                sizes="160px"
                className="max-h-14 w-auto object-contain"
              />
              {item.name && (
                <span className="absolute inset-x-0 bottom-0 translate-y-full bg-ink/85 px-2 py-1.5 text-[10px] font-semibold uppercase leading-tight tracking-[.1em] text-white transition-transform duration-200 group-hover/card:translate-y-0">
                  {item.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
