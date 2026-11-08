"use client";
import { useEffect } from "react";

/** Shared edge-swipe behavior for TGO navigation drawers. */
export function useSwipeSidebar(isOpen: boolean, setIsOpen: (open: boolean) => void, edge: "left" | "right") {
  useEffect(() => {
    let startX = 0, startY = 0, tracking = false;
    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0], width = window.innerWidth;
      const edgeZone = edge === "left" ? touch.clientX <= 26 : touch.clientX >= width - 26;
      const drawerZone = edge === "left" ? touch.clientX <= Math.min(340, width * .8) : touch.clientX >= width - Math.min(340, width * .8);
      tracking = isOpen ? drawerZone : edgeZone;
      if (tracking) { startX = touch.clientX; startY = touch.clientY; }
    };
    const onEnd = (event: TouchEvent) => {
      if (!tracking || !event.changedTouches.length) return;
      tracking = false;
      const touch = event.changedTouches[0], dx = touch.clientX - startX, dy = touch.clientY - startY;
      if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      const opens = edge === "left" ? dx > 0 : dx < 0;
      if (opens !== isOpen) setIsOpen(opens);
    };
    const onCancel = () => { tracking = false; };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onCancel);
    };
  }, [edge, isOpen, setIsOpen]);
}
