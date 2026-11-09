"use client";

import { useEffect, useRef } from "react";

type Ref = { current: HTMLElement | null };

/**
 * Enables full-screen horizontal drawer gestures on touch devices.
 * A swipe may begin anywhere on the page; horizontally scrollable data
 * tables retain their own native gesture and are deliberately excluded.
 */
export function useSwipeSidebar(
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  edge: "left" | "right",
  _drawerRef: Ref,
  _backdropRef: Ref,
  _options: { maxWidth?: number; railWidth?: number } = {},
) {
  const openRef = useRef(isOpen);
  const suppressClickUntil = useRef(0);

  useEffect(() => {
    openRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let trackingTouch = false;
    let trackingPointer = false;
    let horizontalIntent = false;
    let startWasScrollable = false;
    const openDirection = edge === "left" ? 1 : -1;

    const isHorizontalScroller = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(target.closest("[data-horizontal-scroll], [data-swipe-ignore]"));

    const finishGesture = (endX: number, endY: number) => {
      const dx = endX - startX;
      const dy = endY - startY;
      if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

      const towardOpen = dx * openDirection > 0;
      const currentlyOpen = openRef.current;
      if (!currentlyOpen && towardOpen) {
        suppressClickUntil.current = Date.now() + 350;
        openRef.current = true;
        setIsOpen(true);
      } else if (currentlyOpen && !towardOpen) {
        suppressClickUntil.current = Date.now() + 350;
        openRef.current = false;
        setIsOpen(false);
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        trackingTouch = false;
        return;
      }
      startWasScrollable = isHorizontalScroller(event.target);
      if (startWasScrollable) {
        trackingTouch = false;
        return;
      }
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      trackingTouch = true;
      horizontalIntent = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!trackingTouch || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.15) {
        trackingTouch = false;
        return;
      }

      if (Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        horizontalIntent = true;
        // Prevent the page/browser from consuming a horizontal drawer swipe.
        if (event.cancelable) event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!trackingTouch) return;
      trackingTouch = false;
      if (!horizontalIntent || startWasScrollable) return;
      const touch = event.changedTouches[0];
      if (touch) finishGesture(touch.clientX, touch.clientY);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        !event.isPrimary ||
        event.pointerType === "touch" ||
        (event.pointerType === "mouse" && event.button !== 0) ||
        window.matchMedia("(min-width: 768px)").matches ||
        isHorizontalScroller(event.target)
      ) return;

      startX = event.clientX;
      startY = event.clientY;
      trackingPointer = true;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!trackingPointer || event.pointerType === "touch") return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.15) {
        trackingPointer = false;
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!trackingPointer || event.pointerType === "touch") return;
      trackingPointer = false;
      finishGesture(event.clientX, event.clientY);
    };

    const cancelTouch = () => { trackingTouch = false; };
    const cancelPointer = () => { trackingPointer = false; };
    const onClickCapture = (event: MouseEvent) => {
      if (Date.now() < suppressClickUntil.current) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    // Capture phase means nested headers, scroll areas and drawer overlays
    // cannot accidentally prevent the global gesture from being detected.
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
    window.addEventListener("touchcancel", cancelTouch, { passive: true, capture: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true, capture: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true, capture: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true, capture: true });
    window.addEventListener("pointercancel", cancelPointer, { passive: true, capture: true });
    window.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("touchcancel", cancelTouch, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", cancelPointer, true);
      window.removeEventListener("click", onClickCapture, true);
    };
  }, [setIsOpen, edge]);
}
