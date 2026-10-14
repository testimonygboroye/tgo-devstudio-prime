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

type ConfirmationAction = "enable" | "disable" | null;

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const normalized = value.trim();
  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);

  const buffer = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }

  if (bytes.length !== 65 || bytes[0] !== 4) {
    throw new Error(
      "The server's VAPID public key is invalid. Check the notification environment variables on this hosting platform."
    );
  }

  return buffer;
}

function sameKey(
  current: ArrayBuffer | null,
  expected: ArrayBuffer
): boolean {
  if (!current) return false;

  const a = new Uint8Array(current);
  const b = new Uint8Array(expected);

  if (a.length !== b.length) return false;

  return a.every((value, index) => value === b[index]);
}

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export default function PushNotificationSetup() {
  const [state, setState] = useState<PushState>("checking");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] =
    useState<ConfirmationAction>(null);

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
          setMessage(
            "This browser does not support web push notifications. Open the site in a supported browser."
          );
        }
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) {
          setState("disabled");
          setMessage(
            "Notifications are blocked in this browser. Allow them in the browser's site settings, then reload this page."
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
              ? "A browser subscription exists on this device."
              : "Enable notifications to receive supported Founder alerts on this device."
          );
        }
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not initialize browser notifications."
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

    let createdSubscription: PushSubscription | null = null;

    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        throw new Error(
          "This browser does not support push notifications."
        );
      }

      if (Notification.permission === "denied") {
        setState("disabled");
        setMessage(
          "Notifications are blocked. Allow them in your browser's site settings, then reload."
        );
        return;
      }

      const keyResponse = await fetch("/api/push/public-key", {
        cache: "no-store",
        credentials: "same-origin",
      });

      const keyData = await readJson(keyResponse);

      if (
        !keyResponse.ok ||
        typeof keyData.publicKey !== "string" ||
        !keyData.publicKey.trim()
      ) {
        throw new Error(
          keyData.error ||
            "The server has not provided a valid push notification public key."
        );
      }

      const applicationServerKey = base64UrlToArrayBuffer(
        keyData.publicKey
      );

      const permission =
        await Notification.requestPermission();

      if (permission !== "granted") {
        setState(permission === "denied" ? "disabled" : "off");
        setMessage(
          permission === "denied"
            ? "Notifications were blocked. Allow them in your browser's site settings."
            : "Permission was not granted. You can try again whenever you wish."
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

      if (subscription) {
        const existingKey =
          subscription.options.applicationServerKey;

        if (
          existingKey &&
          !sameKey(existingKey, applicationServerKey)
        ) {
          const removeResponse = await fetch(
            "/api/push/subscribe",
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "same-origin",
              body: JSON.stringify({
                endpoint: subscription.endpoint,
              }),
            }
          );

          const removeResult = await readJson(removeResponse);

          if (!removeResponse.ok) {
            throw new Error(
              removeResult.error ||
                "Could not replace the previous notification subscription."
            );
          }

          await subscription.unsubscribe();
          subscription = null;
        }
      }

      if (!subscription) {
        try {
          subscription =
            await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey,
            });

          createdSubscription = subscription;
        } catch (error) {
          const details =
            error instanceof Error ? error.message : "";

          if (
            /push service error|registration failed/i.test(details)
          ) {
            throw new Error(
              "Your browser's push service rejected the subscription. Check that you are using a supported browser with its push services available, and that this hosting platform has the correct VAPID public key. No new server subscription was saved."
            );
          }

          throw error;
        }
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

      const result = await readJson(response);

      if (!response.ok) {
        throw new Error(
          result.error ||
            "The browser subscription could not be saved on the server."
        );
      }

      setState("on");
      setMessage(
        "Notifications are enabled on this device. You can disable them at any time."
      );
    } catch (error) {
      if (createdSubscription) {
        try {
          await createdSubscription.unsubscribe();
        } catch {
          // Keep the original, more useful error message.
        }
      }

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

        const result = await readJson(response);

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Could not remove this device's server subscription."
          );
        }

        await subscription.unsubscribe();
      }

      setState("off");
      setMessage(
        "Notifications have been disabled on this device."
      );
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not disable notifications."
      );
    }
  }

  async function confirmAction() {
    const action = confirmation;
    setConfirmation(null);

    if (action === "enable") {
      await enableNotifications();
    } else if (action === "disable") {
      await disableNotifications();
    }
  }

  return (
    <>
      <section
        aria-label="Push notification settings"
        className="mx-4 my-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-500/20 bg-slate-950/50 px-4 py-3"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            Device notifications
          </p>

          <p
            aria-live="polite"
            className="mt-1 whitespace-pre-line text-xs text-slate-400"
          >
            {message ||
              (state === "checking"
                ? "Checking notification support…"
                : state === "on"
                  ? "This device is subscribed to push notifications."
                  : state === "disabled"
                    ? "Notifications are blocked in this browser."
                    : "Receive supported Founder alerts on this device.")}
          </p>
        </div>

        {state === "on" ? (
          <button
            type="button"
            onClick={() => setConfirmation("disable")}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
          >
            Disable notifications
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmation("enable")}
            disabled={
              state === "working" ||
              state === "checking" ||
              state === "disabled" ||
              state === "unsupported"
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

      {confirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmation(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="push-confirm-title"
            aria-describedby="push-confirm-description"
            className="w-full max-w-md rounded-2xl border border-violet-500/30 bg-slate-950 p-6 shadow-2xl"
          >
            <h2
              id="push-confirm-title"
              className="text-lg font-semibold text-white"
            >
              {confirmation === "enable"
                ? "Enable notifications?"
                : "Disable notifications?"}
            </h2>

            <p
              id="push-confirm-description"
              className="mt-3 text-sm leading-6 text-slate-300"
            >
              {confirmation === "enable"
                ? "Allow this device to receive supported TGO DevStudio Founder alerts? Your browser may also ask you to grant notification permission."
                : "Stop push notifications on this device? You can enable them again later."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void confirmAction()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
              >
                {confirmation === "enable"
                  ? "Yes, enable"
                  : "Yes, disable"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
