import React from 'react';
import './DrawRule.css';

export interface DrawRuleProps {
  /**
   * Délai avant le déclenchement de l'animation en millisecondes (défaut : 650).
   */
  delayMs?: number;
  /**
   * Durée de l'animation d'étirement en millisecondes (défaut : 900).
   */
  durationMs?: number;
  /**
   * Couleur du trait (défaut : 'var(--brand)').
   */
  color?: string;
  /**
   * Classes CSS additionnelles.
   */
  className?: string;
}

/**
 * DrawRule (Server Component, CSS pur)
 *
 * Trait horizontal de 2 px d'épaisseur, largeur min(200px, 40%), couleur var(--brand).
 * S'étire de scaleX 0 à 1 depuis la gauche en 0,9 s avec un délai configurable (650 ms par défaut).
 *
 * N'utilise aucun JavaScript et respecte les préférences de mouvement réduit.
 */
export function DrawRule({
  delayMs = 650,
  durationMs = 900,
  color = 'var(--brand)',
  className = '',
}: DrawRuleProps) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ overflow: 'hidden' }}
    >
      <span
        className="draw-rule-line"
        style={
          {
            '--rule-delay': `${delayMs}ms`,
            '--rule-duration': `${durationMs}ms`,
            '--rule-color': color,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

export default DrawRule;
