import {redirect} from "next/navigation";
import {getServerSession} from "@/lib/auth/serverSession";
import {getAdminBasePath} from "@/lib/adminPath";
import PrivateDocumentVault from "@/components/admin/platform/PrivateDocumentVault";
export const dynamic="force-dynamic";
export const metadata={title:"Private Document Vault | TGO Admin"};
export default async function DocumentsPage(){const session=await getServerSession();if(!session)redirect(getAdminBasePath()+"/login");if(!session.role.isFounderRole)redirect(getAdminBasePath()+"/dashboard");return <main className="mx-auto max-w-7xl space-y-6 pb-12"><header><p className="font-mono text-xs uppercase tracking-[.18em] text-brand-cyan-400">Phase 12 · Secure records</p><h1 className="mt-2 text-3xl font-bold brand-gradient-text sm:text-4xl">Private Document Management</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">Store employee, legal, procurement, compliance and finance documents in private authenticated storage with temporary access links and immutable audit history.</p></header><PrivateDocumentVault/></main>;}
