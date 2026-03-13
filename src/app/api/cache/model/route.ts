import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const CACHE_DIR = path.join(process.cwd(), ".model-cache");

interface CacheEntry {
  taskId: string;
  modelUrl: string;
  thumbnailUrl?: string;
  textureUrls?: Record<string, string> | null;
  createdAt: string;
  sourceNftMint: string;
  sourceNftImage: string;
}

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {}
}

function getCacheKey(wallet: string, nftMint: string): string {
  return wallet + "_" + nftMint;
}

function getCachePath(key: string): string {
  return path.join(CACHE_DIR, key + ".json");
}

/**
 * GET /api/cache/model?wallet=xxx&nftMint=xxx
 * Check if a cached 3D model exists for this wallet+NFT combo.
 * Returns { cached: true, ...entry } or { cached: false }
 */
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const nftMint = req.nextUrl.searchParams.get("nftMint");

  if (!wallet || !nftMint) {
    return NextResponse.json(
      { error: "wallet and nftMint are required" },
      { status: 400 }
    );
  }

  await ensureCacheDir();
  const key = getCacheKey(wallet, nftMint);
  const cachePath = getCachePath(key);

  try {
    const data = await fs.readFile(cachePath, "utf-8");
    const entry: CacheEntry = JSON.parse(data);
    return NextResponse.json({ cached: true, ...entry });
  } catch {
    return NextResponse.json({ cached: false });
  }
}

/**
 * POST /api/cache/model
 * Save a completed 3D model to cache after successful Meshy generation.
 * Body: { wallet, nftMint, taskId, modelUrl, thumbnailUrl, sourceNftImage }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, nftMint, taskId, modelUrl, thumbnailUrl, sourceNftImage } = body;

    if (!wallet || !nftMint || !taskId || !modelUrl) {
      return NextResponse.json(
        { error: "wallet, nftMint, taskId, and modelUrl are required" },
        { status: 400 }
      );
    }

    await ensureCacheDir();
    const key = getCacheKey(wallet, nftMint);
    const cachePath = getCachePath(key);

    const entry: CacheEntry = {
      taskId,
      modelUrl,
      thumbnailUrl: thumbnailUrl || "",
      textureUrls: body.textureUrls || null,
      createdAt: new Date().toISOString(),
      sourceNftMint: nftMint,
      sourceNftImage: sourceNftImage || "",
    };

    await fs.writeFile(cachePath, JSON.stringify(entry, null, 2));

    return NextResponse.json({ success: true, key });
  } catch (error: any) {
    console.error("Cache write error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cache model" },
      { status: 500 }
    );
  }
}
