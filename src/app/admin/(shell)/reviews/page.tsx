import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import ReviewsListClient from "./ReviewsListClient";

export default async function ReviewsListPage() {
  const session = await getServerSession();
  guardCanView(session!, "reviews");
  return <ReviewsListClient />;
}
