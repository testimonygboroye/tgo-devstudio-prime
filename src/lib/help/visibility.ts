import { IHelpArticle } from "@/models/HelpArticle";
import { ServerSession } from "@/lib/auth/serverSession";
import { requireAnyContentPermission } from "@/lib/auth/authorize";

export function canViewArticle(
  article: Pick<IHelpArticle, "visibility" | "requiredContentType">,
  session: ServerSession | null
): boolean {
  if (article.visibility === "public") return true;
  if (article.visibility === "preLogin") return true;

  if (!session) return false;

  if (article.visibility === "anyAuthenticated") return true;

  if (article.visibility === "permission" && article.requiredContentType) {
    return requireAnyContentPermission(session, article.requiredContentType);
  }

  return false;
}
