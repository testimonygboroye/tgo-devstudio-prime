"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link2, Plus, RefreshCw, ShieldCheck, Unplug, KeyRound, ExternalLink } from "lucide-react";
import { notify } from "@/lib/platform/toast";

type Field = { key: string; label: string; hint: string; required?: boolean };
type Provider = { id: string; name: string; category: string; description: string; fields: Field[] };
type Account = { id: string; providerId: string; accountLabel: string; ownerType: string; authMethod: string; credentialNames: string[]; requestedPermissions: string[]; grantedPermissions: string[]; readEnabled: boolean; writeEnabled: boolean; status: string; lastError?: string };
type OAuthApp = { id: string; providerId: string; appName: string; clientId: string; callbackUrl: string; scopes: string[]; active: boolean };
const oauthProviders = [{ id: "github", name: "GitHub" }, { id: "google_workspace", name: "Google Workspace" }, { id: "google_cloud", name: "Google Cloud" }];

export default function IntegrationAccountsPanel() {
 const [providers,setProviders]=useState<Provider[]>([]);
 const [accounts,setAccounts]=useState<Account[]>([]);
 const [apps,setApps]=useState<OAuthApp[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [providerId,setProviderId]=useState("github");
 const [accountLabel,setAccountLabel]=useState("");
 const [credentials,setCredentials]=useState<Record<string,string>>({});
 const [permissions,setPermissions]=useState("");
 const [readEnabled,setReadEnabled]=useState(true);
 const [writeEnabled,setWriteEnabled]=useState(true);
 const [appForm,setAppForm]=useState({providerId:"github",appName:"",clientId:"",clientSecret:"",scopes:"read:user, user:email, repo"});
 const [appSaving,setAppSaving]=useState(false);

 const [callbackUrl,setCallbackUrl]=useState("/api/platform/integrations/oauth/callback");
 const load=useCallback(async()=>{
  setLoading(true);
  try{
   const [accountResponse,appResponse]=await Promise.all([
    fetch("/api/platform/integration-accounts",{cache:"no-store"}),
    fetch("/api/platform/integration-applications",{cache:"no-store"})
   ]);
   const [accountData,appData]=await Promise.all([accountResponse.json(),appResponse.json()]);
   if(!accountResponse.ok)throw new Error(accountData.error||"Could not load account connections.");
   if(!appResponse.ok)throw new Error(appData.error||"Could not load developer applications.");
   setProviders(accountData.providers||[]);setAccounts(accountData.accounts||[]);setApps(appData.applications||[]);if(appData.callbackUrl)setCallbackUrl(String(appData.callbackUrl));
  }catch(error){notify(error instanceof Error?error.message:"Could not load integration data.","error");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const provider=useMemo(()=>providers.find(item=>item.id===providerId),[providers,providerId]);

 async function saveAccount(event:FormEvent){
  event.preventDefault();setBusy(true);
  try{
   const response=await fetch("/api/platform/integration-accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({providerId,accountLabel,authMethod:"api_key",credentials,requestedPermissions:permissions.split(/[\n,;]+/).map(value=>value.trim()).filter(Boolean),readEnabled,writeEnabled})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not save connection.");
   notify(data.message||"Account connection saved.","success");setCredentials({});setAccountLabel("");await load();
  }catch(error){notify(error instanceof Error?error.message:"Could not save connection.","error");}
  finally{setBusy(false);}
 }
 async function saveOAuthApp(event:FormEvent){
  event.preventDefault();setAppSaving(true);
  try{
   const response=await fetch("/api/platform/integration-applications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    providerId:appForm.providerId,appName:appForm.appName,appType:"oauth_app",clientId:appForm.clientId,clientSecret:appForm.clientSecret,
    callbackUrl,scopes:appForm.scopes.split(/[\n,;]+/).map(value=>value.trim()).filter(Boolean)
   })});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not save OAuth application.");
   notify(data.message||"Developer application saved.","success");setAppForm(current=>({...current,appName:"",clientId:"",clientSecret:""}));await load();
  }catch(error){notify(error instanceof Error?error.message:"Could not save OAuth application.","error");}
  finally{setAppSaving(false);}
 }
 async function connectApp(app:OAuthApp){
  setBusy(true);
  try{
   const response=await fetch("/api/platform/integrations/oauth/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId:app.id})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not start provider authorization.");
   window.location.assign(String(data.authorizationUrl));
  }catch(error){notify(error instanceof Error?error.message:"Could not start provider authorization.","error");setBusy(false);}
 }
 async function accountAction(id:string,action:"disconnect"|"revoke"){
  if(!window.confirm(action==="revoke"?"Revoke this account connection and clear its stored credentials?":"Disconnect this account and clear its stored credentials?"))return;
  setBusy(true);
  try{const response=await fetch("/api/platform/integration-accounts",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,action})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Action failed.");notify(data.message||"Account "+action+"ed.","success");await load();}
  catch(error){notify(error instanceof Error?error.message:"Action failed.","error");}
  finally{setBusy(false);}
 }
 async function verify(id:string){
  setBusy(true);
  try{const response=await fetch("/api/platform/integration-accounts/test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Verification failed.");notify(data.message||"Account verified.","success");await load();}
  catch(error){notify(error instanceof Error?error.message:"Verification failed.","error");await load();}
  finally{setBusy(false);}
 }
 async function togglePermission(account:Account,field:"readEnabled"|"writeEnabled"){
  const body={id:account.id,action:"permissions",readEnabled:field==="readEnabled"?!account.readEnabled:account.readEnabled,writeEnabled:field==="writeEnabled"?!account.writeEnabled:account.writeEnabled};
  try{const response=await fetch("/api/platform/integration-accounts",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||"Permission update failed.");notify("Connection permissions updated.","success");await load();}
  catch(error){notify(error instanceof Error?error.message:"Permission update failed.","error");}
 }
 const input="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-2.5 text-sm text-[var(--text-primary)]";
 return <section className="space-y-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-400"><Link2 size={14}/> Multi-account connections</p><h2 className="mt-1 text-xl font-bold">Founder and client account vault</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Connect multiple accounts for the same service. Connections are owner-isolated; credentials are encrypted and never returned to the browser.</p></div><button onClick={()=>void load()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 text-sm"><RefreshCw size={15}/> Refresh</button></div>

  <section className="space-y-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
   <div><h3 className="font-semibold">Developer applications · OAuth registration</h3><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Register your own provider-side OAuth app once, then authorize one or more accounts under this founder or client owner. Add the exact callback URL below to the provider developer console.</p></div>
   <form onSubmit={saveOAuthApp} className="grid gap-3 md:grid-cols-2">
    <label className="text-sm">Provider<select className={input} value={appForm.providerId} onChange={event=>setAppForm(current=>({...current,providerId:event.target.value,scopes:event.target.value==="github"?"read:user, user:email, repo":"openid, email, profile"}))}>{oauthProviders.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label className="text-sm">Application name<input className={input} required value={appForm.appName} onChange={event=>setAppForm(current=>({...current,appName:event.target.value}))} placeholder="TGO Production GitHub OAuth"/></label>
    <label className="text-sm">OAuth Client ID<input className={input} required value={appForm.clientId} onChange={event=>setAppForm(current=>({...current,clientId:event.target.value}))}/></label>
    <label className="text-sm">OAuth Client Secret<input className={input} type="password" autoComplete="new-password" required value={appForm.clientSecret} onChange={event=>setAppForm(current=>({...current,clientSecret:event.target.value}))}/></label>
    <label className="text-sm md:col-span-2">Exact callback URL<input className={input} readOnly value={callbackUrl}/></label>
    <label className="text-sm md:col-span-2">Requested OAuth scopes<textarea className={input} rows={2} value={appForm.scopes} onChange={event=>setAppForm(current=>({...current,scopes:event.target.value}))}/></label>
    <p className="text-xs leading-5 text-[var(--text-muted)] md:col-span-2">The client secret is encrypted before storage. OAuth tokens are stored separately in the encrypted account vault. Only GitHub and Google OAuth adapters are enabled in this release; other providers remain unavailable until their token and identity adapters are verified.</p>
    <button disabled={appSaving||!appForm.appName.trim()||!appForm.clientId.trim()||!appForm.clientSecret.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2"><Plus size={16}/>{appSaving?"Saving application…":"Save encrypted OAuth application"}</button>
   </form>
   <div className="space-y-2">{apps.map(app=><article key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3"><div><p className="text-sm font-semibold">{app.appName}</p><p className="text-xs text-[var(--text-muted)]">{app.providerId} · {app.active?"Active":"Disabled"} · {app.scopes.join(", ")}</p></div><button disabled={busy||!app.active} onClick={()=>void connectApp(app)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cyan-400/30 px-3 text-xs font-semibold text-cyan-300 disabled:opacity-40"><ExternalLink size={14}/> Authorize account</button></article>)}{!apps.length&&<p className="text-xs text-[var(--text-muted)]">No OAuth applications registered in this account scope yet.</p>}</div>
  </section>

  <form onSubmit={saveAccount} className="grid gap-3 rounded-xl border border-[var(--border-subtle)] p-4 md:grid-cols-2">
   <div className="md:col-span-2"><h3 className="font-semibold">Add API-key account</h3><p className="text-xs text-[var(--text-muted)]">Use this for providers that support direct API-key authorization. OAuth providers should be connected through the developer application flow above.</p></div>
   <label className="text-sm">Service<select className={input} value={providerId} onChange={event=>{setProviderId(event.target.value);setCredentials({});}}>{providers.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
   <label className="text-sm">Account label<input className={input} value={accountLabel} onChange={event=>setAccountLabel(event.target.value)} required placeholder="e.g. Production account"/></label>
   {provider?.fields.map(field=><label key={field.key} className="text-sm">{field.label}<input className={input} type="password" autoComplete="off" value={credentials[field.key]||""} onChange={event=>setCredentials(current=>({...current,[field.key]:event.target.value}))} placeholder={field.hint} required={field.required!==false}/></label>)}
   {provider&&!provider.fields.length&&<p className="md:col-span-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-200">This provider requires its dedicated OAuth or application installation flow. API-key entry is disabled.</p>}
   <label className="text-sm md:col-span-2">Requested permissions / scopes<textarea className={input} rows={2} value={permissions} onChange={event=>setPermissions(event.target.value)} placeholder="Provider-specific scopes, separated by commas"/></label>
   <div className="flex flex-wrap gap-4 text-sm md:col-span-2"><label className="flex items-center gap-2"><input type="checkbox" checked={readEnabled} onChange={event=>setReadEnabled(event.target.checked)}/> Allow read access</label><label className="flex items-center gap-2"><input type="checkbox" checked={writeEnabled} onChange={event=>setWriteEnabled(event.target.checked)}/> Allow write access</label></div>
   <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] md:col-span-2"><ShieldCheck size={15}/> Actual permissions are limited to provider-granted scopes and can be restricted further here.</div>
   <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2" disabled={busy||!provider?.fields.length}><Plus size={16}/>{busy?"Saving…":"Save encrypted account connection"}</button>
  </form>

  <div><h3 className="mb-3 font-semibold">Connected accounts ({accounts.length})</h3>{loading?<p className="text-sm text-[var(--text-muted)]">Loading account connections…</p>:accounts.length===0?<p className="rounded-xl border border-dashed border-[var(--border-subtle)] p-5 text-sm text-[var(--text-muted)]">No multi-account connections have been added yet.</p>:<div className="space-y-2">{accounts.map(account=><article key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] p-3"><div className="min-w-0"><p className="font-semibold">{providers.find(item=>item.id===account.providerId)?.name||account.providerId} · {account.accountLabel}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{account.ownerType} scope · {account.authMethod} · {account.status} · {account.credentialNames.join(", ")}</p>{account.lastError&&<p className="mt-1 text-xs text-rose-300">{account.lastError}</p>}<p className="mt-1 text-xs text-[var(--text-muted)]">Permissions: {account.readEnabled?"Read":"No read"} / {account.writeEnabled?"Write":"No write"} · Granted: {account.grantedPermissions.length?account.grantedPermissions.join(", "):"not yet verified"}</p></div><div className="flex flex-wrap gap-2"><button onClick={()=>void verify(account.id)} disabled={busy} className="min-h-10 rounded-lg border border-emerald-400/30 px-3 text-xs text-emerald-300">Verify</button><button onClick={()=>void togglePermission(account,"readEnabled")} disabled={busy} className="min-h-10 rounded-lg border border-[var(--border-subtle)] px-3 text-xs">{account.readEnabled?"Disable read":"Enable read"}</button><button onClick={()=>void togglePermission(account,"writeEnabled")} disabled={busy} className="min-h-10 rounded-lg border border-[var(--border-subtle)] px-3 text-xs">{account.writeEnabled?"Disable write":"Enable write"}</button><button onClick={()=>void accountAction(account.id,"disconnect")} disabled={busy} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-3 text-xs"><Unplug size={13}/> Disconnect</button><button onClick={()=>void accountAction(account.id,"revoke")} disabled={busy} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-rose-400/30 px-3 text-xs text-rose-300"><KeyRound size={13}/> Revoke</button></div></article>)}</div>}</div>
 </section>;
}
