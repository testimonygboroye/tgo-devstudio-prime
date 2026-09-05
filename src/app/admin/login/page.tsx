"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/shared/PasswordInput";

type LoginStep = "credentials" | "twoFactor";

export default function AdminLoginPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const forgotPasswordPath = pathname.replace(/\/login\/?$/, "/forgot-password");
  const recover2FAPath = pathname.replace(/\/login\/?$/, "/recover-2fa");
  const redirectTarget = searchParams.get("redirect");

  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function goToDestination() {
    if (redirectTarget && redirectTarget.startsWith(pathname.replace(/\/login\/?$/, ""))) {
      window.location.href = redirectTarget;
      return;
    }
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

      goToDestination();
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
        body: JSON.stringify({ tempToken, code, isBackupCode: useBackupCode }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid code.");
        return;
      }

      goToDestination();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex justify-center">
            <Image src="/logo.png" alt="TGO DevStudio logo" width={64} height={64} priority />
          </div>
          <p className="mt-4 text-center font-mono text-xs uppercase tracking-widest text-neutral-400">
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm text-neutral-400">
                    Password
                  </label>
                  <Link href={forgotPasswordPath} className="text-xs text-brand-cyan-300 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                  required
                  autoComplete="current-password"
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
                  {useBackupCode ? "Backup code" : "Authentication code"}
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode={useBackupCode ? "text" : "numeric"}
                  autoFocus
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-center text-lg tracking-widest text-neutral-100 outline-none focus:border-brand-cyan-400"
                  placeholder={useBackupCode ? "XXXXX-XXXXX" : "000000"}
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

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode((prev) => !prev);
                    setCode("");
                    setError("");
                  }}
                  className="text-neutral-400 hover:text-brand-cyan-300"
                >
                  {useBackupCode ? "Use authenticator code instead" : "Use a backup code instead"}
                </button>
                <Link href={recover2FAPath} className="text-red-300 hover:underline">
                  Lost access?
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t border-base-800 px-6 py-6 text-center">
        <Link href="/" className="text-xs text-neutral-400 hover:text-brand-cyan-300">
          ← Back to site
        </Link>
        <p className="mt-2 text-xs text-neutral-400">
          © {new Date().getFullYear()} TGO DevStudio. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
