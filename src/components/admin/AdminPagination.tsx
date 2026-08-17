interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export default function AdminPagination({ currentPage, totalPages, buildHref }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <a
        href={currentPage > 1 ? buildHref(currentPage - 1) : undefined}
        aria-disabled={currentPage <= 1}
        className={`rounded-md border border-base-800 px-3 py-1.5 ${
          currentPage <= 1
            ? "pointer-events-none text-neutral-600"
            : "text-neutral-100 hover:bg-base-900"
        }`}
      >
        ← Previous
      </a>
      <span className="text-neutral-500">
        Page {currentPage} of {totalPages}
      </span>
      <a
        href={currentPage < totalPages ? buildHref(currentPage + 1) : undefined}
        aria-disabled={currentPage >= totalPages}
        className={`rounded-md border border-base-800 px-3 py-1.5 ${
          currentPage >= totalPages
            ? "pointer-events-none text-neutral-600"
            : "text-neutral-100 hover:bg-base-900"
        }`}
      >
        Next →
      </a>
    </div>
  );
}
