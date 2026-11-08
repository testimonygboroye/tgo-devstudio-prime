import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg","image/png","image/webp","image/avif"]);
const ALLOWED_HOSTS = new Set(["tgo-devstudio-prime.vercel.app","tgo-devstudio-prime.onrender.com","res.cloudinary.com"]);

export async function GET(request: NextRequest) {
 const raw=request.nextUrl.searchParams.get("url");
 if(!raw)return NextResponse.json({error:"Missing OG image URL."},{status:400});
 let target:URL;
 try{target=new URL(raw);}catch{return NextResponse.json({error:"Invalid OG image URL."},{status:400});}
 const allowed=new Set([...ALLOWED_HOSTS,request.nextUrl.hostname]);
 if(target.protocol!=="https:"||!allowed.has(target.hostname)||target.username||target.password)return NextResponse.json({error:"OG image host is not allowed."},{status:403});
 try{
  const upstream=await fetch(target.toString(),{redirect:"follow",cache:"no-store",headers:{"Accept":"image/avif,image/webp,image/png,image/jpeg"}});
  if(!upstream.ok)return NextResponse.json({error:"The OG preview image could not be retrieved."},{status:502});
  const finalUrl=new URL(upstream.url);
  if(finalUrl.protocol!=="https:"||!allowed.has(finalUrl.hostname))return NextResponse.json({error:"The OG image redirected to an unsupported host."},{status:403});
  const type=(upstream.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
  if(!ALLOWED_IMAGE_TYPES.has(type))return NextResponse.json({error:"The OG preview is not a supported image."},{status:415});
  const length=Number(upstream.headers.get("content-length")||0);
  if(length>MAX_IMAGE_BYTES)return NextResponse.json({error:"The OG preview is too large."},{status:413});
  const bytes=await upstream.arrayBuffer();
  if(!bytes.byteLength||bytes.byteLength>MAX_IMAGE_BYTES)return NextResponse.json({error:"The OG preview image is empty or too large."},{status:413});
  return new NextResponse(bytes,{headers:{"Content-Type":type,"Content-Length":String(bytes.byteLength),"Cache-Control":"public, max-age=3600, stale-while-revalidate=86400","X-Content-Type-Options":"nosniff","Content-Disposition":"inline"}});
 }catch(error){console.error("[Share OG Image]",error);return NextResponse.json({error:"Could not retrieve the OG preview image."},{status:502});}
}
