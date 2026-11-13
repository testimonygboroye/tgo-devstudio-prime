import type { Metadata } from "next";
import HelpIndexClient from "./HelpIndexClient";
import { getPublicPageContent } from "@/lib/publicSite/getPublicPageContent";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicPageContent("help");
  return { title: page.metaTitle, description: page.metaDescription, alternates: { canonical: "/help" } };
}

export default function HelpIndexPage() {
  return <HelpIndexClient />;
}
