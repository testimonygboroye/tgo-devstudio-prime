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

/**
 * One-time, versioned migration for the legal pages.
 * It only replaces legacy records; current admin-edited content is preserved.
 */
export async function migrateLegalPages(updatedBy: Types.ObjectId | string) {
  const existing = await PageContent.find({ type: { $in: LEGAL_TYPES } })
    .select("type contentVersion")
    .lean();

  const byType = new Map(existing.map((page) => [page.type, page.contentVersion]));
  const staleTypes = LEGAL_TYPES.filter(
    (type) => byType.get(type) !== PAGE_CONTENT_VERSION,
  );

  if (staleTypes.length === 0) return { migrated: 0 };

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

  return { migrated: staleTypes.length };
}
