import { redirect } from "next/navigation";
import { ServerSession } from "@/lib/auth/serverSession";
import {
  requireAnyContentPermission,
  requireContentPermission,
} from "@/lib/auth/authorize";
import { getAdminBasePath } from "@/lib/adminPath";

function requireSession(session: ServerSession | null): asserts session is ServerSession {
  if (!session) {
    redirect(`${getAdminBasePath()}/login`);
  }
}

export function guardCanView(session: ServerSession | null, contentType: string) {
  requireSession(session);
  if (!requireAnyContentPermission(session, contentType)) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }
}

export function guardCanCreate(session: ServerSession | null, contentType: string) {
  requireSession(session);
  if (!requireContentPermission(session, contentType, "create")) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }
}

export function guardCanEdit(session: ServerSession | null, contentType: string) {
  requireSession(session);
  if (!requireContentPermission(session, contentType, "edit")) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }
}
