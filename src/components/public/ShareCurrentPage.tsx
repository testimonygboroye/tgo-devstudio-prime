"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  X,
} from "lucide-react";

const DETAIL_ROUTE =
  /^\/(blog|services|portfolio|team|careers|testimonials|tech-stack|stack)\/[^/]+\/?$/;

export default function ShareCurrentPage() {
  const pathname = usePathname();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("TGO DevStudio");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState("");

  const isDetailPage = DETAIL_ROUTE.test(pathname || "");

  useEffect(() => {
    if (!isDetailPage) return;

    setUrl(window.location.href);
    setTitle(document.title || "TGO DevStudio");
  }, [isDetailPage, pathname]);

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
      document.execCommand("copy");
      input.remove();
    }

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
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
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }
      }
    }

    await copyLink();
  }

  async function showQr() {
    const currentUrl = url || window.location.href;

    try {
      const QRCode = await import("qrcode");

      const image = await QRCode.toDataURL(currentUrl, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#101426",
          light: "#FFFFFF",
        },
      });

      setQrData(image);
      setQrOpen(true);
    } catch (error) {
      console.error("Could not generate share QR code:", error);
      await copyLink();
    }
  }

  if (!isDetailPage) return null;

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

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={shareLink}
              className="btn-premium-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-base-950"
            >
              <Share2 size={17} />
              Share page
            </button>

            <button
              type="button"
              onClick={copyLink}
              className="btn-premium-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? "Copied" : "Copy link"}
            </button>

            <button
              type="button"
              onClick={showQr}
              className="btn-premium-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              <QrCode size={17} />
              QR code
            </button>
          </div>
        </div>
      </section>

      {qrOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Share page QR code"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">
                Scan to open this page
              </h2>

              <button
                type="button"
                aria-label="Close QR code"
                onClick={() => setQrOpen(false)}
                className="rounded-full p-2 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {qrData && (
              <img
                src={qrData}
                alt="QR code for this page"
                className="mx-auto my-5 aspect-square w-64 rounded-xl bg-white p-2"
              />
            )}

            <p
              className="break-all text-center text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {url}
            </p>

            <button
              type="button"
              onClick={copyLink}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold brand-gradient-bg text-base-950"
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? "Link copied" : "Copy page link"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
