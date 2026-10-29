import type { ComponentType, SVGProps } from "react";
import { ChablaisSvg } from "./svg/ChablaisSvg";
import { FactorySvg } from "./svg/FactorySvg";
import { SenegalSvg } from "./svg/SenegalSvg";

export interface StorytellingStep {
  id: string;
  year: number;
  from: number;
  svg: ComponentType<SVGProps<SVGSVGElement>>;
  align: "left" | "right";
  titleKey: string;
  descriptionKey: string;
}

export const storytellingSteps: StorytellingStep[] = [
  {
    id: "1976",
    year: 1976,
    from: 1900,
    svg: ChablaisSvg,
    align: "left",
    titleKey: "steps.1976.title",
    descriptionKey: "steps.1976.description",
  },
  {
    id: "2022",
    year: 2022,
    from: 1976,
    svg: SenegalSvg,
    align: "right",
    titleKey: "steps.2022.title",
    descriptionKey: "steps.2022.description",
  },
  {
    id: "2024",
    year: 2024,
    from: 2022,
    svg: FactorySvg,
    align: "left",
    titleKey: "steps.2024.title",
    descriptionKey: "steps.2024.description",
  },
];
