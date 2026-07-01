import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Sora } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
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

// Display face for headings — geometric, premium, "AI-native". Paired with Inter body.
const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ad AI Pulse — From Signal to Strategy",
  description:
    "AI-native intelligence for the AdTech and AI economy. The AAP Lens Engine turns one signal into four role-specific decisions. Produced by Ada, reviewed by Rachel.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ad AI Pulse",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1625",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${geistMono.variable} ${sora.variable}`}>
      <body className="min-h-screen bg-canvas text-ink antialiased safe-area-x safe-area-b">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
