"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/store/useAppStore";
import ModelViewer from "@/components/ModelViewer";
import { mintModelAsNft } from "@/lib/mintNft";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Coins,
} from "lucide-react";

export default function MintPage() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const generatedModel = useAppStore((s) => s.generatedModel);
  const setMintedNft = useAppStore((s) => s.setMintedNft);
  const isMinting = useAppStore((s) => s.isMinting);
  const setIsMinting = useAppStore((s) => s.setIsMinting);
  const network = useAppStore((s) => s.network);
  const arModelUrl = useAppStore((s) => s.arModelUrl);

  const [mintResult, setMintResult] = useState<{
    mint: string;
    explorerUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMainnet = network === "mainnet-beta";
  const mintFee = parseFloat(process.env.NEXT_PUBLIC_MINT_FEE_SOL || "0.05");

  useEffect(() => {
    if (!generatedModel?.modelUrl) {
      router.push("/generate");
    }
  }, [generatedModel, router]);

  const handleMint = async () => {
    if (!wallet.publicKey || !generatedModel?.modelUrl) return;

    setIsMinting(true);
    setError(null);

    try {
      const result = await mintModelAsNft({
        connection,
        wallet,
        modelUrl: generatedModel.modelUrl,
        name: `${generatedModel.sourceNft?.name || "NFT"} - 3D Mask`,
        image: generatedModel.sourceNft?.image || generatedModel.thumbnailUrl || "",
        description: `3D AR mask generated from ${generatedModel.sourceNft?.name || "a Solana NFT"} using MaskForge`,
        isMainnet,
      });

      setMintResult(result);
      setMintedNft(result.mint);
    } catch (err: any) {
      console.error("Mint error:", err);
      setError(err.message || "Minting failed");
    } finally {
      setIsMinting(false);
    }
  };

  if (!generatedModel?.modelUrl) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-2">Mint 3D NFT</h1>
      <p className="text-gray-400 mb-8">
        Mint your generated 3D model as a new NFT on Solana
      </p>

      {/* Model Preview */}
      <div className="glass-card p-4 mb-6">
        <ModelViewer url={generatedModel.modelUrl} className="max-w-sm mx-auto" />
        <div className="text-center mt-3">
          <p className="font-semibold">
            {generatedModel.sourceNft?.name || "3D Model"} - 3D Mask
          </p>
        </div>
      </div>

      {/* Mint Info */}
      {!mintResult && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Coins className="w-5 h-5 text-brand-green" />
            <span className="font-semibold">Minting Details</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span className={isMainnet ? "text-yellow-400" : "text-brand-green"}>
                {isMainnet ? "🔶 Mainnet" : "🟢 Devnet"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mint Fee</span>
              <span>
                {isMainnet ? `${mintFee} SOL` : "Free (devnet)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Format</span>
              <span>GLB (3D Model)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Symbol</span>
              <span>MASK</span>
            </div>
          </div>

          {isMainnet && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400">
              ⚠️ This will charge {mintFee} SOL from your wallet on mainnet.
            </div>
          )}

          <button
            onClick={handleMint}
            disabled={isMinting || !wallet.connected}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Minting...
              </>
            ) : (
              <>🚀 Mint NFT</>
            )}
          </button>

          {!wallet.connected && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Connect your wallet to mint
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card p-4 border-red-500/30 flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold">Minting Failed</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
            <button
              onClick={handleMint}
              className="btn-secondary mt-3 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {mintResult && (
        <div className="glass-card p-6 border-brand-green/30">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-brand-green" />
            <div>
              <p className="font-bold text-lg">NFT Minted!</p>
              <p className="text-sm text-gray-400">Your 3D mask is now on-chain</p>
            </div>
          </div>

          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Mint Address</span>
              <span className="font-mono text-xs">{mintResult.mint.slice(0, 20)}...</span>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={mintResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              View on Solscan <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => router.push("/ar")}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              Try AR Mask <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Skip to AR */}
      {!mintResult && (
        <button
          onClick={() => router.push("/ar")}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors mt-4"
        >
          Skip minting → Try AR mask directly
        </button>
      )}
    </div>
  );
}
