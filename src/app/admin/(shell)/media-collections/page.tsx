import {getServerSession} from "@/lib/auth/serverSession";
import {guardCanEdit} from "@/lib/auth/pageGuards";
import MediaCollectionsClient from "./MediaCollectionsClient";
export default async function MediaCollectionsPage(){const session=await getServerSession();guardCanEdit(session!,"homeSettings");return <div><p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Website growth & experience</p><h1 className="mt-1 text-3xl font-bold brand-gradient-text">Media & Advertising Studio</h1><p className="mt-2 max-w-3xl text-sm text-neutral-400">Manage launch and permanent homepage media, sponsored campaigns and client partner recommendations from one ordered media workspace.</p><div className="mt-8"><MediaCollectionsClient/></div></div>}
