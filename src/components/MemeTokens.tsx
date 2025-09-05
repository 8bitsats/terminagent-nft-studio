'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  birdeyeAPI,
  type MemeToken,
  type MemeTokenListResponse,
} from '@/lib/birdeye-api';
import type { TokenData } from '@/lib/openrouter-client';
import { formatNumber } from '@/lib/utils';

// Helper function to convert MemeToken to TokenData for analysis
const convertMemeTokenToTokenData = (token: MemeToken): TokenData => ({
  address: token.address,
  symbol: token.symbol,
  name: token.name,
  price: token.price || 0,
  priceChange24h: token.price_change_24h || 0,
  volume24h: token.volume_24h || 0,
  marketCap: token.market_cap,
  liquidity: token.liquidity,
  source: token.source,
});

export default function MemeTokens() {
  const [memeTokens, setMemeTokens] = useState<MemeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'new' | 'pump' | 'moonshot'>('trending');

  const fetchMemeTokens = useCallback(async (type: 'trending' | 'new' | 'pump' | 'moonshot') => {
    try {
      setLoading(true);
      let response: MemeTokenListResponse;
      
      switch (type) {
        case 'trending':
          response = await birdeyeAPI.getTrendingMemeTokens(20);
          break;
        case 'new':
          response = await birdeyeAPI.getNewMemeTokens(20);
          break;
        case 'pump':
          response = await birdeyeAPI.getPumpFunTokens(20);
          break;
        case 'moonshot':
          response = await birdeyeAPI.getMoonshotTokens(20);
          break;
      }
      
      setMemeTokens(response.tokens);
      setError(null);
    } catch (err) {
      console.error('Error fetching meme tokens:', err);
      setError('Failed to load meme tokens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemeTokens(activeTab);
  }, [activeTab, fetchMemeTokens]);

  const tabs = [
    { id: 'trending' as const, label: 'Trending Memes', icon: '🔥' },
    { id: 'new' as const, label: 'New Launches', icon: '🆕' },
    { id: 'pump' as const, label: 'Pump.fun', icon: '💊' },
    { id: 'moonshot' as const, label: 'Moonshot', icon: '🚀' },
  ];

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Meme Tokens</h2>
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400">Loading meme tokens...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-red-400">{error}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {memeTokens.map((token) => (
            <Link
              key={token.address}
              href={`/token/${token.address}`}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors border border-gray-700"
            >
              <div className="flex items-center space-x-3 mb-3">
                {token.image_uri ? (
                  <img
                    src={token.image_uri}
                    alt={token.symbol}
                    className="w-12 h-12 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-token.png';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{token.symbol?.[0]}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{token.symbol}</h3>
                  <p className="text-gray-400 text-sm truncate">{token.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                {token.price && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Price</span>
                    <span className="text-white font-medium">
                      ${formatNumber(token.price)}
                    </span>
                  </div>
                )}

                {token.market_cap && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Market Cap</span>
                    <span className="text-white font-medium">
                      ${formatNumber(token.market_cap)}
                    </span>
                  </div>
                )}

                {token.price_change_24h !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">24h Change</span>
                    <span
                      className={`font-medium ${
                        token.price_change_24h >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {token.price_change_24h >= 0 ? '+' : ''}
                      {token.price_change_24h.toFixed(2)}%
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Source</span>
                  <span className="text-purple-400 text-sm font-medium capitalize">
                    {token.source}
                  </span>
                </div>
              </div>

              {token.description && (
                <p className="text-gray-300 text-sm mt-3 line-clamp-2">
                  {token.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
