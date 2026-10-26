'use client';

import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Senegal } from './svg/Senegal';
import { World } from './svg/World';
import { PinSn } from './svg/PinSn';
import { PinsWorld } from './svg/PinsWorld';
import './world-map.css';

// Dimensions officielles du viewBox Figma partagé par les 4 exports
const VIEWBOX_WIDTH = 2329;
const VIEWBOX_HEIGHT = 1387;

// Valeurs de secours calculées précisément sur le centre géométrique du Sénégal
const DEFAULT_SENEGAL_CX = 918.2;
const DEFAULT_SENEGAL_CY = 617.0;

export interface WorldMapRevealProps {
  /**
   * Déclenche la séquence cinématique de la carte du monde.
   */
  play: boolean;
  /**
   * Libellé d'accessibilité décrivant la carte pour les technologies d'assistance.
   */
  ariaLabel?: string;
  /**
   * Classes CSS additionnelles pour le conteneur racine.
   */
  className?: string;
}

/**
 * WorldMapReveal ("use client")
 *
 * Carte du monde interactive animée en SVG en ligne et CSS pur.
 * Séquence :
 * - Zoom initial K sur le Sénégal centré au milieu de l'écran avec point pulsant
 * - Dessin du contour du Sénégal (stroke-dashoffset) puis remplissage
 * - Chute du pin Nicomatic Sénégal (#007eb3)
 * - Dézoom fluide vers la carte mondiale (scale K -> 1)
 * - Révélation en onde du reste du monde via masque radial
 * - Apparition échelonnée des 25 implantations mondiales par distance croissante au Sénégal
 */
export function WorldMapReveal({
  play,
  ariaLabel = 'Carte du monde des implantations Nicomatic',
  className = '',
}: WorldMapRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [senegalCenter, setSenegalCenter] = useState({
    cx: DEFAULT_SENEGAL_CX,
    cy: DEFAULT_SENEGAL_CY,
  });
  const [isReady, setIsReady] = useState(false);

  // useLayoutEffect pour mesurer getBBox et calculer les offsets avant tout affichage visuel
  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Calcul du centre géométrique réel du groupe Sénégal via getBBox
    let cx = DEFAULT_SENEGAL_CX;
    let cy = DEFAULT_SENEGAL_CY;

    const snElement = container.querySelector('.sn') as SVGGraphicsElement | null;
    if (snElement) {
      try {
        const bbox = snElement.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          cx = bbox.x + bbox.width / 2;
          cy = bbox.y + bbox.height / 2;
          setSenegalCenter({ cx, cy });
        }
      } catch {
        // En cas d'indisponibilité de getBBox, les valeurs de secours exactes sont conservées
      }
    }

    // 2. Facteur de zoom K : 2.5 sur desktop, 3.0 sur mobile (< 760px)
    const isMobile = window.innerWidth < 760;
    const K = isMobile ? 3.0 : 2.5;

    // 3. Calcul de la translation initiale pour centrer exactement le Sénégal au milieu (W/2, H/2)
    const tx0 = VIEWBOX_WIDTH / 2 - K * cx;
    const ty0 = VIEWBOX_HEIGHT / 2 - K * cy;

    container.style.setProperty('--k', String(K));
    container.style.setProperty('--tx0', `${tx0}px`);
    container.style.setProperty('--ty0', `${ty0}px`);
    container.style.setProperty('--cx', `${cx}px`);
    container.style.setProperty('--cy', `${cy}px`);

    // 4. Tri des 25 pins mondiaux par distance euclidienne croissante au Sénégal
    const pinsWorldGroup = container.querySelector('.pins-world');
    if (pinsWorldGroup) {
      const pinElements = Array.from(
        pinsWorldGroup.querySelectorAll('.pin-world-item')
      ) as SVGGraphicsElement[];

      const pinsWithDistance = pinElements.map((pin) => {
        let pinX = 0;
        let pinY = 0;
        try {
          const pBox = pin.getBBox();
          pinX = pBox.x + pBox.width / 2;
          pinY = pBox.y + pBox.height / 2;
        } catch {
          // Coordonnées de repli
        }
        const dist = Math.hypot(pinX - cx, pinY - cy);
        return { pin, dist };
      });

      pinsWithDistance.sort((a, b) => a.dist - b.dist);
      pinsWithDistance.forEach(({ pin }, index) => {
        pin.style.setProperty('--i', String(index));
      });
    }

    // 5. Activation de la classe "ready" pour autoriser l'affichage sans flash initial
    container.classList.add('ready');
    setIsReady(true);
  }, []);

  const containerClasses = [
    'world-map-container',
    isReady ? 'ready' : '',
    play ? 'play' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={containerRef} className={containerClasses}>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-label={ariaLabel}
        className="world-map-svg"
      >
        <defs>
          {/* Dégradé radial pour le masque de révélation progressive du monde */}
          <radialGradient
            id="worldRevealGradient"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0.75" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Masque positionné sur les dimensions complètes du viewBox */}
          <mask
            id="worldMask"
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
            style={{ maskType: 'alpha' }}
          >
            <circle
              className="reveal-circle"
              cx={senegalCenter.cx}
              cy={senegalCenter.cy}
              r={1600}
              fill="url(#worldRevealGradient)"
            />
          </mask>
        </defs>

        {/* Groupe caméra animé au dézoom */}
        <g className="camera">
          {/* Carte du monde masquée par l'onde */}
          <g className="world" mask="url(#worldMask)">
            <World />
          </g>

          {/* Tracé et remplissage du Sénégal */}
          <g className="sn">
            <Senegal />
          </g>

          {/* Pin officiel Nicomatic Sénégal */}
          <g className="pin-sn">
            <PinSn />
          </g>

          {/* 25 implantations mondiales */}
          <g className="pins-world">
            <PinsWorld />
          </g>
        </g>

        {/* Point de repère central au repos (W/2, H/2), non zoomé par la caméra */}
        <g className="start-dot">
          <circle
            className="start-dot-core"
            cx={VIEWBOX_WIDTH / 2}
            cy={VIEWBOX_HEIGHT / 2}
            r={3}
          />
          <circle
            className="start-dot-halo"
            cx={VIEWBOX_WIDTH / 2}
            cy={VIEWBOX_HEIGHT / 2}
            r={3}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={1}
          />
        </g>
      </svg>
    </div>
  );
}

export default WorldMapReveal;
