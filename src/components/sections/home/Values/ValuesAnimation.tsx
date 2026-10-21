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
          focusStyle="brackets"
          easing="smooth"
          order="sequential"
          blurAmount={5}
          focusScale={1}
          unfocusedOpacity={1}
          borderColor="#009ee0"
          cornerSize={16}
          borderWidth={3}
          animationDuration={0.5}
          pauseBetweenAnimations={1}
          highlightColor="#009ee0"
        />
      </h2>

      <div ref={paragraphRef} className="values-copy-wrap">
        <VariableProximity
          label={paragraph}
          className="values-copy"
          fromFontVariationSettings="'wght' 300, 'opsz' 9"
          toFontVariationSettings="'wght' 800, 'opsz' 40"
          containerRef={paragraphRef}
          radius={150}
          falloff="gaussian"
          smoothing={0.3}
          scale={1.22}
          lift={0.16}
          idleWave={false}
        />
      </div>
    </div>
  );
}
