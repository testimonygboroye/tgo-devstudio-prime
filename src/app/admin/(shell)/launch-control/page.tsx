import { getServerSession } from "@/lib/auth/serverSession";
import { guardCanEdit } from "@/lib/auth/pageGuards";
import LaunchControlClient from "./LaunchControlClient";
export default async function LaunchControlPage(){
 const session=await getServerSession();
 guardCanEdit(session!,"homeSettings");
 return <div><p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Website experience</p><h1 className="mt-1 text-3xl font-bold brand-gradient-text">Launch Control</h1><p className="mt-2 max-w-2xl text-sm text-neutral-400">Manage the coming-soon campaign, upload its video and flyer, set the live launch countdown, and choose the media that remains after launch.</p><div className="mt-8"><LaunchControlClient/></div></div>;
}
