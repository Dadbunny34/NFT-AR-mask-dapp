// src/lib/integrations/onchain.ts
import axios from 'axios';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  animation_url?: string;
  external_url?: string;
}

interface NFTVerificationResult {
  isValid: boolean;
  verified: boolean;
  source: 'solana' | 'ethereum' | 'polygon';
  address: string;
  owner?: string;
  metadata?: NFTMetadata;
  timestamp: string;
}

// Verify NFT on Solana via Solscan
export const verifySolanaNFT = async (
  tokenAddress: string
): Promise<NFTVerificationResult> => {
  try {
    const response = await axios.get(
      `https://api.solscan.io/token?address=${tokenAddress}`,
      {
        headers: {
          'User-Agent': 'NFT-AR-Mask-dApp',
        },
      }
    );

    const { data } = response;

    if (!data || !data.address) {
      return {
        isValid: false,
        verified: false,
        source: 'solana',
        address: tokenAddress,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      isValid: true,
      verified: true,
      source: 'solana',
      address: tokenAddress,
      owner: data.owner,
      metadata: {
        name: data.name || 'Unknown',
        description: data.description || '',
        image: data.icon || '',
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Solana NFT verification failed:', error);
    return {
      isValid: false,
      verified: false,
      source: 'solana',
      address: tokenAddress,
      timestamp: new Date().toISOString(),
    };
  }
};

// Verify NFT on Ethereum via OpenSea API
export const verifyEthereumNFT = async (
  contractAddress: string,
  tokenId: string
): Promise<NFTVerificationResult> => {
  try {
    const response = await axios.get(
      `https://api.opensea.io/api/v2/chain/ethereum/contract/${contractAddress}/nfts/${tokenId}`,
      {
        headers: {
          'X-API-KEY': process.env.OPENSEA_API_KEY || '',
        },
      }
    );

    const { nft } = response.data;

    if (!nft) {
      return {
        isValid: false,
        verified: false,
        source: 'ethereum',
        address: contractAddress,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      isValid: true,
      verified: true,
      source: 'ethereum',
      address: contractAddress,
      owner: nft.owners?.[0]?.address,
      metadata: {
        name: nft.name || 'Unknown',
        description: nft.description || '',
        image: nft.image_url || nft.display_image_url || '',
        attributes: nft.traits?.map((trait: any) => ({
          trait_type: trait.trait_type,
          value: trait.value,
        })),
        external_url: nft.external_link,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Ethereum NFT verification failed:', error);
    return {
      isValid: false,
      verified: false,
      source: 'ethereum',
      address: contractAddress,
      timestamp: new Date().toISOString(),
    };
  }
};

// Verify NFT on Polygon via Alchemy
export const verifyPolygonNFT = async (
  contractAddress: string,
  tokenId: string
): Promise<NFTVerificationResult> => {
  try {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) {
      throw new Error('Alchemy API key not configured');
    }

    const response = await axios.post(
      `https://polygon-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTMetadata`,
      {
        contractAddress,
        tokenId,
      }
    );

    const { response: nftData } = response.data;

    if (!nftData) {
      return {
        isValid: false,
        verified: false,
        source: 'polygon',
        address: contractAddress,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      isValid: true,
      verified: true,
      source: 'polygon',
      address: contractAddress,
      metadata: {
        name: nftData.name || 'Unknown',
        description: nftData.description || '',
        image: nftData.image?.cachedUrl || nftData.image?.originalUrl || '',
        attributes: nftData.attributes?.map((attr: any) => ({
          trait_type: attr.name,
          value: attr.value,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Polygon NFT verification failed:', error);
    return {
      isValid: false,
      verified: false,
      source: 'polygon',
      address: contractAddress,
      timestamp: new Date().toISOString(),
    };
  }
};

// Magic Eden marketplace verification (Solana)
export const verifyMagicEdenNFT = async (
  mintAddress: string
): Promise<NFTVerificationResult> => {
  try {
    const response = await axios.get(
      `https://api-mainnet.magiceden.dev/v2/tokens/${mintAddress}`
    );

    const { data } = response;

    if (!data) {
      return {
        isValid: false,
        verified: false,
        source: 'solana',
        address: mintAddress,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      isValid: true,
      verified: true,
      source: 'solana',
      address: mintAddress,
      owner: data.owner,
      metadata: {
        name: data.name || 'Unknown',
        description: data.description || '',
        image: data.image || '',
        attributes: data.attributes?.map((attr: any) => ({
          trait_type: attr.trait_type,
          value: attr.value,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Magic Eden verification failed:', error);
    return {
      isValid: false,
      verified: false,
      source: 'solana',
      address: mintAddress,
      timestamp: new Date().toISOString(),
    };
  }
};

// Batch verify multiple NFTs
export const batchVerifyNFTs = async (
  nfts: Array<{ address: string; tokenId?: string; chain: 'solana' | 'ethereum' | 'polygon' }>
): Promise<NFTVerificationResult[]> => {
  const results = await Promise.allSettled(
    nfts.map((nft) => {
      switch (nft.chain) {
        case 'solana':
          return verifySolanaNFT(nft.address);
        case 'ethereum':
          return verifyEthereumNFT(nft.address, nft.tokenId || '0');
        case 'polygon':
          return verifyPolygonNFT(nft.address, nft.tokenId || '0');
        default:
          return Promise.reject(new Error(`Unknown chain: ${nft.chain}`));
      }
    })
  );

  return results.map((result) =>
    result.status === 'fulfilled'
      ? result.value
      : {
          isValid: false,
          verified: false,
          source: 'solana' as const,
          address: '',
          timestamp: new Date().toISOString(),
        }
  );
};

// Get NFT floor price and marketplace info
export const getNFTMarketplaceInfo = async (
  contractAddress: string,
  chain: 'ethereum' | 'polygon' = 'ethereum'
): Promise<{
  floorPrice?: number;
  volumeTraded?: number;
  listings?: number;
  owners?: number;
}> => {
  try {
    if (chain === 'ethereum') {
      const response = await axios.get(
        `https://api.opensea.io/api/v2/collections/${contractAddress}`,
        {
          headers: {
            'X-API-KEY': process.env.OPENSEA_API_KEY || '',
          },
        }
      );

      const { collection } = response.data;
      return {
        floorPrice: collection?.floor_price,
        volumeTraded: collection?.volume_traded,
        listings: collection?.total_supply,
        owners: collection?.unique_holders,
      };
    }

    return {};
  } catch (error) {
    console.error('❌ Failed to fetch marketplace info:', error);
    return {};
  }
};

// Validate NFT metadata JSON
export const validateNFTMetadata = (metadata: any): boolean => {
  const requiredFields = ['name', 'description', 'image'];
  return requiredFields.every((field) => field in metadata && metadata[field]);
};

// Create standard NFT metadata
export const createNFTMetadata = (
  name: string,
  description: string,
  imageUrl: string,
  attributes?: Array<{ trait_type: string; value: string }>,
  externalUrl?: string
): NFTMetadata => {
  return {
    name,
    description,
    image: imageUrl,
    attributes,
    external_url: externalUrl,
  };
};

export {
  NFTMetadata,
  NFTVerificationResult,
};
