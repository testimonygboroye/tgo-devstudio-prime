"use client";
import {Printer} from "lucide-react";
export default function PrintReceiptButton(){return <button type="button" onClick={()=>window.print()} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white print:hidden"><Printer size={15} className="mr-2 inline"/>Print / Save PDF</button>;}
