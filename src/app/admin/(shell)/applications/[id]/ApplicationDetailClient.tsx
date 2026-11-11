"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserPlus, X } from "lucide-react";

interface ApplicationDetail {
  _id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  coverMessage: string;
  profilePhotoUrl: string;
  resumeUrl: string;
  status: string;
  createdAt: string;
  jobOpening: { _id: string; title: string } | null;
}

const STATUS_OPTIONS = ["new", "reviewed", "shortlisted", "rejected"];

export default function ApplicationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePathSegment = `/${pathname.split("/").filter(Boolean)[0]}`;

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [hireOpen, setHireOpen] = useState(false);
  const [hireBusy, setHireBusy] = useState(false);
  const [hireOptions, setHireOptions] = useState<{roles:{id:string;name:string}[];departments:{id:string;name:string}[];positions:{id:string;title:string;departmentId:string}[]}>({roles:[],departments:[],positions:[]});
  const [hireForm, setHireForm] = useState({roleId:"",departmentId:"",positionId:"",employmentType:"full_time",workLocation:"remote",startDate:new Date().toISOString().slice(0,10)});

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (data.status !== "ok") {
        setError(data.message || "Failed to load application.");
        setIsLoading(false);
        return;
      }
      setApplication(data.application);
      setIsLoading(false);
    }
    load();
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    setIsSaving(true);
    setError("");
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.status !== "ok") {
      setError(data.message || "Failed to update status.");
      setIsSaving(false);
      return;
    }
    setApplication(data.application);
    setIsSaving(false);
  }

  async function handleHire() {
    setHireBusy(true); setError("");
    try { const res = await fetch(`/api/applications/${id}/hire`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(hireForm) }); const data = await res.json(); if (!res.ok) throw new Error(data.message || "Could not start hiring handoff."); setApplication((current)=>current?{...current,status:"hired"}:current); setHireOpen(false); setError("Hiring handoff created. The staff invitation is awaiting approval in the Invites area."); } catch(e) { setError(e instanceof Error?e.message:"Could not start hiring handoff."); } finally { setHireBusy(false); }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete the application from ${application?.applicantName}? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.status !== "ok") {
      setError(data.message || "Failed to delete application.");
      setIsDeleting(false);
      return;
    }
    router.push(`${basePathSegment}/applications`);
  }

  if (isLoading) {
    return <p className="text-neutral-400">Loading application...</p>;
  }

  if (!application) {
    return <p className="text-red-400">{error || "Application not found."}</p>;
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">{application.applicantName}</h1>
      <p className="mt-1 text-neutral-400">
        Applied for: {application.jobOpening?.title || "Unknown role"} ·{" "}
        {new Date(application.createdAt).toLocaleString()}
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8 grid gap-8 sm:grid-cols-[160px_1fr]">
        <img
          src={application.profilePhotoUrl}
          alt={application.applicantName}
          className="h-40 w-40 rounded-lg object-cover"
        />

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">Email</p>
            <p className="text-neutral-100">{application.applicantEmail}</p>
          </div>

          {application.applicantPhone && (
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500">Phone</p>
              <p className="text-neutral-100">{application.applicantPhone}</p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">Resume</p>
            <a
              href={application.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-cyan-300 hover:underline"
            >
              View resume
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Cover message</p>
        <p className="mt-2 whitespace-pre-wrap text-neutral-100">{application.coverMessage}</p>
      </div>

      {application.status === "shortlisted" && <div className="mt-8 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-neutral-100">Convert shortlisted applicant into an employee</p><p className="mt-1 text-xs text-neutral-400">Creates a staff invite. Once approved and accepted, the employee account and onboarding profile are created automatically.</p></div><button onClick={()=>setHireOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white"><UserPlus size={15}/>Hire & start onboarding</button></div></div>}
      {application.status === "hired" && <p className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">Hiring handoff started. Check Invites for approval and the candidate will receive the invite after approval.</p>}
      {hireOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"><form onSubmit={(e)=>{e.preventDefault();void handleHire();}} className="w-full max-w-xl space-y-4 rounded-2xl border border-cyan-400/20 bg-[#11172d] p-5 text-white"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Employee onboarding handoff</h2><button type="button" onClick={()=>setHireOpen(false)} aria-label="Close"><X size={18}/></button></div><p className="text-xs text-slate-300">The candidate will be invited using {application.applicantEmail}. Choose the staff role and organizational placement.</p><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-300">Staff access role<select required className="mt-1 w-full rounded-lg bg-slate-900 p-2.5" value={hireForm.roleId} onChange={e=>setHireForm({...hireForm,roleId:e.target.value})}><option value="">Choose role</option>{hireOptions.roles.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-xs text-slate-300">Department<select required className="mt-1 w-full rounded-lg bg-slate-900 p-2.5" value={hireForm.departmentId} onChange={e=>setHireForm({...hireForm,departmentId:e.target.value,positionId:""})}><option value="">Choose department</option>{hireOptions.departments.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-xs text-slate-300">Position<select required className="mt-1 w-full rounded-lg bg-slate-900 p-2.5" value={hireForm.positionId} onChange={e=>setHireForm({...hireForm,positionId:e.target.value})}><option value="">Choose position</option>{hireOptions.positions.filter(x=>x.departmentId===hireForm.departmentId).map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label><label className="text-xs text-slate-300">Employment type<select className="mt-1 w-full rounded-lg bg-slate-900 p-2.5" value={hireForm.employmentType} onChange={e=>setHireForm({...hireForm,employmentType:e.target.value})}><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="intern">Intern</option></select></label><label className="text-xs text-slate-300">Work location<select className="mt-1 w-full rounded-lg bg-slate-900 p-2.5" value={hireForm.workLocation} onChange={e=>setHireForm({...hireForm,workLocation:e.target.value})}><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label><label className="text-xs text-slate-300">Start date<input required type="date" className="mt-1 w-full rounded-lg bg-slate-900 p-2.5" value={hireForm.startDate} onChange={e=>setHireForm({...hireForm,startDate:e.target.value})}/></label></div><div className="flex justify-end gap-2"><button type="button" onClick={()=>setHireOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm">Cancel</button><button disabled={hireBusy} className="rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold disabled:opacity-50">{hireBusy?"Creating invite…":"Create staff invite"}</button></div></form></div>}

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-base-800 pt-6">
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-neutral-500">Status</p>
          <select
            value={application.status}
            disabled={isSaving}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="ml-auto rounded-md border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete Application"}
        </button>
      </div>
    </div>
  );
}
