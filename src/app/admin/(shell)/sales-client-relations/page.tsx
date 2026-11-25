import AdminDepartmentHub from "@/components/admin/AdminDepartmentHub";
import { getAdminBasePath } from "@/lib/adminPath";
import { getServerSession } from "@/lib/auth/serverSession";
import { Contact, MessageSquareText, Mail, PhoneCall, ShoppingCart } from "lucide-react";

export default async function SalesClientRelationsPage() {
  const session = await getServerSession();
  return <AdminDepartmentHub
    basePath={getAdminBasePath()}
    isFounder={session?.role?.isFounderRole === true}
    eyebrow="Sales & client relations"
    title="Sales & Client Relations"
    description="One operating workspace for client relationships, enquiries, contact requests, consultations and commercial delivery."
    sections={[
      { title: "Client relationships", description: "Manage the complete customer relationship and incoming opportunities.", items: [
        { label: "Client Management", description: "Manage client profiles, organisations, onboarding and relationship activity.", hrefSuffix: "/clients", icon: Contact },
        { label: "Client Enquiries", description: "Review, assign and follow up on submitted client enquiries.", hrefSuffix: "/client-enquiries", icon: MessageSquareText },
        { label: "Contact Submissions", description: "Review website contact requests and route them to the right team.", hrefSuffix: "/contact", icon: Mail },
        { label: "Book a Call", description: "Manage consultation bookings and scheduled discovery calls.", hrefSuffix: "/book-a-call", icon: PhoneCall },
      ]},
      { title: "Commercial delivery", description: "Manage proposals, orders and project delivery through the commercial lifecycle.", items: [
        { label: "Sales & Delivery", description: "Manage sales opportunities, proposals, contracts, orders and delivery projects.", hrefSuffix: "/commercial", icon: ShoppingCart, founderOnly: true },
      ]},
    ]}
  />;
}
