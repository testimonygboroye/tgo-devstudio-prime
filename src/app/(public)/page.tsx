export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-mono text-sm uppercase tracking-widest text-neutral-400">
        Design token verification
      </p>
      <h1 className="text-5xl font-bold brand-gradient-text sm:text-7xl">
        TGO DevStudio Prime
      </h1>
      <p className="max-w-xl text-lg text-neutral-100/80">
        This page confirms the brand typography, color tokens, and gradient
        are rendering correctly before the real homepage is built.
      </p>
      <div className="mt-4 h-2 w-48 rounded-full brand-gradient-bg" />
    </main>
  );
}
