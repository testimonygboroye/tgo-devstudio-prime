"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function UnsubscribePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function unsubscribe() {
      const token = searchParams.get("token") || "";
      try {
        const res = await fetch(`/api/newsletter/unsubscribe/${params.id}?token=${token}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.message || "Failed to unsubscribe.");
          return;
        }
        setStatus("success");
        setMessage(data.message);
      } catch {
        setStatus("error");
        setMessage("Something went wrong.");
      }
    }
    unsubscribe();
  }, [params.id, searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Newsletter</p>
      <h1 className="mt-2 text-3xl font-bold brand-gradient-text">
        {status === "loading" ? "Processing..." : status === "success" ? "Unsubscribed" : "Something Went Wrong"}
      </h1>
      <p className="mt-3 max-w-sm text-neutral-100/70">{message}</p>
      <Link href="/" className="mt-6 text-sm text-brand-cyan-300 hover:underline">
        ← Back to home
      </Link>
    </main>
  );
}
