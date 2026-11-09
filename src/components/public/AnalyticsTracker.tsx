"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type QueuedView = { eventId: string; visitorId: string; sessionId: string; path: string; url: string; metadata: Record<string, unknown> };
const QUEUE_KEY = "tgo-analytics-queue-v1";
const VISITOR_KEY = "tgo-analytics-visitor-v1";
const SESSION_KEY = "tgo-analytics-session-v1";
const SESSION_ACTIVITY_KEY = "tgo-analytics-session-activity-v1";
function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `tgo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
function stableId(storage: Storage, key: string) {
  let value = storage.getItem(key);
  if (!value) { value = makeId(); storage.setItem(key, value); }
  return value;
}
function readQueue(): QueuedView[] {
  try { const value = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); return Array.isArray(value) ? value.slice(-100) : []; }
  catch { return []; }
}
async function flushQueue() {
  if (!navigator.onLine) return;
  for (const item of readQueue()) {
    try {
      const response = await fetch("/api/analytics/track", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", keepalive: true, body: JSON.stringify(item),
      });
      if (!response.ok) break;
      localStorage.setItem(QUEUE_KEY, JSON.stringify(readQueue().filter((entry) => entry.eventId !== item.eventId)));
    } catch { break; }
  }
}

type TrackedEventName = "whatsapp_click" | "email_click" | "book_call_click" | "calendly_event_scheduled" | "contact_cta_click" | "portfolio_click" | "service_click" | "newsletter_signup_click" | "cta_click";

function trackInteraction(eventName: TrackedEventName, target?: string) {
  try {
    const visitorId = stableId(localStorage, VISITOR_KEY);
    const sessionId = stableId(sessionStorage, SESSION_KEY);
    const eventId = makeId();
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({
        eventId,
        visitorId,
        sessionId,
        eventName,
        path: window.location.pathname,
        target,
      }),
    }).catch(() => undefined);
  } catch {
    // Conversion tracking must never interrupt navigation.
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");
  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    try {
      const visitorId = stableId(localStorage, VISITOR_KEY);
      const lastActivity = Number(sessionStorage.getItem(SESSION_ACTIVITY_KEY) || "0");
      if (!lastActivity || Date.now() - lastActivity > 30 * 60 * 1000) sessionStorage.setItem(SESSION_KEY, makeId());
      const sessionId = stableId(sessionStorage, SESSION_KEY);
      sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const isStandalonePwa = window.matchMedia?.("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      const entry: QueuedView = {
        eventId: makeId(), visitorId, sessionId, path: decodeURIComponent(pathname), url: window.location.href,
        metadata: {
          language: navigator.language || undefined, languages: Array.isArray(navigator.languages) ? navigator.languages : undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
          screenWidth: window.screen?.width, screenHeight: window.screen?.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
          isStandalonePwa, cookiesEnabled: navigator.cookieEnabled, referrer: document.referrer || undefined,
          utmSource: params.get("utm_source") || undefined, utmMedium: params.get("utm_medium") || undefined,
          utmCampaign: params.get("utm_campaign") || undefined, utmTerm: params.get("utm_term") || undefined, utmContent: params.get("utm_content") || undefined,
        },
      };
      const queue = readQueue(); queue.push(entry); localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-100))); void flushQueue();
    } catch { /* Tracking must never disrupt page rendering. */ }
  }, [pathname]);
  useEffect(() => {
    const retry = () => void flushQueue();
    window.addEventListener("online", retry); window.addEventListener("pageshow", retry); document.addEventListener("visibilitychange", retry);
    return () => { window.removeEventListener("online", retry); window.removeEventListener("pageshow", retry); document.removeEventListener("visibilitychange", retry); };
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target) return;
      const href = target.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      let eventName: TrackedEventName | undefined;
      let eventTarget: string | undefined;
      if (href.startsWith("mailto:")) {
        eventName = "email_click";
        eventTarget = "mailto";
      } else if (href.startsWith("tel:")) {
        return;
      } else {
        try {
          const url = new URL(href, window.location.origin);
          const host = url.hostname.toLowerCase();
          if (host === "wa.me" || host.endsWith(".whatsapp.com") || host === "whatsapp.com") {
            eventName = "whatsapp_click";
            eventTarget = "whatsapp";
          } else if (host === "calendly.com" || host.endsWith(".calendly.com") || url.pathname.includes("/book-a-call")) {
            eventName = "book_call_click";
            eventTarget = host === window.location.hostname ? url.pathname : "calendly.com";
          } else if (url.origin === window.location.origin && url.pathname.startsWith("/contact")) {
            eventName = "contact_cta_click";
            eventTarget = url.pathname;
          } else if (url.origin === window.location.origin && url.pathname.startsWith("/portfolio/")) {
            eventName = "portfolio_click";
            eventTarget = url.pathname;
          } else if (url.origin === window.location.origin && url.pathname.startsWith("/services/")) {
            eventName = "service_click";
            eventTarget = url.pathname;
          }
        } catch {
          return;
        }
      }

      const customEvent = target.getAttribute("data-analytics-event");
      if (customEvent === "newsletter_signup_click") eventName = "newsletter_signup_click";
      if (customEvent === "cta_click") eventName = "cta_click";
      if (eventName) trackInteraction(eventName, eventTarget);
    };

    const handleCalendlyMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith("calendly.com")) return;
      const payload = event.data as { event?: string } | null;
      if (payload?.event === "calendly.event_scheduled") {
        trackInteraction("calendly_event_scheduled", "calendly.com");
      }
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("message", handleCalendlyMessage);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("message", handleCalendlyMessage);
    };
  }, []);

  return null;
}
