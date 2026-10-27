'use client';

import { useRef } from 'react';
import TrueFocus from '@/components/animations/TrueFocus/TrueFocus';
import VariableProximity from '@/components/animations/VariableProximity/VariableProximity';

interface ValuesAnimationProps {
  statement: string;
  paragraph: string;
}

export function ValuesAnimation({ statement, paragraph }: ValuesAnimationProps) {
  const paragraphRef = useRef<HTMLDivElement>(null);

  return (
    <div className="values-animation">
      <h2 className="values-heading">
        <TrueFocus
          sentence={statement}
          focusStyle="underline"
          easing="smooth"
          order="sequential"
          blurAmount={0}
          focusScale={1}
          unfocusedOpacity={0.3}
          borderColor="#009FF0"
          borderWidth={2}
          animationDuration={0.6}
          pauseBetweenAnimations={1}
        />
      </h2>

      <span className="values-divider" aria-hidden="true" />

      <div ref={paragraphRef} className="values-description">
        <VariableProximity
          label={paragraph}
          className="values-description-text"
          fromFontVariationSettings="'wght' 300, 'opsz' 9"
          toFontVariationSettings="'wght' 600, 'opsz' 28"
          containerRef={paragraphRef}
          radius={150}
          falloff="gaussian"
          smoothing={0.3}
          scale={1.04}
          lift={0.04}
          idleWave={false}
        />
      </div>
    </div>
  );
}
