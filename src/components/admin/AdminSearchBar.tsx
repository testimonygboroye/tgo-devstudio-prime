interface AdminSearchBarProps {
  placeholder?: string;
  defaultValue?: string;
}

export default function AdminSearchBar({ placeholder = "Search...", defaultValue = "" }: AdminSearchBarProps) {
  return (
    <form method="GET" className="flex gap-2">
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full max-w-xs rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-cyan-400"
      />
      <button
        type="submit"
        className="rounded-md border border-base-800 px-3 py-2 text-sm text-neutral-100 hover:bg-base-900"
      >
        Search
      </button>
    </form>
  );
}
