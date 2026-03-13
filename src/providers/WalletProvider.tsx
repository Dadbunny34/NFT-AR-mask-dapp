"use client";

import { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

const WalletProvider: FC<Props> = ({ children }) => {
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as any) || "devnet";
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(network);

  // Empty array = auto-detect all installed wallets via the Wallet Standard.
  // This includes Phantom, Solflare, Backpack, AND the Seeker built-in wallet.
  // Hardcoding specific adapters (PhantomWalletAdapter, etc.) forces ONLY those
  // wallets to appear — and if they're not installed, the user gets redirected
  // to a download page.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
