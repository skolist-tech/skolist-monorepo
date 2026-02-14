import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Providers } from "./providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "Skolist - Personalized Strategy-Based Learning for Schools | AI-Powered Education Platform",
  description:
    "Empowering Schools to Provide Personalized Strategy-Based Learning for Every Child's Better Future. AI-powered platform to identify learning gaps and implement strategic solutions. Free pilot program available.",
  keywords:
    "school management, personalized learning, AI education, learning gaps, education technology, school platform, student assessment, educational software, K-12 education, school administration",
  authors: [{ name: "Skolist" }],
  openGraph: {
    type: "website",
    url: "https://www.skolist.com/",
    title: "Skolist - Personalized Strategy-Based Learning for Schools",
    description:
      "Empowering Schools to Provide Personalized Strategy-Based Learning for Every Child's Better Future. AI-powered platform with free pilot program.",
    images: ["https://www.skolist.com/logo-rounded.png"],
    siteName: "Skolist",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@skolist", // Assuming handle
    title: "Skolist - Personalized Strategy-Based Learning for Schools",
    description:
      "Empowering Schools to Provide Personalized Strategy-Based Learning for Every Child's Better Future. AI-powered platform with free pilot program.",
    images: ["https://www.skolist.com/logo-rounded.png"],
  },
};

import { initializeFirebase } from "@skolist/auth";

// Initialize Firebase with Next.js environment variables (Moved to Providers)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppFloat />
          </div>
        </Providers>
        <SpeedInsights />
        <Analytics />
        <GoogleAnalytics gaId="G-HN0651N4DY" />
      </body>
    </html>
  );
}
