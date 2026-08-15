"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Trash2, FileText } from "lucide-react";

interface MediaItem {
  publicId: string;
  url: string;
  resourceType: string;
  format: string;
  bytes: number;
  createdAt: string;
  folder: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryClient() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [folderFilter, setFolderFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const res = await fetch("/api/media/library");
    const data = await res.json();
    if (data.status !== "ok") {
      setError(data.message || "Failed to load media library.");
      setIsLoading(false);
      return;
    }
    setItems(data.items);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleCopy(url: string, publicId: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(publicId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleDelete(item: MediaItem) {
    const confirmed = window.confirm(
      `Delete this file permanently from Cloudinary?\n\nWarning: if this file is still used somewhere on the site (a photo, image, or document), that reference will break. Only delete files you know are unused.`
    );
    if (!confirmed) return;

    setDeletingId(item.publicId);
    const res = await fetch("/api/media/library/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: item.publicId, resourceType: item.resourceType }),
    });
    const data = await res.json();
    if (data.status === "ok") {
      setItems((prev) => prev.filter((i) => i.publicId !== item.publicId));
    } else {
      setError(data.message || "Failed to delete file.");
    }
    setDeletingId(null);
  }

  const folders = Array.from(new Set(items.map((i) => i.folder))).sort();
  const filteredItems = folderFilter ? items.filter((i) => i.folder === folderFilter) : items;

  return (
    <div>
      <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
        Deleting a file here removes it permanently from storage. It does not automatically
        update any page still referencing it — only delete files you know are no longer in use.
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="rounded-md border border-base-800 bg-base-900 px-3 py-2 text-sm text-neutral-100"
        >
          <option value="">All folders</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
        <span className="text-sm text-neutral-500">{filteredItems.length} file(s)</span>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {isLoading && <p className="mt-6 text-neutral-400">Loading media library...</p>}

      {!isLoading && filteredItems.length === 0 && (
        <p className="mt-6 text-neutral-400">No files found.</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {filteredItems.map((item) => (
          <div key={item.publicId} className="overflow-hidden rounded-lg border border-base-800 bg-base-900">
            <div className="flex h-32 items-center justify-center bg-base-950">
              {item.resourceType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.publicId} className="h-full w-full object-cover" />
              ) : (
                <FileText size={32} className="text-neutral-500" />
              )}
            </div>
            <div className="p-2">
              <p className="truncate text-xs text-neutral-400" title={item.publicId}>
                {item.publicId.split("/").pop()}
              </p>
              <p className="text-xs text-neutral-600">
                {item.folder} · {formatBytes(item.bytes)}
              </p>
              <div className="mt-2 flex gap-1">
                <button
                  onClick={() => handleCopy(item.url, item.publicId)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md border border-base-800 py-1 text-xs text-neutral-300 hover:bg-base-800"
                >
                  <Copy size={12} /> {copiedId === item.publicId ? "Copied!" : "Copy URL"}
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.publicId}
                  className="flex items-center justify-center rounded-md border border-red-500/50 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
