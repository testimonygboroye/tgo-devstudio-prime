import type { Metadata } from "next";
import SettingsNavigation from "@/components/settings/SettingsNavigation";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { createTranslator } from "@/lib/i18n/translationHelper";

export const metadata:Metadata={title:"Preferences | TGO DevStudio Prime",description:"Manage your language and appearance preferences for TGO DevStudio Prime.",alternates:{canonical:"/settings"}};

export default async function PublicSettingsPage(){
 const locale=await getServerLocale();
 const t=createTranslator(locale);
 return(
  <main className="public-settings-page"><div className="home-container public-settings-container">
   <header className="public-settings-header"><span className="eyebrow-label">{t("common.settings")} · YOUR EXPERIENCE</span><h1>Make the site<br/><em>feel like yours.</em></h1><p>Personalise your browsing experience with your preferred language and appearance.</p></header>
   <section className="public-settings-panel"><div className="public-settings-panel-heading"><span className="eyebrow-label">Preferences</span><h2>Language &amp; appearance</h2><p>Your choices are used to make future visits more comfortable.</p></div><SettingsNavigation basePath="/settings"/></section>
  </div></main>
 );
}
