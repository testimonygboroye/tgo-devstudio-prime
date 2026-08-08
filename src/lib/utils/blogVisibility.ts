import type { QueryFilter } from "mongoose";
import type { IBlogPost } from "@/models/BlogPost";

export function getPubliclyVisibleFilter(): QueryFilter<IBlogPost> {
  const now = new Date();
  return {
    $or: [
      { publishStatus: "published" },
      { publishStatus: "scheduled", scheduledFor: { $lte: now } },
    ],
  };
}
