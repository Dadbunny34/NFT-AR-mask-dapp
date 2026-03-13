import { create } from "zustand";
import { persist } from "zustand/middleware";

/* -------- Types (match actual usage across all pages) -------- */

interface NFT {
  mintAddress: string;
  name: string;
  image: string;
  collection?: string;
}

interface GeneratedModel {
  taskId: string;
  status?: "processing" | "succeeded";
  modelUrl?: string;
  thumbnailUrl?: string;
  sourceNft?: NFT;
}

/* -------- Store shape -------- */

interface AppState {
  // NFT selection (gallery -> generate)
  selectedNft: NFT | null;
  setSelectedNft: (nft: NFT | null) => void;

  // 3D model generation
  generatedModel: GeneratedModel | null;
  setGeneratedModel: (model: GeneratedModel | null) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;

  // AR
  arEngine: "banuba" | "mediapipe" | "auto";
  setArEngine: (engine: "banuba" | "mediapipe" | "auto") => void;
  arModelUrl: string | null;
  setArModelUrl: (url: string | null) => void;
  arSnapshot: string | null;
  setArSnapshot: (dataUrl: string | null) => void;

  // Minting
  isMinting: boolean;
  setIsMinting: (v: boolean) => void;
  mintedNft: string | null;
  setMintedNft: (nft: string | null) => void;

  // Network
  network: "devnet" | "mainnet-beta";
  setNetwork: (n: "devnet" | "mainnet-beta") => void;
}

/* -------- Implementation -------- */

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // NFT selection
      selectedNft: null,
      setSelectedNft: (nft) => set({ selectedNft: nft }),

      // 3D model generation
      generatedModel: null,
      setGeneratedModel: (model) =>
        set({
          generatedModel: model,
          arModelUrl: model?.modelUrl ?? null,
        }),
      isGenerating: false,
      setIsGenerating: (v) => set({ isGenerating: v }),

      // AR
      arEngine: "auto",
      setArEngine: (engine) => set({ arEngine: engine }),
      arModelUrl: null,
      setArModelUrl: (url) => set({ arModelUrl: url }),
      arSnapshot: null,
      setArSnapshot: (dataUrl) => set({ arSnapshot: dataUrl }),

      // Minting
      isMinting: false,
      setIsMinting: (v) => set({ isMinting: v }),
      mintedNft: null,
      setMintedNft: (nft) => set({ mintedNft: nft }),

      // Network
      network: "devnet",
      setNetwork: (n) => set({ network: n }),
    }),
    {
      name: "maskforge-store",
      partialize: (state) => ({
        selectedNft: state.selectedNft,
        generatedModel: state.generatedModel,
        arModelUrl: state.arModelUrl,
        arEngine: state.arEngine,
        network: state.network,
        mintedNft: state.mintedNft,
      }),
    }
  )
);
