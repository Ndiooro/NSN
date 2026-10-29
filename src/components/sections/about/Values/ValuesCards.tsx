"use client";

import { useEffect, useRef } from "react";
import { InView } from "@/components/animations/InView/InView";
import { ValueCard } from "@/components/animations/ValueCard/ValueCard";
import type { ValueId } from "./values-data";

export interface ValueCardContent {
  id: ValueId;
  number: string;
  title: string;
  lead: string;
  text: string;
  toggleLabel: string;
}

interface ValuesCardsProps {
  cards: ValueCardContent[];
}

export function ValuesCards({ cards }: ValuesCardsProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.dataset.jsActive = "true";
    }
  }, []);

  return (
    <div className="values__grid" ref={gridRef}>
      {cards.map((card, index) => (
        <InView
          as="div"
          className="values__card-reveal"
          threshold={0}
          triggerOffset={0.95}
          triggerIfAbove
          key={card.id}
        >
          <ValueCard {...card} index={index} />
        </InView>
      ))}
    </div>
  );
}
