import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "../globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LiveAPIProvider } from "@/contexts/LiveAPIContext";
import { AppSidebar } from "@/components/sidebar-nav";
import { ClerkProvider } from "@clerk/nextjs";
import MobileNotice from "@/components/mobile-notice";
import { Analytics } from "@vercel/analytics/react"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-instrument-serif'
});

export const metadata: Metadata = {
  title: "samantha",
  description: "an agent that can help you with your life",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    title: "samantha",
    description: "an agent that can help you with your life",
    siteName: "samantha",
    url: "https://yoursamantha.com",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "samantha",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "samantha",
    description: "an agent that can help you with your life",
    images: ["/opengraph.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const API_KEY = process.env.GENAI_API_KEY as string;
  const host = "generativelanguage.googleapis.com";
  const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <SidebarProvider>
          <ClerkProvider>
          <LiveAPIProvider url={uri} apiKey={API_KEY}>
            <MobileNotice />
            <AppSidebar />
            {children}
          </LiveAPIProvider>
          </ClerkProvider>
        </SidebarProvider>
        <Analytics />
      </body>
    </html>
  );
}
