"use client";
import { useMemo, useState } from "react";
import countriesData from "@/data/countries.json";
type Country = { cca2:string; name:string; calling_code:string; flag?:{emoji?:string} };
const countries=(countriesData as Country[]).filter(c=>c.cca2&&c.name&&c.calling_code).sort((a,b)=>a.name.localeCompare(b.name));
const byDial=[...countries].sort((a,b)=>b.calling_code.length-a.calling_code.length);
function parsePhone(value:string) {
  const match=byDial.find(c=>value.startsWith(c.calling_code));
  return match?{country:match.cca2,digits:value.slice(match.calling_code.length).replace(/\D/g,"")}:{country:"NG",digits:value.replace(/^\+/, "").replace(/\D/g,"")};
}
export default function PhoneNumberInput({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  const initial=parsePhone(value||"+234");
  const [country,setCountry]=useState(initial.country);
  const [digits,setDigits]=useState(initial.digits);
  const [query,setQuery]=useState("");
  const [open,setOpen]=useState(false);
  const selected=countries.find(c=>c.cca2===country)||countries.find(c=>c.cca2==="NG")!;
  const filtered=useMemo(()=>countries.filter(c=>!query||c.name.toLowerCase().includes(query.toLowerCase())||c.cca2.toLowerCase().includes(query.toLowerCase())||c.calling_code.includes(query)),[query]);
  function update(nextCountry:string,nextDigits:string){const item=countries.find(c=>c.cca2===nextCountry);if(!item)return;const normalized=nextDigits.replace(/^0+/,"");setCountry(nextCountry);setDigits(normalized);onChange(item.calling_code+normalized);}
  return <div className="mt-2 space-y-2">
    <div className="flex gap-2">
      <div className="relative w-[44%] min-w-0 sm:w-[38%]">
        <button type="button" aria-expanded={open} onClick={()=>{setOpen(v=>!v);setQuery("");}} className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#080d20] px-2 text-sm text-white hover:border-violet-400"><span className="text-lg">{selected.flag?.emoji||"🌐"}</span><span className="font-semibold">{selected.calling_code}</span><span className="text-[10px] text-slate-400">{selected.cca2}</span></button>
        {open&&<><button type="button" aria-label="Close calling code list" className="fixed inset-0 z-20 cursor-default" onClick={()=>setOpen(false)}/><div className="absolute left-0 top-full z-30 mt-2 w-[min(88vw,20rem)] rounded-xl border border-white/10 bg-[#101a34] p-2 shadow-2xl"><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search country or +code…" className="mb-2 w-full rounded-lg border border-white/10 bg-[#080d20] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400"/><div className="max-h-56 overflow-y-auto">{filtered.map(c=><button type="button" key={c.cca2} onClick={()=>{update(c.cca2,digits);setOpen(false);}} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-200 hover:bg-violet-500/15"><span>{c.flag?.emoji||"🌐"}</span><span className="min-w-0 flex-1 truncate">{c.name}</span><span className="text-xs text-cyan-300">{c.cca2} · {c.calling_code}</span></button>)}</div></div></>}
      </div>
      <input type="tel" inputMode="tel" autoComplete="tel-national" value={digits} onChange={e=>update(country,e.target.value.replace(/[^0-9]/g,"").slice(0,Math.max(1,15-selected.calling_code.replace(/\D/g,"").length)))} placeholder="Phone number" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080d20] px-3 py-3 text-sm text-white outline-none focus:border-violet-400"/>
    </div>
    <p className="text-[11px] text-slate-500">International format: {selected.calling_code}{digits||"XXXXXXXXX"} · {selected.flag?.emoji} {selected.name}</p>
  </div>;
}
