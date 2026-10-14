"use client";

import { useEffect, useState } from "react";

type PushState =
  | "checking"
  | "unsupported"
  | "disabled"
  | "off"
  | "on"
  | "working"
  | "error";

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);

  const buffer = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }

  return buffer;
}

export default function PushNotificationSetup() {
  const [state, setState] = useState<PushState>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (!cancelled) {
          setState("unsupported");
          setMessage("This browser does not support push notifications.");
        }
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) {
          setState("disabled");
          setMessage(
            "Notifications are blocked. Allow them in your browser's site settings, then reload."
          );
        }
        return;
      }

      try {
        const registration =
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

        await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        if (!cancelled) {
          setState(subscription ? "on" : "off");
          setMessage(
            subscription
              ? "This device has a browser subscription. Notifications depend on server registration and delivery."
              : "Enable notifications to receive supported Founder alerts on this device."
          );
        }
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not initialize browser notifications. Check HTTPS and browser support."
          );
        }
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  async function enableNotifications() {
    setState("working");
    setMessage("");

    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        throw new Error("This browser does not support push notifications.");
      }

      // Check server configuration before requesting browser permission.
      const keyResponse = await fetch("/api/push/public-key", {
        cache: "no-store",
      });

      const keyData = await keyResponse.json();

      if (!keyResponse.ok || typeof keyData.publicKey !== "string") {
        throw new Error(
          keyData.error ||
            "Push notifications are not configured correctly on the server."
        );
      }

      if (Notification.permission === "denied") {
        setState("disabled");
        setMessage(
          "Notifications are blocked. Allow them in your browser's site settings, then reload."
        );
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState(permission === "denied" ? "disabled" : "off");
        setMessage(
          permission === "denied"
            ? "Notifications are blocked. Allow them in your browser's site settings."
            : "Notification permission was not granted. Tap Enable notifications to try again."
        );
        return;
      }

      const registration =
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

      await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToArrayBuffer(
            keyData.publicKey
          ),
        });
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceLabel: /Android/i.test(navigator.userAgent)
            ? "Android device"
            : "Browser device",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "The server could not register this device."
        );
      }

      setState("on");
      setMessage(
        "Notifications are enabled for this device. Supported alerts can now be delivered while this subscription remains active."
      );
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not enable notifications."
      );
    }
  }

  async function disableNotifications() {
    setState("working");
    setMessage("");

    try {
      const registration =
        await navigator.serviceWorker.getRegistration("/");

      const subscription =
        await registration?.pushManager.getSubscription();

      if (subscription) {
        const response = await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Could not remove this device from the server."
          );
        }

        await subscription.unsubscribe();
      }

      setState("off");
      setMessage("Notifications have been disabled on this device.");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not disable notifications."
      );
    }
  }

  if (state === "unsupported") {
    return (
      <section
        aria-label="Push notification status"
        className="mx-4 my-3 rounded-xl border border-amber-500/20 bg-slate-950/50 px-4 py-3"
      >
        <p className="text-sm font-semibold text-white">
          Push notifications unavailable
        </p>
        <p className="mt-1 text-xs text-slate-400">{message}</p>
      </section>
    );
  }

  return (
    <section
      aria-label="Push notification settings"
      className="mx-4 my-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-500/20 bg-slate-950/50 px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">
          Device notifications
        </p>

        <p aria-live="polite" className="mt-1 text-xs text-slate-400">
          {message ||
            (state === "on"
              ? "This device is subscribed to push notifications."
              : state === "disabled"
                ? "Allow notifications in your browser settings."
                : "Receive supported Founder alerts on this device.")}
        </p>
      </div>

      {state === "on" ? (
        <button
          type="button"
          onClick={() => void disableNotifications()}
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
        >
          Disable
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void enableNotifications()}
          disabled={
            state === "working" ||
            state === "checking" ||
            state === "disabled"
          }
          className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "working"
            ? "Please wait…"
            : state === "checking"
              ? "Checking…"
              : state === "disabled"
                ? "Notifications blocked"
                : "Enable notifications"}
        </button>
      )}
    </section>
  );
}
