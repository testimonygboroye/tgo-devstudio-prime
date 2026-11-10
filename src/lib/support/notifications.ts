import {sendNotificationEmail} from "@/lib/email/sendEmail";
function esc(v:string){return v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));}
export async function sendSupportNotification(input:{toEmail?:string;toName?:string;subject:string;message:string;whatsappTo?:string}){
 const outcomes:{email:boolean;whatsapp:boolean;errors:string[]}={email:false,whatsapp:false,errors:[]};
 if(input.toEmail&&process.env.BREVO_API_KEY&&process.env.BREVO_SENDER_EMAIL){
  const result=await sendNotificationEmail({toEmail:input.toEmail,toName:input.toName,subject:input.subject,htmlContent:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033"><h2 style="color:#6338e8">TGO DevStudio Support</h2><p>Hello ${esc(input.toName||"there")},</p><p>${esc(input.message)}</p><p>Sign in to your client portal to view the full conversation and reply securely.</p></div>`});
  outcomes.email=result.success;if(!result.success)outcomes.errors.push(result.error||"Email delivery failed.");
 }
 const sid=process.env.TWILIO_ACCOUNT_SID,token=process.env.TWILIO_AUTH_TOKEN,from=process.env.TWILIO_WHATSAPP_FROM,to=input.whatsappTo||process.env.SUPPORT_WHATSAPP_TO;
 if(to&&sid&&token&&from){
  try{const auth=Buffer.from(sid+":"+token).toString("base64");const form=new URLSearchParams({From:from.startsWith("whatsapp:")?from:"whatsapp:"+from,To:to.startsWith("whatsapp:")?to:"whatsapp:"+to,Body:input.subject+" — "+input.message.slice(0,900)});const res=await fetch("https://api.twilio.com/2010-04-01/Accounts/"+sid+"/Messages.json",{method:"POST",headers:{Authorization:"Basic "+auth,"Content-Type":"application/x-www-form-urlencoded"},body:form.toString(),cache:"no-store"});outcomes.whatsapp=res.ok;if(!res.ok)outcomes.errors.push("WhatsApp provider returned HTTP "+res.status);}catch(e){outcomes.errors.push(e instanceof Error?e.message:"WhatsApp delivery failed.");}
 }
 return outcomes;
}
