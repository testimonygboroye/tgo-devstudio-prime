import type { ReactNode } from "react";
import ClientPortalFrame from "@/components/client/ClientPortalFrame";
export const metadata={robots:{index:false,follow:false,noarchive:true}};
export default function ClientPortalLayout({children}:{children:ReactNode}){return <ClientPortalFrame>{children}</ClientPortalFrame>;}
