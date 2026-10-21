import React from 'react';
import './FadeIn.css';

export interface FadeInProps {
  /**
   * Contenu à révéler en fondu.
   */
  children: React.ReactNode;
  /**
   * Délai avant déclenchement en millisecondes (défaut : 0).
   */
  delay?: number;
  /**
   * Durée du fondu en millisecondes (défaut : 600).
   */
  duration?: number;
  /**
   * Classes CSS additionnelles.
   */
  className?: string;
  /**
   * Élément HTML sémantique cible (défaut : 'div').
   */
  as?: React.ElementType;
}

/**
 * FadeIn (Server Component, CSS pur)
 *
 * Applique une animation de fondu progressif sans dépendre de JavaScript.
 * Respecte les préférences de mouvement réduit (prefers-reduced-motion).
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 600,
  className = '',
  as: Component = 'div',
}: FadeInProps) {
  return (
    <Component
      className={`fade-in-container ${className}`.trim()}
      style={
        {
          '--fade-delay': `${delay}ms`,
          '--fade-duration': `${duration}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </Component>
  );
}

export default FadeIn;
