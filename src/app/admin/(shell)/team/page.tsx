import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";
import { getAdminBasePath } from "@/lib/adminPath";

export default async function TeamListPage() {
  await connectToDatabase();
  const teamMembers = await TeamMember.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
  const basePath = getAdminBasePath();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
          <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Team</h1>
        </div>
        <Link
          href={`${basePath}/team/new`}
          className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950"
        >
          Add Team Member
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {teamMembers.length === 0 && (
          <p className="text-neutral-400">No team members yet. Add your first one.</p>
        )}
        {teamMembers.map((member) => (
          <Link
            key={member._id.toString()}
            href={`${basePath}/team/${member._id.toString()}`}
            className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-100">
                {member.name} — {member.jobTitle}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  member.publishStatus === "published"
                    ? "bg-brand-cyan-400/20 text-brand-cyan-300"
                    : "bg-neutral-600/30 text-neutral-400"
                }`}
              >
                {member.publishStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400 line-clamp-1">{member.bio}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
