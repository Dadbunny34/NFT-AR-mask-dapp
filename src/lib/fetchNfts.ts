import { Connection, PublicKey } from "@solana/web3.js";

export interface NFTData {
  mint: string;
  name: string;
  image: string;
  collection?: string;
}

export async function fetchWalletNfts(
  connection: Connection,
  walletAddress: PublicKey
): Promise<NFTData[]> {
  const rpcUrl = (connection as any)._rpcEndpoint || process.env.NEXT_PUBLIC_RPC_URL;

  if (!rpcUrl) {
    console.error("No RPC URL available for DAS API");
    return [];
  }

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress.toBase58(),
          page: 1,
          limit: 100,
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
          },
        },
      }),
    });

    const data = await response.json();

    if (!data.result?.items) {
      console.error("DAS API returned no items:", data);
      return [];
    }

    const nfts: NFTData[] = data.result.items
      .map((item: any) => {
        const image =
          item.content?.links?.image ||
          item.content?.files?.[0]?.cdn_uri ||
          item.content?.files?.[0]?.uri ||
          "";
        const name = item.content?.metadata?.name || "Unnamed NFT";
        const collection =
          item.grouping?.find((g: any) => g.group_key === "collection")
            ?.group_value || undefined;

        return { mint: item.id, name, image, collection };
      })
      .filter((nft: NFTData) => nft.image);

    console.log(`Fetched ${nfts.length} NFTs via Helius DAS API`);
    return nfts;
  } catch (error) {
    console.error("Error fetching NFTs via DAS API:", error);
    return [];
  }
}