import type { Metadata } from "next";
import ContactForm from "@/components/public/ContactForm";
import AvailabilityBadge from "@/components/public/AvailabilityBadge";

export const metadata: Metadata = {
  title: "Contact | TGO DevStudio Prime",
  description: "Get in touch with TGO DevStudio about your next project.",
  openGraph: {
    title: "Contact | TGO DevStudio Prime",
    description: "Get in touch with TGO DevStudio about your next project.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <main className="ambient-glow relative min-h-screen px-6 py-24 sm:px-12">
      <div className="mx-auto max-w-xl text-center">
        <span className="eyebrow-label justify-center">Contact</span>
        <h1
          className="heading-premium mt-4 text-5xl font-bold brand-gradient-text sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Let&apos;s Talk
        </h1>
        <div className="mt-5 flex justify-center">
          <AvailabilityBadge />
        </div>
        <p className="mt-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Have a project in mind, a question, or just want to say hello? Send us a message and
          we&apos;ll respond as soon as we can.
        </p>
      </div>

      <div className="surface-card mx-auto mt-12 max-w-xl">
        <div className="surface-card-inner p-8 sm:p-10">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
