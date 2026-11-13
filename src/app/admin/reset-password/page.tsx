"use client";

import { useState, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const token = searchParams.get("token") || "";
  const loginPath = pathname.replace(/\/reset-password\/?$/, "/login");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to reset password.");
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
    return <p className="mt-8 text-center text-sm text-red-400">No reset token provided.</p>;
  }

  return (
    <>
      {!success ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm text-neutral-400">New Password</label>
            <PasswordInput id="password" value={password} onChange={setPassword} required autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-neutral-400">Confirm New Password</label>
            <PasswordInput id="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} required autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl brand-gradient-bg px-4 py-3 font-semibold text-base-950 shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:opacity-60"
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      ) : (
        <div className="mt-8 text-center">
          <p className="text-sm text-brand-cyan-300">Password reset successfully.</p>
          <Link href={loginPath} className="mt-4 inline-block text-sm text-neutral-100 hover:text-brand-cyan-300">
            Go to login →
          </Link>
        </div>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
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
            Set New Password
          </h1>
          <Suspense fallback={<p className="mt-8 text-center text-neutral-400">Loading...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
