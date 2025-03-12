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