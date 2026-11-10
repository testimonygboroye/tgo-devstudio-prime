"use client";
import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
export type SearchOption={value:string;label:string};
export default function SearchableSelect({value,onChange,options,placeholder="Choose an option",searchPlaceholder="Search options…",disabled=false}:{value:string;onChange:(value:string)=>void;options:SearchOption[];placeholder?:string;searchPlaceholder?:string;disabled?:boolean}) {
 const [open,setOpen]=useState(false);const [query,setQuery]=useState("");
 const selected=options.find(o=>o.value===value);
 const filtered=useMemo(()=>options.filter(o=>!query||o.label.toLowerCase().includes(query.toLowerCase())||o.value.toLowerCase().includes(query.toLowerCase())),[options,query]);
 return <div className="relative mt-2">
  <button type="button" role="combobox" aria-expanded={open} disabled={disabled} onClick={()=>{setOpen(v=>!v);setQuery("");}} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#080d20] px-3 py-3 text-left text-sm text-white outline-none hover:border-violet-400 focus:border-violet-400 disabled:opacity-50"><span className={selected?"truncate":"truncate text-slate-500"}>{selected?.label||placeholder}</span><ChevronDown size={16} className="shrink-0 text-slate-400"/></button>
  {open&&<><button type="button" aria-label="Close options" className="fixed inset-0 z-20 cursor-default" onClick={()=>setOpen(false)}/><div className="absolute z-30 mt-2 w-full rounded-xl border border-white/10 bg-[#101a34] p-2 shadow-2xl"><div className="relative mb-2"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder={searchPlaceholder} className="w-full rounded-lg border border-white/10 bg-[#080d20] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-violet-400"/></div><div className="max-h-56 overflow-y-auto">{filtered.length?filtered.map(option=><button type="button" key={option.value} onClick={()=>{onChange(option.value);setOpen(false);setQuery("");}} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${value===option.value?"bg-violet-500/20 text-white":"text-slate-300 hover:bg-white/[.06] hover:text-white"}`}>{option.label}</button>):<p className="px-3 py-4 text-xs text-slate-400">No matching option.</p>}</div></div></>}
 </div>;
}
