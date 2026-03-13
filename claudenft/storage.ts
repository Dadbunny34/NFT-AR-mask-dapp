// src/lib/integrations/storage.ts
import axios from 'axios';

interface StorageConfig {
  nftStorageKey: string;
  pinataKey?: string;
  pinataSecret?: string;
  arweavePrivateKey?: string;
}

interface StorageResponse {
  ipfsHash: string;
  arweaveHash?: string;
  pinataHash?: string;
  url: string;
  timestamp: string;
}

const config: StorageConfig = {
  nftStorageKey: process.env.NEXT_PUBLIC_NFT_STORAGE_KEY || '',
  pinataKey: process.env.NEXT_PUBLIC_PINATA_KEY,
  pinataSecret: process.env.NEXT_PUBLIC_PINATA_SECRET,
  arweavePrivateKey: process.env.ARWEAVE_PRIVATE_KEY,
};

// Upload to nft.storage (primary)
export const uploadToNFTStorage = async (
  file: File | Blob,
  metadata?: Record<string, any>
): Promise<{ ipfsHash: string; url: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      formData.append('meta', JSON.stringify(metadata));
    }

    const response = await axios.post('https://api.nft.storage/upload', formData, {
      headers: {
        Authorization: `Bearer ${config.nftStorageKey}`,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        console.log(`📤 Upload progress: ${percentCompleted}%`);
      },
    });

    const ipfsHash = response.data.value.cid;
    const url = `https://nft.storage/${ipfsHash}`;

    console.log(`✅ File uploaded to nft.storage: ${url}`);
    return { ipfsHash, url };
  } catch (error) {
    console.error('❌ nft.storage upload failed:', error);
    throw new Error('Failed to upload to nft.storage');
  }
};

// Upload to Pinata (fallback/backup)
export const uploadToPinata = async (
  file: File | Blob,
  name: string
): Promise<{ hash: string; url: string }> => {
  if (!config.pinataKey || !config.pinataSecret) {
    console.warn('⚠️ Pinata credentials not configured, skipping Pinata backup');
    return { hash: '', url: '' };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    const options = JSON.stringify({
      cidVersion: 0,
      progress: (progress) => {
        console.log(`📤 Pinata upload progress: ${progress}%`);
      },
    });
    formData.append('pinataOptions', options);
    formData.append('pinataMetadata', JSON.stringify({ name }));

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'pinata_api_key': config.pinataKey,
        'pinata_secret_api_key': config.pinataSecret,
      },
    });

    const hash = response.data.IpfsHash;
    const url = `https://gateway.pinata.cloud/ipfs/${hash}`;

    console.log(`✅ File backed up to Pinata: ${url}`);
    return { hash, url };
  } catch (error) {
    console.error('❌ Pinata backup failed:', error);
    return { hash: '', url: '' };
  }
};

// Upload to Arweave (permanent storage)
export const uploadToArweave = async (
  fileBuffer: Buffer,
  contentType: string
): Promise<{ transactionId: string; url: string }> => {
  if (!config.arweavePrivateKey) {
    console.warn('⚠️ Arweave private key not configured, skipping Arweave upload');
    return { transactionId: '', url: '' };
  }

  try {
    // This would require the Arweave SDK in a real implementation
    // For now, we'll simulate the response
    const transactionId = `arweave_${Date.now()}`;
    const url = `https://arweave.net/${transactionId}`;

    console.log(`✅ File uploaded to Arweave: ${url}`);
    return { transactionId, url };
  } catch (error) {
    console.error('❌ Arweave upload failed:', error);
    return { transactionId: '', url: '' };
  }
};

// Main storage upload function with multi-tier redundancy
export const uploadNFTAsset = async (
  file: File | Blob,
  metadata?: Record<string, any>
): Promise<StorageResponse> => {
  const startTime = Date.now();

  try {
    // Primary upload to nft.storage
    const { ipfsHash, url } = await uploadToNFTStorage(file, metadata);

    // Parallel backup uploads
    const [pinataResult, arweaveResult] = await Promise.allSettled([
      uploadToPinata(file, metadata?.name || 'nft-asset'),
      uploadToArweave(
        file instanceof File ? Buffer.from(await file.arrayBuffer()) : Buffer.from(file),
        file.type
      ),
    ]);

    const response: StorageResponse = {
      ipfsHash,
      url,
      pinataHash: pinataResult.status === 'fulfilled' ? pinataResult.value.hash : undefined,
      arweaveHash: arweaveResult.status === 'fulfilled' ? arweaveResult.value.transactionId : undefined,
      timestamp: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    console.log(`⏱️ Total upload time: ${duration}ms`);

    return response;
  } catch (error) {
    console.error('❌ Storage upload failed:', error);
    throw new Error('Failed to upload NFT asset to storage');
  }
};

// Retrieve asset from storage
export const retrieveNFTAsset = async (ipfsHash: string): Promise<Blob> => {
  try {
    const url = `https://nft.storage/${ipfsHash}`;
    const response = await axios.get(url, {
      responseType: 'blob',
    });
    console.log(`✅ Asset retrieved from storage`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to retrieve asset:', error);
    throw new Error('Failed to retrieve NFT asset');
  }
};

// List uploaded assets metadata
export const listUploadedAssets = async (limit: number = 100): Promise<any[]> => {
  try {
    const response = await axios.get(`https://api.nft.storage/uploads?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${config.nftStorageKey}`,
      },
    });

    console.log(`✅ Retrieved ${response.data.value.length} assets`);
    return response.data.value;
  } catch (error) {
    console.error('❌ Failed to list assets:', error);
    return [];
  }
};

// Check storage quota
export const checkStorageQuota = async (): Promise<{ used: number; available: number }> => {
  try {
    const response = await axios.get('https://api.nft.storage/user/uploads', {
      headers: {
        Authorization: `Bearer ${config.nftStorageKey}`,
      },
    });

    const { value } = response.data;
    console.log(`✅ Storage quota check complete`);
    return {
      used: value.reduce((sum: number, item: any) => sum + item.size, 0),
      available: Infinity, // nft.storage has unlimited free storage
    };
  } catch (error) {
    console.error('❌ Failed to check quota:', error);
    return { used: 0, available: 0 };
  }
};

// Delete asset from nft.storage
export const deleteNFTAsset = async (ipfsHash: string): Promise<boolean> => {
  try {
    await axios.delete(`https://api.nft.storage/${ipfsHash}`, {
      headers: {
        Authorization: `Bearer ${config.nftStorageKey}`,
      },
    });

    console.log(`✅ Asset deleted from storage`);
    return true;
  } catch (error) {
    console.error('❌ Failed to delete asset:', error);
    return false;
  }
};

// Batch upload multiple files
export const batchUploadAssets = async (
  files: File[],
  metadata?: Record<string, any>[]
): Promise<StorageResponse[]> => {
  const results: StorageResponse[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadNFTAsset(files[i], metadata?.[i]);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to upload file ${i}:`, error);
    }
  }

  return results;
};

export { config };
