import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import OrganizationSchema from "@/components/shared/OrganizationSchema";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const siteUrl = process.env.SITE_URL || "https://tgo-devstudio-prime.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "TGO DevStudio Prime",
  description:
    "The flagship brand, portfolio, and command-center site for TGO DevStudio — a full-stack software engineering studio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <head>
        <meta name="google-site-verification" content="g7RX7-eoPACihWjJckfBIfFsgo8jnXz2iTpegqH56nA" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500&f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <OrganizationSchema />
        {children}
      </body>
    </html>
  );
}
