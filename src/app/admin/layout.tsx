import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest-admin",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
