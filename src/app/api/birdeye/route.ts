import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { birdeyeAPI } from '@/lib/birdeye-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const address = searchParams.get('address');
    const chain = searchParams.get('chain') || 'solana';

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    let data: unknown;
    switch (endpoint) {
      case 'trending': {
        data = await birdeyeAPI.getTrendingTokens();
        break;
      }
      case 'meme': {
        data = await birdeyeAPI.getMemeTokens();
        break;
      }
      case 'overview': {
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter for overview' },
            { status: 400 }
          );
        }
        data = await birdeyeAPI.getTokenOverview(address);
        break;
      }
      case 'metadata': {
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter for metadata' },
            { status: 400 }
          );
        }
        data = await birdeyeAPI.getTokenMetadata(address);
        break;
      }
      case 'ohlcv': {
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter for OHLCV data' },
            { status: 400 }
          );
        }
        const type = searchParams.get('type') || '1h';
        data = await birdeyeAPI.getOHLCVV3(
          address,
          Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
          Date.now(),
          type as '1h' | '1d'
        );
        break;
      }
      case 'trades': {
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter for trades' },
            { status: 400 }
          );
        }
        data = await birdeyeAPI.getTokenTrades(address);
        break;
      }
      case 'wallet': {
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter for wallet analysis' },
            { status: 400 }
          );
        }
        data = await birdeyeAPI.getWalletPortfolio(address);
        break;
      }
      default: {
        return NextResponse.json(
          { error: 'Invalid endpoint parameter' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Birdeye API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Birdeye API' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, address, chain = 'solana', ...params } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    let data: unknown;
    switch (endpoint) {
      case 'trending': {
        data = await birdeyeAPI.getTrendingTokens();
        break;
      }
      case 'meme': {
        data = await birdeyeAPI.getMemeTokens();
        break;
      }
      case 'overview': {
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter for overview' },
            { status: 400 }
          );
        }
        data = await birdeyeAPI.getTokenOverview(address);
        break;
      }
      case 'metadata': {
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter for metadata' },
            { status: 400 }
          );
        }
        data = await birdeyeAPI.getTokenMetadata(address);
        break;
      }
      case 'ohlcv': {
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter for OHLCV data' },
            { status: 400 }
          );
        }
        const type = (params.type as string) || '1h';
        data = await birdeyeAPI.getOHLCVV3(
          address,
          Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
          Date.now(),
          type as '1h' | '1d'
        );
        break;
      }
      case 'trades': {
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter for trades' },
            { status: 400 }
          );
        }
        data = await birdeyeAPI.getTokenTrades(address);
        break;
      }
      case 'wallet': {
        if (!address) {
          return NextResponse.json(
            { error: 'Missing address parameter for wallet analysis' },
            { status: 400 }
          );
        }
        data = await birdeyeAPI.getWalletPortfolio(address);
        break;
      }
      default: {
        return NextResponse.json(
          { error: 'Invalid endpoint parameter' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Birdeye API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Birdeye API' },
      { status: 500 }
    );
  }
}
