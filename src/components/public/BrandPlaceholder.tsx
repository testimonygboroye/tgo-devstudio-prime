export default function BrandPlaceholder({ label }: { label: string }) {
  const initial = label.trim().charAt(0).toUpperCase() || "T";

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#5B2EE8] to-[#2EC5F0]">
      <span className="text-6xl font-bold text-white/90">{initial}</span>
    </div>
  );
}
