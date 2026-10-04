import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SeoSchemas from "@/components/shared/SeoSchemas";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import ServiceWorkerRegistration from "@/components/shared/ServiceWorkerRegistration";
import { getServerLocale } from "@/lib/i18n/serverLocale";
import { RTL_LOCALES } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/siteUrl";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();

  const googleVerification =
    process.env.GOOGLE_SITE_VERIFICATION ||
    "g7RX7-eoPACihWjJckfBIfFsgo8jnXz2iTpegqH56nA";

  return {
    metadataBase: new URL(siteUrl),

    title: {
      default: "TGO DevStudio Prime",
      template: "%s | TGO DevStudio",
    },

    description:
      "TGO DevStudio is a full-stack software engineering studio building premium digital products, platforms, websites, applications, cloud systems, AI solutions, and intelligent software systems.",

    applicationName: "TGO DevStudio Prime",

    keywords: [
      "TGO DevStudio",
      "TGO DevStudio Prime",
      "TGO software engineering",
      "TGO DevStudio Nigeria",
      "full-stack development",
      "full-stack software engineering",
      "custom software development",
      "software engineering company",
      "software development company",
      "web development",
      "website development",
      "web application development",
      "mobile app development",
      "Android app development",
      "iOS app development",
      "SaaS development",
      "software consulting",
      "technology consulting",
      "digital product development",
      "product engineering",
      "AI development",
      "cloud engineering",
      "cybersecurity",
      "DevOps",
      "API development",
      "database engineering",
      "Nigeria software company",
      "African software company",
    ],

    authors: [
      {
        name: "TGO DevStudio",
        url: siteUrl,
      },
    ],

    creator: "TGO DevStudio",
    publisher: "TGO DevStudio",

    alternates: {
      canonical: siteUrl,
    },

    manifest: "/manifest.json",

    icons: {
      icon: [
        {
          url: "/icons/icon-192x192.png",
          type: "image/png",
          sizes: "192x192",
        },
        {
          url: "/icons/icon-512x512.png",
          type: "image/png",
          sizes: "512x512",
        },
      ],
      shortcut: "/icons/icon-192x192.png",
      apple: "/icons/apple-touch-icon.png",
    },

    openGraph: {
      url: siteUrl,
      siteName: "TGO DevStudio",
      title: "TGO DevStudio Prime",
      description:
        "Premium full-stack software engineering, digital products, platforms, applications, AI, cloud systems, and intelligent software.",
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          alt: "TGO DevStudio Prime — Premium Software Engineering",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: "TGO DevStudio Prime",
      description:
        "Premium full-stack software engineering and digital product development.",
      images: ["/opengraph-image"],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    verification: {
      google: googleVerification,
    },

    other: {
      "fb:app_id": "2134239190472228",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  const dir = RTL_LOCALES.includes(locale)
    ? "rtl"
    : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={jetbrainsMono.variable}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="theme-color"
          content="#0A0A0F"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tgo-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />

        <link
          rel="preconnect"
          href="https://api.fontshare.com"
        />

        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500&f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <SeoSchemas />
            <ServiceWorkerRegistration />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
