'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  birdeyeAPI,
  type TrendingToken,
} from '@/lib/birdeye-api';
import type { TokenData } from '@/lib/openrouter-client';
import { formatNumber } from '@/lib/utils';

import { BrainAnalysisIcon } from './BrainAnalysisIcon';

// Helper function to convert TrendingToken to TokenData for analysis
const convertToTokenData = (token: TrendingToken): TokenData => ({
  address: token.address,
  symbol: token.symbol,
  name: token.name,
  price: token.price,
  priceChange24h: token.price24hChangePercent,
  volume24h: token.volume24hUSD,
  marketCap: token.marketcap,
  liquidity: token.liquidity,
});

export default function TrendingTicker() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        const response = await birdeyeAPI.getTrendingTokens(10);
        setTokens(response.tokens);
        setError(null);
      } catch (err) {
        console.error('Error fetching trending tokens:', err);
        setError('Failed to load trending tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTokens();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTrendingTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900 border-b border-gray-800 py-2">
        <div className="flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading trending tokens...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 border-b border-gray-800 py-2">
        <div className="flex items-center justify-center">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border-b border-gray-800 py-2 overflow-hidden">
      <div className="flex items-center space-x-8 animate-scroll">
        <div className="flex items-center space-x-8 whitespace-nowrap">
          {tokens.map((token, index) => (
            <div
              key={`${token.address}-${index}`}
              className="flex items-center space-x-2 hover:bg-gray-800 px-3 py-1 rounded-lg transition-colors duration-200"
            >
              <Link
                href={`/token/${token.address}`}
                className="flex items-center space-x-2"
              >
                {token.logoURI && (
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <span className="text-white font-medium text-sm">{token.symbol}</span>
                <span className="text-gray-400 text-sm">
                  ${formatNumber(token.price)}
                </span>
                <span
                  className={`text-sm font-medium ${
                    token.price24hChangePercent >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {token.price24hChangePercent >= 0 ? '+' : ''}
                  {token.price24hChangePercent.toFixed(2)}%
                </span>
              </Link>
              <BrainAnalysisIcon 
                tokenData={convertToTokenData(token)} 
                size="sm"
                className="ml-1"
              />
            </div>
          ))}
        </div>
        {/* Duplicate for seamless scrolling */}
        <div className="flex items-center space-x-8 whitespace-nowrap">
          {tokens.map((token, index) => (
            <div
              key={`${token.address}-duplicate-${index}`}
              className="flex items-center space-x-2 hover:bg-gray-800 px-3 py-1 rounded-lg transition-colors duration-200"
            >
              <Link
                href={`/token/${token.address}`}
                className="flex items-center space-x-2"
              >
                {token.logoURI && (
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <span className="text-white font-medium text-sm">{token.symbol}</span>
                <span className="text-gray-400 text-sm">
                  ${formatNumber(token.price)}
                </span>
                <span
                  className={`text-sm font-medium ${
                    token.price24hChangePercent >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {token.price24hChangePercent >= 0 ? '+' : ''}
                  {token.price24hChangePercent.toFixed(2)}%
                </span>
              </Link>
              <BrainAnalysisIcon 
                tokenData={convertToTokenData(token)} 
                size="sm"
                className="ml-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
