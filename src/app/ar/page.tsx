"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import ARView from "@/components/ARView";

export default function ARPage() {
  const router = useRouter();
  const { generatedModel, selectedNft, arEngine, setArSnapshot } = useAppStore();

  if (!generatedModel || !generatedModel.modelUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="text-center px-6">
          <div className="text-6xl mb-6">🎭</div>
          <h2 className="text-2xl font-bold mb-3">No 3D Model Available</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            Generate a 3D model from your NFT first, then come back here to try it as an AR face mask.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/gallery"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Browse Gallery
            </Link>
            <Link
              href="/generate"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Generate Model
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black">
      <ARView
        modelUrl={generatedModel.modelUrl}
        preferredEngine={arEngine}
        onClose={() => router.push("/generate")}
        onSnapshot={(dataUrl) => {
          setArSnapshot(dataUrl);
        }}
      />
    </div>
  );
}
