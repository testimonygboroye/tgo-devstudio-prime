"use client";
import { useEffect } from "react";

type Ref = { current: HTMLElement | null };

export function useSwipeSidebar(
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  edge: "left" | "right",
  drawerRef: Ref,
  backdropRef: Ref,
  options: { maxWidth?: number; railWidth?: number } = {},
) {
  useEffect(() => {
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startExtent = 0;
    let maxWidth = 0;
    let railWidth = 0;
    let horizontal = false;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    const direction = edge === "left" ? 1 : -1;

    const paint = (extent: number) => {
      const available = Math.max(1, maxWidth - railWidth);
      const visible = Math.max(0, Math.min(available, extent));
      const width = railWidth + visible;
      const drawer = drawerRef.current;
      const backdrop = backdropRef.current;
      if (drawer) {
        drawer.style.transition = "none";
        drawer.style.width = width + "px";
        drawer.style.transform = edge === "right" ? `translate3d(${maxWidth - width}px,0,0)` : "translate3d(0,0,0)";
      }
      if (backdrop) {
        backdrop.style.transition = "none";
        backdrop.style.opacity = String(visible / available);
      }
    };

    const clearInlineStyles = () => {
      const drawer = drawerRef.current;
      const backdrop = backdropRef.current;
      if (drawer) { drawer.style.transition = ""; drawer.style.width = ""; drawer.style.transform = ""; }
      if (backdrop) { backdrop.style.transition = ""; backdrop.style.opacity = ""; }
    };
    const clearAfterRender = () => requestAnimationFrame(() => requestAnimationFrame(clearInlineStyles));

    const onPointerDown = (event: PointerEvent) => {
      if (window.matchMedia("(min-width: 768px)").matches) return;
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      if (!drawerRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [data-no-sidebar-swipe]")) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      lastX = startX;
      lastTime = performance.now();
      velocity = 0;
      horizontal = false;
      maxWidth = Math.min(options.maxWidth ?? (edge === "left" ? 304 : 336), window.innerWidth * 0.86);
      railWidth = Math.min(options.railWidth ?? 0, maxWidth);
      startExtent = isOpen ? maxWidth - railWidth : 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!horizontal) {
        if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return;
        if (Math.abs(dx) <= Math.abs(dy) * 1.1) { pointerId = null; return; }
        horizontal = true;
      }
      if (event.cancelable) event.preventDefault();
      const now = performance.now();
      velocity = (event.clientX - lastX) / Math.max(1, now - lastTime);
      lastX = event.clientX;
      lastTime = now;
      paint(startExtent + dx * direction);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const available = Math.max(1, maxWidth - railWidth);
      const extent = Math.max(0, Math.min(available, startExtent + dx * direction));
      const threshold = available * 0.16;
      let nextOpen = isOpen;
      if (!isOpen && horizontal && (extent >= threshold || velocity * direction > 0.45)) nextOpen = true;
      if (isOpen && horizontal && (extent <= available - threshold || velocity * direction < -0.45)) nextOpen = false;
      pointerId = null;
      if (horizontal) setIsOpen(nextOpen);
      horizontal = false;
      clearAfterRender();
    };

    const onPointerCancel = () => {
      pointerId = null;
      horizontal = false;
      clearAfterRender();
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerCancel, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      clearInlineStyles();
    };
  }, [backdropRef, drawerRef, edge, isOpen, options.maxWidth, options.railWidth, setIsOpen]);
}
