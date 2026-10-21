'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import './HeroBackground.css';

// Import dynamique côté client sans SSR
const Antigravity = dynamic(
  () => import('../Antigravity/Antigravity'),
  { ssr: false }
);

/**
 * Détecte la disponibilité de WebGL2 avec un canvas jetable libéré immédiatement.
 */
function isWebGL2Available(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2');
    if (!gl) return false;
    const loseContext = gl.getExtension('WEBGL_lose_context');
    if (loseContext) {
      loseContext.loseContext();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Évalue si le repli statique doit être utilisé.
 * Conditions : prefers-reduced-motion, navigator.connection.saveData, ou absence de WebGL2.
 */
function shouldUseStaticFallback(): boolean {
  if (typeof window === 'undefined') return true;

  // 1. Détection de la préférence de mouvement réduit
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotionQuery && reducedMotionQuery.matches) {
    return true;
  }

  // 2. Détection du mode économie de données
  const nav = navigator as unknown as { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData === true) {
    return true;
  }

  // 3. Détection de WebGL2
  if (!isWebGL2Available()) {
    return true;
  }

  return false;
}

export interface HeroBackgroundProps {
  className?: string;
}

/**
 * HeroBackground ("use client")
 *
 * Enveloppe le composant WebGL2 Antigravity avec :
 * - Fond de repli totalement blanc (zéro CLS)
 * - Montage différé après le premier affichage (requestIdleCallback ou repli setTimeout 300 ms)
 * - Fondu d'apparition du canvas (0 -> 1 en 1,2 s)
 * - Adaptation de la densité de particules pour mobile / tactile (700 au lieu de 1500)
 * - Nuances de bleu officielles tirées de reference/colors.png
 * - Repli statique (motif de points CSS sans aucun contexte WebGL ni animation)
 */
export function HeroBackground({ className = '' }: HeroBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [particleCount, setParticleCount] = useState(1500);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Montage différé via requestIdleCallback (repli setTimeout 300 ms)
    const handleMount = () => {
      // 1. Vérification des conditions de repli statique
      if (shouldUseStaticFallback()) {
        setUseFallback(true);
        return;
      }

      // 2. Calcul de la densité de particules pour mobile / écran tactile
      const isMobileWidth = window.innerWidth < 760;
      const isTouchDevice =
        window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      setParticleCount(isMobileWidth || isTouchDevice ? 700 : 1500);

      // 3. Déclenchement du montage du composant Antigravity
      setMounted(true);
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(handleMount, { timeout: 1000 });
    } else {
      timeoutId = setTimeout(handleMount, 300);
    }

    return () => {
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`hero-background-container ${className}`.trim()}
    >
      {/* Repli statique : motif de points en CSS masqué par un dégradé radial */}
      {useFallback && <div className="hero-background-static-dots" />}

      {/* Montage différé et fondu du canvas WebGL */}
      {!useFallback && mounted && (
        <div
          className="hero-background-canvas-wrap"
          style={{
            opacity: mounted ? 1 : 0,
          }}
        >
          <Antigravity
            colors={['#009ee0', '#4cbbe9', '#80cfef', '#b2e2f6']}
            count={particleCount}
            magnetRadius={4.5}
            ringRadius={4}
            particleSize={0.65}
            particleVariance={0.25}
            particleShape="sphere"
            fieldStrength={25}
            waveAmplitude={0.6}
            rotationSpeed={1.2}
            autoAnimate={true}
            lightMode
            maxDevicePixelRatio={1.5}
          />
        </div>
      )}
    </div>
  );
}

export default HeroBackground;
