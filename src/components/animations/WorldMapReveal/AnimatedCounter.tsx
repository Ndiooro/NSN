'use client';

import React, { useEffect, useState } from 'react';

export interface AnimatedCounterProps {
  /**
   * Valeur numérique cible.
   */
  target: number;
  /**
   * Booléen déclenchant le compte à rebours de l'animation.
   */
  play: boolean;
  /**
   * Délai avant déclenchement en millisecondes (défaut : 3800 ms).
   */
  delayMs?: number;
  /**
   * Durée de l'animation en millisecondes (défaut : 1200 ms).
   */
  durationMs?: number;
  /**
   * Classes CSS additionnelles.
   */
  className?: string;
}

/**
 * AnimatedCounter ("use client")
 * Compteur numérique fluide avec courbe ease-out (1,2 s déclenché à 3,8 s).
 * Respecte prefers-reduced-motion en affichant immédiatement la valeur cible.
 */
export function AnimatedCounter({
  target,
  play,
  delayMs = 3800,
  durationMs = 1200,
  className = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Vérification des préférences de mouvement réduit
    const isReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReducedMotion) {
      setCount(target);
      return;
    }

    if (!play) return;

    let rafId: number;
    let startTimestamp: number | null = null;
    let timerId: ReturnType<typeof setTimeout>;

    timerId = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
        // Courbe ease-out cubique : 1 - (1 - p)^3
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(easeOut * target));

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          setCount(target);
        }
      };

      rafId = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timerId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [play, target, delayMs, durationMs]);

  return (
    <span aria-hidden="true" className={className}>
      {count}
    </span>
  );
}

export default AnimatedCounter;
