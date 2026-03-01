import type { Metadata } from "next";
import "@/styles/globals.css";
import { HomePageBodyStyle } from "@/components/layout/HomePageBodyStyle";

export const metadata: Metadata = {
  title: "FutureSpend — See Tomorrow, Save Today, Share Success",
  description: "Intelligent personal finance: calendar-driven spending forecast, insights, and challenges.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <head>
        <meta name="theme-color" content="#0a0a0b" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-surface-0 text-zinc-100 antialiased">
        <HomePageBodyStyle />
        {children}
      </body>
    </html>
  );
}
