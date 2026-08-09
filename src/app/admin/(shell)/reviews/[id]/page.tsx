import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanView } from "@/lib/auth/pageGuards";
import ReviewDetailClient from "./ReviewDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewDetailPage({ params }: PageProps) {
  const session = await getServerSession();
  guardCanView(session!, "reviews");
  const { id } = await params;
  return <ReviewDetailClient id={id} />;
}
