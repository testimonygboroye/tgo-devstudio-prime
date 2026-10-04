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
  const siteUrl = await getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),

    title: {
      default: "TGO DevStudio Prime",
      template: "%s | TGO DevStudio",
    },

    description:
      "TGO DevStudio is a full-stack software engineering studio building premium digital products, platforms, websites, and intelligent software systems.",

    applicationName: "TGO DevStudio Prime",

    generator: "Next.js",

    keywords: [
      "TGO DevStudio",
      "TGO DevStudio Prime",
      "full-stack development",
      "software engineering",
      "web development",
      "mobile app development",
      "software consulting",
      "digital products",
      "custom software",
      "Nigeria software company",
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

,

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
      shortcut: [
        {
          url: "/icons/icon-192x192.png",
          type: "image/png",
        },
      ],
      apple: [
        {
          url: "/icons/apple-touch-icon.png",
          type: "image/png",
          sizes: "180x180",
        },
      ],
    },

    openGraph: {
      url: siteUrl,
      siteName: "TGO DevStudio",
      title: "TGO DevStudio Prime",
      description:
        "Premium full-stack software engineering, digital products, platforms, and intelligent software systems.",
      type: "website",
      images: [
        {
          url: "/icons/icon-512x512.png",
          alt: "TGO DevStudio",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: "TGO DevStudio Prime",
      description:
        "Premium full-stack software engineering and digital product development.",
      images: ["/icons/icon-512x512.png"],
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
      google: "g7RX7-eoPACihWjJckfBIfFsgo8jnXz2iTpegqH56nA",
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
