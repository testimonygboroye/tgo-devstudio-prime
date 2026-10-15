import Link from "next/link";
import { Palette, Languages, Bell, ChevronRight } from "lucide-react";

const SETTINGS = [
  {
    title: "Theme Settings",
    description: "Choose light, dark, or system appearance.",
    href: "theme",
    icon: Palette,
  },
  {
    title: "Language Settings",
    description: "Choose your preferred display language.",
    href: "language",
    icon: Languages,
  },
];

export default function SettingsNavigation({
  basePath,
  includeNotifications = false,
}: {
  basePath: string;
  includeNotifications?: boolean;
}) {
  const items = [
    ...SETTINGS,
    ...(includeNotifications
      ? [
          {
            title: "Notification Settings",
            description: "Manage device notifications and registration.",
            href: "notifications",
            icon: Bell,
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map(({ title, description, href, icon: Icon }) => (
        <Link
          key={href}
          href={`${basePath}/${href}`}
          className="group surface-card flex items-center gap-4 rounded-2xl border border-[var(--border-subtle)] p-5 transition hover:border-brand-cyan-400"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-2)] text-brand-cyan-400">
            <Icon size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-[var(--text-primary)]">
              {title}
            </span>
            <span className="mt-1 block text-sm text-[var(--text-secondary)]">
              {description}
            </span>
          </span>
          <ChevronRight
            size={18}
            className="shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-1"
          />
        </Link>
      ))}
    </div>
  );
}
