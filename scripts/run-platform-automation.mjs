const base=(process.env.APP_BASE_URL||process.env.SITE_URL||"").replace(/\/$/,"");
const secret=process.env.PLATFORM_AUTOMATION_CRON_SECRET;
if(!base){console.error("APP_BASE_URL (or SITE_URL) must point to the active deployment. No hosting provider is hard-coded.");process.exit(1);}
if(!secret){console.error("PLATFORM_AUTOMATION_CRON_SECRET is required.");process.exit(1);}
const jobs=["/api/cron/webhook-delivery","/api/cron/sales-followups","/api/cron/executive-reports","/api/cron/marketing-campaigns","/api/cron/analytics-snapshot","/api/cron/support-escalation","/api/cron/engagement-expiry"];
let failed=0;
for(const path of jobs){try{const response=await fetch(base+path,{headers:{Authorization:"Bearer "+secret},signal:AbortSignal.timeout(30000),cache:"no-store"});const body=await response.text();console.log(path,response.status,body.slice(0,1500));if(!response.ok)failed++;}catch(error){failed++;console.error(path,error instanceof Error?error.message:"Automation request failed.");}}
if(failed)process.exit(1);
