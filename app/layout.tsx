import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MobileGuard from "@/components/MobileGuard";
import BanGuard from "@/components/BanGuard";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "yUE Match!",
  description: "Find your match at University of the East",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "yUE Match!",
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="yUE Match!" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={inter.className}>
      
        <MobileGuard>
          <BanGuard>
            {children}
          </BanGuard>
        </MobileGuard>
      </body>
    </html>
  );
}
