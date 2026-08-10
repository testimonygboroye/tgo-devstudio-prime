import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-mono text-sm uppercase tracking-widest text-neutral-400">Error 404</p>
      <h1 className="text-5xl font-bold brand-gradient-text sm:text-7xl">Page Not Found</h1>
      <p className="max-w-md text-neutral-100/70">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-md brand-gradient-bg px-6 py-3 font-semibold text-base-950"
      >
        Back to Home
      </Link>
    </main>
  );
}
