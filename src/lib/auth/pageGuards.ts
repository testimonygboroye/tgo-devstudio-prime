import { redirect } from "next/navigation";
import { ServerSession } from "@/lib/auth/serverSession";
import {
  requireAnyContentPermission,
  requireContentPermission,
} from "@/lib/auth/authorize";
import { getAdminBasePath } from "@/lib/adminPath";

export function guardCanView(session: ServerSession, contentType: string) {
  if (!requireAnyContentPermission(session, contentType)) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }
}

export function guardCanCreate(session: ServerSession, contentType: string) {
  if (!requireContentPermission(session, contentType, "create")) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }
}

export function guardCanEdit(session: ServerSession, contentType: string) {
  if (!requireContentPermission(session, contentType, "edit")) {
    redirect(`${getAdminBasePath()}/dashboard`);
  }
}
