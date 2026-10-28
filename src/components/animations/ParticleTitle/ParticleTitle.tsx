'use client';

import { useEffect, useRef, useState } from 'react';
import './ParticleTitle.css';

interface ParticleTitleProps {
  text: string;
}

interface Particle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: number;
  radius: number;
}

interface TextLine {
  start: number;
  end: number;
  left: number;
  top: number;
}

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

const ASSEMBLY_DELAY_MS = 500;
const ASSEMBLY_DURATION_MS = 1600;
const RESIZE_DEBOUNCE_MS = 100;

function getTextLines(textNode: Text, titleRect: DOMRect): TextLine[] {
  const text = textNode.data;
  const wordPattern = /\S+/g;
  const range = document.createRange();
  const lines: TextLine[] = [];
  let match: RegExpExecArray | null;

  while ((match = wordPattern.exec(text)) !== null) {
    range.setStart(textNode, match.index);
    range.setEnd(textNode, match.index + match[0].length);
    const wordRect = range.getBoundingClientRect();
    const top = wordRect.top - titleRect.top;
    const currentLine = lines[lines.length - 1];

    if (currentLine && Math.abs(currentLine.top - top) <= 1) {
      currentLine.end = match.index + match[0].length;
    } else {
      lines.push({
        start: match.index,
        end: match.index + match[0].length,
        left: wordRect.left - titleRect.left,
        top,
      });
    }
  }

  range.detach();
  return lines;
}

export function ParticleTitle({ text }: ParticleTitleProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [isStatic, setIsStatic] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const connection = (navigator as NavigatorWithConnection).connection;

    const updateCanvasPreference = () => {
      if (motionPreference.matches || connection?.saveData) {
        setCanvasEnabled(false);
        setCanvasReady(false);
        setIsStatic(true);
        return;
      }

      setCanvasEnabled(true);
      setIsStatic(false);
    };

    updateCanvasPreference();
    motionPreference.addEventListener('change', updateCanvasPreference);

    return () =>
      motionPreference.removeEventListener('change', updateCanvasPreference);
  }, []);

  useEffect(() => {
    if (!canvasEnabled) return;

    const heading = headingRef.current;
    const canvas = canvasRef.current;
    let context: CanvasRenderingContext2D | null = null;

    try {
      context = canvas?.getContext('2d', { willReadFrequently: true }) ?? null;
    } catch (error) {
      console.warn(
        'ParticleTitle could not access a 2D canvas; showing plain text.',
        error,
      );
    }

    if (!heading || !canvas || !context) {
      setCanvasEnabled(false);
      setCanvasReady(false);
      setIsStatic(true);
      return;
    }

    let cancelled = false;
    let active = document.visibilityState !== 'hidden';
    let inView = true;
    let frameId: number | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let particles: Particle[] = [];
    let assembled = false;
    let assemblyStart: number | null = null;
    let pausedAt: number | null = null;
    let pointer: { x: number; y: number } | null = null;
    let isDisplaced = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const supportsPointer = window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches;
    const strongColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--brand-strong')
        .trim() || '#0a7fb8';
    const particleColors = [strongColor, '#009ee0', '#7dd3fc'];

    const drawParticles = () => {
      const rect = heading.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      for (
        let colorIndex = 0;
        colorIndex < particleColors.length;
        colorIndex += 1
      ) {
        context.beginPath();
        for (const particle of particles) {
          if (particle.color !== colorIndex) continue;
          context.moveTo(particle.x + particle.radius, particle.y);
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        }
        context.fillStyle = particleColors[colorIndex];
        context.fill();
      }
    };

    const scheduleFrame = () => {
      if (active && frameId === null) {
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    const renderFrame = (now: number) => {
      frameId = null;
      if (!active || cancelled) return;

      if (!assembled && assemblyStart !== null) {
        const progress = Math.min(
          1,
          (now - assemblyStart) / ASSEMBLY_DURATION_MS,
        );
        const eased = 1 - (1 - progress) ** 3;

        for (const particle of particles) {
          particle.x =
            particle.startX + (particle.targetX - particle.startX) * eased;
          particle.y =
            particle.startY + (particle.targetY - particle.startY) * eased;
        }

        if (progress === 1) {
          assembled = true;
          for (const particle of particles) {
            particle.x = particle.targetX;
            particle.y = particle.targetY;
          }
        }

        drawParticles();
        if (!assembled) scheduleFrame();
        return;
      }

      if (assembled && (pointer || isDisplaced)) {
        let isMoving = false;

        for (const particle of particles) {
          const dx = pointer ? particle.targetX - pointer.x : 0;
          const dy = pointer ? particle.targetY - pointer.y : 0;
          const distance = Math.hypot(dx, dy);
          const radius = 46;
          const force =
            pointer && distance < radius ? (1 - distance / radius) * 8 : 0;
          const targetX =
            particle.targetX + (distance ? (dx / distance) * force : 0);
          const targetY =
            particle.targetY + (distance ? (dy / distance) * force : 0);
          const nextX = particle.x + (targetX - particle.x) * 0.2;
          const nextY = particle.y + (targetY - particle.y) * 0.2;

          isMoving ||= Math.abs(nextX - particle.x) > 0.08;
          isMoving ||= Math.abs(nextY - particle.y) > 0.08;
          particle.x = nextX;
          particle.y = nextY;
        }

        isDisplaced = isMoving;
        if (isMoving) {
          drawParticles();
          scheduleFrame();
        } else {
          drawParticles();
        }
      }
    };

    const updateActiveState = () => {
      const nextActive = inView && document.visibilityState !== 'hidden';
      if (nextActive === active) return;

      active = nextActive;
      const now = performance.now();

      if (!active) {
        if (assemblyStart !== null && !assembled) pausedAt = now;
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
          frameId = null;
        }
      } else {
        if (pausedAt !== null && assemblyStart !== null && !assembled) {
          assemblyStart += now - pausedAt;
          pausedAt = null;
        }
        scheduleFrame();
      }
    };

    const onVisibilityChange = () => updateActiveState();
    document.addEventListener('visibilitychange', onVisibilityChange);

    const intersectionObserver =
      'IntersectionObserver' in window
        ? new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            updateActiveState();
          })
        : null;
    intersectionObserver?.observe(heading);

    let samplingReady = false;
    const rebuildParticles = () => {
      const rect = heading.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;

      const width = Math.ceil(rect.width * dpr);
      const height = Math.ceil(rect.height * dpr);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);

      const textNode = Array.from(heading.childNodes).find(
        (node): node is Text => node.nodeType === Node.TEXT_NODE,
      );
      if (!textNode) return false;

      const computed = getComputedStyle(heading);
      const fontSize = Number.parseFloat(computed.fontSize);
      const lineHeight =
        computed.lineHeight === 'normal'
          ? fontSize * 1.05
          : Number.parseFloat(computed.lineHeight);
      const lines = getTextLines(textNode, rect);

      context.font = `${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`;
      const spacedContext = context as CanvasRenderingContext2D & {
        letterSpacing?: string;
      };
      spacedContext.letterSpacing = computed.letterSpacing;
      context.textAlign = 'left';
      context.textBaseline = 'alphabetic';
      context.fillStyle = strongColor;

      for (const line of lines) {
        const lineText = textNode.data.slice(line.start, line.end);
        const baseline =
          line.top + (lineHeight - fontSize) / 2 + fontSize * 0.82;
        context.fillText(lineText, line.left, baseline);
      }

      const image = context.getImageData(0, 0, width, height);
      const maxParticles = window.innerWidth < 760 ? 1800 : 3500;
      const samplingStep = Math.max(
        2,
        Math.floor(Math.sqrt((width * height) / (maxParticles * 3))),
      );
      const samples: Array<{ x: number; y: number }> = [];

      for (let y = 0; y < height; y += samplingStep) {
        for (let x = 0; x < width; x += samplingStep) {
          const alpha = image.data[(y * width + x) * 4 + 3];
          if (alpha > 80) {
            samples.push({ x: (x + 0.5) / dpr, y: (y + 0.5) / dpr });
          }
        }
      }

      if (samples.length === 0) return false;

      const sampleStep = Math.max(1, Math.ceil(samples.length / maxParticles));
      const nextParticles: Particle[] = [];
      for (let i = 0; i < samples.length; i += sampleStep) {
        const sample = samples[i];
        const spreadX = (Math.random() - 0.5) * 34;
        const spreadY = (Math.random() - 0.5) * 28;
        const colorRoll = Math.random();

        nextParticles.push({
          x: assembled ? sample.x : sample.x + spreadX,
          y: assembled ? sample.y : sample.y + spreadY,
          startX: assembled ? sample.x : sample.x + spreadX,
          startY: assembled ? sample.y : sample.y + spreadY,
          targetX: sample.x,
          targetY: sample.y,
          color: colorRoll > 0.94 ? 2 : colorRoll > 0.72 ? 1 : 0,
          radius: 1.15 + Math.random() * 0.4,
        });
      }

      particles = nextParticles;
      context.clearRect(0, 0, rect.width, rect.height);
      canvas.dataset.ready = 'true';
      if (assembled) {
        drawParticles();
      } else {
        const hasStarted = assemblyStart !== null;
        if (hasStarted) assemblyStart = performance.now();
        drawParticles();
        if (hasStarted) scheduleFrame();
      }
      return true;
    };

    let lastWidth = heading.getBoundingClientRect().width;
    let lastHeight = heading.getBoundingClientRect().height;
    const resizeObserver =
      'ResizeObserver' in window
        ? new ResizeObserver(() => {
            if (!samplingReady) return;
            const rect = heading.getBoundingClientRect();
            if (
              Math.abs(rect.width - lastWidth) < 1 &&
              Math.abs(rect.height - lastHeight) < 1
            ) {
              return;
            }

            lastWidth = rect.width;
            lastHeight = rect.height;
            if (resizeTimer !== null) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
              if (cancelled) return;
              try {
                if (!rebuildParticles()) {
                  throw new Error('The resized heading produced no particles.');
                }
              } catch (error) {
                console.error(
                  'ParticleTitle could not resample the resized heading; keeping the text visible.',
                  error,
                );
                setCanvasEnabled(false);
                setCanvasReady(false);
                setIsStatic(true);
              }
            }, RESIZE_DEBOUNCE_MS);
          })
        : null;
    resizeObserver?.observe(heading);

    const onPointerMove = (event: PointerEvent) => {
      if (!supportsPointer || !assembled) return;
      const rect = heading.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      scheduleFrame();
    };
    const onPointerLeave = () => {
      if (!pointer) return;
      pointer = null;
      scheduleFrame();
    };

    if (supportsPointer) {
      heading.addEventListener('pointermove', onPointerMove);
      heading.addEventListener('pointerleave', onPointerLeave);
    }

    const initialize = async () => {
      try {
        await document.fonts.ready;
        if (cancelled) return;

        if (!rebuildParticles()) {
          setCanvasEnabled(false);
          setIsStatic(true);
          return;
        }

        samplingReady = true;
        lastWidth = heading.getBoundingClientRect().width;
        lastHeight = heading.getBoundingClientRect().height;
        setCanvasReady(true);
        window.setTimeout(() => {
          if (cancelled) return;
          if (active) {
            assemblyStart = performance.now();
            scheduleFrame();
          } else {
            assemblyStart = performance.now();
            pausedAt = performance.now();
          }
        }, ASSEMBLY_DELAY_MS);
      } catch (error) {
        console.error(
          'ParticleTitle could not sample its heading; keeping the text visible.',
          error,
        );
        setCanvasEnabled(false);
        setCanvasReady(false);
        setIsStatic(true);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      heading.removeEventListener('pointermove', onPointerMove);
      heading.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [canvasEnabled]);

  return (
    <h1
      ref={headingRef}
      className="particle-title"
      data-canvas-ready={canvasReady || undefined}
      data-static={isStatic || undefined}
    >
      {text}
      {canvasEnabled && (
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
