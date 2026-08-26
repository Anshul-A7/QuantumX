"use client";

import { useEffect, useRef } from "react";

export default function QuantumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const mouse = { x: width / 2, y: height / 3, targetX: width / 2, targetY: height / 3 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Particle class representing quantum state amplitudes
    const particlesCount = Math.min(Math.floor((width * height) / 22000), 60);
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      phase: number;
      color: string;
    }> = [];

    const colors = [
      "rgba(79, 70, 229, 0.45)",  // Indigo
      "rgba(124, 58, 237, 0.45)", // Violet
      "rgba(6, 182, 212, 0.40)",  // Cyan
      "rgba(16, 185, 129, 0.35)", // Emerald
    ];

    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.5 + 1.5,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle entanglement bridges between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.18;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        // Mouse attraction/entanglement
        const mdx = mouse.x - particles[i].x;
        const mdy = mouse.y - particles[i].y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 220) {
          const mAlpha = (1 - mdist / 220) * 0.25;
          ctx.strokeStyle = `rgba(124, 58, 237, ${mAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        // Update positions
        particles[i].x += particles[i].vx + Math.sin(time + particles[i].phase) * 0.15;
        particles[i].y += particles[i].vy + Math.cos(time + particles[i].phase) * 0.15;

        // Wrap around bounds
        if (particles[i].x < 0) particles[i].x = width;
        if (particles[i].x > width) particles[i].x = 0;
        if (particles[i].y < 0) particles[i].y = height;
        if (particles[i].y > height) particles[i].y = 0;

        // Draw particle with quantum wave halo
        const pulse = Math.sin(time * 2 + particles[i].phase) * 0.8;
        ctx.fillStyle = particles[i].color;
        ctx.beginPath();
        ctx.arc(particles[i].x, particles[i].y, particles[i].radius + pulse * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60"
    />
  );
}
