import { redirect } from "next/navigation";
import { getAdminBasePath } from "@/lib/adminPath";

/**
 * The public-facing admin URL is rewritten by src/proxy.ts to /admin.
 * Redirect the internal entry point to the dashboard under the configured
 * external admin path. Redirecting to /command-deck itself creates a loop:
 * /command-deck -> rewrite /admin -> redirect /command-deck.
 */
export default function AdminEntryRedirect() {
  redirect(`${getAdminBasePath()}/dashboard`);
}
