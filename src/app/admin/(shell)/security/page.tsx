import SecurityClient from "./SecurityClient";

export default function SecurityPage() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Account</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Security &amp; Two-Factor Authentication</h1>
      <div className="mt-8">
        <SecurityClient />
      </div>
    </div>
  );
}
