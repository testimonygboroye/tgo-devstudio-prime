import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import OrganizationSchema from "@/components/shared/OrganizationSchema";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import ServiceWorkerRegistration from "@/components/shared/ServiceWorkerRegistration";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { RTL_LOCALES } from "@/lib/i18n/config";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const siteUrl = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://tgo-devstudio-prime.onrender.com");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "TGO DevStudio Prime",
  description:
    "The flagship brand, portfolio, and command-center site for TGO DevStudio — a full-stack software engineering studio.",
  openGraph: {
    url: siteUrl,
    siteName: "TGO DevStudio",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={jetbrainsMono.variable} suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="g7RX7-eoPACihWjJckfBIfFsgo8jnXz2iTpegqH56nA" />
        <meta property="fb:app_id" content="2134239190472228" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#0A0A0F" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tgo-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500&f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <OrganizationSchema />
            <ServiceWorkerRegistration />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
