"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, ChevronDown, ExternalLink, MessageCircle, Send, ShieldCheck, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";

type Scope = "public" | "client" | "admin";
type ChatMessage = { messageId: string; role: "user" | "assistant"; content: string; feedback?: "helpful" | "unhelpful"; sources?: string[]; createdAt?: string };
const endpoint: Record<Scope, string> = { public: "/api/public/ai-chat", client: "/api/client/ai-chat", admin: "/api/admin/ai-chat" };
const supportHref: Record<Scope, string> = { public: "/contact", client: "/client/support", admin: "/admin/messages" };

export default function AIChatWidget({ scope, adminBasePath = "/admin", showLauncher = true }: { scope: Scope; adminBasePath?: string; showLauncher?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [welcome, setWelcome] = useState("Hello. How can I help?");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [launcherPos, setLauncherPos] = useState({ x: 0, y: 0 });
  const drag = useRef({ x: 0, y: 0, startX: 0, startY: 0, moved: false, active: false });
  const api = endpoint[scope];
  const support = scope === "admin" ? adminBasePath + "/messages" : supportHref[scope];

  useEffect(() => {
    if (!showLauncher) return;
    setLauncherPos({ x: Math.max(12, window.innerWidth - 72), y: Math.max(12, window.innerHeight - 72) });
  }, [showLauncher]);

  useEffect(() => {
    if (showLauncher) return;
    const openChat = () => setOpen(true);
    window.addEventListener("tgo:open-ai-chat", openChat);
    return () => window.removeEventListener("tgo:open-ai-chat", openChat);
  }, [showLauncher]);

  const load = useCallback(async () => {
    try {
      const response = await fetch(api, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Assistant could not be loaded.");
      setEnabled(Boolean(data.enabled));
      setWelcome(String(data.welcomeMessage || "Hello. How can I help?"));
      setMessages((data.messages || []) as ChatMessage[]);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Assistant unavailable.");
    }
  }, [api]);

  useEffect(() => { if (open) void load(); }, [open, load]);
  useEffect(() => { if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, open, busy]);

  async function send(event?: React.FormEvent) {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || busy || !enabled) return;
    setDraft("");
    setError("");
    setBusy(true);
    setMessages((current) => [...current, { messageId: "pending-" + Date.now(), role: "user", content: message }]);
    try {
      const response = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, currentPage: pathname }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "The assistant could not answer.");
      setMessages((current) => [...current, { ...data.message, sources: data.sources || [] }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The assistant is temporarily unavailable.");
    } finally { setBusy(false); }
  }

  async function feedback(messageId: string, value: "helpful" | "unhelpful") {
    try {
      const response = await fetch(api, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, feedback: value }) });
      if (response.ok) setMessages((current) => current.map((message) => message.messageId === messageId ? { ...message, feedback: value } : message));
    } catch { /* Feedback is optional. */ }
  }

  async function clearHistory() {
    if (!window.confirm("Clear this assistant's conversation history for this account?")) return;
    try {
      const response = await fetch(api, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not clear history.");
      setMessages([]);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not clear history."); }
  }

  const title = scope === "public" ? "TGO Website Assistant" : scope === "client" ? "Your TGO Client Assistant" : "TGO Internal Assistant";
  const subtitle = scope === "public" ? "Public website guidance" : scope === "client" ? "Private to your signed-in account" : "Private to your staff account";

  function pointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!showLauncher) return;
    drag.current = { x: event.clientX, y: event.clientY, startX: launcherPos.x, startY: launcherPos.y, moved: false, active: true };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!drag.current.active || !showLauncher) return;
    const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.current.moved = true;
    if (drag.current.moved) setLauncherPos({ x: Math.max(12, Math.min(window.innerWidth - 68, drag.current.startX + dx)), y: Math.max(12, Math.min(window.innerHeight - 68, drag.current.startY + dy)) });
  }
  function pointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    drag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return <div className="font-sans">
    {open && <section className="fixed bottom-20 right-4 z-[130] mb-2 flex h-[min(680px,calc(100dvh-110px))] w-[min(410px,calc(100vw-28px))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d1428] text-white shadow-2xl shadow-black/50 sm:right-6" aria-label={title}>
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[radial-gradient(circle_at_85%_0%,rgba(46,197,240,.2),transparent_40%),linear-gradient(125deg,#17112f,#101b35)] p-4">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Bot size={21}/></span><div><h2 className="text-sm font-bold">{title}</h2><p className="mt-0.5 text-[10px] text-slate-300">{subtitle}</p></div></div>
        <div className="flex items-center gap-1"><button onClick={() => void clearHistory()} title="Clear conversation history" aria-label="Clear conversation history" className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><Trash2 size={16}/></button><button onClick={() => setOpen(false)} title="Minimise assistant" aria-label="Minimise assistant" className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><ChevronDown size={18}/></button></div>
      </header>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-3 text-xs leading-5 text-slate-300"><span className="mb-1 flex items-center gap-2 font-semibold text-cyan-200"><ShieldCheck size={14}/> Privacy boundary</span>{scope === "public" ? "This assistant answers public website questions. Sign in to the client portal for private account details." : scope === "client" ? "Your answers are limited to your own signed-in account and public website information." : "This assistant uses only your authorised staff context and cannot disclose other people's private records."}</div>
        {!messages.length && <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs font-semibold text-cyan-200">{welcome}</p><p className="mt-2 text-xs leading-5 text-slate-400">Ask a question in natural language. The assistant can explain and guide, but cannot make changes or execute tasks.</p></div>}
        {messages.map((message) => <div key={message.messageId} className={message.role === "user" ? "ml-8 rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-cyan-600 p-3 text-sm text-white" : "mr-3 rounded-2xl rounded-bl-md border border-white/10 bg-white/[.05] p-3 text-sm text-slate-100"}>
          <p className="whitespace-pre-wrap break-words leading-6">{message.content}</p>
          {message.role === "assistant" && <><div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2"><button onClick={() => void feedback(message.messageId, "helpful")} aria-label="Helpful answer" className={`rounded-md p-1.5 ${message.feedback === "helpful" ? "bg-emerald-400/20 text-emerald-300" : "text-slate-400 hover:bg-white/10"}`}><ThumbsUp size={13}/></button><button onClick={() => void feedback(message.messageId, "unhelpful")} aria-label="Unhelpful answer" className={`rounded-md p-1.5 ${message.feedback === "unhelpful" ? "bg-rose-400/20 text-rose-300" : "text-slate-400 hover:bg-white/10"}`}><ThumbsDown size={13}/></button><span className="text-[10px] text-slate-500">Was this useful?</span></div>{message.sources?.length ? <div className="mt-2 text-[10px] text-slate-400">Based on: {message.sources.slice(0, 3).join(" · ")}</div> : null}</>}
        </div>)}
        {busy && <div className="mr-10 rounded-2xl border border-white/10 bg-white/[.05] p-3 text-xs text-cyan-200">Thinking…</div>}
        {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
      </div>
      <div className="border-t border-white/10 bg-black/20 p-3"><form onSubmit={send} className="flex items-end gap-2"><textarea rows={2} maxLength={2000} disabled={!enabled} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Ask your question…" className="min-h-11 max-h-28 min-w-0 flex-1 resize-y rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"/><button disabled={busy || !enabled || !draft.trim()} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white disabled:opacity-40"><Send size={17}/></button></form><div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span>{enabled ? "AI service status · configured" : "AI service is not enabled yet"}</span><a href={support} className="inline-flex items-center gap-1 text-cyan-300 hover:underline">Contact support <ExternalLink size={10}/></a></div></div>
    </section>}
    {showLauncher && <button onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onClick={() => { if (drag.current.moved) { drag.current.moved = false; return; } setOpen((value) => !value); }} aria-label={open ? "Close AI assistant" : "Open AI assistant"} title="Drag to reposition · Tap to open" className="fixed z-[125] flex h-14 w-14 touch-none cursor-grab items-center justify-center rounded-full border border-cyan-200/30 bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-xl shadow-violet-950/40 transition hover:scale-105 active:cursor-grabbing" style={{ left: launcherPos.x || undefined, top: launcherPos.y || undefined, right: launcherPos.x ? undefined : 16, bottom: launcherPos.y ? undefined : 16 }}>{open ? <X size={22}/> : <MessageCircle size={23}/>}</button>}
  </div>;
}
