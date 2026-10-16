from pathlib import Path

ROOT = Path.cwd()

def read(path):
    file = ROOT / path
    if not file.exists():
        raise SystemExit(f"STOPPED: Missing file: {path}")
    return file.read_text()

def write(path, content):
    (ROOT / path).write_text(content)
    print(f"Updated: {path}")

def replace(path, old, new, label):
    content = read(path)
    if new in content:
        print(f"Already applied: {label}")
        return
    if old not in content:
        raise SystemExit(f"STOPPED: Could not find expected code for: {label}")
    write(path, content.replace(old, new, 1))

# ---------------------------------------------------------
# 1. Repair and implement reusable theme/language settings
# ---------------------------------------------------------
write("src/components/shared/ThemeAndLanguageSettings.tsx", r'''"use client";

import { useTheme, ThemeMode } from "./ThemeProvider";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, Locale } from "@/lib/i18n/config";
import { Sun, Moon, Laptop, Globe, Check } from "lucide-react";

type SettingsMode = "all" | "theme" | "language";

export default function ThemeAndLanguageSettings({
  mode = "all",
}: {
  mode?: SettingsMode;
}) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useTranslation();

  const themes: {
    id: ThemeMode;
    label: string;
    desc: string;
    icon: typeof Sun;
  }[] = [
    { id: "light", label: t("common.light"), desc: t("theme.lightDesc"), icon: Sun },
    { id: "dark", label: t("common.dark"), desc: t("theme.darkDesc"), icon: Moon },
    { id: "system", label: t("common.system"), desc: t("theme.systemDesc"), icon: Laptop },
  ];

  const selectedClass =
    "border-[var(--color-brand-cyan-400)] bg-[var(--bg-surface-2)] shadow-md";
  const defaultClass =
    "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)]";

  return (
    <div className="mx-auto max-w-2xl space-y-8 rounded-2xl surface-card p-6">
      {mode !== "language" && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Sun size={20} className="text-[var(--color-brand-cyan-400)]" />
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              {t("theme.title")}
            </h2>
          </div>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            {t("theme.description")}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {themes.map((item) => {
              const Icon = item.icon;
              const selected = theme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTheme(item.id)}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                    selected ? selectedClass : defaultClass
                  }`}
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <Icon
                        size={22}
                        className={
                          selected
                            ? "text-[var(--color-brand-cyan-400)]"
                            : "text-[var(--text-muted)]"
                        }
                      />
                      {selected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-cyan-400)] text-[var(--color-base-950)]">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <h3 className="mb-1 font-semibold text-[var(--text-primary)]">
                      {item.label}
                    </h3>
                    <p className="line-clamp-2 text-xs text-[var(--text-secondary)]">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {mode === "all" && (
        <hr className="border-[var(--border-subtle)]" />
      )}

      {mode !== "theme" && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Globe size={20} className="text-[var(--color-brand-cyan-400)]" />
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              {t("language.title")}
            </h2>
          </div>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            {t("language.description")}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.values(LANGUAGES).map((lang) => {
              const selected = locale === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLocale(lang.code as Locale)}
                  className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                    selected ? selectedClass : defaultClass
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {lang.name}
                    </p>
                  </div>
                  {selected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-cyan-400)] text-[var(--color-base-950)]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
''')

# ---------------------------------------------------------
# 2. Availability model: persist the indicator colour
# ---------------------------------------------------------
replace(
    "src/models/AvailabilityStatus.ts",
    "  customMessage?: string;\n",
    "  customMessage?: string;\n  indicatorColor?: string;\n",
    "availability colour interface",
)
replace(
    "src/models/AvailabilityStatus.ts",
    '    customMessage: { type: String, trim: true, maxlength: 150 },\n',
    '    customMessage: { type: String, trim: true, maxlength: 150 },\n'
    '    indicatorColor: {\n'
    '      type: String,\n'
    '      trim: true,\n'
    '      default: "#22c55e",\n'
    '      match: /^#[0-9a-fA-F]{6}$/,\n'
    '    },\n',
    "availability colour schema",
)

# ---------------------------------------------------------
# 3. Availability API: validate and save the selected colour
# ---------------------------------------------------------
replace(
    "src/app/api/availability-status/route.ts",
    "    state,\n    customMessage,\n  } = body as {\n    state?: string;\n    customMessage?: string;\n  };",
    "    state,\n    customMessage,\n    indicatorColor,\n  } = body as {\n    state?: string;\n    customMessage?: string;\n    indicatorColor?: string;\n  };",
    "availability API colour input",
)
replace(
    "src/app/api/availability-status/route.ts",
    '  const normalizedCustomMessage =\n    typeof customMessage === "string"\n      ? customMessage.trim()\n      : "";',
    '  const normalizedCustomMessage =\n    typeof customMessage === "string"\n      ? customMessage.trim()\n      : "";\n\n'
    '  const normalizedIndicatorColor =\n'
    '    typeof indicatorColor === "string" &&\n'
    '    /^#[0-9a-fA-F]{6}$/.test(indicatorColor)\n'
    '      ? indicatorColor\n'
    '      : "#22c55e";',
    "availability API colour validation",
)
replace(
    "src/app/api/availability-status/route.ts",
    "      lastUpdatedBy: session.user._id,\n",
    "      lastUpdatedBy: session.user._id,\n"
    "      indicatorColor: normalizedIndicatorColor,\n",
    "availability API colour persistence",
)

# ---------------------------------------------------------
# 4. Availability admin UI: colour picker and hex input
# ---------------------------------------------------------
replace(
    "src/app/admin/(shell)/availability/AvailabilityClient.tsx",
    '  const [customMessage, setCustomMessage] = useState("");',
    '  const [customMessage, setCustomMessage] = useState("");\n'
    '  const [indicatorColor, setIndicatorColor] = useState("#22c55e");',
    "availability colour state",
)
replace(
    "src/app/admin/(shell)/availability/AvailabilityClient.tsx",
    '        setCustomMessage(data.availability.customMessage || "");',
    '        setCustomMessage(data.availability.customMessage || "");\n'
    '        setIndicatorColor(data.availability.indicatorColor || "#22c55e");',
    "availability colour loading",
)
replace(
    "src/app/admin/(shell)/availability/AvailabilityClient.tsx",
    "      body: JSON.stringify({ state, customMessage }),",
    "      body: JSON.stringify({ state, customMessage, indicatorColor }),",
    "availability colour save request",
)
replace(
    "src/app/admin/(shell)/availability/AvailabilityClient.tsx",
    '      <div>\n        <label className="block text-sm text-neutral-400">\n          Custom Message',
    '      <div>\n'
    '        <label className="block text-sm text-neutral-400">\n'
    '          Indicator colour\n'
    '        </label>\n'
    '        <div className="mt-2 flex items-center gap-3">\n'
    '          <input\n'
    '            type="color"\n'
    '            value={indicatorColor}\n'
    '            onChange={(e) => setIndicatorColor(e.target.value)}\n'
    '            aria-label="Availability indicator colour"\n'
    '            className="h-10 w-14 cursor-pointer rounded border border-neutral-700 bg-transparent p-1"\n'
    '          />\n'
    '          <input\n'
    '            type="text"\n'
    '            value={indicatorColor}\n'
    '            onChange={(e) => setIndicatorColor(e.target.value)}\n'
    '            pattern="^#[0-9a-fA-F]{6}$"\n'
    '            maxLength={7}\n'
    '            aria-label="Indicator colour hex code"\n'
    '            className="w-32 rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-cyan-400"\n'
    '          />\n'
    '        </div>\n'
    '      </div>\n\n'
    '      <div>\n'
    '        <label className="block text-sm text-neutral-400">\n'
    '          Custom Message',
    "availability colour picker",
)

# ---------------------------------------------------------
# 5. Public availability badge uses the stored colour
# ---------------------------------------------------------
replace(
    "src/components/public/AvailabilityBadge.tsx",
    '<span className={`h-2 w-2 rounded-full ${config.color}`} />',
    '<span\n'
    '        className="h-2 w-2 rounded-full"\n'
    '        style={{\n'
    '          backgroundColor:\n'
    '            availability.indicatorColor ||\n'
    '            (availability.state === "booked"\n'
    '              ? "#ef4444"\n'
    '              : availability.state === "limited"\n'
    '                ? "#f59e0b"\n'
    '                : "#22c55e"),\n'
    '        }}\n'
    '      />',
    "public availability indicator colour",
)

replace(
    "src/lib/constants/pageDefaults.ts",
    'export const AVAILABILITY_DEFAULT = {\n  state: "accepting",\n  customMessage: "",\n};',
    'export const AVAILABILITY_DEFAULT = {\n'
    '  state: "accepting",\n'
    '  customMessage: "",\n'
    '  indicatorColor: "#22c55e",\n'
    '};',
    "availability default colour",
)

# ---------------------------------------------------------
# 6. Admin settings respects configured ADMIN_PATH
# ---------------------------------------------------------
replace(
    "src/app/admin/(shell)/settings/page.tsx",
    'import SettingsNavigation from "@/components/settings/SettingsNavigation";',
    'import SettingsNavigation from "@/components/settings/SettingsNavigation";\n'
    'import { getAdminBasePath } from "@/lib/adminPath";',
    "admin settings base-path import",
)
replace(
    "src/app/admin/(shell)/settings/page.tsx",
    "export default function AdminSettingsPage() {\n  return (",
    "export default function AdminSettingsPage() {\n"
    "  const basePath = getAdminBasePath();\n"
    "  return (",
    "admin settings base-path variable",
)
replace(
    "src/app/admin/(shell)/settings/page.tsx",
    'basePath="/admin/settings"',
    'basePath={`${basePath}/settings`}',
    "admin settings navigation base path",
)

# ---------------------------------------------------------
# 7. Remove Founder notification setup from the dashboard
# ---------------------------------------------------------
dashboard = "src/app/admin/(shell)/dashboard/page.tsx"
content = read(dashboard)
updated = content.replace(
    'import PushNotificationSetup from "@/components/admin/PushNotificationSetup";\n',
    "",
).replace(
    "      {session.role.isFounderRole && <PushNotificationSetup />}\n",
    "",
)
if updated != content:
    write(dashboard, updated)
else:
    print("Dashboard notification setup already removed")

# ---------------------------------------------------------
# 8. Founder may edit own name, but cannot change own role,
#    password or ban status through the user-management API.
#    The Founder account itself remains protected from changes
#    by other accounts.
# ---------------------------------------------------------
route = "src/app/api/users/[id]/route.ts"
content = read(route)

old_guard = '''  if (user.role.isFounderRole) {
    return forbiddenResponse("The Founder account cannot be modified through this endpoint.");
  }
  if (user.role.hierarchyLevel <= session.role.hierarchyLevel && !session.role.isFounderRole) {
    return forbiddenResponse("You cannot modify a user at or above your own hierarchy level.");
  }

  const body = await request.json();
  const { name, roleId, newPassword, banAction } = body as {
    name?: string;
    roleId?: string;
    newPassword?: string;
    banAction?: "ban" | "unban";
  };
'''

new_guard = '''  const isSelf = String(user._id) === String(session.user._id);
  const isFounderTarget = Boolean(user.role.isFounderRole);

  const body = await request.json();
  const { name, roleId, newPassword, banAction } = body as {
    name?: string;
    roleId?: string;
    newPassword?: string;
    banAction?: "ban" | "unban";
  };

  if (isFounderTarget && !isSelf) {
    return forbiddenResponse("The Founder account cannot be modified by another account.");
  }

  if (isFounderTarget && (roleId || newPassword || banAction)) {
    return forbiddenResponse("The Founder account's role, password and account status cannot be changed through this endpoint.");
  }

  if (isSelf && (roleId || newPassword || banAction)) {
    return forbiddenResponse("You may update your display name here, but cannot change your own role, password or account status through this endpoint.");
  }

  if (!isSelf && user.role.hierarchyLevel <= session.role.hierarchyLevel && !session.role.isFounderRole) {
    return forbiddenResponse("You cannot modify a user at or above your own hierarchy level.");
  }
'''

if new_guard not in content:
    if old_guard not in content:
        raise SystemExit("STOPPED: Could not find the expected user PATCH protection block.")
    content = content.replace(old_guard, new_guard, 1)
    write(route, content)
else:
    print("Founder/self-edit protection already applied")

# ---------------------------------------------------------
# 9. Create a server-protected Founder notification page
# ---------------------------------------------------------
notification_page = ROOT / "src/app/admin/(shell)/settings/notifications/page.tsx"
notification_page.parent.mkdir(parents=True, exist_ok=True)

write(
    "src/app/admin/(shell)/settings/notifications/page.tsx",
    '''import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/serverSession";
import { getAdminBasePath } from "@/lib/adminPath";
import PushNotificationSetup from "@/components/admin/PushNotificationSetup";

export default async function AdminNotificationSettingsPage() {
  const basePath = getAdminBasePath();
  const session = await getServerSession();

  if (!session) {
    redirect(`${basePath}/login`);
  }

  if (!session.role.isFounderRole) {
    redirect(`${basePath}/settings`);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Founder
        </p>
        <h1 className="mt-1 text-3xl font-bold brand-gradient-text">
          Notification Settings
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Configure push notifications for supported devices.
        </p>
      </header>

      <div className="surface-card rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6">
        <PushNotificationSetup />
      </div>
    </div>
  );
}
''',
)

# ---------------------------------------------------------
# 10. Validation checks
# ---------------------------------------------------------
component = read("src/components/shared/ThemeAndLanguageSettings.tsx")
assert 'mode !== "language"' in component
assert 'mode !== "theme"' in component
assert "ThemeAndLanguageSettings" in component

client = read("src/app/admin/(shell)/availability/AvailabilityClient.tsx")
assert "indicatorColor" in client
assert "type=\"color\"" in client

api = read("src/app/api/availability-status/route.ts")
assert "normalizedIndicatorColor" in api

print("\\nImplementation changes completed.")
print("Next run: git diff --check")
