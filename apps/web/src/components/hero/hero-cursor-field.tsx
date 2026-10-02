"use client";

import { useEffect, useRef } from "react";

export function HeroCursorField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const hero = host?.closest<HTMLElement>("[data-hero-theme]") ?? host;
    const context = canvas?.getContext("2d");
    if (!canvas || !host || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const pointer = {
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      active: false,
      opacity: 0,
    };
    const spacing = 20;
    const radius = 280;
    let width = 0;
    let height = 0;
    let frame = 0;
    let color = "";

    const disabled = () => reducedMotion.matches || coarsePointer.matches || document.hidden;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer.active = false;
      pointer.opacity = 0;
      context.clearRect(0, 0, width, height);
    };

    const draw = () => {
      frame = 0;
      if (disabled()) {
        stop();
        return;
      }
      pointer.currentX += (pointer.targetX - pointer.currentX) * 0.16;
      pointer.currentY += (pointer.targetY - pointer.currentY) * 0.16;
      pointer.opacity += ((pointer.active ? 1 : 0) - pointer.opacity) * 0.14;
      context.clearRect(0, 0, width, height);

      if (!pointer.active && pointer.opacity < 0.005) {
        pointer.opacity = 0;
        return;
      }

      const firstColumn = Math.max(0, Math.floor((pointer.currentX - radius) / spacing));
      const lastColumn = Math.min(Math.ceil(width / spacing), Math.ceil((pointer.currentX + radius) / spacing));
      const firstRow = Math.max(0, Math.floor((pointer.currentY - radius) / spacing));
      const lastRow = Math.min(Math.ceil(height / spacing), Math.ceil((pointer.currentY + radius) / spacing));

      for (let row = firstRow; row <= lastRow; row++) {
        for (let column = firstColumn; column <= lastColumn; column++) {
          const gridX = column * spacing + spacing / 2;
          const gridY = row * spacing + spacing / 2;
          const deltaX = pointer.currentX - gridX;
          const deltaY = pointer.currentY - gridY;
          const distance = Math.hypot(deltaX, deltaY);
          if (distance >= radius) continue;

          const influence = Math.pow(1 - distance / radius, 1.25);
          const pull = distance ? (influence * 10) / distance : 0;
          const dotX = gridX + deltaX * pull;
          const dotY = gridY + deltaY * pull;
          const angle = Math.atan2(deltaY, deltaX) + influence * 0.5;
          const halfLength = 0.9 + influence * 2.4;
          const offsetX = Math.cos(angle) * halfLength;
          const offsetY = Math.sin(angle) * halfLength;

          context.globalAlpha = influence * pointer.opacity * 0.85;
          context.lineWidth = 1.4 + influence * 0.7;
          context.beginPath();
          context.moveTo(dotX - offsetX, dotY - offsetY);
          context.lineTo(dotX + offsetX, dotY + offsetY);
          context.stroke();
        }
      }

      context.globalAlpha = 1;
      const moving = Math.hypot(pointer.targetX - pointer.currentX, pointer.targetY - pointer.currentY) > 0.1;
      const fading = Math.abs((pointer.active ? 1 : 0) - pointer.opacity) > 0.005;
      if (moving || fading) frame = requestAnimationFrame(draw);
    };

    const schedule = () => {
      if (!frame && !disabled()) frame = requestAnimationFrame(draw);
    };

    const onMove = (event: PointerEvent) => {
      if (disabled() || event.pointerType === "touch") return;
      const bounds = host.getBoundingClientRect();
      pointer.targetX = event.clientX - bounds.left;
      pointer.targetY = event.clientY - bounds.top;
      if (!pointer.active) {
        pointer.currentX = pointer.targetX;
        pointer.currentY = pointer.targetY;
      }
      pointer.active = true;
      schedule();
    };

    const onLeave = () => {
      pointer.active = false;
      schedule();
    };

    const resize = () => {
      stop();
      const bounds = host.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.lineCap = "round";
      color = getComputedStyle(canvas).color;
      context.strokeStyle = color;
    };

    const onPreferenceChange = () => {
      if (disabled()) stop();
    };

    const observer = new ResizeObserver(resize);
    const colorObserver = new MutationObserver(() => {
      const accent = getComputedStyle(canvas).color;
      if (!accent || accent === color) return;
      color = accent;
      context.strokeStyle = color;
      if (pointer.active || pointer.opacity > 0.005) schedule();
    });
    observer.observe(host);
    colorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    if (hero) colorObserver.observe(hero, { attributes: true, attributeFilter: ["style"] });
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave, { passive: true });
    host.addEventListener("pointercancel", onLeave, { passive: true });
    reducedMotion.addEventListener("change", onPreferenceChange);
    coarsePointer.addEventListener("change", onPreferenceChange);
    document.addEventListener("visibilitychange", onPreferenceChange);
    window.addEventListener("blur", stop);
    resize();

    return () => {
      stop();
      observer.disconnect();
      colorObserver.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointercancel", onLeave);
      reducedMotion.removeEventListener("change", onPreferenceChange);
      coarsePointer.removeEventListener("change", onPreferenceChange);
      document.removeEventListener("visibilitychange", onPreferenceChange);
      window.removeEventListener("blur", stop);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
