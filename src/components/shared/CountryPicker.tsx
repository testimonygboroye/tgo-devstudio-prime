"use client";
import { useMemo, useState } from "react";
import countriesData from "@/data/countries.json";
type Country = { cca2: string; name: string; calling_code: string; flag?: { emoji?: string } };
const countries = (countriesData as Country[]).filter(c => c.cca2 && c.name).sort((a,b)=>a.name.localeCompare(b.name));
export function findCountry(value: string) {
  const key=value.trim().toLowerCase();
  return countries.find(c=>c.cca2.toLowerCase()===key||c.name.toLowerCase()===key);
}
export default function CountryPicker({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  const [query,setQuery]=useState("");
  const [open,setOpen]=useState(false);
  const selected=findCountry(value);
  const filtered=useMemo(()=>countries.filter(c=>!query||c.name.toLowerCase().includes(query.toLowerCase())||c.cca2.toLowerCase().includes(query.toLowerCase())||c.calling_code.includes(query)),[query]);
  return <div className="relative">
    <input role="combobox" aria-expanded={open} aria-controls="client-country-options" aria-autocomplete="list" autoComplete="off" value={open?query:(selected?selected.flag?.emoji+" "+selected.name+" ("+selected.cca2+")":value)} onFocus={()=>{setOpen(true);setQuery("");}} onChange={e=>{setQuery(e.target.value);setOpen(true);}} onKeyDown={e=>{if(e.key==="Escape")setOpen(false);if(e.key==="Enter"&&filtered[0]){e.preventDefault();onChange(filtered[0].cca2);setOpen(false);}}} placeholder="Search countries…" className="mt-2 w-full rounded-xl border border-white/10 bg-[#080d20] px-3 py-3 text-sm text-white outline-none focus:border-violet-400"/>
    {open&&<><button type="button" aria-label="Close country list" className="fixed inset-0 z-20 cursor-default" onClick={()=>setOpen(false)}/><div id="client-country-options" role="listbox" className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#101a34] p-1 shadow-2xl">{filtered.length?filtered.map(country=><button type="button" role="option" aria-selected={selected?.cca2===country.cca2} key={country.cca2} onClick={()=>{onChange(country.cca2);setOpen(false);setQuery("");}} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-violet-500/15"><span className="text-lg">{country.flag?.emoji||"🌐"}</span><span className="min-w-0 flex-1 truncate">{country.name}</span><span className="text-xs font-semibold text-cyan-300">{country.cca2}</span></button>):<p className="px-3 py-4 text-sm text-slate-400">No matching country found.</p>}</div></>}
  </div>;
}
