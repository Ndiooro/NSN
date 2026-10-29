"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { smoothstep } from "@/lib/smoothstep";

interface ScrollTimelineProps {
  children: ReactNode;
}

interface AnchorMeasure {
  anchor: HTMLElement;
  offset: number;
  placeholder: HTMLElement;
}

interface DrawMeasure {
  element: HTMLElement;
  height: number;
  offset: number;
  progress: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function ScrollTimeline({ children }: ScrollTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      container.dataset.motionReduced = "true";
      return;
    }

    const runner = container.querySelector<HTMLElement>("[data-runner]");
    const railProgress = container.querySelector<HTMLElement>(
      "[data-rail-progress]",
    );
    if (!runner || !railProgress) return;

    container.dataset.jsActive = "true";

    const anchors = Array.from(
      container.querySelectorAll<HTMLElement>("[data-anchor]"),
    );
    const anchorMeasures: AnchorMeasure[] = [];
    anchors.forEach((anchor) => {
      const placeholder = container.querySelector<HTMLElement>(
        `[data-placeholder="${anchor.dataset.anchor}"]`,
      );
      if (placeholder) {
        anchorMeasures.push({ anchor, offset: 0, placeholder });
      }
    });
    const drawMeasures: DrawMeasure[] = Array.from(
      container.querySelectorAll<HTMLElement>("[data-draw]"),
    ).map((element) => ({ element, height: 0, offset: 0, progress: 0 }));

    let containerHeight = 0;
    let runnerY = 0;
    let frameId: number | null = null;
    let isNearViewport = false;
    let dockedIndex: number | null = null;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      containerHeight = containerRect.height;
      anchorMeasures.forEach((item) => {
        const anchorRect = item.anchor.getBoundingClientRect();
        item.offset =
          anchorRect.top - containerRect.top + anchorRect.height * 0.5;
      });
      drawMeasures.forEach((item) => {
        const rect = item.element.getBoundingClientRect();
        item.offset = rect.top - containerRect.top;
        item.height = rect.height;
        item.progress = 0;
        item.element.style.setProperty("--p", "0");
      });
      runnerY = clamp(runnerY, 0, containerHeight);
    };

    const stopFrame = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const update = () => {
      frameId = null;
      if (!isNearViewport || anchorMeasures.length === 0) return;

      const containerTop = container.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;
      const follow = viewportHeight * 0.5 - containerTop;
      let closestIndex = 0;

      for (let index = 1; index < anchorMeasures.length; index += 1) {
        if (
          Math.abs(follow - anchorMeasures[index].offset) <
          Math.abs(follow - anchorMeasures[closestIndex].offset)
        ) {
          closestIndex = index;
        }
      }

      const closestAnchor = anchorMeasures[closestIndex].offset;
      const distance = Math.abs(follow - closestAnchor);
      const dockingRadius = viewportHeight * 0.2;
      const blend = smoothstep(0, 1, Math.min(distance / dockingRadius, 1));
      const targetY = clamp(
        closestAnchor + (follow - closestAnchor) * blend,
        0,
        containerHeight,
      );
      runnerY += (targetY - runnerY) * 0.18;

      const shouldDock = distance < dockingRadius * 0.35;
      if (shouldDock && dockedIndex !== closestIndex) {
        dockedIndex = closestIndex;
        runner.dataset.docked = "true";
        runner.dataset.halo = "true";
        anchorMeasures.forEach((item, index) => {
          item.placeholder.toggleAttribute(
            "data-filled",
            index === dockedIndex,
          );
        });
      } else if (!shouldDock && dockedIndex !== null) {
        dockedIndex = null;
        delete runner.dataset.docked;
        delete runner.dataset.halo;
        anchorMeasures.forEach((item) => {
          item.placeholder.removeAttribute("data-filled");
        });
      }

      runner.style.setProperty("--runner-y", `${runnerY}px`);
      railProgress.style.transform = `scaleY(${clamp(
        runnerY / Math.max(containerHeight, 1),
        0,
        1,
      )})`;

      let settling = Math.abs(targetY - runnerY) >= 0.1;
      drawMeasures.forEach((item) => {
        const top = containerTop + item.offset;
        const denominator = viewportHeight * 0.4 + item.height * 0.5;
        const target = clamp(
          (viewportHeight * 0.85 - top) / Math.max(denominator, 1),
          0,
          1,
        );
        item.progress += (target - item.progress) * 0.18;
        item.element.style.setProperty("--p", `${item.progress}`);
        if (Math.abs(target - item.progress) >= 0.001) settling = true;
      });

      if (settling) {
        frameId = requestAnimationFrame(update);
      }
    };

    const schedule = () => {
      if (isNearViewport && frameId === null) {
        frameId = requestAnimationFrame(update);
      }
    };

    const onScroll = () => schedule();
    const activate = () => {
      if (isNearViewport) return;
      isNearViewport = true;
      measure();
      window.addEventListener("scroll", onScroll, { passive: true });
      schedule();
    };
    const deactivate = () => {
      if (!isNearViewport) return;
      isNearViewport = false;
      window.removeEventListener("scroll", onScroll);
      stopFrame();
    };

    measure();

    let disposed = false;
    void document.fonts.ready.then(() => {
      if (!disposed) {
        measure();
        schedule();
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      measure();
      schedule();
    });
    resizeObserver.observe(container);
    container.querySelectorAll("[data-step]").forEach((step) => {
      resizeObserver.observe(step);
    });

    let visibilityObserver: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) activate();
          else deactivate();
        },
        { rootMargin: "200px 0px" },
      );
      visibilityObserver.observe(container);
    } else {
      activate();
    }

    return () => {
      disposed = true;
      deactivate();
      resizeObserver.disconnect();
      visibilityObserver?.disconnect();
    };
  }, []);

  return (
    <div className="story-timeline" ref={containerRef} data-scroll-timeline>
      <div className="story-timeline__rail" aria-hidden="true">
        <span className="story-timeline__rail-progress" data-rail-progress />
      </div>
      <div className="story-timeline__runner" data-runner aria-hidden="true">
        <span className="story-timeline__halo" />
      </div>
      {children}
    </div>
  );
}
