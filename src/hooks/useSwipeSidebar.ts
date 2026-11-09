"use client";
import { useEffect, useRef } from "react";

type Ref = { current: HTMLElement | null };

export function useSwipeSidebar(
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  edge: "left" | "right",
  drawerRef: Ref,
  _backdropRef: Ref,
  _options: { maxWidth?: number; railWidth?: number } = {},
) {
  const suppressClickUntil = useRef(0);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let trackingTouch = false;
    let trackingPointer = false;
    let horizontalIntent = false;
    const openDirection = edge === "left" ? 1 : -1;

    const isScrollableTableGesture = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest("[data-horizontal-scroll]"));

    const finishGesture = (dx: number, dy: number) => {
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      const towardOpen = dx * openDirection > 0;
      if (!isOpen && towardOpen) {
        suppressClickUntil.current = Date.now() + 450;
        setIsOpen(true);
      } else if (isOpen && !towardOpen) {
        suppressClickUntil.current = Date.now() + 450;
        setIsOpen(false);
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || isScrollableTableGesture(event.target)) return;
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      trackingTouch = true;
      horizontalIntent = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!trackingTouch || event.touches.length !== 1) return;
      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.1) {
        trackingTouch = false;
        return;
      }
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.1) {
        horizontalIntent = true;
        if (event.cancelable) event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!trackingTouch) return;
      trackingTouch = false;
      if (!horizontalIntent) return;
      const touch = event.changedTouches[0];
      finishGesture(touch.clientX - startX, touch.clientY - startY);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.pointerType === "touch" ||
          (event.pointerType === "mouse" && event.button !== 0) ||
          window.matchMedia("(min-width: 768px)").matches ||
          isScrollableTableGesture(event.target)) return;
      startX = event.clientX;
      startY = event.clientY;
      trackingPointer = true;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!trackingPointer || event.pointerType === "touch") return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.1) trackingPointer = false;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!trackingPointer || event.pointerType === "touch") return;
      trackingPointer = false;
      finishGesture(event.clientX - startX, event.clientY - startY);
    };

    const onTouchCancel = () => { trackingTouch = false; };
    const onPointerCancel = () => { trackingPointer = false; };
    const onClickCapture = (event: MouseEvent) => {
      if (Date.now() < suppressClickUntil.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true, capture: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerCancel, { passive: true });
    window.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("touchcancel", onTouchCancel, true);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("click", onClickCapture, true);
    };
  }, [isOpen, setIsOpen, edge, drawerRef]);
}
