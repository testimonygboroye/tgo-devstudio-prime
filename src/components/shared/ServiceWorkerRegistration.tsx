"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let active = true;
    const install = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (!active) return;

        // Check for a new worker on entry and periodically while the site is open.
        void registration.update().catch(() => {});
        const updateInterval = window.setInterval(() => {
          if (navigator.onLine) void registration.update().catch(() => {});
        }, 60 * 60 * 1000);

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              installing.postMessage({ type: "TGO_SKIP_WAITING" });
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // Avoid forced reloads: the active page remains usable and the next
          // navigation automatically uses the updated offline worker.
        });

        return () => window.clearInterval(updateInterval);
      } catch {
        // The online site remains fully usable when service workers are unavailable.
      }
    };

    let cleanup: (() => void) | undefined;
    void install().then((fn) => { cleanup = fn; });
    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return null;
}
