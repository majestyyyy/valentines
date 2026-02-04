import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MobileGuard from "@/components/MobileGuard";
import BanGuard from "@/components/BanGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "yUE Match!",
  description: "Exclusive dating app for UE students",
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
