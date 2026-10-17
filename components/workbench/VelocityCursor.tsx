"use client";

import { useEffect, useRef } from "react";

export const CURSOR_SIZE_STORAGE_KEY = "querysense-cursor-size";
export const DEFAULT_CURSOR_SIZE = 35;
export const MIN_CURSOR_SIZE = 24;
export const MAX_CURSOR_SIZE = 52;

export function getStoredCursorSize(): number {
  if (typeof window === "undefined") return DEFAULT_CURSOR_SIZE;
  try {
    const saved = Number(window.localStorage.getItem(CURSOR_SIZE_STORAGE_KEY));
    return Number.isFinite(saved) && saved >= MIN_CURSOR_SIZE && saved <= MAX_CURSOR_SIZE
      ? saved
      : DEFAULT_CURSOR_SIZE;
  } catch {
    return DEFAULT_CURSOR_SIZE;
  }
}

export function getVelocityCursorScale(velocity: number, rapidMotion: number): number {
  if (velocity <= 1.28 || rapidMotion <= 0.58) return 1;
  return 1 + Math.min(0.44, (velocity - 1.28) * 0.26);
}

export default function VelocityCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const root = document.documentElement;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!cursor || !finePointer.matches || reducedMotion.matches) return;

    root.style.setProperty("--cursor-size", `${getStoredCursorSize()}px`);

    let lastX = 0;
    let lastY = 0;
    let lastMoveAt = 0;
    let lastFrameAt = 0;
    let velocity = 0;
    let rapidMotion = 0;
    let scale = 1;
    let frame = 0;

    root.classList.add("qs-custom-cursor-active");

    const animate = (now: number) => {
      const delta = Math.min(now - (lastFrameAt || now), 40);
      lastFrameAt = now;
      velocity *= Math.exp(-delta / 105);
      rapidMotion *= Math.exp(-delta / 125);
      const targetScale = getVelocityCursorScale(velocity, rapidMotion);
      scale += (targetScale - scale) * Math.min(1, delta / 36);
      cursor.style.setProperty("--cursor-scale", scale.toFixed(3));

      if (velocity > 0.015 || Math.abs(scale - 1) > 0.008) frame = requestAnimationFrame(animate);
      else { scale = 1; cursor.style.setProperty("--cursor-scale", "1"); frame = 0; lastFrameAt = 0; }
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const now = performance.now();
      const isFirstMove = lastMoveAt === 0;
      const distance = isFirstMove ? 0 : Math.hypot(event.clientX - lastX, event.clientY - lastY);
      const elapsed = Math.max(8, now - lastMoveAt);
      const instantVelocity = isFirstMove ? 0 : distance / elapsed;
      velocity = Math.min(3, velocity * 0.3 + instantVelocity * 0.7);
      rapidMotion = instantVelocity > 1.28 ? Math.min(1, rapidMotion + 0.22) : Math.max(0, rapidMotion - 0.24);
      lastX = event.clientX;
      lastY = event.clientY;
      lastMoveAt = now;

      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.dataset.visible = "true";

      const target = event.target instanceof Element ? event.target : null;
      const textSurface = target?.closest("textarea, input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]), select, [contenteditable='true'], [role='textbox'], .monaco-editor");
      root.classList.toggle("qs-native-cursor", Boolean(textSurface));

      if (!frame) frame = requestAnimationFrame(animate);
    };

    const leave = () => {
      cursor.dataset.visible = "false";
      root.classList.remove("qs-native-cursor");
      velocity = 0;
      rapidMotion = 0;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      scale = 1;
      lastFrameAt = 0;
      cursor.style.setProperty("--cursor-scale", "1");
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", leave);
    document.documentElement.addEventListener("pointerleave", leave);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
      if (frame) cancelAnimationFrame(frame);
      root.classList.remove("qs-custom-cursor-active", "qs-native-cursor");
    };
  }, []);

  return <div ref={cursorRef} className="velocity-cursor" aria-hidden="true" data-visible="false">
    <svg viewBox="0 0 64 76" role="presentation">
      <path className="velocity-cursor-shape" d="M7 4 57 42 37 45 49 64 39 70 27 51 12 67Z" />
      <path className="velocity-cursor-cut" d="m17 14 29 24-16 2 12 20-3 2-13-21-12 12Z" />
      <path className="velocity-cursor-glint" d="m10 8 6 5" />
    </svg>
  </div>;
}
