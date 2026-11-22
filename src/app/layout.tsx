import type { Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { JsonLd, organizationLd, rootMetadata, websiteLd } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata = rootMetadata;

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

/**
 * Bare root: html, body, fonts, sitewide metadata and JSON-LD. Site chrome (skip
 * link, Nav, <main>, Footer) lives in src/app/(marketing)/layout.tsx so /admin
 * renders without it; not-found.tsx composes the chrome itself.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="flex min-h-svh flex-col">
        <JsonLd data={[organizationLd(), websiteLd()]} />
        {children}
      </body>
    </html>
  );
}
