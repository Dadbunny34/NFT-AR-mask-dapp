/**
 * App configuration constants
 * Treasury wallet, fees, and AR settings defined here as the single source of truth.
 */

// ── Solana ──────────────────────────────────────────

// Project treasury wallet — all mint fees on mainnet go here
export const TREASURY_WALLET = "7p7adLdmKzak2TwyKgmGh1JsxK59es6uYJAciG49q52a";

// Mint fee in SOL (mainnet only — devnet minting is free)
export const MINT_FEE_SOL = 0.05;

// Solana network
export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet") as
  | "devnet"
  | "mainnet-beta";

// RPC URLs
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  (SOLANA_NETWORK === "mainnet-beta"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com");

// ── Banuba WebAR ────────────────────────────────────

// Client token (from .env.local)
export const BANUBA_CLIENT_TOKEN =
  process.env.NEXT_PUBLIC_BANUBA_CLIENT_TOKEN || "";

// CDN base for Banuba WASM/data files
export const BANUBA_CDN_BASE =
  "https://cdn.jsdelivr.net/npm/@banuba/webar/dist";

// Banuba WASM file paths (used by Player.create locateFile)
export const BANUBA_WASM_FILES = {
  "BanubaSDK.data": `${BANUBA_CDN_BASE}/BanubaSDK.data`,
  "BanubaSDK.wasm": `${BANUBA_CDN_BASE}/BanubaSDK.wasm`,
  "BanubaSDK.simd.wasm": `${BANUBA_CDN_BASE}/BanubaSDK.simd.wasm`,
} as const;

// Built-in effects directory on Banuba CDN
export const BANUBA_EFFECTS_BASE = `${BANUBA_CDN_BASE}/effects`;

// ── MediaPipe (Fallback) ────────────────────────────

// WASM CDN for MediaPipe tasks-vision
export const MEDIAPIPE_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

// Face landmark model
export const MEDIAPIPE_FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// ── AR Defaults ─────────────────────────────────────

// Default AR smoothing factor (0 = max smooth, 1 = instant)
export const AR_SMOOTHING_FACTOR = 0.4;

// Webcam resolution
export const WEBCAM_WIDTH = 640;
export const WEBCAM_HEIGHT = 480;

// ── Meshy.ai ────────────────────────────────────────

export const MESHY_API_BASE = "https://api.meshy.ai/v1";
export const MESHY_API_KEY = process.env.MESHY_API_KEY || "";
