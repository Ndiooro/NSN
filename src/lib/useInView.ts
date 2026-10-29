"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

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
   * Bord inférieur du viewport, en fraction, auquel déclencher l'observation.
   */
  triggerOffset?: number;
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
  options: UseInViewOptions = {},
): [RefObject<T | null>, boolean] {
  const {
    threshold = 0.35,
    rootMargin = "0px",
    triggerOnce = true,
    triggerOffset,
    triggerIfAbove = false,
    onInView,
  } = options;

  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);
  const onInViewRef = useRef(onInView);

  useEffect(() => {
    onInViewRef.current = onInView;
  }, [onInView]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      const timer = setTimeout(() => {
        setIsInView(true);
        onInViewRef.current?.();
      }, 0);
      return () => clearTimeout(timer);
    }

    let observer: IntersectionObserver | null = null;
    let hasTriggered = false;

    const observe = () => {
      if (triggerOnce && hasTriggered) return;
      observer?.disconnect();
      const offset = Math.min(1, Math.max(0, triggerOffset ?? 1));
      const effectiveRootMargin =
        triggerOffset === undefined
          ? rootMargin
          : `0px 0px -${Math.round(window.innerHeight * (1 - offset))}px 0px`;

      observer = new IntersectionObserver(
        ([entry]) => {
          const rootTop = entry.rootBounds ? entry.rootBounds.top : 0;
          const isAbove =
            triggerIfAbove && entry.boundingClientRect.top < rootTop;

          if (entry.isIntersecting || isAbove) {
            hasTriggered = true;
            setIsInView(true);
            onInViewRef.current?.();
            if (triggerOnce) {
              observer?.unobserve(element);
              observer?.disconnect();
            }
          } else if (!triggerOnce) {
            setIsInView(false);
          }
        },
        { threshold, rootMargin: effectiveRootMargin },
      );

      observer.observe(element);
    };

    observe();
    if (triggerOffset !== undefined) {
      window.addEventListener("resize", observe);
    }

    return () => {
      window.removeEventListener("resize", observe);
      observer?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, triggerOffset, triggerIfAbove]);

  return [ref, isInView];
}
