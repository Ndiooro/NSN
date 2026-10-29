"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import "./ValueCard.css";

export interface ValueCardProps {
  number: string;
  title: string;
  lead: string;
  text: string;
  toggleLabel: string;
  index: number;
}

export function ValueCard({
  number,
  title,
  lead,
  text,
  toggleLabel,
  index,
}: ValueCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const backId = `value-card-${number}-back`;

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    backRef.current?.toggleAttribute("aria-hidden", !isOpen);
  }, [isOpen]);

  const resetTilt = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (tiltRef.current) {
      tiltRef.current.style.setProperty("--rx", "0deg");
      tiltRef.current.style.setProperty("--ry", "0deg");
      tiltRef.current.removeAttribute("data-tilting");
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const pointerX = event.clientX;
    const pointerY = event.clientY;
    if (frameRef.current !== null) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const card = cardRef.current;
      const tilt = tiltRef.current;
      if (!card || !tilt) return;

      const bounds = card.getBoundingClientRect();
      const x = Math.max(
        -1,
        Math.min(1, ((pointerX - bounds.left) / bounds.width) * 2 - 1),
      );
      const y = Math.max(
        -1,
        Math.min(1, ((pointerY - bounds.top) / bounds.height) * 2 - 1),
      );
      const limit = isOpen ? 2 : 6;

      tilt.style.setProperty("--rx", `${-y * limit}deg`);
      tilt.style.setProperty("--ry", `${x * limit}deg`);
      tilt.setAttribute("data-tilting", "true");
    });
  };

  const closeOnEscape = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      resetTilt();
    }
  };

  return (
    <article
      className="vcard"
      data-open={isOpen}
      ref={cardRef}
      style={{ "--card-index": index } as CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div
        className="vcard__tilt"
        ref={tiltRef}
        onTransitionEnd={(event) => {
          if (event.propertyName === "transform" && isOpen) {
            tiltRef.current?.style.setProperty("--rx", "0deg");
            tiltRef.current?.style.setProperty("--ry", "0deg");
          }
        }}
      >
        <div className="vcard__flip">
          <div className="vcard__face vcard__front">
            <span className="vcard__number">{number}</span>
            <div className="vcard__front-bottom">
              <h3 className="vcard__title">{title}</h3>
              <span className="vcard__underline" aria-hidden="true" />
              <span className="vcard__indicator" aria-hidden="true">
                <span>+</span>
              </span>
            </div>
          </div>
          <div className="vcard__face vcard__back" id={backId} ref={backRef}>
            <p className="vcard__lead">{lead}</p>
            <p className="vcard__text">{text}</p>
            <span className="vcard__indicator" aria-hidden="true">
              ×
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="vcard__hit"
        aria-expanded={isOpen}
        aria-controls={backId}
        onClick={() => {
          if (!isOpen) resetTilt();
          setIsOpen((open) => !open);
        }}
        onKeyDown={closeOnEscape}
      >
        <span className="sr-only">
          {toggleLabel}: {title}
        </span>
      </button>
    </article>
  );
}
