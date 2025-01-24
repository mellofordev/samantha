import { ClerkProvider, SignedOut } from "@clerk/nextjs";
import "../globals.css";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}