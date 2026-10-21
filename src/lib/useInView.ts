'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

export interface UseInViewOptions {
  /**
   * Pourcentage de visibilité pour déclencher l'affichage (défaut : 0.35).
   */
  threshold?: number;
  /**
   * Marges extérieures de l'observateur (défaut : '0px').
   */
  rootMargin?: string;
  /**
   * Si vrai, ne déclenche l'animation qu'une seule fois (défaut : true).
   */
  triggerOnce?: boolean;
}

/**
 * useInView
 * Hook réutilisable basé sur IntersectionObserver pour les futures animations au scroll.
 * Seuil par défaut configuré à 0.35, déclenchement unique.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [RefObject<T | null>, boolean] {
  const { threshold = 0.35, rootMargin = '0px', triggerOnce = true } = options;
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      const timer = setTimeout(() => setIsInView(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isInView];
}
