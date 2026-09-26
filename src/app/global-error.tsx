"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "#0B0E14" }}>
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="font-mono text-sm uppercase tracking-widest" style={{ color: "#6B7280" }}>
            Error 500
          </p>
          <h1
            className="text-6xl font-bold sm:text-8xl"
            style={{ background: "linear-gradient(135deg, #5B2EE8 0%, #6C3CE9 35%, #2EC5F0 75%, #22D3EE 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            Something Went Wrong
          </h1>
          <p className="max-w-md leading-relaxed" style={{ color: "#A8B0C3" }}>
            An unexpected error occurred. Please try again, or head back to the homepage.
          </p>
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full px-8 py-3.5 font-semibold"
              style={{ border: "1px solid #262C3D", color: "#F1F3F8", background: "transparent" }}
            >
              Try Again
            </button>
            <a
              href="/"
              className="rounded-full px-8 py-3.5 font-semibold"
              style={{ background: "linear-gradient(135deg, #5B2EE8 0%, #6C3CE9 35%, #2EC5F0 75%, #22D3EE 100%)", color: "#0B0E14" }}
            >
              Back to Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
