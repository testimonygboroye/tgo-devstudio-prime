"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";

interface BackToTopButtonProps {
  scrollContainerId?: string;
  threshold?: number;
  position?: "left" | "right";
}

export default function BackToTopButton({
  scrollContainerId,
  threshold = 400,
  position = "left",
}: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getContainer = useCallback((): HTMLElement | null => {
    return scrollContainerId ? document.getElementById(scrollContainerId) : null;
  }, [scrollContainerId]);

  useEffect(() => {
    const container = getContainer();
    const target: EventTarget = container ?? window;

    function handleScroll() {
      const scrollTop = container ? container.scrollTop : window.scrollY;
      setIsVisible(scrollTop > threshold);
    }

    target.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => target.removeEventListener("scroll", handleScroll);
  }, [getContainer, threshold]);

  function handleClick() {
    const container = getContainer();
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!isVisible) return null;

  return (
    <button
      onClick={handleClick}
      aria-label="Back to top"
      className={`fixed bottom-24 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-base-800 bg-base-900 text-brand-cyan-300 shadow-lg transition-transform hover:scale-105 hover:border-brand-cyan-400 active:scale-95 ${
        position === "left" ? "left-6" : "right-6"
      }`}
    >
      <ArrowUp size={20} />
    </button>
  );
}
