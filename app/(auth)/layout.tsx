import { ClerkProvider } from "@clerk/nextjs";
import "../globals.css";
import { Instrument_Serif } from "next/font/google";
import { Metadata } from "next";

const instrumentSerif = Instrument_Serif({ 
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-instrument-serif'
});

export const metadata: Metadata = {
  title: 'samantha',
  description: 'her',
  openGraph: {
    title: "samantha",
    description: "her",
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
    description: "her",
    images: ["/opengraph.jpg"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable}`}>
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}