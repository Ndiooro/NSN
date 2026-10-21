import React from 'react';
import { getTranslations } from 'next-intl/server';
import { HeroBackground } from '@/components/animations/HeroBackground/HeroBackground';
import { BlurLines } from '@/components/animations/BlurLines/BlurLines';
import { DrawRule } from '@/components/animations/DrawRule/DrawRule';
import { FadeIn } from '@/components/animations/FadeIn/FadeIn';
import './Hero.css';

export interface HeroProps {
  /**
   * Sur-titre d'introduction (fourni via messages/*.json).
   */
  eyebrow?: string;
  /**
   * Lignes du titre h1 rendu avec BlurLines (fournies via messages/*.json).
   */
  titleLines?: string[];
  /**
   * Classes CSS additionnelles pour la section racine.
   */
  className?: string;
}

/**
 * Hero Section (Server Component)
 *
 * Section principale d'accueil pour Nicomatic Sénégal :
 * - Textes entièrement centrés avec typographie Helvetica Now Display
 * - Fond totalement blanc avec particules WebGL2 ou repli statique CSS
 * - Typographie animée en CSS pur sans dépendance JavaScript
 * - Voile de lisibilité discret assurant un contraste WCAG AA
 * - Prise en compte des encoches mobiles (safe-area-inset)
 */
export async function Hero({
  eyebrow: propEyebrow,
  titleLines: propTitleLines,
  className = '',
}: HeroProps) {
  // Récupération des traductions si non fournies explicitement en props
  const t = await getTranslations('Home.hero');
  const eyebrow = propEyebrow ?? t('eyebrow');
  const titleLines = propTitleLines ?? (t.raw('titleLines') as string[]);

  return (
    <section className={`hero-section ${className}`.trim()}>
      {/* Fond interactif WebGL / repli statique en arrière-plan (z-index: 0) */}
      <HeroBackground />

      {/* Conteneur principal du texte centré (z-index: 10) */}
      <div className="hero-content-wrapper">
        {/* Voile de lisibilité centré garantissant un contraste WCAG AA permanent */}
        <div className="hero-text-veil" aria-hidden="true" />

        {/* Sur-titre avec fondu pur CSS */}
        <FadeIn delay={300} duration={1000}>
          <p className="hero-eyebrow">{eyebrow}</p>
        </FadeIn>

        {/* Titre h1 animé en CSS pur ligne par ligne, centré */}
        <h1 className="hero-title">
          <BlurLines lines={titleLines} className="text-center" />
        </h1>

        {/* Trait de séparation animé sous le titre, centré */}
        <DrawRule delayMs={650} durationMs={900} align="center" className="mt-8" />
      </div>
    </section>
  );
}

export default Hero;
