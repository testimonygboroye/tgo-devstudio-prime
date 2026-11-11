const base=(process.env.SITE_URL||"https://tgo-devstudio-prime.onrender.com").replace(/\/$/,"");
const secret=process.env.PLATFORM_AUTOMATION_CRON_SECRET;
if(!secret){console.error("PLATFORM_AUTOMATION_CRON_SECRET is required.");process.exit(1);}
const jobs=["/api/cron/webhook-delivery","/api/cron/sales-followups"];
let failed=0;
for(const path of jobs){try{const response=await fetch(base+path,{headers:{Authorization:"Bearer "+secret},signal:AbortSignal.timeout(30000),cache:"no-store"});const body=await response.text();console.log(path,response.status,body.slice(0,1500));if(!response.ok)failed++;}catch(error){failed++;console.error(path,error instanceof Error?error.message:"Automation request failed.");}}
if(failed)process.exit(1);
