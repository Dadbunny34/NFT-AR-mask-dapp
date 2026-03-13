"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/store/useAppStore";
import ModelViewer from "@/components/ModelViewer";

interface CachedModel {
  cached: boolean;
  taskId?: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  createdAt?: string;
}

export default function GeneratePage() {
  const { publicKey } = useWallet();
  const { selectedNft, setGeneratedModel, generatedModel } = useAppStore();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (!publicKey || !selectedNft) return;
    const walletAddr = publicKey.toBase58();
    const nftMint = selectedNft.mintAddress || selectedNft.name;
    async function checkCache() {
      try {
        const res = await fetch(
          "/api/cache/model?wallet=" + walletAddr + "&nftMint=" + encodeURIComponent(nftMint)
        );
        const data = await res.json();
        if (data.cached && data.modelUrl) {
          setStatus("Found cached 3D model! No Meshy tokens used.");
          setGeneratedModel({ modelUrl: data.modelUrl, taskId: data.taskId || "" });
          setFromCache(true);
        }
      } catch (err) {
        console.log("No cached model found");
      }
    }
    checkCache();
  }, [publicKey, selectedNft, setGeneratedModel]);

  const handleGenerate = async () => {
    if (!selectedNft || !publicKey) return;
    setLoading(true);
    setProgress(0);
    setFromCache(false);
    setStatus("Submitting image to Meshy.ai...");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: selectedNft.image }),
      });
      if (!res.ok) throw new Error("Failed to start generation");
      const { taskId } = await res.json();
      setStatus("Generating 3D model... This takes 1-3 minutes.");
      let attempts = 0;
      const maxAttempts = 60;
      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 5000));
        attempts++;
        const statusRes = await fetch("/api/generate/status?taskId=" + taskId);
        const statusData = await statusRes.json();
        if (statusData.progress !== undefined) setProgress(statusData.progress);
        if (statusData.status === "SUCCEEDED") {
          const modelUrl = statusData.model_urls?.glb || statusData.modelUrl;
          if (modelUrl) {
            setGeneratedModel({ modelUrl, taskId });
            setStatus("3D model generated successfully!");
            const wallet = publicKey.toBase58();
            const nftMint = selectedNft.mintAddress || selectedNft.name;
            await fetch("/api/cache/model", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ wallet, nftMint, taskId, modelUrl, sourceNftImage: selectedNft.image }),
            }).catch((e: unknown) => console.warn("Cache save failed:", e));
          }
          break;
        }
        if (statusData.status === "FAILED") throw new Error(statusData.error || "Generation failed");
        setStatus("Generating... " + (statusData.progress || 0) + "% (attempt " + attempts + "/" + maxAttempts + ")");
      }
      if (attempts >= maxAttempts) throw new Error("Generation timed out");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Generation failed";
      setStatus("Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect a Solana wallet to generate 3D models.</p>
        </div>
      </div>
    );
  }

  if (!selectedNft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No NFT Selected</h2>
          <p className="text-gray-400 mb-4">Select an NFT from your gallery first.</p>
          <Link href="/gallery" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg">Browse Gallery</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Generate 3D Model</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Source NFT</h2>
            <img src={selectedNft.image} alt={selectedNft.name} className="w-full rounded-lg mb-4" />
            <p className="font-medium">{selectedNft.name}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              3D Model{fromCache && <span className="ml-2 text-sm text-green-400 font-normal">(cached)</span>}
            </h2>
            {generatedModel ? (
              <div className="w-full aspect-square"><ModelViewer url={generatedModel.modelUrl!} /></div>
            ) : (
              <div className="w-full aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">{loading ? status : "Click Generate to create 3D model"}</p>
              </div>
            )}
            {loading && progress > 0 && (
              <div className="mt-4 bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: progress + "%" }} />
              </div>
            )}
            {status && !loading && <p className="mt-4 text-sm text-gray-300">{status}</p>}
            <div className="mt-6 flex gap-4">
              <button onClick={handleGenerate} disabled={loading}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-medium">
                {loading ? "Generating..." : fromCache ? "Regenerate (uses Meshy tokens)" : "Generate 3D Model"}
              </button>
              {generatedModel && (
                <Link href="/ar" className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium">Try AR Mask</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
