import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ambient-glow relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="eyebrow-label justify-center">Error 404</span>
      <h1 className="heading-premium text-6xl font-bold brand-gradient-text sm:text-8xl" style={{ fontFamily: "var(--font-display)" }}>
        Page Not Found
      </h1>
      <p className="max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link href="/" className="btn-premium-primary mt-4 rounded-full px-8 py-3.5 font-semibold text-base-950">
        Back to Home
      </Link>
    </main>
  );
}
