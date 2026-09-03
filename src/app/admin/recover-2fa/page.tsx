"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";

export default function Recover2FAPage() {
  const pathname = usePathname();
  const loginPath = pathname.replace(/\/recover-2fa\/?$/, "/login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/recover-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }

      setSubmitted(true);
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
            Recover 2FA Access
          </h1>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <p className="text-sm text-neutral-400">
                Lost your authenticator and backup codes? Confirm your email and password, and
                we&apos;ll email you a fresh secret key and new backup codes.
              </p>
              <div>
                <label htmlFor="email" className="block text-sm text-neutral-400">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm text-neutral-400">Password</label>
                <PasswordInput id="password" value={password} onChange={setPassword} required autoComplete="current-password" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md brand-gradient-bg px-4 py-2 font-semibold text-base-950 disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Send New 2FA Details"}
              </button>
            </form>
          ) : (
            <p className="mt-8 text-center text-sm text-brand-cyan-300">
              If the details are correct and two-factor authentication is enabled on that account,
              new recovery details have been emailed.
            </p>
          )}

          <p className="mt-6 text-center">
            <Link href={loginPath} className="text-xs text-neutral-400 hover:text-brand-cyan-300">
              ← Back to login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
