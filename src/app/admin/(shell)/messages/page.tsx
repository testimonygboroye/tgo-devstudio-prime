import MessagesClient from "./MessagesClient";

export default function MessagesPage() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Account</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Messages</h1>
      <div className="mt-8">
        <MessagesClient />
      </div>
    </div>
  );
}
