import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { TREASURY_WALLET, MINT_FEE_SOL, SOLANA_NETWORK, SOLANA_RPC_URL } from "@/lib/config";

/**
 * POST /api/mint
 * Prepares mint metadata and fee info.
 * The actual NFT minting uses Metaplex on the client side.
 * Fee transfer is handled in mintNft.ts on the client.
 *
 * Body: { walletAddress, modelUrl, name, image, description }
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, modelUrl, name, image, description } =
      await req.json();

    if (!walletAddress || !modelUrl) {
      return NextResponse.json(
        { error: "walletAddress and modelUrl are required" },
        { status: 400 }
      );
    }

    // Build metadata JSON for the NFT
    const metadata = {
      name: name || "3D AR Mask",
      description:
        description ||
        "3D model generated from a Solana NFT using MaskForge",
      image: image || "",
      animation_url: modelUrl,
      attributes: [
        { trait_type: "Type", value: "3D AR Mask" },
        { trait_type: "Format", value: "GLB" },
        { trait_type: "Generator", value: "MaskForge x Meshy.ai" },
      ],
      properties: {
        files: [
          { uri: modelUrl, type: "model/gltf-binary" },
          ...(image ? [{ uri: image, type: "image/png" }] : []),
        ],
        category: "vr",
      },
    };

    return NextResponse.json({
      metadata,
      feeRequired: SOLANA_NETWORK === "mainnet-beta" && MINT_FEE_SOL > 0,
      feeSol: MINT_FEE_SOL,
      feeWallet: TREASURY_WALLET,
      network: SOLANA_NETWORK,
    });
  } catch (error: any) {
    console.error("Mint API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
