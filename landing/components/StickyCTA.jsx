/** Mobile-only sticky bottom bar. */
export default function StickyCTA({ workshop }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-paper p-2.5 md:hidden">
      <a
        href={workshop.cta_link || '#enroll'}
        className="block bg-accent py-3 text-center text-[13px] font-semibold uppercase tracking-wider text-white"
      >
        Reserve {workshop.price}
      </a>
    </div>
  );
}
