import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import JobOpening from "@/models/JobOpening";
import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import { getAdminBasePath } from "@/lib/adminPath";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function CareersListPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  guardCanView(session!, "jobOpenings");
  await connectToDatabase();

  const { q = "", page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const basePath = getAdminBasePath();

  const filter = q ? { title: { $regex: q, $options: "i" } } : {};

  const [jobs, totalCount] = await Promise.all([
    JobOpening.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    JobOpening.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function buildHref(page: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(page));
    return `${basePath}/careers?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
          <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Careers</h1>
        </div>
        <Link
          href={`${basePath}/careers/new`}
          className="rounded-md brand-gradient-bg px-4 py-2 text-sm font-semibold text-base-950"
        >
          New Job Opening
        </Link>
      </div>

      <div className="mt-6">
        <AdminSearchBar placeholder="Search by title..." defaultValue={q} basePath={`${basePath}/careers`} />
        {q && <p className="mt-2 text-xs text-neutral-500">Showing results for "{q}"</p>}
      </div>

      <div className="mt-6 space-y-3">
        {jobs.length === 0 && (
          <p className="text-neutral-400">{q ? `No job openings match "${q}".` : "No job openings yet."}</p>
        )}
        {jobs.map((job) => (
          <Link
            key={job._id.toString()}
            href={`${basePath}/careers/${job._id.toString()}`}
            className="block rounded-lg border border-base-800 bg-base-900 p-4 hover:border-brand-cyan-400"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-100">{job.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  job.publishStatus === "published"
                    ? "bg-brand-cyan-400/20 text-brand-cyan-300"
                    : "bg-neutral-600/30 text-neutral-400"
                }`}
              >
                {job.publishStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400">
              {job.locationType} · {job.employmentType}
            </p>
          </Link>
        ))}
      </div>

      <AdminPagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}
