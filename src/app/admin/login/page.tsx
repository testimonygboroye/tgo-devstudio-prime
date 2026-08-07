"use client";

import { useState } from "react";

type LoginStep = "credentials" | "twoFactor";

export default function AdminLoginPage() {
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function goToDashboard() {
    const dashboardPath = window.location.pathname.replace(/\/login\/?$/, "/dashboard");
    window.location.href = dashboardPath;
  }

  async function handleCredentialsSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      if (data.status === "2fa_required") {
        setTempToken(data.tempToken);
        setStep("twoFactor");
        return;
      }

      goToDashboard();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTwoFactorSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid code.");
        return;
      }

      goToDashboard();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-center font-mono text-xs uppercase tracking-widest text-neutral-400">
          TGO DevStudio Prime
        </p>
        <h1 className="mt-1 text-center text-2xl font-bold brand-gradient-text">
          Admin Sign In
        </h1>

        {step === "credentials" && (
          <form onSubmit={handleCredentialsSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-neutral-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-neutral-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md brand-gradient-bg px-4 py-2 font-semibold text-base-950 disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        {step === "twoFactor" && (
          <form onSubmit={handleTwoFactorSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm text-neutral-400">
                Authentication code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoFocus
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-center text-lg tracking-widest text-neutral-100 outline-none focus:border-brand-cyan-400"
                placeholder="000000"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md brand-gradient-bg px-4 py-2 font-semibold text-base-950 disabled:opacity-60"
            >
              {isSubmitting ? "Verifying..." : "Verify"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
