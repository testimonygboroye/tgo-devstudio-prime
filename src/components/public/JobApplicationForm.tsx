"use client";

import { useState } from "react";
import TurnstileWidget from "@/components/public/TurnstileWidget";

interface JobApplicationFormProps {
  jobId: string;
}

export default function JobApplicationForm({ jobId }: JobApplicationFormProps) {
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [coverMessage, setCoverMessage] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function uploadFile(file: File, endpoint: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "job-applications");
    const response = await fetch(endpoint, { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "File upload failed.");
    }
    return data;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!resumeFile) {
      setError("Please attach your CV/resume.");
      return;
    }

    if (!photoFile) {
      setError("Please attach a profile photo.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the verification challenge.");
      return;
    }

    setIsSubmitting(true);

    try {
      const resumeData = await uploadFile(resumeFile, "/api/media/upload-document");
      const photoData = await uploadFile(photoFile, "/api/media/upload");

      const response = await fetch(`/api/careers/${jobId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName,
          applicantEmail,
          applicantPhone: applicantPhone || undefined,
          coverMessage,
          profilePhotoUrl: photoData.url,
          resumeUrl: resumeData.url,
          resumePublicId: resumeData.publicId,
          companyWebsite,
          turnstileToken,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit application.");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-brand-cyan-400/40 bg-brand-cyan-400/10 p-6 text-center">
        <p className="font-semibold text-neutral-100">Application received</p>
        <p className="mt-1 text-sm text-neutral-400">Thank you for applying. We'll be in touch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={companyWebsite}
        onChange={(event) => setCompanyWebsite(event.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400">Full Name</label>
          <input
            required
            value={applicantName}
            onChange={(event) => setApplicantName(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Email</label>
          <input
            required
            type="email"
            value={applicantEmail}
            onChange={(event) => setApplicantEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Phone (optional)</label>
        <input
          value={applicantPhone}
          onChange={(event) => setApplicantPhone(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Cover Message / Experience</label>
        <textarea
          required
          rows={5}
          value={coverMessage}
          onChange={(event) => setCoverMessage(event.target.value)}
          className="mt-1 w-full rounded-md border border-base-800 bg-base-900 px-3 py-2 text-neutral-100 outline-none focus:border-brand-cyan-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">CV / Resume (PDF or Word, required)</label>
        <input
          required
          type="file"
          accept="application/pdf,.doc,.docx"
          onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
          className="mt-1 text-sm text-neutral-400"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400">Profile Photo (required)</label>
        <input
          required
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
          className="mt-1 text-sm text-neutral-400"
        />
      </div>

      <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md brand-gradient-bg px-5 py-2 font-semibold text-base-950 disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
