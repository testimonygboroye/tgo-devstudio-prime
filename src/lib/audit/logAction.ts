import { connectToDatabase } from "@/lib/db";
import { sendAdminPush } from "@/lib/push/server";
import { getAdminBasePath } from "@/lib/adminPath";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";

interface LogAuditParams {
  actorId: string;
  method: string;
  path: string;
}

const ACTION_LABELS: { match: RegExp; label: string }[] = [
  { match: /\/api\/users\/[^/]+$/, label: "Modified a user" },
  { match: /\/api\/roles\/[^/]+$/, label: "Modified a role" },
  { match: /\/api\/roles$/, label: "Created a role" },
  { match: /\/api\/invites\/[^/]+\/decision$/, label: "Decided on an invite" },
  { match: /\/api\/invites$/, label: "Submitted an invite" },
  { match: /\/api\/role-change-requests/, label: "Decided on a role change" },
  { match: /\/api\/reviews\/[^/]+$/, label: "Moderated a review" },
  { match: /\/api\/contact\/[^/]+$/, label: "Updated a contact message" },
  { match: /\/api\/careers\/[^/]+\/applications/, label: "Updated a job application" },
  { match: /\/api\/media\/library\/delete/, label: "Deleted a media file" },
  { match: /\/api\/newsletter\/broadcast/, label: "Sent a newsletter broadcast" },
  { match: /\/api\/auth\/login/, label: "Logged in" },
  { match: /\/api\/auth\/logout/, label: "Logged out" },
];

function describeAction(method: string, path: string): string {
  const matched = ACTION_LABELS.find((entry) => entry.match.test(path));
  if (matched) return matched.label;

  const verb = method === "POST" ? "Created" : method === "DELETE" ? "Deleted" : "Updated";
  const segment = path.split("/").filter(Boolean)[1] || "item";
  return `${verb} ${segment}`;
}

export async function logAuditAction(params: LogAuditParams): Promise<void> {
  try {
    await connectToDatabase();
    const user = await User.findById(params.actorId).select("name");
    if (!user) return;

    const action = describeAction(params.method, params.path);
    await AuditLog.create({
      actor: params.actorId,
      actorName: user.name,
      method: params.method,
      path: params.path,
      action,
    });

    // Avoid noisy login/logout notifications while retaining meaningful audit events.
    if (!/\/api\/auth\/(login|logout)/.test(params.path)) {
      void sendAdminPush({
        title: "Admin audit event",
        body: `${user.name}: ${action}.`,
        url: `${getAdminBasePath()}/audit-log`,
        category: "audit",
        tag: `audit-${Date.now()}`,
      }).catch((error) => console.error("[Push] Audit notification failed:", error));
    }
  } catch (error) {
    console.error("Failed to write audit log entry:", error);
  }
}
