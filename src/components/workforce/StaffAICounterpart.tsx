"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Bot, LoaderCircle, Send, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

type Agent = { _id: string; name: string; role: string; department: string; description?: string; modelName: string; requiresApproval: boolean; providerId?: { name?: string; provider?: string } };
type Task = { _id: string; agentId: { name?: string; role?: string } | string; title: string; input: string; result?: string; error?: string; status: string; createdAt: string };

export default function StaffAICounterpart() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agentId, setAgentId] = useState("");
  const [title, setTitle] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/platform/ai-workforce", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Could not load your AI workspace.");
      const available = Array.isArray(payload.agents) ? payload.agents : [];
      setAgents(available);
      setTasks(Array.isArray(payload.tasks) ? payload.tasks : []);
      setAgentId((current: string) => available.some((agent: Agent) => agent._id === current) ? current : (available[0]?._id || ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your AI workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!agentId || !title.trim() || !input.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/platform/ai-workforce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "task.enqueue", agentId, title: title.trim(), input: input.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Your task could not be submitted.");
      setTitle(""); setInput("");
      setNotice("Your request has been sent to the founder approval queue. The AI employee will not run it until it is approved.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your task could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  const selected = agents.find(agent => agent._id === agentId);
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-7 sm:px-8">
    <section className="rounded-3xl border border-violet-300/15 bg-[radial-gradient(circle_at_85%_15%,rgba(34,211,238,.17),transparent_30%),linear-gradient(120deg,#17153a,#111a35_65%,#0e1b32)] p-6 sm:p-8">
      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-200"><Sparkles size={13}/>Human + AI collaboration</span>
      <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Your AI counterpart</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Work with your assigned AI counterpart and other AI employees authorised for your department. Requests are reviewed by the founder before execution.</p>
    </section>
    {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
    {loading ? <div className="rounded-2xl border border-white/10 bg-white/[.04] p-6 text-sm text-slate-300">Loading your authorised AI employees…</div> : agents.length === 0 ? <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6"><Bot className="text-amber-300" size={28}/><h2 className="mt-3 font-semibold text-white">No AI counterpart is active yet</h2><p className="mt-2 text-sm text-slate-300">Your administrator must connect and test an AI provider, provision the workforce, and enable your assigned counterpart before it appears here.</p></section> : <>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-white">Available AI employees</h2><button onClick={() => void load()} aria-label="Refresh AI employees" className="rounded-lg border border-white/10 p-2 text-slate-300"><RefreshCw size={15}/></button></div>
          <div className="mt-4 space-y-2">{agents.map(agent => <button key={agent._id} onClick={() => setAgentId(agent._id)} className={`w-full rounded-xl border p-3 text-left transition ${agentId === agent._id ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-black/10 hover:bg-white/[.06]"}`}><div className="flex items-center gap-2"><Bot size={17} className="text-cyan-300"/><span className="text-sm font-semibold text-white">{agent.name}</span></div><p className="mt-1 text-xs text-slate-400">{agent.role} · {agent.department}</p><p className="mt-2 text-[10px] text-slate-500">{agent.providerId?.name || "Configured AI provider"} · {agent.modelName}</p></button>)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-cyan-300"/><h2 className="font-semibold text-white">Send a task</h2></div>
          {selected && <p className="mt-2 text-xs text-slate-400">Assigned to {selected.name}. {selected.requiresApproval ? "Founder approval is required before execution." : "This agent follows its assigned access policy."}</p>}
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block text-xs text-slate-300">AI employee<select value={agentId} onChange={event => setAgentId(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#11182e] px-3 py-2.5 text-sm text-white">{agents.map(agent => <option key={agent._id} value={agent._id}>{agent.name} · {agent.department}</option>)}</select></label>
            <label className="block text-xs text-slate-300">Task title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={180} required className="mt-1 w-full rounded-xl border border-white/10 bg-[#11182e] px-3 py-2.5 text-sm text-white" placeholder="What do you need help with?"/></label>
            <label className="block text-xs text-slate-300">Instructions<textarea value={input} onChange={event => setInput(event.target.value)} maxLength={20000} required rows={6} className="mt-1 w-full rounded-xl border border-white/10 bg-[#11182e] px-3 py-2.5 text-sm text-white" placeholder="Describe the task, context and expected output…"/></label>
            <button disabled={busy || !agentId || !title.trim() || !input.trim()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin"/> : <Send size={16}/>}Submit for founder approval</button>
          </form>
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="font-semibold text-white">Your task history</h2><div className="mt-4 space-y-3">{tasks.length ? tasks.map(task => <article key={task._id} className="rounded-xl border border-white/10 bg-black/10 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold text-white">{task.title}</h3><p className="mt-1 text-[10px] text-slate-500">{typeof task.agentId === "string" ? "AI employee" : task.agentId?.name || "AI employee"} · {new Date(task.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-violet-200">{task.status.replace(/_/g, " ")}</span></div>{task.result && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{task.result}</p>}{task.error && <p className="mt-3 text-xs text-rose-300">{task.error}</p>}</article>) : <p className="text-sm text-slate-400">No tasks have been submitted yet.</p>}</div></section>
    </>}
  </main>;
}
