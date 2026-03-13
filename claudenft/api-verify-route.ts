// src/app/api/nft/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  verifySolanaNFT,
  verifyEthereumNFT,
  verifyPolygonNFT,
  verifyMagicEdenNFT,
} from '@/lib/integrations/onchain';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chain, address, tokenId } = body;

    if (!chain || !address) {
      return NextResponse.json(
        { error: 'Chain and address are required' },
        { status: 400 }
      );
    }

    let result;

    switch (chain.toLowerCase()) {
      case 'solana':
        result = await verifySolanaNFT(address);
        break;
      case 'ethereum':
        result = await verifyEthereumNFT(address, tokenId || '0');
        break;
      case 'polygon':
        result = await verifyPolygonNFT(address, tokenId || '0');
        break;
      case 'magiceden':
        result = await verifyMagicEdenNFT(address);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported blockchain' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Verification error:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify NFT',
        message: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');
    const address = searchParams.get('address');
    const tokenId = searchParams.get('tokenId');

    if (!chain || !address) {
      return NextResponse.json(
        { error: 'Chain and address are required' },
        { status: 400 }
      );
    }

    let result;

    switch (chain.toLowerCase()) {
      case 'solana':
        result = await verifySolanaNFT(address);
        break;
      case 'ethereum':
        result = await verifyEthereumNFT(address, tokenId || '0');
        break;
      case 'polygon':
        result = await verifyPolygonNFT(address, tokenId || '0');
        break;
      case 'magiceden':
        result = await verifyMagicEdenNFT(address);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported blockchain' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Verification error:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify NFT',
        message: String(error),
      },
      { status: 500 }
    );
  }
}
