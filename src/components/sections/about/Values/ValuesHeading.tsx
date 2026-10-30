"use client";

import { BlurLines } from "@/components/animations/BlurLines/BlurLines";
import { DrawRule } from "@/components/animations/DrawRule/DrawRule";
import { InView } from "@/components/animations/InView/InView";

interface ValuesHeadingProps {
  title: string;
}

export function ValuesHeading({ title }: ValuesHeadingProps) {
  return (
    <InView
      as="div"
      className="values__heading-reveal"
      threshold={0}
      triggerOffset={0.8}
      triggerIfAbove
    >
      {(isInView) => (
        <>
          <h2 className="values__heading">
            <BlurLines lines={[title]} active={isInView} />
          </h2>
         
        </>
      )}
    </InView>
  );
}
