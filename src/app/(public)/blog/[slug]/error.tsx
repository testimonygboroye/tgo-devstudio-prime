"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function BlogDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      "[TGO BlogDetailError]",
      error
    );
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-20">
      <section className="surface-card w-full max-w-xl text-center">
        <div className="surface-card-inner p-8 sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
            Blog
          </p>

          <h1 className="mt-4 text-3xl font-bold brand-gradient-text sm:text-4xl">
            This article could not be loaded
          </h1>

          <p className="mt-4 text-sm leading-7 text-neutral-400">
            Something went wrong while loading this article.
            Please try again or return to the blog.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full border border-base-700 px-6 py-3 text-sm font-semibold text-neutral-200 hover:border-brand-cyan-400"
            >
              Try Again
            </button>

            <Link
              href="/blog"
              className="rounded-full brand-gradient-bg px-6 py-3 text-sm font-semibold text-base-950"
            >
              Back to Blog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
