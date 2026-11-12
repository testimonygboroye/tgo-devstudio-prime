"use client";

import { useEffect, useState } from "react";

export default function ClientWhatsAppSettings() {
  const [connected, setConnected] = useState(false);
  const [sharedSenderConfigured, setSharedSenderConfigured] = useState(false);
  const [displayPhone, setDisplayPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/platform/messaging/whatsapp-connection", { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => {
        if (!active || !ok) return;
        setConnected(Boolean(data.connected));
        setSharedSenderConfigured(Boolean(data.sharedSenderConfigured));
        setDisplayPhone(data.displayPhone || "");
        setDestination(data.personalPhoneNumber || "");
        setPhone(data.personalPhoneNumber || "");
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
        body: JSON.stringify({ personalPhoneNumber: phone, consent }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "WhatsApp destination could not be saved.");
      setConnected(true);
      setDisplayPhone(data.displayPhone || "");
      setDestination(data.personalPhoneNumber || "");
      setConsent(false);
      setNotice("Your WhatsApp destination is registered. Eligible messages can now be delivered under Meta&apos;s rules.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "WhatsApp registration failed.");
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
    setDestination("");
    setPhone("");
    setConsent(false);
    setNotice("Your WhatsApp destination has been disconnected.");
  }

  return <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-300">Messaging preferences</p><h2 className="mt-2 text-xl font-semibold text-white">WhatsApp connection</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">Register or replace the WhatsApp number where you want eligible TGO client-support updates delivered. Your destination is private to your account.</p></div>
      <span className={connected ? "rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300" : "rounded-full bg-slate-400/10 px-3 py-1 text-xs text-slate-400"}>{connected ? "Connected" : "Not connected"}</span>
    </div>
    {connected && <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-slate-200"><p>TGO business sender: {displayPhone || "Verified shared sender"}</p><p className="mt-1">Your WhatsApp destination: +{destination}</p><label className="mt-3 block text-xs text-slate-400">Change destination number<input inputMode="numeric" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="2348012345678" className="mt-1 w-full rounded-lg border border-white/10 bg-[#080d20] p-3 text-sm text-white"/></label><label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-400"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1"/>I consent to receiving eligible TGO support messages at this number. I understand that Meta&apos;s service-window and approved-template rules apply.</label><div className="mt-3 flex flex-wrap gap-2"><button disabled={!consent||!phone.trim()||saving} onClick={save} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-40">{saving?"Saving…":"Update WhatsApp number"}</button><button onClick={disconnect} className="rounded-lg border border-red-400/30 px-3 py-2 text-xs text-red-300">Disconnect this number</button></div></div>}
    {!connected && <div className="mt-4 space-y-3">
      <p className="text-xs text-slate-400">{sharedSenderConfigured ? "TGO&apos;s WhatsApp sender is configured. Register the number you want us to contact." : "The TGO WhatsApp sender has not been configured by the administrator yet. You can enter your destination now, but registration will become available after the sender is connected."}</p>
      <label className="block text-xs text-slate-400">Your WhatsApp number (international digits only)<input inputMode="numeric" placeholder="2348012345678" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#080d20] p-3 text-sm text-white sm:max-w-md"/></label>
      <label className="flex items-start gap-2 text-xs leading-5 text-slate-400"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1"/>I consent to receiving eligible TGO support communications at this WhatsApp number.</label>
      <button disabled={saving||!phone.trim()||!consent||!sharedSenderConfigured} onClick={save} className="rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">{saving?"Registering…":"Register WhatsApp destination"}</button>
    </div>}
    {notice && <p role="status" className="mt-3 text-xs text-cyan-200">{notice}</p>}
    <p className="mt-3 text-xs leading-5 text-slate-500">Your number is stored as a private destination. TGO does not send arbitrary bulk messages: WhatsApp delivery requires valid recipient consent and compliance with Meta&apos;s 24-hour customer-service window or approved message templates. You can change or disconnect your destination at any time.</p>
  </section>;
}
