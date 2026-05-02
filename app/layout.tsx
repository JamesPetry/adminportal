import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";

import { SpeedInsightsDeferred } from "@/components/analytics/speed-insights-deferred";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Strat X Advisory Portal",
    template: "%s",
  },
  description: "Premium client portal for the Strat X Advisory website redesign project.",
};

function supabasePreconnectOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseOrigin = supabasePreconnectOrigin();

  return (
    <html lang="en" className={`${manrope.variable} ${newsreader.variable} h-full antialiased`}>
      <head>
        {supabaseOrigin ? <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" /> : null}
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <SpeedInsightsDeferred />
      </body>
    </html>
  );
}
