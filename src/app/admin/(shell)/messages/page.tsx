import CommunicationsHub from "./CommunicationsHub";

export default function MessagesPage() {
  return <div>
    <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Team operations</p>
    <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Communications</h1>
    <p className="mt-2 max-w-3xl text-sm text-neutral-400">A shared workspace for team conversations, AI employee task assignments, and connected messaging channels.</p>
    <div className="mt-8"><CommunicationsHub /></div>
  </div>;
}
