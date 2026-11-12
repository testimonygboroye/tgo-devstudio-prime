import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Requests | TGO DevStudio",
  description: "How to request access to, correction of, or deletion of personal data associated with TGO DevStudio services and communications.",
  robots: { index: true, follow: true },
};

export default function DataDeletionPage() {
  return <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
    <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-7 shadow-sm sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-500">Privacy & data rights</p>
      <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">Request deletion of your data</h1>
      <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">TGO DevStudio provides a way to request access to, correction of, or deletion of personal information associated with our website, client services and business communications, including WhatsApp conversations handled by our systems.</p>
      <h2 className="mt-8 text-lg font-semibold text-[var(--text-primary)]">How to submit a request</h2>
      <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-7 text-[var(--text-secondary)]">
        <li>Open our contact page and choose a privacy or data-deletion request.</li>
        <li>Tell us which TGO service you used and the account email or WhatsApp number associated with the data. Do not send passwords, access tokens, API keys or other login credentials.</li>
        <li>We may request reasonable information to verify that you control the account or communication channel before acting on the request.</li>
        <li>We will review the request and delete or anonymise personal data where applicable, subject to legitimate security, contractual and legal retention requirements.</li>
      </ol>
      <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
        <h2 className="font-semibold text-[var(--text-primary)]">Submit a privacy request</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Use the official TGO DevStudio contact channel and include “Personal data deletion request” in your message subject.</p>
        <Link href="/contact?subject=Personal%20data%20deletion%20request" className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white">Submit data deletion request</Link>
      </div>
      <p className="mt-8 text-xs leading-6 text-[var(--text-muted)]">For details about how we collect, use and protect information, read our <Link href="/privacy-policy" className="text-cyan-500 underline">Privacy Policy</Link>.</p>
    </section>
  </main>;
}
