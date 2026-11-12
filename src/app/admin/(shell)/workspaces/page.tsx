import WorkspacesClient from "@/components/workspaces/WorkspacesClient";

export const metadata = {
  title: "Universal Workspaces | TGO Admin",
};

export const dynamic = "force-dynamic";

/**
 * The founder/admin entry point intentionally reuses the shared workspace
 * experience. Because this route lives inside the admin shell route group,
 * the normal AdminSidebar, AdminTopBar and admin scroll layout remain present.
 * The public /workspaces route remains available to clients and employees.
 */
export default function AdminWorkspacesPage() {
  return <WorkspacesClient />;
}
