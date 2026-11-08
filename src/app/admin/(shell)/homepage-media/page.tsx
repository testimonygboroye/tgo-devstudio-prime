import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import HomepageMediaClient from "./HomepageMediaClient";
export default async function HomepageMediaPage(){
 const session=await getServerSession();
 guardCanEdit(session!,"homeSettings");
 return <div><p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Website experience</p><h1 className="mt-1 text-3xl font-bold brand-gradient-text">Homepage Media & Countdown</h1><p className="mt-2 max-w-2xl text-sm text-neutral-400">Manage the homepage media section, videos, images, optional countdown, and date-based media changes.</p><div className="mt-8"><HomepageMediaClient/></div></div>;
}
