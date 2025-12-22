"use client";

import { useEffect, useRef, memo } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface FuturisticBackgroundProps {
  className?: string;
}

export const FuturisticBackground = memo(function FuturisticBackground({
  className = "",
}: FuturisticBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    const particleCount = 80;
    const colors = ["#a855f7", "#22d3ee", "#6366f1", "#8b5cf6"];

    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]!,
    }));

    // Track mouse for subtle interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;

    const draw = () => {
      time += 0.005;
      const { width, height } = canvas;

      // Clear with gradient background
      const bgGradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      bgGradient.addColorStop(0, "#0a0f1a");
      bgGradient.addColorStop(0.5, "#050810");
      bgGradient.addColorStop(1, "#020408");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw animated grid
      ctx.save();
      const gridSize = 60;
      const gridAlpha = 0.03;

      // Horizontal lines with wave effect
      ctx.strokeStyle = `rgba(100, 116, 139, ${gridAlpha})`;
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 5) {
          const wave = Math.sin(x * 0.01 + time * 2) * 2;
          if (x === 0) {
            ctx.moveTo(x, y + wave);
          } else {
            ctx.lineTo(x, y + wave);
          }
        }
        ctx.stroke();
      }

      // Vertical lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.restore();

      // Draw glowing orbs in background
      const orbPositions = [
        { x: width * 0.2, y: height * 0.3, radius: 200, color: "#a855f7" },
        { x: width * 0.8, y: height * 0.6, radius: 250, color: "#22d3ee" },
        { x: width * 0.5, y: height * 0.5, radius: 300, color: "#6366f1" },
      ];

      for (const orb of orbPositions) {
        const pulse = Math.sin(time * 2 + orb.x * 0.001) * 0.2 + 0.8;
        const gradient = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius * pulse
        );
        gradient.addColorStop(0, `${orb.color}15`);
        gradient.addColorStop(0.5, `${orb.color}08`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Update and draw particles
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      for (const particle of particles) {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Subtle mouse attraction
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200 * 0.0003;
          particle.vx += dx * force;
          particle.vy += dy * force;
        }

        // Apply friction
        particle.vx *= 0.999;
        particle.vy *= 0.999;

        // Draw particle with glow
        const pulseAlpha = particle.alpha * (0.7 + 0.3 * Math.sin(time * 3 + particle.x * 0.01));

        // Outer glow
        const glowGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 8
        );
        glowGradient.addColorStop(0, `${particle.color}${Math.floor(pulseAlpha * 60).toString(16).padStart(2, "0")}`);
        glowGradient.addColorStop(1, "transparent");
        ctx.fillStyle = glowGradient;
        ctx.fillRect(
          particle.x - particle.size * 8,
          particle.y - particle.size * 8,
          particle.size * 16,
          particle.size * 16
        );

        // Core
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(pulseAlpha * 255).toString(16).padStart(2, "0")}`;
        ctx.fill();
      }

      // Draw connecting lines between nearby particles
      ctx.strokeStyle = "rgba(168, 85, 247, 0.05)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]!;
          const p2 = particles[j]!;
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.15;
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw scan line effect
      const scanY = (time * 100) % (height + 100) - 50;
      const scanGradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50);
      scanGradient.addColorStop(0, "transparent");
      scanGradient.addColorStop(0.5, "rgba(168, 85, 247, 0.03)");
      scanGradient.addColorStop(1, "transparent");
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanY - 50, width, 100);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
});
