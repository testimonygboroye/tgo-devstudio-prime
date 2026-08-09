import type { Metadata } from "next";
import ContactForm from "@/components/public/ContactForm";

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
    <main className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-xl">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Contact</p>
        <h1 className="mt-2 text-4xl font-bold brand-gradient-text sm:text-5xl">Let's Talk</h1>
        <p className="mt-4 text-neutral-100/70">
          Have a project in mind, a question, or just want to say hello? Send us a message and
          we'll respond as soon as we can.
        </p>

        <div className="mt-10">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
