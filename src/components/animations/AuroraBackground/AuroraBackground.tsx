'use client';

import { useEffect, useRef } from 'react';
import './AuroraBackground.css';

export function AuroraBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      element.dataset.inView = 'true';
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        element.dataset.inView = String(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="aurora-background"
      data-in-view="false"
    />
  );
}

export default AuroraBackground;
