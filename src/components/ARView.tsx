"use client";

import { useState, useCallback, useEffect, lazy, Suspense } from "react";

// Lazy-load heavy AR components
const BanubaAR = lazy(() => import("@/components/BanubaAR"));
const MediaPipeFallback = lazy(() => import("@/components/MediaPipeFallback"));

type AREngine = "banuba" | "mediapipe" | "auto";

interface ARViewProps {
  modelUrl: string;
  preferredEngine?: AREngine;
  onClose?: () => void;
  onSnapshot?: (dataUrl: string) => void;
}

const BANUBA_TOKEN = process.env.NEXT_PUBLIC_BANUBA_CLIENT_TOKEN || "";

/**
 * Unified AR View v3 — manages Banuba (primary) and MediaPipe (fallback).
 *
 * Changes from v2:
 * - Removed dead BanubaStatus import (not exported from useBanubaAR v3)
 * - Both engines are self-contained (own camera, rendering, tracking)
 * - Cleaner engine switching
 */
export default function ARView({
  modelUrl,
  preferredEngine = "auto",
  onClose,
  onSnapshot,
}: ARViewProps) {
  const [activeEngine, setActiveEngine] = useState<"banuba" | "mediapipe">(
    preferredEngine === "mediapipe" ? "mediapipe" : "banuba"
  );
  const [banubaFailed, setBanubaFailed] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // If no Banuba token, go straight to MediaPipe
  useEffect(() => {
    if (!BANUBA_TOKEN && preferredEngine !== "mediapipe") {
      console.log("[ARView] No Banuba token — using MediaPipe");
      setBanubaFailed(true);
      setActiveEngine("mediapipe");
    }
  }, [preferredEngine]);

  const toggleEngine = useCallback(() => {
    if (activeEngine === "banuba") {
      setActiveEngine("mediapipe");
    } else if (!banubaFailed && BANUBA_TOKEN) {
      setActiveEngine("banuba");
    }
  }, [activeEngine, banubaFailed]);

  const handleSnapshot = useCallback(() => {
    const canvases = document.querySelectorAll("canvas");
    for (const canvas of Array.from(canvases).reverse()) {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        if (dataUrl.length > 100) {
          onSnapshot?.(dataUrl);
          return;
        }
      } catch {}
    }
    console.warn("[ARView] No canvas found for snapshot");
  }, [onSnapshot]);

  const isBanuba = activeEngine === "banuba";

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* === Banuba Engine === */}
      {isBanuba && (
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading Banuba AR SDK...</p>
              </div>
            </div>
          }
        >
          <BanubaAR glbUrl={modelUrl} className="w-full h-full" />
        </Suspense>
      )}

      {/* === MediaPipe Engine === */}
      {!isBanuba && (
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading MediaPipe...</p>
              </div>
            </div>
          }
        >
          <MediaPipeFallback glbUrl={modelUrl} className="w-full h-full" />
        </Suspense>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-20">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-black/50 hover:bg-black/70 rounded-lg text-white font-medium backdrop-blur-sm transition-colors"
        >
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={toggleEngine}
            disabled={banubaFailed && activeEngine === "mediapipe"}
            className={
              "px-3 py-2 rounded-lg text-xs backdrop-blur-sm transition-colors " +
              (isBanuba
                ? "bg-purple-600/80 text-white"
                : "bg-blue-600/80 text-white") +
              (banubaFailed && !isBanuba ? " opacity-50" : "")
            }
          >
            {isBanuba ? "⚡ Banuba" : "🧠 MediaPipe"}
          </button>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={
              "px-3 py-2 rounded-lg text-sm backdrop-blur-sm transition-colors " +
              (debugMode
                ? "bg-green-600/80 text-white"
                : "bg-black/50 text-gray-300 hover:bg-black/70")
            }
          >
            Debug
          </button>
        </div>
      </div>

      {/* Snapshot button */}
      <div className="absolute bottom-4 right-4 z-20">
        <button
          onClick={handleSnapshot}
          className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-white" />
        </button>
      </div>

      {/* Engine badge */}
      <div className="absolute bottom-4 left-4 z-20">
        <div
          className={
            "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm " +
            (isBanuba
              ? "bg-purple-500/80 text-white"
              : "bg-blue-500/80 text-white")
          }
        >
          {isBanuba ? "⚡ Banuba AR" : "🧠 MediaPipe"} • {modelUrl ? "Model loaded" : "No model"}
        </div>
      </div>
    </div>
  );
}
