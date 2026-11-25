import AdminDepartmentHub from "@/components/admin/AdminDepartmentHub";
import { getAdminBasePath } from "@/lib/adminPath";
import { MessageSquare, LifeBuoy, Send } from "lucide-react";

export default function CommunicationsPage() {
  return <AdminDepartmentHub
    basePath={getAdminBasePath()}
    eyebrow="Communications & support"
    title="Communications & Support"
    description="A central entry point for conversations, customer support and audience communications. Open the dedicated workspace for the channel you need."
    sections={[
      { title: "Communication channels", description: "Manage internal and customer-facing communication.", items: [
        { label: "Messages & Conversations", description: "Manage team conversations, client messaging, AI task conversations and connected communication channels.", hrefSuffix: "/messages", icon: MessageSquare },
        { label: "Customer Support", description: "Manage support tickets, customer responses, service levels and support workflows.", hrefSuffix: "/support", icon: LifeBuoy },
        { label: "Newsletter", description: "Manage newsletter subscribers and audience communication.", hrefSuffix: "/newsletter", icon: Send },
      ]},
    ]}
  />;
}
