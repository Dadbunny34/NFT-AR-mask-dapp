// src/app/api/storage/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadNFTAsset } from '@/lib/integrations/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataJson = formData.get('metadata') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // Parse metadata if provided
    let metadata;
    if (metadataJson) {
      try {
        metadata = JSON.parse(metadataJson);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid metadata JSON' },
          { status: 400 }
        );
      }
    }

    // Upload to storage
    const result = await uploadNFTAsset(file, metadata);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'File uploaded successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        message: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ipfsHash = searchParams.get('ipfsHash');

    if (!ipfsHash) {
      return NextResponse.json(
        { error: 'IPFS hash is required' },
        { status: 400 }
      );
    }

    // Return IPFS gateway URL
    const url = `https://nft.storage/${ipfsHash}`;

    return NextResponse.json(
      {
        success: true,
        url,
        ipfsHash,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    );
  }
}
