import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { DevTools } from "@/components/dev-tools";

export const metadata: Metadata = {
  title: "BeeVent Halls",
  description: "Premium event venue booking platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <DevTools />
        </Providers>
      </body>
    </html>
  );
}
