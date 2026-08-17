import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import { getAdminBasePath } from "@/lib/adminPath";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function TeamListPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  guardCanView(session!, "team");
  await connectToDatabase();

  const { q = "", page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const basePath = getAdminBasePath();

  const filter = q
    ? { $or: [{ name: { $regex: q, $options: "i" } }, { jobTitle: { $regex: q, $options: "i" } }] }
    : {};

  const [teamMembers, totalCount] = await Promise.all([
    TeamMember.find(filter)
      .sort({ displayOrder: 1, createdAt: 1 })
      .skip((currentPage - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    TeamMember.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function buildHref(page: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(page));
    return `${basePath}/team?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
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

      <div className="mt-6">
        <AdminSearchBar placeholder="Search by name or job title..." defaultValue={q} />
        {q && <p className="mt-2 text-xs text-neutral-500">Showing results for "{q}"</p>}
      </div>

      <div className="mt-6 space-y-3">
        {teamMembers.length === 0 && (
          <p className="text-neutral-400">
            {q ? `No team members match "${q}".` : "No team members yet. Add your first one."}
          </p>
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

      <AdminPagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}
