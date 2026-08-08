import type { FilterQuery } from "mongoose";
import type { IBlogPost } from "@/models/BlogPost";

export function getPubliclyVisibleFilter(): FilterQuery<IBlogPost> {
  const now = new Date();
  return {
    $or: [
      { publishStatus: "published" },
      { publishStatus: "scheduled", scheduledFor: { $lte: now } },
    ],
  };
}
