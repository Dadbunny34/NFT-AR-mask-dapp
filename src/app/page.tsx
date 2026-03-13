"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppStore } from "@/store/useAppStore";
import ModelViewer from "@/components/ModelViewer";
import { Loader2, Box, ArrowRight, AlertCircle, RotateCcw } from "lucide-react";

export default function GeneratePage() {
  const router = useRouter();
  const selectedNft = useAppStore((s) => s.selectedNft);
  const generatedModel = useAppStore((s) => s.generatedModel);
  const setGeneratedModel = useAppStore((s) => s.setGeneratedModel);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const setIsGenerating = useAppStore((s) => s.setIsGenerating);
  const setArModelUrl = useAppStore((s) => s.setArModelUrl);

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if no NFT selected
  useEffect(() => {
    if (!selectedNft) {
      router.push("/gallery");
    }
  }, [selectedNft, router]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Resume polling if generation is in progress (e.g., after tab switch)
  useEffect(() => {
    if (
      isGenerating &&
      generatedModel?.taskId &&
      generatedModel.status === "processing" &&
      !intervalRef.current
    ) {
      pollStatus(generatedModel.taskId);
    }
  }, [isGenerating, generatedModel]);

  // Poll for generation status
  const pollStatus = useCallback(
    (taskId: string) => {
      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/generate/status?taskId=${taskId}`);
          const data = await res.json();

          if (data.error) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setError(data.error);
            setIsGenerating(false);
            return;
          }

          setProgress(data.progress || 0);

          if (data.status === "SUCCEEDED") {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setGeneratedModel({
              taskId,
              status: "succeeded",
              modelUrl: data.modelUrl,
              thumbnailUrl: data.thumbnailUrl,
              sourceNft: selectedNft!,
            });
            setIsGenerating(false);
          } else if (data.status === "FAILED") {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setError("3D generation failed. Try a different NFT image.");
            setIsGenerating(false);
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, 3000);
    },
    [selectedNft, setGeneratedModel, setIsGenerating]
  );

  const startGeneration = async () => {
    if (!selectedNft) return;

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: selectedNft.image,
          name: selectedNft.name,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setIsGenerating(false);
        return;
      }

      setGeneratedModel({
        taskId: data.taskId,
        status: "processing",
        sourceNft: selectedNft,
      });

      pollStatus(data.taskId);
    } catch (err: any) {
      setError(err.message || "Failed to start generation");
      setIsGenerating(false);
    }
  };

  const handleProceedToMint = () => {
    if (generatedModel?.modelUrl) {
      setArModelUrl(generatedModel.modelUrl);
      router.push("/mint");
    }
  };

  const handleProceedToAR = () => {
    if (generatedModel?.modelUrl) {
      setArModelUrl(generatedModel.modelUrl);
      router.push("/ar");
    }
  };

  if (!selectedNft) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-2">Generate 3D Model</h1>
      <p className="text-gray-400 mb-8">
        AI will transform your NFT into a photorealistic 3D model
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Source NFT */}
        <div className="glass-card p-4">
          <p className="text-sm text-gray-400 mb-3">Source NFT</p>
          <div className="relative aspect-square rounded-xl overflow-hidden">
            <Image
              src={selectedNft.image}
              alt={selectedNft.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <p className="font-semibold mt-3">{selectedNft.name}</p>
          <p className="text-xs text-gray-500 font-mono">{selectedNft.mintAddress.slice(0, 16)}...</p>
        </div>

        {/* 3D Result / Action */}
        <div className="glass-card p-4 flex flex-col">
          <p className="text-sm text-gray-400 mb-3">3D Model</p>

          {/* Not started */}
          {!isGenerating && !generatedModel?.modelUrl && !error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Box className="w-16 h-16 text-gray-600" />
              <p className="text-gray-500 text-center">
                Click below to generate a 3D model from this NFT
              </p>
              <button onClick={startGeneration} className="btn-primary">
                🚀 Generate 3D Model
              </button>
            </div>
          )}

          {/* Generating */}
          {isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-brand-purple animate-spin" />
              <div className="text-center">
                <p className="font-semibold">Generating 3D model...</p>
                <p className="text-sm text-gray-400 mt-1">
                  This usually takes 1-3 minutes
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-brand-dark rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-green transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{progress}%</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-red-400 text-center">{error}</p>
              <button onClick={startGeneration} className="btn-secondary flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}

          {/* Success - 3D Viewer */}
          {generatedModel?.modelUrl && (
            <div className="flex-1 flex flex-col">
              <ModelViewer url={generatedModel.modelUrl} />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleProceedToMint}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  Mint as NFT <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleProceedToAR}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  Try AR Mask <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
