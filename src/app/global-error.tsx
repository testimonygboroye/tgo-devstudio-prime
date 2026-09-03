"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0A0A0F] px-6 text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-neutral-400">
            Error 500
          </p>
          <h1 className="text-5xl font-bold text-neutral-100 sm:text-7xl">
            Something Went Wrong
          </h1>
          <p className="max-w-md text-neutral-100/70">
            An unexpected error occurred. Please try again, or head back to the homepage.
          </p>
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="rounded-md border border-neutral-700 px-6 py-3 font-semibold text-neutral-100"
            >
              Try Again
            </button>
            <a
              href="/"
              className="rounded-md bg-gradient-to-r from-[#6C3CE9] to-[#2EC5F0] px-6 py-3 font-semibold text-[#0A0A0F]"
            >
              Back to Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
