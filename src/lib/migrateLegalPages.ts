import PageContent, { PageContentType } from "@/models/PageContent";
import { PAGE_DEFAULTS } from "@/lib/constants/pageDefaults";
import { PAGE_CONTENT_VERSION } from "@/lib/constants/legalContent";
import { Types } from "mongoose";

const LEGAL_TYPES: PageContentType[] = [
  "privacy-policy",
  "terms-of-service",
  "usage-policy",
  "accessibility",
];

export const AI_PRIVACY_SECTION = `<h2>AI assistants and automated support</h2>
<p>Where enabled, TGO DevStudio provides separate AI assistants for public website visitors, authenticated clients and authorised staff. The public assistant is limited to public website information and general client-portal access guidance. The client assistant may use information belonging to the signed-in client account, including that client's projects, milestones, deliverables, support history, invoices, payments and account-credit records. The staff assistant is limited to the signed-in staff member's own authorised account context and platform guidance; it is not intended to expose another person's private records.</p>
<p>When you send a message to an assistant, your message and the minimum authorised context needed to answer may be sent to the AI model provider configured for that assistant. Depending on the active configuration, providers may include Google Gemini, OpenAI or Anthropic Claude. If a configured primary provider is unavailable, a separately configured fallback provider may receive the same request. Each provider processes information under its applicable terms, privacy notice and account settings. We do not control the provider's independent systems.</p>
<p>These three chat assistants are designed for read-only explanations and guidance. They are not given business-operation tools and cannot change project, payment, account or workforce records. Separate internal AI workforce features, if enabled, are governed by their own role permissions, activity logging and human-approval requirements.</p>
<p>Conversation history is stored in the platform so you can return to previous questions. Public conversations are associated with a browser session; client and staff conversations are associated with the authenticated account. You can clear the active conversation using the assistant's clear-history control. Backups or security records may remain for limited recovery, audit or legal purposes. Do not enter passwords, API keys, access tokens, full card details or unnecessary sensitive information into an AI conversation.</p>\n<p>Privacy-rights and deletion requests are stored with a reference number, contact details, the service or account identifier supplied by the requester, request description, verification notes and resolution status so the request can be reviewed and tracked. We verify identity before disclosing or deleting personal information and may retain records where required or permitted by law.</p>`;

export async function migrateLegalPages(updatedBy: Types.ObjectId | string) {
  const existing = await PageContent.find({ type: { $in: LEGAL_TYPES } })
    .select("type contentVersion")
    .lean();

  const byType = new Map(existing.map((page) => [page.type, page.contentVersion]));
  const staleTypes = LEGAL_TYPES.filter(
    (type) => byType.get(type) !== PAGE_CONTENT_VERSION,
  );

  if (staleTypes.length > 0) {
    await Promise.all(
      staleTypes.map((type) =>
        PageContent.findOneAndUpdate(
          { type },
          {
            $set: {
              type,
              title: PAGE_DEFAULTS[type].title,
              content: PAGE_DEFAULTS[type].content,
              contentVersion: PAGE_CONTENT_VERSION,
              translations: {},
              lastUpdatedBy: updatedBy,
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        ),
      ),
    );
  }

  // Preserve founder-authored privacy policy content while correcting the known
  // pre-portal notice and appending the AI/data-processing disclosure once.
  const privacy = await PageContent.findOne({ type: "privacy-policy" });
  let privacyUpdated = false;
  if (privacy) {
    const outdatedNotice = "New products, a client portal, account workspace or payment service may require an additional notice before launch.";
    if (privacy.content.includes(outdatedNotice)) {
      privacy.content = privacy.content.replace(
        outdatedNotice,
        "The Services include the public website, authenticated client portal, project and support workspaces, payment and invoice features, connected communication channels and AI-assisted help features where enabled. Internal workforce and administration tools are used by authorised personnel.",
      );
      privacyUpdated = true;
    }
    if (!privacy.content.includes("<h2>AI assistants and automated support</h2>")) {
      privacy.content += "\n" + AI_PRIVACY_SECTION;
      privacyUpdated = true;
    }
    if (privacyUpdated) {
      privacy.lastUpdatedBy = new Types.ObjectId(String(updatedBy));
      await privacy.save();
    }
  }

  return { migrated: staleTypes.length + (privacyUpdated ? 1 : 0) };
}
