import type { Metadata } from "next";

import "./globals.css";

import { ChatWidget } from "@/components/chat/chat-widget";
import { PageContextProvider } from "@/components/chat/page-context";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { Providers } from "@/components/site/providers";
import { featureFlags } from "@/lib/env";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.title}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} | ${siteConfig.title}`,
    description: siteConfig.description,
    type: "website",
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.title}`,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-linen"
        >
          Skip to content
        </a>
        <Providers clerkEnabled={featureFlags.clerk}>
          <PageContextProvider>
            <div className="relative min-h-screen">
              <SiteHeader clerkEnabled={featureFlags.clerk} />
              <main id="main-content">{children}</main>
              <SiteFooter />
            </div>
            <ChatWidget />
          </PageContextProvider>
        </Providers>
      </body>
    </html>
  );
}
