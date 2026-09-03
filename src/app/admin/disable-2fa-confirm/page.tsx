"use client";

import { useState, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";

function ConfirmForm() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const token = searchParams.get("token") || "";
  const loginPath = pathname.replace(/\/disable-2fa-confirm\/?$/, "/login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/confirm-disable-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to disable two-factor authentication.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return <p className="mt-8 text-center text-sm text-red-400">No recovery token provided.</p>;
  }

  return (
    <>
      {!success ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <p className="text-sm text-neutral-400">
            Confirm your email and password to disable two-factor authentication on this account.
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
            {isSubmitting ? "Disabling..." : "Disable Two-Factor Authentication"}
          </button>
        </form>
      ) : (
        <div className="mt-8 text-center">
          <p className="text-sm text-brand-cyan-300">Two-factor authentication has been disabled.</p>
          <p className="mt-2 text-sm text-neutral-400">
            You can now log in normally, and set up 2FA again anytime from your Security page.
          </p>
          <Link href={loginPath} className="mt-4 inline-block text-sm text-neutral-100 hover:text-brand-cyan-300">
            Go to login →
          </Link>
        </div>
      )}
    </>
  );
}

export default function DisableTwoFactorConfirmPage() {
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
            Confirm 2FA Disable
          </h1>
          <Suspense fallback={<p className="mt-8 text-center text-neutral-400">Loading...</p>}>
            <ConfirmForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
