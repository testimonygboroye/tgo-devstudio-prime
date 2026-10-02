"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICE_ICON_NAMES, SERVICE_ICON_MAP } from "@/lib/constants/serviceIcons";
import LocaleTabs from "./LocaleTabs";
import { Locale, RTL_LOCALES } from "@/lib/i18n/config";

interface ServiceFormProps {
  mode: "create" | "edit";
  serviceId?: string;
  initialData?: {
    title: string;
    summary: string;
    icon: string;
    displayOrder: number;
    publishStatus: string;
    featured?: boolean;
    translations?: Record<string, Record<string, unknown>>;
  };
}

export default function ServiceForm({ mode, serviceId, initialData }: ServiceFormProps) {
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState<Locale>("en");
  const [translations, setTranslations] = useState<Record<string, Record<string, unknown>>>(
    initialData?.translations ?? {}
  );

  const [baseTitle, setBaseTitle] = useState(initialData?.title || "");
  const [baseSummary, setBaseSummary] = useState(initialData?.summary || "");

  const [icon, setIcon] = useState(initialData?.icon || "Code");
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder ?? 0);
  const [publishStatus, setPublishStatus] = useState(initialData?.publishStatus || "draft");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const activeTitle = currentLocale === "en" ? baseTitle : String(translations[currentLocale]?.title ?? "");
  const activeSummary = currentLocale === "en" ? baseSummary : String(translations[currentLocale]?.summary ?? "");

  function handleFieldChange(field: "title" | "summary", value: string) {
    if (currentLocale === "en") {
      if (field === "title") setBaseTitle(value);
      if (field === "summary") setBaseSummary(value);
    } else {
      setTranslations((prev) => ({
        ...prev,
        [currentLocale]: {
          ...(prev[currentLocale] || {}),
          [field]: value,
        },
      }));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSavedMessage("");
    setIsSaving(true);

    const endpoint = mode === "create" ? "/api/services" : `/api/services/${serviceId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: baseTitle,
          summary: baseSummary,
          icon,
          displayOrder,
          publishStatus,
          featured,
          translations,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save service.");
        return;
      }

      router.refresh();
      setSavedMessage("Saved successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== "DELETE") {
      setError("You must type DELETE exactly to confirm.");
      return;
    }
    setIsDeleting(true);
    setError("");
    const res = await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Failed to delete service.");
      setIsDeleting(false);
      return;
    }
    router.refresh();
    setSavedMessage("Saved successfully.");
  }

  const isRtl = RTL_LOCALES.includes(currentLocale);

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <LocaleTabs
        currentLocale={currentLocale}
        onLocaleChange={setCurrentLocale}
        translations={translations}
        translatableFields={["title", "summary"]}
      />

      <div className="rounded-xl border border-base-800 bg-base-900/50 p-6 shadow-xl space-y-4 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-neutral-100">
          {mode === "create" ? "New Service" : "Edit Service"} {currentLocale !== "en" && `(${currentLocale.toUpperCase()})`}
        </h2>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Title</label>
          <input
            required={currentLocale === "en"}
            value={activeTitle}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            placeholder="e.g. Full-Stack Web Development"
            className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Summary</label>
          <textarea
            required={currentLocale === "en"}
            rows={4}
            value={activeSummary}
            onChange={(e) => handleFieldChange("summary", e.target.value)}
            placeholder="Briefly describe the service offering..."
            className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400 focus:ring-2 focus:ring-brand-cyan-400/20"
          />
        </div>

        {currentLocale === "en" && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-300">Icon</label>
              <div className="mt-2 grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 rounded-lg border border-base-800 bg-base-950">
                {SERVICE_ICON_NAMES.map((name) => {
                  const IconComp = SERVICE_ICON_MAP[name];
                  const selected = icon === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setIcon(name)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${
                        selected
                          ? "border-brand-cyan-400 bg-brand-cyan-400/10 text-brand-cyan-300"
                          : "border-transparent bg-base-900 text-neutral-400 hover:bg-base-800 hover:text-neutral-200"
                      }`}
                    >
                      {IconComp && <IconComp className="h-5 w-5 mb-1" />}
                      <span className="text-[10px] truncate w-full text-center">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300">Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300">Status</label>
                <select
                  value={publishStatus}
                  onChange={(e) => setPublishStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-base-800 bg-base-950 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-brand-cyan-400"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-base-700 bg-base-950 text-brand-cyan-400 focus:ring-brand-cyan-400"
              />
              <label htmlFor="featured" className="text-sm font-medium text-neutral-300 cursor-pointer">
                Feature on homepage / highlight
              </label>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}
      {savedMessage && <p className="text-sm font-medium text-emerald-400 bg-emerald-400/10 p-3 rounded-xl border border-emerald-400/20">{savedMessage}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-brand-cyan-400 px-6 py-2.5 font-semibold text-base-950 hover:bg-brand-cyan-300 transition disabled:opacity-50 shadow-lg shadow-brand-cyan-400/10"
        >
          {isSaving ? "Saving..." : mode === "create" ? "Create Service" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
