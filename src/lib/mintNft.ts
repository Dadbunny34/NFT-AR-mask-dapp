import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  Metaplex,
  walletAdapterIdentity,
  irysStorage,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { TREASURY_WALLET, MINT_FEE_SOL, SOLANA_NETWORK } from "@/lib/config";

interface MintParams {
  connection: Connection;
  wallet: any;
  modelUrl: string;
  name: string;
  image: string;
  description?: string;
  isMainnet?: boolean;
}

/**
 * Mint a 3D model as an NFT on Solana using Metaplex.
 *
 * FIX: Now actually uploads metadata JSON to Arweave (via Bundlr/Irys)
 * before minting, so the NFT has a valid metadata URI.
 *
 * The old code passed uri: "" which created an NFT with no metadata.
 */
export async function mintModelAsNft({
  connection,
  wallet,
  modelUrl,
  name,
  image,
  description,
  isMainnet = false,
}: MintParams) {
  // Configure Metaplex with Bundlr storage for metadata uploads
  // Devnet uses devnet Bundlr (free), mainnet uses production Bundlr
  const metaplex = new Metaplex(connection)
    .use(walletAdapterIdentity(wallet))
    .use(
      irysStorage({
        address: isMainnet
          ? "https://node1.irys.xyz"
          : "https://devnet.irys.xyz",
        providerUrl: isMainnet
          ? "https://api.mainnet-beta.solana.com"
          : "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );

  // Step 1: Pay fee on mainnet to project treasury
  if (isMainnet && MINT_FEE_SOL > 0) {
    const feeTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(TREASURY_WALLET),
        lamports: Math.floor(MINT_FEE_SOL * LAMPORTS_PER_SOL),
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    feeTransaction.recentBlockhash = blockhash;
    feeTransaction.feePayer = wallet.publicKey;

    const signed = await wallet.signTransaction(feeTransaction);
    const txSig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(txSig, "confirmed");
    console.log("Fee paid to treasury:", txSig);
  }

  // Step 2: Upload metadata JSON to Arweave via Bundlr
  // This is the critical step the old code was missing!
  const { uri: metadataUri } = await metaplex.nfts().uploadMetadata({
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
  });

  console.log("Metadata uploaded to:", metadataUri);

  // Step 3: Create the NFT on-chain with the actual metadata URI
  const { nft } = await metaplex.nfts().create({
    name: name || "3D AR Mask",
    uri: metadataUri, // <-- THIS was the bug! Was "" before
    sellerFeeBasisPoints: 0,
    symbol: "MASK",
    creators: [
      {
        address: wallet.publicKey,
        share: 100,
      },
    ],
  });

  return {
    mint: nft.address.toBase58(),
    name: nft.name,
    metadataUri,
    explorerUrl: isMainnet
      ? `https://solscan.io/token/${nft.address.toBase58()}`
      : `https://solscan.io/token/${nft.address.toBase58()}?cluster=devnet`,
  };
}
