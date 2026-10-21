'use client';

import React, { type ReactNode, type ElementType } from 'react';
import { useInView } from '@/lib/useInView';

export interface InViewProps {
  /**
   * Contenu enfant ou fonction recevant l'état booléen isInView.
   */
  children: ReactNode | ((isInView: boolean) => ReactNode);
  /**
   * Seuil de visibilité (défaut : 0.35).
   */
  threshold?: number;
  /**
   * Animation déclenchée une seule fois (défaut : true).
   */
  triggerOnce?: boolean;
  /**
   * Classes CSS additionnelles.
   */
  className?: string;
  /**
   * Élément sémantique conteneur (défaut : 'div').
   */
  as?: ElementType;
}

/**
 * InView (Composant Client d'observation de visibilité au scroll)
 * Conforme aux règles d'architecture : seuil 0.35, une seule fois.
 */
export function InView({
  children,
  threshold = 0.35,
  triggerOnce = true,
  className = '',
  as: Component = 'div',
}: InViewProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold, triggerOnce });

  return (
    <Component
      ref={ref}
      className={`${className} ${inView ? 'is-in-view' : ''}`.trim()}
      data-inview={inView ? 'true' : 'false'}
    >
      {typeof children === 'function' ? children(inView) : children}
    </Component>
  );
}

export default InView;
