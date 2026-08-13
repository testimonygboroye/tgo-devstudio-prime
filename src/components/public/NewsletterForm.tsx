"use client";

import { useState } from "react";
import TurnstileWidget from "@/components/public/TurnstileWidget";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!turnstileToken) {
      setError("Please complete the verification challenge.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyWebsite, turnstileToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to subscribe.");
        return;
      }

      setMessage(data.message || "Subscribed!");
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (message) {
    return <p className="text-sm text-brand-cyan-300">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={companyWebsite}
        onChange={(e) => setCompanyWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-cyan-400 sm:flex-1"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="whitespace-nowrap rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950 disabled:opacity-60"
        >
          {isSubmitting ? "Subscribing..." : "Subscribe"}
        </button>
      </div>
      <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
