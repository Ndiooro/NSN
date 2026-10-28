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
  fieldX: number;
  fieldY: number;
  normalizedX: number;
  normalizedY: number;
  randomA: number;
  randomB: number;
  randomC: number;
  color: number;
  radius: number;
  opacity: number;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
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
  textCanvas: HTMLCanvasElement;
}

interface TextLine {
  top: number;
  glyphs: Glyph[];
}

type TitleMode = "pending" | "canvas" | "static";
type AnimationPhase = "pre" | "gathering" | "text" | "dissolving" | "field";
type MotionMode = "smoke" | "vortex" | "sand" | "burst" | "sweep" | "absorb";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

const INTRO_DELAY_MS = 500;
const TRAVEL_DURATION_MS = 4200;
const TEXT_HOLD_MS = 5200;
const FIELD_HOLD_MS = 1400;
const MOTION_SPREAD = 0.55;
const RESIZE_DEBOUNCE_MS = 100;
const PARTICLE_SEED = 0x4a3b2c1d;
const TITLE_TEXT_COLOR = "#009ff0";
const MOTION_MODES: MotionMode[] = [
  "smoke",
  "vortex",
  "sand",
  "burst",
  "sweep",
  "absorb",
];

function clearCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  dpr: number,
  offsetX = 0,
  offsetY = 0,
) {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(dpr, 0, 0, dpr, offsetX * dpr, offsetY * dpr);
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

function smooth(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function createMotionModePicker(random: () => number) {
  let bag: MotionMode[] = [];
  let previous: MotionMode | null = null;

  return () => {
    if (bag.length === 0) {
      bag = [...MOTION_MODES];
      for (let index = bag.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
      }
      if (bag[bag.length - 1] === previous) {
        [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
    }

    previous = bag.pop()!;
    return previous;
  };
}

function getMotionPlan(mode: MotionMode, particle: Particle) {
  switch (mode) {
    case "smoke":
      return {
        delay: (1 - particle.normalizedY) * 0.35 + particle.randomC * 0.25,
        bend: (particle.randomA - 0.5) * 150,
      };
    case "vortex":
      return {
        delay:
          (Math.hypot(particle.normalizedX - 0.5, particle.normalizedY - 0.5) /
            Math.SQRT1_2) *
            0.9 +
          particle.randomC * 0.15,
        bend: (particle.randomB > 0.5 ? 1 : -1) * (90 + particle.randomA * 140),
      };
    case "sand":
      return {
        delay: particle.normalizedX * 0.6 + particle.randomC * 0.18,
        bend: (particle.randomA - 0.5) * 60,
      };
    case "burst":
      return {
        delay: particle.randomC * 0.1,
        bend: (particle.randomB - 0.5) * 26,
      };
    case "sweep":
      return {
        delay: (1 - particle.normalizedX) * 0.6 + particle.randomC * 0.18,
        bend: -(60 + particle.randomA * 90),
      };
    case "absorb":
      return {
        delay: particle.randomA * 0.55,
        bend: (particle.randomB - 0.5) * 100,
      };
  }
}

function bowAt(
  from: [number, number],
  to: [number, number],
  bend: number,
  progress: number,
) {
  const eased = easeInOut(progress);
  const deltaX = to[0] - from[0];
  const deltaY = to[1] - from[1];
  const distance = Math.hypot(deltaX, deltaY) || 1;
  const bow = Math.sin(eased * Math.PI) * bend;

  return [
    from[0] + deltaX * eased - (deltaY / distance) * bow,
    from[1] + deltaY * eased + (deltaX / distance) * bow,
  ] as const;
}

function sampleTitle(
  heading: HTMLHeadingElement,
  dpr: number,
): SampledTitle | null {
  const rect = heading.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const width = Math.ceil(rect.width * dpr);
  const height = Math.ceil(rect.height * dpr);
  const textCanvas = document.createElement("canvas");
  textCanvas.width = width;
  textCanvas.height = height;
  const context = textCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

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
  context.fillStyle = TITLE_TEXT_COLOR;
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
  let samples: Array<{
    x: number;
    y: number;
    sourceX: number;
    sourceY: number;
    sourceWidth: number;
    sourceHeight: number;
  }> = [];

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
            sourceX: cellX,
            sourceY: cellY,
            sourceWidth: cellWidth,
            sourceHeight: cellHeight,
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
    const fieldX =
      rect.width / 2 +
      Math.cos(angle) * rect.width * 0.68 * radius;
    const fieldY =
      rect.height / 2 +
      Math.sin(angle) * rect.height * 0.85 * radius;
    const randomA = random();
    const randomB = random();
    const randomC = random();
    const colorRoll = random();

    return {
      x: fieldX,
      y: fieldY,
      targetX: sample.x,
      targetY: sample.y,
      fieldX,
      fieldY,
      normalizedX:
        (sample.x - bounds.minX) / Math.max(1, bounds.maxX - bounds.minX),
      normalizedY:
        (sample.y - bounds.minY) / Math.max(1, bounds.maxY - bounds.minY),
      randomA,
      randomB,
      randomC,
      color: colorRoll < 0.6 ? 0 : colorRoll < 0.85 ? 1 : 2,
      radius: particleRadius,
      opacity: 0,
      sourceX: sample.sourceX,
      sourceY: sample.sourceY,
      sourceWidth: sample.sourceWidth,
      sourceHeight: sample.sourceHeight,
    };
  });

  return { particles, glyphs, textCanvas };
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

          const sampled = sampleTitle(
            heading,
            Math.min(window.devicePixelRatio || 1, 2),
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
    let phaseTimer: number | null = null;
    let phaseTimerDeadline: number | null = null;
    let phaseTimerRemaining = 0;
    let phaseTimerAction: (() => void) | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let particles: Particle[] = [];
    let glyphs: Glyph[] = [];
    let textCanvas: HTMLCanvasElement | null = null;
    let maxDelay = 0;
    let plans: Array<{ delay: number; bend: number }> = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let canvasOffsetX = 0;
    let canvasOffsetY = 0;
    const particleColors = [
      TITLE_TEXT_COLOR,
      TITLE_TEXT_COLOR,
      TITLE_TEXT_COLOR,
    ];
    const motionRandom = createRng(PARTICLE_SEED ^ 0x5a5a);
    const fieldRandom = createRng(PARTICLE_SEED ^ 0xa5a5);
    const pickMotionMode = createMotionModePicker(motionRandom);
    let motionMode = pickMotionMode();
    const debugMode =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).get("debug") === "particles";
    let inView = !("IntersectionObserver" in window);
    let active = document.visibilityState !== "hidden" && inView;

    const drawTitle = () => {
      if (!textCanvas) return;
      clearCanvas(canvas, context, dpr, canvasOffsetX, canvasOffsetY);
      if (debugMode) {
        const computed = getComputedStyle(heading);
        context.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
        context.textBaseline = "alphabetic";
        context.fillStyle = "rgba(255, 0, 0, 0.4)";
        for (const glyph of glyphs) {
          context.fillText(glyph.text, glyph.x, glyph.baseline);
        }
      }
      context.globalAlpha = 1;
      context.drawImage(
        textCanvas,
        0,
        0,
        textCanvas.width / dpr,
        textCanvas.height / dpr,
      );
      context.globalAlpha = 1;
    };

    const drawParticles = () => {
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

    const schedulePhaseTimer = () => {
      if (!active || phaseTimer !== null || phaseTimerAction === null) return;
      phaseTimerDeadline = performance.now() + phaseTimerRemaining;
      phaseTimer = window.setTimeout(() => {
        phaseTimer = null;
        phaseTimerDeadline = null;
        phaseTimerRemaining = 0;
        const action = phaseTimerAction;
        phaseTimerAction = null;
        action?.();
      }, phaseTimerRemaining);
    };

    const startPhaseTimer = (duration: number, action: () => void) => {
      phaseTimerRemaining = duration;
      phaseTimerAction = action;
      schedulePhaseTimer();
    };

    const pausePhaseTimer = (now: number) => {
      if (phaseTimer === null || phaseTimerDeadline === null) return;
      phaseTimerRemaining = Math.max(0, phaseTimerDeadline - now);
      window.clearTimeout(phaseTimer);
      phaseTimer = null;
      phaseTimerDeadline = null;
    };

    const scheduleFrame = () => {
      if (
        active &&
        !cancelled &&
        frameId === null &&
        (phase === "gathering" || phase === "dissolving")
      ) {
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    const renderFrame = (now: number) => {
      frameId = null;
      if (
        !active ||
        cancelled ||
        (phase !== "gathering" && phase !== "dissolving") ||
        phaseStart === null
      ) {
        return;
      }

      const progress = Math.min(1, (now - phaseStart) / TRAVEL_DURATION_MS);
      const gathering = phase === "gathering";

      clearCanvas(canvas, context, dpr, canvasOffsetX, canvasOffsetY);

      if (debugMode) {
        const computed = getComputedStyle(heading);
        context.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
        context.textBaseline = "alphabetic";
        context.fillStyle = "rgba(255, 0, 0, 0.4)";
        for (const glyph of glyphs) {
          context.fillText(glyph.text, glyph.x, glyph.baseline);
        }
      }

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const plan = plans[index];
        const delayProgress = maxDelay === 0 ? 0 : plan.delay / maxDelay;
        const localProgress = Math.min(
          1,
          Math.max(
            0,
            (progress - delayProgress * MOTION_SPREAD) / (1 - MOTION_SPREAD),
          ),
        );
        const from: [number, number] = gathering
          ? [particle.fieldX, particle.fieldY]
          : [particle.targetX, particle.targetY];
        const to: [number, number] = gathering
          ? [particle.targetX, particle.targetY]
          : [particle.fieldX, particle.fieldY];
        const position = bowAt(
          from,
          to,
          gathering ? -plan.bend : plan.bend,
          localProgress,
        );
        particle.x = position[0];
        particle.y = position[1];

        const textOpacity = gathering
          ? smooth((localProgress - 0.82) / 0.18)
          : 1 - smooth(localProgress / 0.18);
        const particleOpacity = gathering
          ? smooth(localProgress / 0.15) * (1 - textOpacity)
          : smooth(localProgress / 0.15) *
            (1 - smooth((localProgress - 0.85) / 0.15));

        if (textCanvas && textOpacity > 0.002) {
          context.globalAlpha = textOpacity;
          context.drawImage(
            textCanvas,
            particle.sourceX,
            particle.sourceY,
            particle.sourceWidth,
            particle.sourceHeight,
            particle.sourceX / dpr,
            particle.sourceY / dpr,
            particle.sourceWidth / dpr,
            particle.sourceHeight / dpr,
          );
        }
        particle.opacity = particleOpacity;
      }

      context.globalAlpha = 1;
      drawParticles();
      if (progress < 1) {
        scheduleFrame();
        return;
      }

      if (gathering) {
        for (const particle of particles) {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.opacity = 0;
        }
        enterPhase("text");
      } else {
        for (const particle of particles) {
          particle.x = particle.fieldX;
          particle.y = particle.fieldY;
          particle.opacity = 0;
        }
        enterPhase("field");
      }
    };

    const redrawCurrentPhase = () => {
      if (phase === "text") {
        drawTitle();
      } else if (phase === "field" || phase === "pre") {
        clearCanvas(canvas, context, dpr, canvasOffsetX, canvasOffsetY);
      } else if (active) {
        phaseStart = performance.now();
        scheduleFrame();
      }
    };

    const rerollField = () => {
      const rect = heading.getBoundingClientRect();
      for (const particle of particles) {
        const angle = fieldRandom() * Math.PI * 2;
        const radius = Math.sqrt(fieldRandom());
        particle.fieldX =
          rect.width / 2 +
          Math.cos(angle) * rect.width * 0.68 * radius;
        particle.fieldY =
          rect.height / 2 +
          Math.sin(angle) * rect.height * 0.85 * radius;
      }
    };

    const enterPhase = (nextPhase: AnimationPhase) => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      if (phaseTimer !== null) {
        window.clearTimeout(phaseTimer);
        phaseTimer = null;
        phaseTimerDeadline = null;
      }
      phaseTimerAction = null;
      phase = nextPhase;
      phaseStart = performance.now();

      if (nextPhase === "pre") {
        clearCanvas(canvas, context, dpr, canvasOffsetX, canvasOffsetY);
        startPhaseTimer(INTRO_DELAY_MS, () => enterPhase("gathering"));
      } else if (nextPhase === "text") {
        drawTitle();
        startPhaseTimer(TEXT_HOLD_MS, () => enterPhase("dissolving"));
      } else if (nextPhase === "field") {
        clearCanvas(canvas, context, dpr, canvasOffsetX, canvasOffsetY);
        startPhaseTimer(FIELD_HOLD_MS, () => enterPhase("gathering"));
      } else {
        if (nextPhase === "dissolving") {
          motionMode = pickMotionMode();
          rerollField();
          updateMotionPlans();
        }
        phaseStart = performance.now();
        for (const particle of particles) {
          particle.x =
            nextPhase === "gathering" ? particle.fieldX : particle.targetX;
          particle.y =
            nextPhase === "gathering" ? particle.fieldY : particle.targetY;
          particle.opacity = 0;
        }
        scheduleFrame();
      }
    };

    const updateActiveState = () => {
      const nextActive = inView && document.visibilityState !== "hidden";
      if (nextActive === active) return;
      active = nextActive;
      const now = performance.now();

      if (!active) {
        if (phaseStart !== null) pausedAt = now;
        pausePhaseTimer(now);
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
      schedulePhaseTimer();
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

    const updateMotionPlans = () => {
      plans = particles.map((particle) => getMotionPlan(motionMode, particle));
      maxDelay = plans.reduce(
        (maximum, plan) => Math.max(maximum, plan.delay),
        0,
      );
    };

    const applySample = (sampled: SampledTitle) => {
      particles = sampled.particles;
      glyphs = sampled.glyphs;
      textCanvas = sampled.textCanvas;
      const rect = heading.getBoundingClientRect();
      canvasOffsetX = rect.width * 0.7;
      canvasOffsetY = rect.height * 0.9;
      canvas.style.left = `${-canvasOffsetX}px`;
      canvas.style.top = `${-canvasOffsetY}px`;
      canvas.style.width = `${rect.width * 2.4}px`;
      canvas.style.height = `${rect.height * 2.8}px`;
      canvas.width = Math.ceil(rect.width * 2.4 * dpr);
      canvas.height = Math.ceil(rect.height * 2.8 * dpr);
      updateMotionPlans();
    };

    const rebuildParticles = () => {
      const sampled = sampleTitle(heading, dpr);
      if (!sampled) {
        throw new Error("The resized heading produced no particles.");
      }

      applySample(sampled);
      redrawCurrentPhase();
    };

    const initializeParticles = () => {
      const sampled = sampledTitleRef.current;
      if (!sampled) {
        throw new Error("ParticleTitle has no sampled glyph data.");
      }
      applySample(sampled);
      rerollField();
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
      enterPhase("pre");
    } catch (error) {
      console.error("ParticleTitle could not initialize its particles.", error);
      window.setTimeout(() => setMode("static"), 0);
    }

    return () => {
      cancelled = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (phaseTimer !== null) window.clearTimeout(phaseTimer);
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
