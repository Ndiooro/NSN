import React from 'react';
import { getTranslations } from 'next-intl/server';
import { COMPANY_STATS } from '@/lib/company-stats';
import { WorldMapInteractive } from './WorldMapInteractive';
import './WorldMapSection.css';

export interface WorldMapSectionProps {
  className?: string;
}

/**
 * WorldMapSection (Server Component)
 *
 * Deuxième section de la page d'accueil : "Notre présence dans le monde".
 * - Fond dégradé vertical doux (var(--hero-bg2) -> var(--hero-bg1))
 * - Carte SVG responsive jusqu'à 1440 px de large
 * - Déclenchement unique de la séquence d'animation à mi-hauteur du viewport
 * - Statistiques de présence internationale (800 collaborateurs, 25 filiales, 22 pays)
 */
export async function WorldMapSection({ className = '' }: WorldMapSectionProps) {
  const t = await getTranslations('Home.map');

  const label = t('label');
  const aria = t('aria');
  const statsLabels = {
    employees: t('stats.employees'),
    subsidiaries: t('stats.subsidiaries'),
    countries: t('stats.countries'),
  };

  return (
    <section id="presence" className={`world-map-section ${className}`.trim()}>
      <WorldMapInteractive
        label={label}
        ariaLabel={aria}
        statsLabels={statsLabels}
        statsValues={COMPANY_STATS}
      />

      {/* Rendu de secours en l'absence de JavaScript */}
      <noscript>
        <style>{`
          .world-map-container { opacity: 1 !important; }
          .camera { transform: translate(0, 0) scale(1) !important; animation: none !important; }
          .world { mask: none !important; opacity: 1 !important; }
          .sn path { stroke-dashoffset: 0 !important; fill-opacity: 0.12 !important; animation: none !important; }
          .pin-sn, .pin-world-item { opacity: 1 !important; transform: none !important; animation: none !important; }
          .start-dot { display: none !important; }
          .map-label, .map-stats-row { opacity: 1 !important; animation: none !important; }
        `}</style>
      </noscript>
    </section>
  );
}

export default WorldMapSection;
