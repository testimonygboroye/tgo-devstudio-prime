"use client";

import { useState, useEffect } from "react";
import PasswordInput from "@/components/shared/PasswordInput";

type ViewState = "loading" | "status" | "settingUp" | "backupCodesShown" | "disabling";

export default function SecurityClient() {
  const [view, setView] = useState<ViewState>("loading");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const [disablePassword, setDisablePassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    const res = await fetch("/api/auth/2fa-status");
    const data = await res.json();
    if (data.status === "ok") {
      setTwoFactorEnabled(data.twoFactorEnabled);
    }
    setView("status");
  }

  async function startSetup() {
    setError("");
    setIsSubmitting(true);
    const res = await fetch("/api/auth/setup-2fa", { method: "POST" });
    const data = await res.json();
    setIsSubmitting(false);
    if (!res.ok) {
      setError(data.message || "Failed to start setup.");
      return;
    }
    setQrCodeDataUrl(data.qrCodeDataUrl);
    setSecret(data.secret);
    setConfirmCode("");
    setView("settingUp");
  }

  async function confirmSetup(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const res = await fetch("/api/auth/confirm-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: confirmCode }),
    });
    const data = await res.json();
    setIsSubmitting(false);
    if (!res.ok) {
      setError(data.message || "Invalid code.");
      return;
    }
    setBackupCodes(data.backupCodes);
    setTwoFactorEnabled(true);
    setView("backupCodesShown");
  }

  function downloadBackupCodes() {
    const content = `TGO DevStudio Prime — Two-Factor Backup Codes\nEach code can be used once.\n\n${backupCodes.join("\n")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tgo-devstudio-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function finishBackupCodes() {
    setBackupCodes([]);
    setView("status");
  }

  async function handleDisable(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const res = await fetch("/api/auth/disable-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: disablePassword }),
    });
    const data = await res.json();
    setIsSubmitting(false);
    if (!res.ok) {
      setError(data.message || "Failed to disable 2FA.");
      return;
    }
    setDisablePassword("");
    setTwoFactorEnabled(false);
    setView("status");
  }

  if (view === "loading") {
    return <p className="text-neutral-400">Loading...</p>;
  }

  if (view === "status") {
    return (
      <div className="max-w-xl space-y-4">
        <div className="rounded-lg border border-base-800 bg-base-900 p-4">
          <p className="text-sm font-semibold text-neutral-100">
            Two-Factor Authentication is currently{" "}
            <span className={twoFactorEnabled ? "text-green-400" : "text-neutral-500"}>
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            {twoFactorEnabled
              ? "Your account requires a code from your authenticator app (or a backup code) at login."
              : "Add an extra layer of security to your account with an authenticator app."}
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={startSetup}
            disabled={isSubmitting}
            className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950 disabled:opacity-60"
          >
            {twoFactorEnabled ? "Re-setup 2FA (new codes)" : "Set Up 2FA"}
          </button>

          {twoFactorEnabled && (
            <button
              onClick={() => setView("disabling")}
              className="rounded-md border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
            >
              Disable 2FA
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view === "settingUp") {
    return (
      <div className="max-w-xl space-y-4">
        <p className="text-sm text-neutral-400">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), or
          enter the secret key manually.
        </p>

        {qrCodeDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrCodeDataUrl} alt="2FA QR Code" className="h-48 w-48 rounded-md bg-white p-2" />
        )}

        <div className="rounded-md border border-base-800 bg-base-900 p-3">
          <p className="text-xs text-neutral-500">Manual entry secret:</p>
          <p className="mt-1 break-all font-mono text-sm text-brand-cyan-300">{secret}</p>
        </div>

        <form onSubmit={confirmSetup} className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-400">Enter the 6-digit code from your app</label>
            <input
              required
              inputMode="numeric"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-md border border-base-800 bg-base-900 px-3 py-2 text-center text-lg tracking-widest text-neutral-100 outline-none focus:border-brand-cyan-400"
              placeholder="000000"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950 disabled:opacity-60"
            >
              {isSubmitting ? "Verifying..." : "Verify & Enable"}
            </button>
            <button
              type="button"
              onClick={() => setView("status")}
              className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (view === "backupCodesShown") {
    return (
      <div className="max-w-xl space-y-4">
        <div className="rounded-md border border-brand-cyan-400/40 bg-brand-cyan-400/10 p-3 text-sm text-brand-cyan-300">
          Two-factor authentication is now enabled. Save these backup codes somewhere safe — each
          works once, and they&apos;re the only way back into your account if you lose your
          authenticator app.
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-md border border-base-800 bg-base-900 p-4 font-mono text-sm text-neutral-100">
          {backupCodes.map((code) => (
            <div key={code}>{code}</div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={downloadBackupCodes}
            className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
          >
            Download Codes
          </button>
          <button
            onClick={finishBackupCodes}
            className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950"
          >
            I&apos;ve Saved My Codes
          </button>
        </div>
      </div>
    );
  }

  if (view === "disabling") {
    return (
      <form onSubmit={handleDisable} className="max-w-sm space-y-4">
        <p className="text-sm text-neutral-400">Enter your password to disable two-factor authentication.</p>
        <div>
          <label className="block text-sm text-neutral-400">Password</label>
          <PasswordInput id="disablePassword" value={disablePassword} onChange={setDisablePassword} required autoComplete="current-password" />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            {isSubmitting ? "Disabling..." : "Disable 2FA"}
          </button>
          <button
            type="button"
            onClick={() => setView("status")}
            className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return null;
}
