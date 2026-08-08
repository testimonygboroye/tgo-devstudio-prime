import JobOpeningForm from "@/components/admin/JobOpeningForm";

export default function NewJobOpeningPage() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">New Job Opening</h1>
      <div className="mt-8">
        <JobOpeningForm mode="create" />
      </div>
    </div>
  );
}
