import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/providers/WalletProvider";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "NFT → 3D → AR Mask | Solana dApp",
  description:
    "Transform your Solana NFTs into photorealistic 3D models and wear them as AR face masks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-dark">
        <WalletProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
