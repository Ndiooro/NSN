import type { CSSProperties } from "react";
import { InView } from "@/components/animations/InView/InView";
import "./DateRoller.css";

interface DateRollerProps {
  from: number;
  to: number;
  duration?: number;
  stagger?: number;
}

export function DateRoller({
  from,
  to,
  duration = 1200,
  stagger = 90,
}: DateRollerProps) {
  const startDigits = String(from).padStart(4, "0");
  const endDigits = String(to).padStart(4, "0");

  return (
    <>
      <span className="sr-only">{to}</span>
      <InView
        as="span"
        className="date-roller"
        threshold={0}
        triggerOffset={0.6}
        triggerIfAbove
      >
        <span className="date-roller__visual" aria-hidden="true">
          {endDigits.split("").map((digit, index) => {
            const start = Number(startDigits[index]);
            const target = Number(digit);
            const end = target < start ? target + 10 : target;

            return (
              <span className="date-roller__window" key={`${index}-${digit}`}>
                <span
                  className="date-roller__strip"
                  style={
                    {
                      "--start-offset": `${-start}em`,
                      "--end-offset": `${-end}em`,
                      "--roller-duration": `${duration}ms`,
                      "--roller-delay": `${index * stagger}ms`,
                    } as CSSProperties
                  }
                >
                  {Array.from({ length: 20 }, (_, value) => (
                    <span className="date-roller__digit" key={value}>
                      {value % 10}
                    </span>
                  ))}
                </span>
              </span>
            );
          })}
        </span>
      </InView>
    </>
  );
}
