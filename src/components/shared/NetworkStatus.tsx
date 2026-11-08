"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ConnectionState = "online" | "offline" | "restored";

export default function NetworkStatus() {
  const [state, setState] = useState<ConnectionState>("online");
  const [visible, setVisible] = useState(false);
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);

  const clearTimers = useCallback(() => {
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    verifyTimer.current = null;
    hideTimer.current = null;
  }, []);

  const confirmConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setState("offline");
      setVisible(true);
      return;
    }
    try {
      const response = await fetch(`/favicon.png?network-check=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Connection check failed");
      clearTimers();
      setState("restored");
      setVisible(true);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        setState("online");
      }, 2200);
    } catch {
      setState("offline");
      setVisible(true);
    }
  }, [clearTimers]);

  useEffect(() => {
    mounted.current = true;
    if (!navigator.onLine) {
      setState("offline");
      setVisible(true);
    }

    const handleOffline = () => {
      clearTimers();
      setState("offline");
      setVisible(true);
    };
    const handleOnline = () => {
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
      verifyTimer.current = setTimeout(() => void confirmConnection(), 350);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Recheck when a suspended mobile tab becomes active again.
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void confirmConnection();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Some mobile browsers do not reliably emit online/offline events.
    const interval = window.setInterval(() => {
      if (!navigator.onLine) {
        setState("offline");
        setVisible(true);
      }
    }, 12000);

    return () => {
      mounted.current = false;
      clearTimers();
      window.clearInterval(interval);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [clearTimers, confirmConnection]);

  const retry = () => {
    if (navigator.onLine) void confirmConnection();
  };

  if (!visible || state === "online") return null;

  const restored = state === "restored";
  return (
    <div
      className={`tgo-network-toast ${restored ? "is-restored" : "is-offline"}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="tgo-network-icon" aria-hidden="true">
        {restored ? "✓" : "⌁"}
      </span>
      <span className="tgo-network-copy">
        <strong>{restored ? "Connection restored" : "You're offline"}</strong>
        <span>{restored ? "You're back online. Everything is ready." : "Some features may be unavailable until you reconnect."}</span>
      </span>
      {!restored && (
        <button type="button" className="tgo-network-retry" onClick={retry} disabled={!navigator.onLine}>
          Retry
        </button>
      )}
      <button type="button" className="tgo-network-close" onClick={() => setVisible(false)} aria-label="Dismiss connection notice">×</button>
    </div>
  );
}
