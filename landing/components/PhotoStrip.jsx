import PhotoShowcase from './PhotoShowcase';
import LogoStrip from './LogoStrip';
import { assetUrl } from '../lib/api';

export default function PhotoStrip({ gallery }) {
  const logos = gallery.filter((g) => g.category === 'logo');

  // Only real photos are shown. A caption appears only if one was entered in the admin.
  const tiles = gallery
    .filter((g) => g.category === 'workshop' && g.image_url)
    .slice(0, 8)
    .map((g) => ({
      key: g.id,
      src: assetUrl(g.image_url),
      caption: g.caption && g.caption.trim() ? g.caption.trim() : '',
    }));

  if (tiles.length === 0 && logos.length === 0) return null;

  return (
    <section aria-label="Photos" className="border-b border-ink py-12 md:py-16">
      <div className="wrap">
        {tiles.length > 0 && (
          <>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="mb-2 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.14em] text-accent">
                  <span aria-hidden="true" className="h-0.5 w-8 bg-accent" />
                  In Action
                </p>
                <h2 className="font-serif text-3xl font-bold leading-tight md:text-4xl">
                  Workshops, Awards &amp; Stage Talks
                </h2>
              </div>
              <p className="text-xs text-ink-soft">
                <span className="md:hidden">Swipe · tap a photo to enlarge</span>
                <span className="hidden md:inline">Tap a photo to enlarge</span>
              </p>
            </div>
            <PhotoShowcase tiles={tiles} />
          </>
        )}

        <LogoStrip logos={logos} />
      </div>
    </section>
  );
}
