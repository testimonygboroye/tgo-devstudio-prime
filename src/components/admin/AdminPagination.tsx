interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export default function AdminPagination({ currentPage, totalPages, buildHref }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="surface-card mt-8 flex items-center justify-between px-6 py-4 text-sm">
      <a
        href={currentPage > 1 ? buildHref(currentPage - 1) : undefined}
        aria-disabled={currentPage <= 1}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all ${
          currentPage <= 1
            ? "pointer-events-none opacity-40 text-[var(--text-muted)]"
            : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-brand-cyan-400 hover:text-brand-cyan-400"
        }`}
      >
        ← Previous
      </a>
      <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
        Page {currentPage} of {totalPages}
      </span>
      <a
        href={currentPage < totalPages ? buildHref(currentPage + 1) : undefined}
        aria-disabled={currentPage >= totalPages}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all ${
          currentPage >= totalPages
            ? "pointer-events-none opacity-40 text-[var(--text-muted)]"
            : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-brand-cyan-400 hover:text-brand-cyan-400"
        }`}
      >
        Next →
      </a>
    </div>
  );
}
