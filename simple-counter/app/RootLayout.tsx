// app/RootLayout.tsx (Client Component)
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </div>
    </WalletProvider>
  );
}
