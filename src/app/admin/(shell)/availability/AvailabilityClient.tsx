"use client";

import { useState, useEffect } from "react";

const OPTIONS = [
  { value: "accepting", label: "Currently accepting new projects" },
  { value: "limited", label: "Limited availability" },
  { value: "booked", label: "Fully booked" },
];

export default function AvailabilityClient() {
  const [state, setState] = useState("accepting");
  const [customMessage, setCustomMessage] = useState("");
  const [indicatorColor, setIndicatorColor] = useState("#22c55e");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/availability-status");
      const data = await res.json();
      if (data.status === "ok") {
        setState(data.availability.state);
        setCustomMessage(data.availability.customMessage || "");
        setIndicatorColor(data.availability.indicatorColor || "#22c55e");
      }
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSavedMessage("");

    const res = await fetch("/api/availability-status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, customMessage, indicatorColor }),
    });
    const data = await res.json();

    if (data.status !== "ok") {
      setError(data.message || "Failed to save.");
      setIsSaving(false);
      return;
    }

    setSavedMessage("Saved successfully.");
    setIsSaving(false);
  }

  if (isLoading) {
    return <p className="text-neutral-400">Loading...</p>;
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm text-neutral-400">Availability</label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        >
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-neutral-400">
          Indicator colour
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="color"
            value={indicatorColor}
            onChange={(e) => setIndicatorColor(e.target.value)}
            aria-label="Availability indicator colour"
            className="h-10 w-14 cursor-pointer rounded border border-neutral-700 bg-transparent p-1"
          />
          <input
            type="text"
            value={indicatorColor}
            onChange={(e) => setIndicatorColor(e.target.value)}
            pattern="^#[0-9a-fA-F]{6}$"
            maxLength={7}
            aria-label="Indicator colour hex code"
            className="w-32 rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-400">
          Custom Message (optional, e.g. &quot;Booked until March&quot;)
        </label>
        <input
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Leave blank to use the default label above"
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {savedMessage && <p className="text-sm text-brand-cyan-300">{savedMessage}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
