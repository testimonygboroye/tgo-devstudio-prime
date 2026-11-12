"use client";

import { useEffect, useState } from "react";

type WhatsAppForm = {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  personalPhoneNumber: string;
  appSecret: string;
  webhookVerifyToken: string;
};

const emptyForm: WhatsAppForm = {
  accessToken: "",
  phoneNumberId: "",
  businessAccountId: "",
  personalPhoneNumber: "",
  appSecret: "",
  webhookVerifyToken: "",
};

export default function ClientWhatsAppSettings() {
  const [connected, setConnected] = useState(false);
  const [displayPhone, setDisplayPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [form, setForm] = useState<WhatsAppForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/platform/messaging/whatsapp-connection", { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => {
        if (!active || !ok) return;
        setConnected(Boolean(data.connected));
        setDisplayPhone(data.displayPhone || "");
        setDestination(data.personalPhoneNumber || "");
      })
      .catch(() => { if (active) setNotice("Could not load WhatsApp connection status."); });
    return () => { active = false; };
  }, []);

  async function save() {
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/platform/messaging/whatsapp-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "WhatsApp connection could not be saved.");
      setConnected(true);
      setDisplayPhone(data.displayPhone || "");
      setDestination(data.personalPhoneNumber || "");
      setForm(emptyForm);
      setNotice("Your WhatsApp destination is verified and encrypted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "WhatsApp connection failed.");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Disconnect the WhatsApp destination registered to this client account?")) return;
    const response = await fetch("/api/platform/messaging/whatsapp-connection", { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice(data.message || "Could not disconnect WhatsApp."); return; }
    setConnected(false);
    setDisplayPhone("");
    setDestination("");
    setNotice("Your WhatsApp destination has been disconnected.");
  }

  return <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-300">Messaging preferences</p><h2 className="mt-2 text-xl font-semibold text-white">WhatsApp connection</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">Register or replace the WhatsApp number where you want eligible TGO client-support updates delivered. Your destination is private to your account.</p></div>
      <span className={connected ? "rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300" : "rounded-full bg-slate-400/10 px-3 py-1 text-xs text-slate-400"}>{connected ? "Connected" : "Not connected"}</span>
    </div>
    {connected && <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-slate-200"><p>Business sender: {displayPhone || "Verified"}</p><p className="mt-1">Your WhatsApp destination: +{destination}</p><button onClick={disconnect} className="mt-3 rounded-lg border border-red-400/30 px-3 py-2 text-xs text-red-300">Disconnect this number</button></div>}
    {!connected && <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs text-slate-400">Meta access token<input type="password" autoComplete="off" value={form.accessToken} onChange={e=>setForm(v=>({...v,accessToken:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#080d20] p-3 text-sm text-white" /></label>
      <label className="text-xs text-slate-400">Business Phone Number ID<input value={form.phoneNumberId} onChange={e=>setForm(v=>({...v,phoneNumberId:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#080d20] p-3 text-sm text-white" /></label>
      <label className="text-xs text-slate-400">WhatsApp Business Account ID<input value={form.businessAccountId} onChange={e=>setForm(v=>({...v,businessAccountId:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#080d20] p-3 text-sm text-white" /></label>
      <label className="text-xs text-slate-400">Your WhatsApp destination (international digits)<input inputMode="numeric" placeholder="2348012345678" value={form.personalPhoneNumber} onChange={e=>setForm(v=>({...v,personalPhoneNumber:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#080d20] p-3 text-sm text-white" /></label>
      <label className="text-xs text-slate-400">Meta app secret<input type="password" autoComplete="off" value={form.appSecret} onChange={e=>setForm(v=>({...v,appSecret:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#080d20] p-3 text-sm text-white" /></label>
      <label className="text-xs text-slate-400">Webhook verify token (create your own)<input type="password" autoComplete="off" value={form.webhookVerifyToken} onChange={e=>setForm(v=>({...v,webhookVerifyToken:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#080d20] p-3 text-sm text-white" /></label>
      <div className="sm:col-span-2"><button disabled={saving || Object.values(form).some(value=>!value.trim())} onClick={save} className="rounded-lg bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">{saving ? "Verifying…" : "Verify and connect WhatsApp"}</button></div>
    </div>}
    {notice && <p role="status" className="mt-3 text-xs text-cyan-200">{notice}</p>}
    <p className="mt-3 text-xs leading-5 text-slate-500">WhatsApp delivery requires valid Meta Cloud API credentials, recipient consent and compliance with Meta's service-window or approved-template rules. Connecting a number does not guarantee that every notification can be sent.</p>
  </section>;
}
