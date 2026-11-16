'use client';

import { useEffect, useRef } from 'react';

// Full class strings (not built dynamically) so nothing is purged.
const DIRECTION_CLASS = {
  up: 'reveal',
  left: 'reveal reveal-left',
  right: 'reveal reveal-right',
};

/**
 * Fades (and optionally slides) its children in once, when 10% of the element
 * enters the viewport. Uses IntersectionObserver + CSS transitions only.
 */
export default function Reveal({ as: Tag = 'div', direction = 'up', className = '', children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible');
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`${DIRECTION_CLASS[direction] || DIRECTION_CLASS.up} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
