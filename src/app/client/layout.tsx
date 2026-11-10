import type { ReactNode } from "react";

export const metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export default function ClientPortalLayout({ children }: { children: ReactNode }) {
  return children;
}
