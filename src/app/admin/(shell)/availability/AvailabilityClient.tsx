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
      body: JSON.stringify({ state, customMessage }),
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
