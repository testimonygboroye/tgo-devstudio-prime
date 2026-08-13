"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";

function SignupForm() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const token = searchParams.get("token") || "";
  const loginPath = pathname.replace(/\/signup\/?$/, "/login");

  const [isValidating, setIsValidating] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<{ email: string; roleName: string } | null>(null);
  const [validationError, setValidationError] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function validate() {
      if (!token) {
        setValidationError("No invite token provided.");
        setIsValidating(false);
        return;
      }
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setValidationError(data.message || "Invalid invite.");
          setIsValidating(false);
          return;
        }
        setInviteInfo(data.invite);
      } catch {
        setValidationError("Something went wrong loading this invite. Please try refreshing the page.");
      } finally {
        setIsValidating(false);
      }
    }
    validate();
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup-via-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to create account.");
        return;
      }

      setSuccess(true);
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
            Accept Invite
          </h1>

          {isValidating && <p className="mt-8 text-center text-neutral-400">Validating invite...</p>}

          {!isValidating && validationError && (
            <p className="mt-8 text-center text-sm text-red-400">{validationError}</p>
          )}

          {!isValidating && inviteInfo && !success && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="rounded-md border border-base-800 bg-base-900 p-3 text-sm text-neutral-400">
                Creating an account for <span className="text-neutral-100">{inviteInfo.email}</span> as{" "}
                <span className="text-brand-cyan-300">{inviteInfo.roleName}</span>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm text-neutral-400">Full Name</label>
                <input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm text-neutral-400">Password</label>
                <PasswordInput id="password" value={password} onChange={setPassword} required autoComplete="new-password" />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm text-neutral-400">Confirm Password</label>
                <PasswordInput id="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} required autoComplete="new-password" />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md brand-gradient-bg px-4 py-2 font-semibold text-base-950 disabled:opacity-60"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {success && (
            <div className="mt-8 text-center">
              <p className="text-sm text-brand-cyan-300">Account created successfully.</p>
              <Link href={loginPath} className="mt-4 inline-block text-sm text-neutral-100 hover:text-brand-cyan-300">
                Go to login →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminSignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-neutral-400">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
