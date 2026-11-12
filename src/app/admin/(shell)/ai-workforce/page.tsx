import Link from "next/link";
import { getAdminBasePath } from "@/lib/adminPath";
import AIWorkforceManager from "@/components/admin/AIWorkforceManager";
export default function AIWorkforcePage() {
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-400">AI workforce management</p><h2 className="text-lg font-bold text-[var(--text-primary)]">Provider and agent operations</h2></div><Link href={getAdminBasePath()+"/ai-workforce/chatbots"} className="rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10">Configure public, client & admin assistants →</Link></div><AIWorkforceManager /></div>;
}
