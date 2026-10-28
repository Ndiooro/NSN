"use client";

import { useEffect, useRef, useState } from "react";
import "./ParticleTitle.css";

interface ParticleTitleProps {
  text: string;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  normalizedX: number;
  randomA: number;
  color: number;
  radius: number;
  opacity: number;
}

interface Glyph {
  text: string;
  x: number;
  top: number;
  baseline: number;
}

interface SampledTitle {
  particles: Particle[];
  glyphs: Glyph[];
}

interface TextLine {
  top: number;
  glyphs: Glyph[];
}

type TitleMode = "pending" | "canvas" | "static";
type AnimationPhase = "pre" | "gathering" | "rest";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

const INTRO_DELAY_MS = 500;
const TRAVEL_DURATION_MS = 1800;
const RESIZE_DEBOUNCE_MS = 100;
const PARTICLE_SEED = 0x4a3b2c1d;

function clearCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  dpr: number,
) {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function easeInOut(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2;
}

function sampleTitle(
  heading: HTMLHeadingElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  dpr: number,
  particleColors: string[],
): SampledTitle | null {
  const rect = heading.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const width = Math.ceil(rect.width * dpr);
  const height = Math.ceil(rect.height * dpr);
  canvas.width = width;
  canvas.height = height;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  clearCanvas(canvas, context, dpr);

  const textNode = Array.from(heading.childNodes).find(
    (node): node is Text => node.nodeType === Node.TEXT_NODE,
  );
  if (!textNode) return null;

  const computed = getComputedStyle(heading);
  const fontSize = Number.parseFloat(computed.fontSize);
  context.font = `${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`;
  context.textBaseline = "alphabetic";
  const typographyContext = context as CanvasRenderingContext2D & {
    letterSpacing?: string;
    fontKerning?: string;
  };
  typographyContext.letterSpacing = computed.letterSpacing;
  typographyContext.fontKerning = "normal";

  const range = document.createRange();
  const lines: TextLine[] = [];
  const text = textNode.data;

  for (let index = 0; index < text.length;) {
    const codePoint = String.fromCodePoint(text.codePointAt(index) ?? 0);
    const nextIndex = index + codePoint.length;
    if (!/\s/u.test(codePoint)) {
      range.setStart(textNode, index);
      range.setEnd(textNode, nextIndex);
      const characterRect = range.getBoundingClientRect();
      const top = characterRect.top - rect.top;
      let line = lines.find((candidate) => Math.abs(candidate.top - top) <= 1);
      if (!line) {
        line = { top, glyphs: [] };
        lines.push(line);
      }
      line.glyphs.push({
        text: codePoint,
        x: characterRect.left - rect.left,
        top,
        baseline: 0,
      });
    }
    index = nextIndex;
  }
  range.detach();
  if (lines.length === 0) return null;

  const glyphs: Glyph[] = [];
  context.fillStyle = particleColors[0];
  for (const line of lines) {
    const lineText = line.glyphs.map((glyph) => glyph.text).join("");
    const metrics = context.measureText(lineText);
    const ascent = metrics.fontBoundingBoxAscent ?? fontSize * 0.8;
    const baseline = line.top + ascent;
    for (const glyph of line.glyphs) {
      glyph.baseline = baseline;
      context.fillText(glyph.text, glyph.x, baseline);
      glyphs.push(glyph);
    }
  }

  const image = context.getImageData(0, 0, width, height);
  const maxParticles = window.innerWidth < 760 ? 1800 : 3500;
  let samplingStep = Math.max(2, Math.ceil(dpr * 3.1));
  let samples: Array<{ x: number; y: number }> = [];

  do {
    samples = [];
    for (let cellY = 0; cellY < height; cellY += samplingStep) {
      const cellHeight = Math.min(samplingStep, height - cellY);
      for (let cellX = 0; cellX < width; cellX += samplingStep) {
        const cellWidth = Math.min(samplingStep, width - cellX);
        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;

        for (let y = cellY; y < cellY + cellHeight; y += 1) {
          for (let x = cellX; x < cellX + cellWidth; x += 1) {
            const alpha = image.data[(y * width + x) * 4 + 3];
            if (alpha <= 80) continue;

            totalWeight += alpha;
            weightedX += (x + 0.5) * alpha;
            weightedY += (y + 0.5) * alpha;
          }
        }

        if (totalWeight > 0) {
          samples.push({
            x: weightedX / totalWeight / dpr,
            y: weightedY / totalWeight / dpr,
          });
        }
      }
    }
    if (samples.length > maxParticles) samplingStep += 1;
  } while (samples.length > maxParticles);

  if (samples.length === 0) return null;

  const bounds = samples.reduce(
    (current, sample) => ({
      minX: Math.min(current.minX, sample.x),
      maxX: Math.max(current.maxX, sample.x),
      minY: Math.min(current.minY, sample.y),
      maxY: Math.max(current.maxY, sample.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
  const random = createRng(PARTICLE_SEED);
  const particleRadius = Math.max(1.1, (samplingStep / dpr) * 0.36);
  const particles = samples.map((sample) => {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random());
    const startX =
      rect.width / 2 + Math.cos(angle) * rect.width * 0.42 * radius;
    const startY =
      rect.height / 2 + Math.sin(angle) * rect.height * 0.34 * radius;
    const randomA = random();
    const colorRoll = random();

    return {
      x: startX,
      y: startY,
      targetX: sample.x,
      targetY: sample.y,
      startX,
      startY,
      normalizedX:
        (sample.x - bounds.minX) / Math.max(1, bounds.maxX - bounds.minX),
      randomA,
      color: colorRoll < 0.6 ? 0 : colorRoll < 0.85 ? 1 : 2,
      radius: particleRadius,
      opacity: 0,
    };
  });

  clearCanvas(canvas, context, dpr);
  return { particles, glyphs };
}

export function ParticleTitle({ text }: ParticleTitleProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampledTitleRef = useRef<SampledTitle | null>(null);
  const [mode, setMode] = useState<TitleMode>("pending");

  useEffect(() => {
    const heading = headingRef.current;
    const canvas = canvasRef.current;
    if (!heading || !canvas) {
      setMode("static");
      return;
    }

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const connection = (navigator as NavigatorWithConnection).connection;
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      setMode("static");
    }, 3000);

    const fallback = (message?: string, error?: unknown) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (message) console.warn(message, error);
      setMode("static");
    };

    const enforceStaticPreference = () => {
      if (motionPreference.matches || connection?.saveData) {
        if (settled) {
          setMode("static");
        } else {
          fallback();
        }
      }
    };
    motionPreference.addEventListener("change", enforceStaticPreference);
    enforceStaticPreference();

    if (!settled) {
      void (async () => {
        try {
          await document.fonts.ready;
          if (settled) return;

          let context: CanvasRenderingContext2D | null;
          try {
            context = canvas.getContext("2d", { willReadFrequently: true });
          } catch (error) {
            fallback(
              "ParticleTitle could not access a 2D canvas; showing plain text.",
              error,
            );
            return;
          }

          if (!context) {
            fallback(
              "ParticleTitle has no 2D canvas context; showing plain text.",
            );
            return;
          }

          const rootStyles = getComputedStyle(document.documentElement);
          const particleColors = [
            rootStyles.getPropertyValue("--brand-deep").trim() || "#075a85",
            rootStyles.getPropertyValue("--ink-deep").trim() || "#0b2233",
            rootStyles.getPropertyValue("--brand-strong").trim() || "#0a7fb8",
          ];
          const sampled = sampleTitle(
            heading,
            canvas,
            context,
            Math.min(window.devicePixelRatio || 1, 2),
            particleColors,
          );
          if (!sampled) {
            fallback("ParticleTitle sampled no glyphs; showing plain text.");
            return;
          }

          sampledTitleRef.current = sampled;
          settled = true;
          window.clearTimeout(timeoutId);
          setMode("canvas");
        } catch (error) {
          fallback(
            "ParticleTitle could not sample its heading; showing plain text.",
            error,
          );
        }
      })();
    }

    return () => {
      settled = true;
      window.clearTimeout(timeoutId);
      motionPreference.removeEventListener("change", enforceStaticPreference);
    };
  }, []);

  useEffect(() => {
    if (mode !== "canvas") return;

    const heading = headingRef.current;
    const canvas = canvasRef.current;
    if (!heading || !canvas) {
      console.error("ParticleTitle canvas mount failed; showing plain text.");
      window.setTimeout(() => setMode("static"), 0);
      return;
    }

    let context: CanvasRenderingContext2D | null;
    try {
      context = canvas.getContext("2d", { willReadFrequently: true });
    } catch (error) {
      console.error("ParticleTitle could not initialize its canvas.", error);
      window.setTimeout(() => setMode("static"), 0);
      return;
    }
    if (!context) {
      console.error("ParticleTitle canvas context is unavailable.");
      window.setTimeout(() => setMode("static"), 0);
      return;
    }

    let cancelled = false;
    let phase: AnimationPhase = "pre";
    let phaseStart: number | null = null;
    let pausedAt: number | null = null;
    let frameId: number | null = null;
    let introTimer: number | null = null;
    let introDeadline: number | null = null;
    let introRemaining = INTRO_DELAY_MS;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let particles: Particle[] = [];
    let glyphs: Glyph[] = [];
    let maxDelay = 0;
    let plans: Array<{ delay: number; bend: number }> = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rootStyles = getComputedStyle(document.documentElement);
    const particleColors = [
      rootStyles.getPropertyValue("--brand-deep").trim() || "#075a85",
      rootStyles.getPropertyValue("--ink-deep").trim() || "#0b2233",
      rootStyles.getPropertyValue("--brand-strong").trim() || "#0a7fb8",
    ];
    const debugMode =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).get("debug") === "particles";
    let inView = !("IntersectionObserver" in window);
    let active = document.visibilityState !== "hidden" && inView;

    const drawParticles = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      clearCanvas(canvas, context, dpr);
      if (debugMode) {
        context.fillStyle = "rgba(255, 0, 0, 0.4)";
        for (const glyph of glyphs) {
          context.fillText(glyph.text, glyph.x, glyph.baseline);
        }
      }

      const opacitySteps = 10;
      const buckets = particleColors.map(() =>
        Array.from({ length: opacitySteps }, () => [] as Particle[]),
      );
      for (const particle of particles) {
        if (particle.opacity <= 0) continue;
        const opacityIndex = Math.min(
          opacitySteps - 1,
          Math.floor(particle.opacity * opacitySteps),
        );
        buckets[particle.color][opacityIndex].push(particle);
      }

      for (
        let colorIndex = 0;
        colorIndex < particleColors.length;
        colorIndex += 1
      ) {
        for (
          let opacityIndex = 0;
          opacityIndex < opacitySteps;
          opacityIndex += 1
        ) {
          const bucket = buckets[colorIndex][opacityIndex];
          if (bucket.length === 0) continue;
          context.beginPath();
          for (const particle of bucket) {
            context.moveTo(particle.x + particle.radius, particle.y);
            context.arc(
              particle.x,
              particle.y,
              particle.radius,
              0,
              Math.PI * 2,
            );
          }
          context.fillStyle = particleColors[colorIndex];
          context.globalAlpha = (opacityIndex + 1) / opacitySteps;
          context.fill();
        }
      }
      context.globalAlpha = 1;
    };

    const scheduleFrame = () => {
      if (active && frameId === null && phase === "gathering") {
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    const renderFrame = (now: number) => {
      frameId = null;
      if (
        !active ||
        cancelled ||
        phase !== "gathering" ||
        phaseStart === null
      ) {
        return;
      }

      const progress = Math.min(1, (now - phaseStart) / TRAVEL_DURATION_MS);
      const spread = 0.55;
      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const plan = plans[index];
        const delayProgress = maxDelay === 0 ? 0 : plan.delay / maxDelay;
        const localProgress = Math.min(
          1,
          Math.max(0, (progress - delayProgress * spread) / (1 - spread)),
        );
        const eased = easeInOut(localProgress);
        const deltaX = particle.targetX - particle.startX;
        const deltaY = particle.targetY - particle.startY;
        const distance = Math.hypot(deltaX, deltaY) || 1;
        const curve = Math.sin(eased * Math.PI) * plan.bend;
        particle.x =
          particle.startX + deltaX * eased - (deltaY / distance) * curve;
        particle.y =
          particle.startY + deltaY * eased + (deltaX / distance) * curve;
        particle.opacity = localProgress;
      }

      if (progress === 1) {
        phase = "rest";
        phaseStart = null;
        for (const particle of particles) {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.opacity = 1;
        }
      }
      drawParticles();
      if (phase === "gathering") scheduleFrame();
    };

    const scheduleIntro = () => {
      if (!active || phase !== "pre" || introTimer !== null) return;
      introDeadline = performance.now() + introRemaining;
      introTimer = window.setTimeout(() => {
        introTimer = null;
        introDeadline = null;
        introRemaining = 0;
        if (cancelled || !active) return;
        phase = "gathering";
        phaseStart = performance.now();
        scheduleFrame();
      }, introRemaining);
    };

    const pauseIntro = (now: number) => {
      if (introTimer === null || introDeadline === null) return;
      introRemaining = Math.max(0, introDeadline - now);
      window.clearTimeout(introTimer);
      introTimer = null;
      introDeadline = null;
    };

    const updateActiveState = () => {
      const nextActive = inView && document.visibilityState !== "hidden";
      if (nextActive === active) return;
      active = nextActive;
      const now = performance.now();

      if (!active) {
        if (phaseStart !== null) pausedAt = now;
        pauseIntro(now);
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
          frameId = null;
        }
        return;
      }

      if (pausedAt !== null && phaseStart !== null) {
        phaseStart += now - pausedAt;
        pausedAt = null;
      }
      scheduleIntro();
      scheduleFrame();
    };

    const onVisibilityChange = () => updateActiveState();
    document.addEventListener("visibilitychange", onVisibilityChange);

    const intersectionObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            if (!entry) return;
            inView = entry.isIntersecting;
            updateActiveState();
          })
        : null;
    intersectionObserver?.observe(heading);

    const rebuildParticles = () => {
      const sampled = sampleTitle(
        heading,
        canvas,
        context,
        dpr,
        particleColors,
      );
      if (!sampled) {
        throw new Error("The resized heading produced no particles.");
      }

      particles = sampled.particles;
      glyphs = sampled.glyphs;
      plans = particles.map((particle) => ({
        delay: particle.normalizedX,
        bend: (particle.randomA - 0.5) * 30,
      }));
      maxDelay = plans.reduce(
        (maximum, plan) => Math.max(maximum, plan.delay),
        0,
      );

      if (phase === "rest") {
        for (const particle of particles) {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.opacity = 1;
        }
        drawParticles();
      } else if (phase === "gathering") {
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
          frameId = null;
        }
        if (active) renderFrame(performance.now());
      } else {
        clearCanvas(canvas, context, dpr);
      }
    };

    const initializeParticles = () => {
      const sampled = sampledTitleRef.current;
      if (!sampled) {
        throw new Error("ParticleTitle has no sampled glyph data.");
      }
      particles = sampled.particles;
      glyphs = sampled.glyphs;
      plans = particles.map((particle) => ({
        delay: particle.normalizedX,
        bend: (particle.randomA - 0.5) * 30,
      }));
      maxDelay = plans.reduce(
        (maximum, plan) => Math.max(maximum, plan.delay),
        0,
      );
      clearCanvas(canvas, context, dpr);
    };

    let lastRect = heading.getBoundingClientRect();
    const resizeObserver =
      "ResizeObserver" in window
        ? new ResizeObserver(() => {
            const rect = heading.getBoundingClientRect();
            if (
              Math.abs(rect.width - lastRect.width) < 1 &&
              Math.abs(rect.height - lastRect.height) < 1
            ) {
              return;
            }
            lastRect = rect;
            if (resizeTimer !== null) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
              resizeTimer = null;
              if (cancelled) return;
              try {
                rebuildParticles();
              } catch (error) {
                console.error(
                  "ParticleTitle could not resample the resized heading.",
                  error,
                );
                setMode("static");
              }
            }, RESIZE_DEBOUNCE_MS);
          })
        : null;
    resizeObserver?.observe(heading);

    try {
      initializeParticles();
      scheduleIntro();
    } catch (error) {
      console.error("ParticleTitle could not initialize its particles.", error);
      window.setTimeout(() => setMode("static"), 0);
    }

    return () => {
      cancelled = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (introTimer !== null) window.clearTimeout(introTimer);
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [mode]);

  return (
    <h1 ref={headingRef} className="particle-title" data-mode={mode}>
      {text}
      {mode !== "static" && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="particle-title__canvas"
        />
      )}
    </h1>
  );
}

export default ParticleTitle;
