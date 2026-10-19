"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  X,
  Link2,
  Download,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";

type ShareMode = "choose" | "link" | "qr";

const DETAIL_ROUTE =
  /^\/(blog|services|portfolio|team|careers|testimonials|tech-stack|stack|faq)\/[^/]+\/?$/;

export default function ShareCurrentPage() {
  const pathname = usePathname();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("TGO DevStudio");
  const [mode, setMode] = useState<ShareMode>("choose");
  const [copied, setCopied] = useState(false);
  const [qrData, setQrData] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState("");

  const isDetailPage = DETAIL_ROUTE.test(pathname || "");

  useEffect(() => {
    if (!isDetailPage) return;

    setUrl(window.location.href);
    setTitle(document.title || "TGO DevStudio");
    setMode("choose");
    setQrData("");
    setError("");
  }, [isDetailPage, pathname]);

  useEffect(() => {
    if (mode !== "qr" || !url || qrData) return;

    let cancelled = false;

    async function generateQr() {
      setQrLoading(true);
      setError("");

      try {
        const QRCode = await import("qrcode");

        const image = await QRCode.toDataURL(url, {
          width: 640,
          margin: 3,
          errorCorrectionLevel: "H",
          color: {
            dark: "#101426",
            light: "#FFFFFF",
          },
        });

        if (!cancelled) setQrData(image);
      } catch {
        if (!cancelled) {
          setError("Could not generate the QR code. Please try again.");
        }
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    }

    void generateQr();

    return () => {
      cancelled = true;
    };
  }, [mode, url, qrData]);

  async function copyLink() {
    const currentUrl = url || window.location.href;

    try {
      await navigator.clipboard.writeText(currentUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = currentUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";

      document.body.appendChild(input);
      input.select();

      const successful = document.execCommand("copy");
      input.remove();

      if (!successful) {
        setError("Unable to copy the link. Please copy it manually.");
        return;
      }
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    const currentUrl = url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: currentUrl,
        });
        return;
      } catch (shareError) {
        if (
          shareError instanceof Error &&
          shareError.name === "AbortError"
        ) {
          return;
        }
      }
    }

    await copyLink();
  }

  async function shareQrImage() {
    if (!qrData) return;

    try {
      const response = await fetch(qrData);
      const blob = await response.blob();
      const file = new File([blob], "tgo-page-qr.png", {
        type: "image/png",
      });

      if (
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          title,
          text: `Scan this QR code to open: ${title}`,
          files: [file],
        });
        return;
      }

      downloadQr();
    } catch (shareError) {
      if (
        shareError instanceof Error &&
        shareError.name === "AbortError"
      ) {
        return;
      }

      downloadQr();
    }
  }

  function downloadQr() {
    if (!qrData) return;

    const anchor = document.createElement("a");
    anchor.href = qrData;
    anchor.download = "tgo-page-qr.png";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  if (!isDetailPage) return null;

  const closeDialog = () => {
    setMode("choose");
    setError("");
  };

  return (
    <>
      <section
        className="mx-auto max-w-4xl px-6 pb-12 sm:px-12"
        aria-label="Share this page"
      >
        <div
          className="flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--bg-surface)",
          }}
        >
          <div>
            <p
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Found this useful?
            </p>

            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Share this page with someone who might find it helpful.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMode("choose")}
            className="btn-premium-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-base-950"
          >
            <Share2 size={17} />
            Share page
          </button>
        </div>
      </section>

      {mode !== "choose" || mode === "choose" ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Share this page"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  TGO DevStudio
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {mode === "choose"
                    ? "How would you like to share?"
                    : mode === "link"
                      ? "Share this link"
                      : "Share this QR code"}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close sharing dialog"
                onClick={closeDialog}
                className="rounded-full p-2 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {mode !== "choose" && (
              <button
                type="button"
                onClick={() => {
                  setMode("choose");
                  setError("");
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <ArrowLeft size={16} />
                Back to sharing methods
              </button>
            )}

            {mode === "choose" && (
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => setMode("link")}
                  className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:border-cyan-400"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
                    <Link2 size={24} />
                  </span>

                  <span className="flex-1">
                    <span className="block font-semibold">
                      Share as a link
                    </span>
                    <span
                      className="mt-1 block text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Send through WhatsApp, Messages, email, and more.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("qr")}
                  className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:border-cyan-400"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
                    <QrCode size={24} />
                  </span>

                  <span className="flex-1">
                    <span className="block font-semibold">
                      Share as a QR code
                    </span>
                    <span
                      className="mt-1 block text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Display, download, or send the QR image.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={copyLink}
                  className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:border-cyan-400"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
                    {copied ? <Check size={24} /> : <Copy size={24} />}
                  </span>

                  <span className="flex-1">
                    <span className="block font-semibold">
                      {copied ? "Link copied" : "Copy link"}
                    </span>
                    <span
                      className="mt-1 block text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Copy the exact URL of this page.
                    </span>
                  </span>
                </button>
              </div>
            )}

            {mode === "link" && (
              <div className="mt-6">
                <div
                  className="break-all rounded-xl border p-3 text-sm"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {url}
                </div>

                <button
                  type="button"
                  onClick={shareLink}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold brand-gradient-bg text-base-950"
                >
                  <MessageCircle size={18} />
                  Choose an app to share
                </button>

                <button
                  type="button"
                  onClick={copyLink}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 font-semibold"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
            )}

            {mode === "qr" && (
              <div className="mt-5">
                {qrLoading && (
                  <p className="py-10 text-center text-sm">
                    Generating QR code…
                  </p>
                )}

                {qrData && (
                  <>
                    <img
                      src={qrData}
                      alt={`QR code for ${title}`}
                      className="mx-auto my-4 aspect-square w-64 rounded-xl bg-white p-2"
                    />

                    <p
                      className="break-all text-center text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {url}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={downloadQr}
                        className="flex items-center justify-center gap-2 rounded-full border px-3 py-3 text-sm font-semibold"
                        style={{ borderColor: "var(--border-subtle)" }}
                      >
                        <Download size={17} />
                        Download QR
                      </button>

                      <button
                        type="button"
                        onClick={shareQrImage}
                        className="flex items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-semibold brand-gradient-bg text-base-950"
                      >
                        <Share2 size={17} />
                        Send QR image
                      </button>
                    </div>
                  </>
                )}

                {error && (
                  <p role="alert" className="mt-3 text-sm text-red-400">
                    {error}
                  </p>
                )}
              </div>
            )}

            {error && mode !== "qr" && (
              <p role="alert" className="mt-3 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
