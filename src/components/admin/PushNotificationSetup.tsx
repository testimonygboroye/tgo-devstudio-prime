"use client";

import { useEffect, useState } from "react";

type PushState = "checking" | "unsupported" | "disabled" | "off" | "on" | "working" | "error";

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export default function PushNotificationSetup() {
  const [state, setState] = useState<PushState>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (!cancelled) setState("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) {
          setState("disabled");
          setMessage("Notifications are blocked in this browser's site settings.");
        }
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) setState(subscription ? "on" : "off");
      } catch {
        if (!cancelled) {
          setState("error");
          setMessage("Could not initialize browser notifications. Check that this site uses HTTPS.");
        }
      }
    }

    void check();
    return () => { cancelled = true; };
  }, []);

  async function enableNotifications() {
    setState("working");
    setMessage("");

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("This browser does not support push notifications.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "disabled" : "off");
        setMessage("Notification permission was not granted.");
        return;
      }

      const keyResponse = await fetch("/api/push/public-key", { cache: "no-store" });
      const keyData = await keyResponse.json();
      if (!keyResponse.ok || !keyData.publicKey) {
        throw new Error(keyData.error || "Push notifications are not configured on the server.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToBytes(keyData.publicKey),
        });
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceLabel: /Android/i.test(navigator.userAgent) ? "Android device" : "Browser device",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "The server could not register this device.");
      }

      setState("on");
      setMessage("This device is subscribed. Notifications will arrive when supported events are connected.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not enable notifications.");
    }
  }

  async function disableNotifications() {
    setState("working");
    setMessage("");

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        const response = await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || "Could not remove this device from the server.");
        }

        await subscription.unsubscribe();
      }

      setState("off");
      setMessage("Notifications have been disabled on this device.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not disable notifications.");
    }
  }

  if (state === "unsupported") return null;

  return (
    <section
      aria-label="Push notification settings"
      className="mx-4 my-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-500/20 bg-slate-950/50 px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">Device notifications</p>
        <p aria-live="polite" className="mt-1 text-xs text-slate-400">
          {message || (
            state === "on"
              ? "This device is subscribed to push notifications."
              : state === "disabled"
                ? "Enable notifications in your browser's site settings first."
                : "Receive supported admin alerts on this device."
          )}
        </p>
      </div>

      {state === "on" ? (
        <button
          type="button"
          onClick={() => void disableNotifications()}
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-50"
          disabled={state === "working"}
        >
          Disable
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void enableNotifications()}
          disabled={state === "working" || state === "checking" || state === "disabled"}
          className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "working" ? "Please wait…" : state === "checking" ? "Checking…" : "Enable notifications"}
        </button>
      )}
    </section>
  );
}
