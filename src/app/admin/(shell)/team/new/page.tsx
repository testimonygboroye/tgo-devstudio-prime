import TeamMemberForm from "@/components/admin/TeamMemberForm";

export default function NewTeamMemberPage() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Add Team Member</h1>
      <div className="mt-8">
        <TeamMemberForm mode="create" />
      </div>
    </div>
  );
}
