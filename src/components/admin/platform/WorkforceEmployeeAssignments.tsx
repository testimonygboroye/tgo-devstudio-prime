"use client";

import { useCallback, useEffect, useState } from "react";
import { UserCog, Save, Bot, ShieldCheck } from "lucide-react";

type Employee = {
  id: string; userId: string; name: string; email: string; employeeCode: string;
  departmentId: string; departmentName: string; teamId: string; teamName: string;
  positionId: string; positionTitle: string;
};
type Dept = { id: string; name: string; status: string };
type Team = { id: string; name: string; departmentId: string; status: string };
type Position = { id: string; title: string; departmentId: string; status: string };
type Role = { id: string; name: string };
type AIAgentOption = { id: string; name: string; role: string; department: string; enabled: boolean };
type AIAccessMode = "own" | "selected" | "all";

export default function WorkforceEmployeeAssignments() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [aiAgents, setAIAgents] = useState<AIAgentOption[]>([]);
  const [selected, setSelected] = useState("");
  const [managerId, setManagerId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [workLocation, setWorkLocation] = useState("remote");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [aiAccessMode, setAIAccessMode] = useState<AIAccessMode>("own");
  const [aiAllowedAgentIds, setAIAllowedAgentIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [workforceResponse, aiResponse] = await Promise.all([
      fetch("/api/platform/workforce", { cache: "no-store" }),
      fetch("/api/platform/ai-workforce", { cache: "no-store" }),
    ]);
    const [workforce, ai] = await Promise.all([workforceResponse.json(), aiResponse.json()]);
    if (!workforceResponse.ok) throw new Error(workforce.error || "Could not load employees.");
    if (!aiResponse.ok) throw new Error(ai.message || "Could not load AI team members.");
    setEmployees(workforce.employees || []);
    setDepartments(workforce.departments || []);
    setTeams(workforce.teams || []);
    setPositions(workforce.positions || []);
    setRoles(workforce.roles || []);
    setAIAgents((ai.agents || []).map((agent: Record<string, unknown>) => ({
      id: String(agent._id || agent.id || ""),
      name: String(agent.name || ""),
      role: String(agent.role || ""),
      department: String(agent.department || ""),
      enabled: Boolean(agent.enabled),
    })).filter((agent: AIAgentOption) => agent.id && agent.enabled));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((e) => setError(e instanceof Error ? e.message : "Could not load workforce assignments."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    (async () => {
      try {
        const response = await fetch("/api/platform/workforce/employees/" + selected, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load assignments.");
        if (alive) {
          setManagerId(data.managerId || "");
          setDepartmentId(data.departmentId || "");
          setTeamId(data.teamId || "");
          setPositionId(data.positionId || "");
          setRoleIds(data.roleIds || []);
          setPhone(data.phone || "");
          setTimezone(data.timezone || "Africa/Lagos");
          setWorkLocation(data.workLocation || "remote");
          setEmploymentType(data.employmentType || "full_time");
          setAIAccessMode(data.aiAccessMode || "own");
          setAIAllowedAgentIds(data.aiAllowedAgentIds || []);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not load assignments.");
      }
    })();
    return () => { alive = false; };
  }, [selected]);

  async function save() {
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/platform/workforce/employees/" + selected, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId, departmentId, teamId, positionId, roleIds, phone, timezone,
          workLocation, employmentType, aiAccessMode, aiAllowedAgentIds,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save assignments.");
      setNotice("Employee assignments and AI access permissions updated.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save assignments.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-2 text-xs text-[var(--text-primary)]";
  const employee = employees.find((item) => item.id === selected);

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center gap-2">
        <UserCog className="text-violet-400" />
        <h2 className="font-semibold text-[var(--text-primary)]">Employee reporting, permissions & AI access</h2>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Manage the employee's reporting line, department/team/position placement, business roles and founder-controlled access to AI teammates.
      </p>
      {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
      {notice && <p role="status" className="mt-3 text-xs text-emerald-300">{notice}</p>}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-xs text-[var(--text-secondary)]">
          Employee
          <select className={input} value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Select employee</option>
            {employees.map((item) => <option key={item.id} value={item.id}>{item.name || item.email} · {item.employeeCode || item.positionTitle}</option>)}
          </select>
        </label>

        {employee && <>
          <label className="text-xs text-[var(--text-secondary)]">
            Reports to
            <select className={input} value={managerId} onChange={(event) => setManagerId(event.target.value)}>
              <option value="">No direct manager</option>
              {employees.filter((item) => item.userId !== employee.userId).map((item) => <option key={item.userId} value={item.userId}>{item.name || item.email}</option>)}
            </select>
          </label>
          <label className="text-xs text-[var(--text-secondary)]">
            Department
            <select className={input} value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); setTeamId(""); setPositionId(""); }}>
              {departments.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-[var(--text-secondary)]">
            Team
            <select className={input} value={teamId} onChange={(event) => setTeamId(event.target.value)}>
              <option value="">No team</option>
              {teams.filter((item) => item.departmentId === departmentId && item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-[var(--text-secondary)]">
            Position
            <select className={input} value={positionId} onChange={(event) => setPositionId(event.target.value)}>
              {positions.filter((item) => item.departmentId === departmentId && item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <label className="text-xs text-[var(--text-secondary)]">
            Phone
            <input className={input} value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
          </label>
          <label className="text-xs text-[var(--text-secondary)]">
            Timezone
            <input className={input} value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={80} />
          </label>
          <label className="text-xs text-[var(--text-secondary)]">
            Employment type
            <select className={input} value={employmentType} onChange={(event) => setEmploymentType(event.target.value)}>
              <option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="intern">Intern</option>
            </select>
          </label>
          <label className="text-xs text-[var(--text-secondary)]">
            Work location
            <select className={input} value={workLocation} onChange={(event) => setWorkLocation(event.target.value)}>
              <option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option>
            </select>
          </label>
          <label className="text-xs text-[var(--text-secondary)]">
            Business roles
            <select multiple className={input + " min-h-28"} value={roleIds} onChange={(event) => setRoleIds(Array.from(event.target.selectedOptions).map((option) => option.value))}>
              {roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>

          <div className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-4 md:col-span-2 xl:col-span-3">
            <div className="flex items-center gap-2">
              <Bot size={17} className="text-violet-400" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI teammate access</h3>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-300"><ShieldCheck size={13} /> Founder controlled</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Every employee gets their own role-matched AI counterpart by default. You can grant selected additional AI teammates or all enabled AI teammates to this employee. Only the founder can change this access.
            </p>
            <label className="mt-3 block text-xs text-[var(--text-secondary)]">
              AI access scope
              <select className={input} value={aiAccessMode} onChange={(event) => {
                const value = event.target.value as AIAccessMode;
                setAIAccessMode(value);
                if (value !== "selected") setAIAllowedAgentIds([]);
              }}>
                <option value="own">Own AI counterpart only (default)</option>
                <option value="selected">Own AI + selected AI teammates</option>
                <option value="all">All enabled AI teammates</option>
              </select>
            </label>
            {aiAccessMode === "selected" && <div className="mt-3">
              <p className="text-xs font-medium text-[var(--text-secondary)]">Additional AI teammates</p>
              <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-3 sm:grid-cols-2">
                {aiAgents.map((agent) => <label key={agent.id} className="flex min-w-0 items-start gap-2 rounded-lg p-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
                  <input type="checkbox" className="mt-0.5 accent-violet-500" checked={aiAllowedAgentIds.includes(agent.id)} onChange={(event) => setAIAllowedAgentIds(current => event.target.checked ? [...new Set([...current, agent.id])] : current.filter(id => id !== agent.id))}/>
                  <span className="min-w-0"><span className="block break-words font-medium text-[var(--text-primary)]">{agent.name}</span><span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{agent.department}</span></span>
                </label>)}
                {!aiAgents.length && <p className="text-xs text-[var(--text-muted)]">No enabled AI teammates are available.</p>}
              </div>
              <span className="mt-1 block text-[11px] text-[var(--text-muted)]">The employee's own AI counterpart remains available automatically. Only checked AI teammates are added.</span>
            </div>}
            {aiAccessMode === "all" && <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">
              This grants access to every enabled AI employee. Use only for a trusted manager or executive and review the grant periodically.
            </p>}
            {aiAccessMode === "own" && <p className="mt-3 text-xs text-[var(--text-muted)]">Default and least-privilege setting: this employee can message and assign tasks only to their own AI counterpart.</p>}
          </div>

          <div className="flex items-end">
            <button disabled={busy} onClick={() => void save()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              <Save size={15} />{busy ? "Saving…" : "Save assignments"}
            </button>
          </div>
        </>}
      </div>
    </section>
  );
}
