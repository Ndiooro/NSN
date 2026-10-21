import React, { Fragment } from 'react';
import './BlurLines.css';

export interface BlurLinesProps {
  /**
   * Tableau de lignes de texte à afficher avec animation progressive.
   */
  lines: string[];
  /**
   * Classes CSS additionnelles pour le conteneur racine.
   */
  className?: string;
  /**
   * Décalage d'apparition entre deux lignes consécutives en ms (défaut : 140).
   */
  staggerMs?: number;
  /**
   * Durée personnalisée de l'animation (défaut : 'var(--dur-slow)').
   */
  duration?: string;
}

/**
 * BlurLines (Server Component, CSS pur)
 *
 * Affiche chaque ligne dans un <span> en display: block.
 * Chaque ligne passe de opacity 0 + blur(10px) + letter-spacing .02em à nette
 * (opacity 1, blur 0, letter-spacing -.02em).
 *
 * Utilise la variable CSS --i pour échelonner l'animation.
 * Insère une espace dans le DOM pour la continuité de lecture par les technologies d'assistance.
 */
export function BlurLines({
  lines,
  className = '',
  staggerMs = 140,
  duration = 'var(--dur-slow)',
}: BlurLinesProps) {
  if (!lines || lines.length === 0) return null;

  return (
    <span className={className ? `inline ${className}` : 'inline'}>
      {lines.map((line, index) => (
        <Fragment key={index}>
          <span
            className="blur-line-item"
            style={
              {
                display: 'block',
                '--i': index,
                '--stagger-delay': `${staggerMs}ms`,
                '--line-duration': duration,
              } as React.CSSProperties
            }
          >
            {line}
          </span>
          {/* Espace dans le DOM pour garantir qu'une seule phrase continue soit lue par les lecteurs d'écran */}
          {index < lines.length - 1 && <span className="sr-only">{' '}</span>}
        </Fragment>
      ))}
    </span>
  );
}

export default BlurLines;
