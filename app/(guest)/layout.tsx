import { ClerkProvider } from "@clerk/nextjs";
import "../globals.css";
import { Instrument_Serif } from "next/font/google";
import { Metadata } from "next";
import MobileNotice from "@/components/mobile-notice";
import { LiveAPIProvider } from "@/contexts/LiveAPIContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { GuestSidebarNav } from "@/components/guest-sidebar-nav";
import { Analytics } from "@vercel/analytics/react";
const instrumentSerif = Instrument_Serif({ 
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-instrument-serif'
});

export const metadata: Metadata = {
  title: 'samantha',
  description: 'her',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const host = "generativelanguage.googleapis.com";
  const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;
  return (
    <html lang="en" className={`${instrumentSerif.variable}`}>
      <body>
        <ClerkProvider>
          <SidebarProvider>
            <LiveAPIProvider url={uri} apiKey={process.env.GENAI_API_KEY as string}>
              <GuestSidebarNav />
              {children}
            </LiveAPIProvider>
          </SidebarProvider>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}