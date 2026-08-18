"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  hueShift: number;
}

const BRAND_VIOLET = { r: 108, g: 60, b: 233 };
const BRAND_CYAN = { r: 46, g: 197, b: 240 };

export default function HeroMoment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let pointerX = -9999;
    let pointerY = -9999;
    let animationFrame: number;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas!.width = width * window.devicePixelRatio;
      canvas!.height = height * window.devicePixelRatio;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);

      const spacing = 42;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      particles = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing;
          const y = row * spacing;
          particles.push({
            x,
            y,
            baseX: x,
            baseY: y,
            size: 1.2,
            hueShift: (col + row) / (cols + rows),
          });
        }
      }
    }

    function lerpColor(t: number) {
      const r = Math.round(BRAND_VIOLET.r + (BRAND_CYAN.r - BRAND_VIOLET.r) * t);
      const g = Math.round(BRAND_VIOLET.g + (BRAND_CYAN.g - BRAND_VIOLET.g) * t);
      const b = Math.round(BRAND_VIOLET.b + (BRAND_CYAN.b - BRAND_VIOLET.b) * t);
      return `${r}, ${g}, ${b}`;
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        const dx = pointerX - p.baseX;
        const dy = pointerY - p.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influenceRadius = 160;

        let targetX = p.baseX;
        let targetY = p.baseY;
        let opacity = 0.12;
        let size = p.size;

        if (dist < influenceRadius) {
          const force = (1 - dist / influenceRadius) * 18;
          const angle = Math.atan2(dy, dx);
          targetX = p.baseX - Math.cos(angle) * force;
          targetY = p.baseY - Math.sin(angle) * force;
          opacity = 0.12 + (1 - dist / influenceRadius) * 0.55;
          size = p.size + (1 - dist / influenceRadius) * 1.8;
        }

        p.x += (targetX - p.x) * 0.12;
        p.y += (targetY - p.y) * 0.12;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${lerpColor(p.hueShift)}, ${opacity})`;
        ctx!.fill();
      }

      animationFrame = requestAnimationFrame(draw);
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
    }

    function handlePointerLeave() {
      pointerX = -9999;
      pointerY = -9999;
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    if (!prefersReducedMotion) {
      draw();
    } else {
      // Respect reduced-motion: render one static frame instead of animating.
      draw();
      cancelAnimationFrame(animationFrame);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
