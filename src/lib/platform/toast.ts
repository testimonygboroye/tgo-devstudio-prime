"use client";
export type TgoToastKind = "success" | "error" | "info" | "warning";
export function notify(message: string, kind: TgoToastKind = "info", duration = 4200) {
  if (typeof window === "undefined" || !message.trim()) return;
  window.dispatchEvent(new CustomEvent("tgo:toast", { detail: { message: message.trim(), kind, duration } }));
}
