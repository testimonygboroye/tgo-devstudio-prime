import AdminDepartmentHub from "@/components/admin/AdminDepartmentHub";
import { getAdminBasePath } from "@/lib/adminPath";
import { getServerSession } from "@/lib/auth/serverSession";
import { Home, FileText, Settings, Layers, Briefcase, Workflow, Users, Newspaper, DoorOpen, MessageCircleQuestion, Star, Boxes, Image, Video, Megaphone } from "lucide-react";

export default async function ContentStudioPage() {
  const [session] = await Promise.all([getServerSession()]);
  return <AdminDepartmentHub
    basePath={getAdminBasePath()}
    isFounder={session?.role?.isFounderRole === true}
    eyebrow="Website & creative studio"
    title="Content Studio"
    description="One organised workspace for the public website, brand identity, editorial content, service catalogue, portfolio and creative media. Choose a workspace below to manage its dedicated tools."
    sections={[
      { title: "Website foundation", description: "Control the public site's main pages, structure and brand presentation.", items: [
        { label: "Homepage", description: "Manage homepage sections, messaging and featured content.", hrefSuffix: "/home-settings", icon: Home },
        { label: "Site Pages & Legal", description: "Manage About, Accessibility, Privacy, Terms, Cookies and other core pages.", hrefSuffix: "/pages", icon: FileText },
        { label: "Landing Pages", description: "Create and manage campaign and conversion landing pages.", hrefSuffix: "/public-pages", icon: FileText },
        { label: "Site Identity & Navigation", description: "Manage site-wide identity, header, footer and navigation settings.", hrefSuffix: "/site-settings", icon: Settings },
      ]},
      { title: "Content & services", description: "Manage the information, stories and proof points presented to customers.", items: [
        { label: "Services", description: "Manage service offerings, descriptions and commercial presentation.", hrefSuffix: "/services", icon: Layers },
        { label: "Case Studies", description: "Publish project stories, outcomes and client work.", hrefSuffix: "/case-studies", icon: Briefcase },
        { label: "Process", description: "Manage the delivery process and customer journey steps.", hrefSuffix: "/process", icon: Workflow },
        { label: "Team", description: "Manage team profiles and public team information.", hrefSuffix: "/team", icon: Users },
        { label: "Blog", description: "Create, edit and publish editorial articles.", hrefSuffix: "/blog", icon: Newspaper },
        { label: "Careers", description: "Manage vacancies, recruitment content and applications.", hrefSuffix: "/careers", icon: DoorOpen },
        { label: "FAQs", description: "Manage frequently asked questions and answers.", hrefSuffix: "/faq-items", icon: MessageCircleQuestion },
        { label: "Reviews", description: "Moderate and publish customer reviews and testimonials.", hrefSuffix: "/reviews", icon: Star },
        { label: "Technology Stack", description: "Manage the technologies and platforms featured on the site.", hrefSuffix: "/stack-items", icon: Boxes },
      ]},
      { title: "Media & creative assets", description: "Manage imagery, video, collections and advertising assets in one place.", items: [
        { label: "Media Library", description: "Browse and organise uploaded images, videos and files.", hrefSuffix: "/media", icon: Image },
        { label: "Homepage Media", description: "Manage homepage hero media and featured visual experiences.", hrefSuffix: "/homepage-media", icon: Video },
        { label: "Media Collections & Advertising", description: "Manage curated media collections and advertising placements.", hrefSuffix: "/media-collections", icon: Megaphone },
      ]},
    ]}
  />;
}
