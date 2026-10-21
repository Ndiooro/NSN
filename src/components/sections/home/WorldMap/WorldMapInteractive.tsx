'use client';

import React from 'react';
import { useInView } from '@/lib/useInView';
import { WorldMapReveal } from '@/components/animations/WorldMapReveal/WorldMapReveal';
import { AnimatedCounter } from '@/components/animations/WorldMapReveal/AnimatedCounter';

export interface WorldMapInteractiveProps {
  label: string;
  ariaLabel: string;
  statsLabels: {
    employees: string;
    subsidiaries: string;
    countries: string;
  };
  statsValues: {
    employees: number;
    subsidiaries: number;
    countries: number;
  };
}

/**
 * WorldMapInteractive ("use client")
 *
 * Gère le déclenchement unique de la séquence de la carte du monde via la sentinelle
 * au milieu de la hauteur d'écran (rootMargin "-49% 0px -49% 0px"), et synchronise
 * le compte progressif des indicateurs clés (800, 25, 22).
 */
export function WorldMapInteractive({
  label,
  ariaLabel,
  statsLabels,
  statsValues,
}: WorldMapInteractiveProps) {
  // Observation de la sentinelle à mi-hauteur avec déclenchement unique
  const [sentinelRef, isTriggered] = useInView<HTMLDivElement>({
    threshold: 0,
    rootMargin: '-49% 0px -49% 0px',
    triggerOnce: true,
    triggerIfAbove: true,
  });

  // Phrase continue sémantique pour les lecteurs d'écran
  const accessibleSummary = `${statsValues.employees} ${statsLabels.employees}, ${statsValues.subsidiaries} ${statsLabels.subsidiaries}, ${statsValues.countries} ${statsLabels.countries}`;

  return (
    <div className={`world-map-wrapper ${isTriggered ? 'map-play' : ''}`.trim()}>
      {/* Sentinelle invisible de 1 px au centre vertical de la section */}
      <div ref={sentinelRef} className="map-sentinel" aria-hidden="true" />

      {/* Carte SVG vectorielle animée */}
      <WorldMapReveal play={isTriggered} ariaLabel={ariaLabel} />

      {/* Bloc d'informations et statistiques */}
      <div className="map-text-block">
        {/* Voile de lisibilité discret assurant un contraste WCAG AA permanent */}
        <div className="map-text-veil" aria-hidden="true" />

        {/* Label de section avec apparition en fondu à 3,4 s */}
        <p className="map-label">{label}</p>

        {/* Phrase complète pour les lecteurs d'écran */}
        <span className="sr-only">{accessibleSummary}</span>

        {/* Statistiques chiffrées avec compte fluide à 3,8 s */}
        <div className="map-stats-row">
          {/* 1. Collaborateurs */}
          <div className="map-stat-item">
            <div className="map-stat-number map-stat-number--wide">
              <AnimatedCounter
                target={statsValues.employees}
                play={isTriggered}
                delayMs={3800}
                durationMs={1200}
              />
            </div>
            <p className="map-stat-caption">{statsLabels.employees}</p>
          </div>

          {/* 2. Filiales */}
          <div className="map-stat-item">
            <div className="map-stat-number">
              <AnimatedCounter
                target={statsValues.subsidiaries}
                play={isTriggered}
                delayMs={3800}
                durationMs={1200}
              />
            </div>
            <p className="map-stat-caption">{statsLabels.subsidiaries}</p>
          </div>

          {/* 3. Pays */}
          <div className="map-stat-item">
            <div className="map-stat-number">
              <AnimatedCounter
                target={statsValues.countries}
                play={isTriggered}
                delayMs={3800}
                durationMs={1200}
              />
            </div>
            <p className="map-stat-caption">{statsLabels.countries}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorldMapInteractive;
