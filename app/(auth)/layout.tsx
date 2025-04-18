import { ClerkProvider } from "@clerk/nextjs"
import { Metadata } from "next"
import { Instrument_Serif } from "next/font/google"

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
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en"  className={`${instrumentSerif.variable}`}>
      <body>
        <ClerkProvider>
                {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
