"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchWalletNfts, NFTData } from "@/lib/fetchNfts";
import { useAppStore } from "@/store/useAppStore";
import { ImageOff, Loader2, ArrowRight } from "lucide-react";

export default function GalleryPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const setSelectedNft = useAppStore((s) => s.setSelectedNft);

  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchWalletNfts(connection, publicKey);
        setNfts(results);
        if (results.length === 0) {
          setError("No NFTs found in this wallet");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load NFTs");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [connected, publicKey, connection]);

  const handleSelect = (nft: NFTData) => {
    setSelectedNft({
      mintAddress: nft.mint,
      name: nft.name,
      image: nft.image,
      collection: nft.collection,
    });
    router.push("/generate");
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <ImageOff className="w-16 h-16 text-gray-600" />
        <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
        <p className="text-gray-400">
          Connect your Solana wallet to browse your NFT collection
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Your NFTs</h1>
          <p className="text-gray-400 mt-1">
            Select an NFT to transform into a 3D AR mask
          </p>
        </div>
        {nfts.length > 0 && (
          <span className="text-sm text-gray-500">
            {nfts.length} NFT{nfts.length !== 1 ? "s" : ""} found
          </span>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
          <p className="text-gray-400">Loading your NFTs...</p>
        </div>
      )}

      {error && !loading && (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-400">{error}</p>
        </div>
      )}

      {!loading && nfts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {nfts.map((nft) => (
            <button
              key={nft.mint}
              onClick={() => handleSelect(nft)}
              className="glass-card overflow-hidden group hover:border-brand-purple/50 transition-all text-left"
            >
              <div className="relative aspect-square">
                <Image
                  src={nft.image}
                  alt={nft.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-brand-purple/0 group-hover:bg-brand-purple/20 transition-all flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{nft.name}</p>
                {nft.collection && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {nft.collection.slice(0, 8)}...
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
