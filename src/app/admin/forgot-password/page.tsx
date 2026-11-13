"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const pathname = usePathname();
  const loginPath = pathname.replace(/\/forgot-password\/?$/, "/login");

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#080b18] text-white">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(91,46,232,.24),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(46,197,240,.14),transparent_36%)]"/>
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#10172b]/85 p-6 shadow-[0_30px_100px_rgba(0,0,0,.48)] backdrop-blur-2xl sm:p-9">
          <div className="flex justify-center">
            <Image src="/logo.png" alt="TGO DevStudio logo" width={64} height={64} priority />
          </div>
          <p className="mt-4 text-center font-mono text-xs uppercase tracking-widest text-neutral-400">
            TGO DevStudio Prime
          </p>
          <h1 className="mt-1 text-center text-2xl font-bold brand-gradient-text">
            Reset Password
          </h1>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <p className="text-sm text-neutral-400">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
              <div>
                <label htmlFor="email" className="block text-sm text-neutral-400">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl brand-gradient-bg px-4 py-3 font-semibold text-base-950 shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <p className="mt-8 text-center text-sm text-brand-cyan-300">
              If an account exists with that email, a reset link has been sent.
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
