import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

// ONE primary sans (Inter — the de-facto product-UI typeface) + ONE mono (Geist Mono,
// for figures/hashes/timestamps only). The 3-font Playfair/Jakarta/JetBrains
// maximalism is cut; Rachel's editorial voice is carried by prose hierarchy + italics.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ad AI Pulse — From Signal to Strategy",
  description:
    "AI-native intelligence for the AdTech and AI economy. The AAP Lens Engine turns one signal into four role-specific decisions. Produced by Ada, reviewed by Rachel.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
