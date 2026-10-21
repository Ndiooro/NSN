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
  /**
   * Si vrai, déclenche également si l'élément se situe déjà au-dessus de la zone cible
   * (cas des rechargements en milieu de page ou défilements très rapides).
   */
  triggerIfAbove?: boolean;
  /**
   * Callback facultatif appelé au premier déclenchement.
   */
  onInView?: () => void;
}

/**
 * useInView
 * Hook réutilisable basé sur IntersectionObserver.
 * Supporte le seuil, le rootMargin paramétrable et la détection d'éléments déjà au-dessus.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [RefObject<T | null>, boolean] {
  const {
    threshold = 0.35,
    rootMargin = '0px',
    triggerOnce = true,
    triggerIfAbove = false,
    onInView,
  } = options;

  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);
  const onInViewRef = useRef(onInView);
  onInViewRef.current = onInView;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      const timer = setTimeout(() => {
        setIsInView(true);
        onInViewRef.current?.();
      }, 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const rootTop = entry.rootBounds ? entry.rootBounds.top : 0;
        const isIntersecting = entry.isIntersecting;
        const isAbove = triggerIfAbove && entry.boundingClientRect.top < rootTop;

        if (isIntersecting || isAbove) {
          setIsInView(true);
          onInViewRef.current?.();
          if (triggerOnce) {
            observer.unobserve(element);
            observer.disconnect();
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
  }, [threshold, rootMargin, triggerOnce, triggerIfAbove]);

  return [ref, isInView];
}
