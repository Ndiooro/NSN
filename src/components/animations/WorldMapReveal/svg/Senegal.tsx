import React from 'react';

/**
 * Senegal SVG Component
 * Contour du Sénégal pour l'animation de tracé progressif.
 * pathLength={1} est injecté sur chaque tracé pour le pilotage CSS (stroke-dashoffset).
 */
export function Senegal() {
  return (
    <>
      <path
        d="m901.5 622.9 1-3.7 7.8-.1 1.6-2 2.3-.2 2.8 2h2.2l2.4-1.2 1.4 2.3-3.2 1.9-3-.3-3.1-1.6-2.7 1.9h-1.2L908 623z"
        pathLength={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m935 611 .3 5 1.4 4.7 2.5 2.3.7 3-.4 2.6-1 .5-4-.6-.5.9h-1.5l-5.2-1.8-3.4-.1-13.3-.4-1.9 1-2.4-.3-3.8 1.3-1-6.2 6.5.1 1.8-1.1h1.2l2.7-2 3 1.7 3 .3 3.3-2-1.4-2.2-2.4 1.2H917l-2.8-2-2.3.1-1.6 2-7.8.2-3-6.4-3.3-2.7 3.1-1.7 3.6-5.7 1.8-4.2 2.5-2.5 3.4.6 3.6-1.8h4l3.4 2.3 4.5 2.2 4.4 6z"
        pathLength={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

export default Senegal;
