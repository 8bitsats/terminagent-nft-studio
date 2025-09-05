'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  Activity,
  ArrowLeft,
  BarChart3,
  Copy,
  ExternalLink,
  Globe,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Volume2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  type TokenMarketData,
  type TokenMetadata,
  type TokenOverview,
  type Trade,
  birdeyeAPI,
} from '@/lib/birdeye-api';
import {
  formatNumber,
  formatPercentage,
  formatPrice,
  timeAgo,
  truncateAddress,
} from '@/lib/utils';

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as string;

  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [marketData, setMarketData] = useState<TokenMarketData | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadTokenData() {
      if (!address) return;

      try {
        setIsLoading(true);
        setError(null);

        const [metadata, market, trades] = await Promise.all([
          birdeyeAPI.getTokenMetadata(address),
          birdeyeAPI.getTokenMarketData(address),
          birdeyeAPI.getTokenTrades(address, 20),
        ]);

        setTokenMetadata(metadata);
        setMarketData(market);
        setRecentTrades(trades.items);
      } catch (err) {
        console.error('Failed to load token data:', err);
        setError('Failed to load token data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTokenData();
  }, [address]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400">Loading token data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Explorer</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use TokenOverview for price change data since TokenMarketData doesn't have this
  const priceChange24h = 0; // We'll need to get this from a different endpoint
  const isPositiveChange = priceChange24h >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Explorer</span>
            </Link>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center space-x-3">
              {tokenMetadata?.logo_uri ? (
                <img
                  src={tokenMetadata.logo_uri}
                  alt={tokenMetadata.symbol}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    {tokenMetadata?.symbol?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {tokenMetadata?.name || 'Unknown Token'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tokenMetadata?.symbol || 'UNKNOWN'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Price and Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Price Card */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Price</h2>
                <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                  isPositiveChange 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {isPositiveChange ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{formatPercentage(priceChange24h)}</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {formatPrice(marketData?.price || 0)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                24h change: {isPositiveChange ? '+' : ''}{formatPercentage(priceChange24h)}
              </p>
            </div>
          </div>

          {/* Token Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contract Address</h3>
            <div className="flex items-center space-x-2 mb-3">
              <code className="flex-1 text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded font-mono text-gray-800 dark:text-gray-200">
                {truncateAddress(address, 6, 6)}
              </code>
              <button
                onClick={() => copyToClipboard(address)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Copy address"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={`https://solscan.io/token/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="View on Solscan"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            {copied && (
              <p className="text-xs text-green-600 dark:text-green-400">Address copied!</p>
            )}
          </div>
        </div>

        {/* Market Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Market Cap</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {marketData?.market_cap ? `$${formatNumber(marketData.market_cap)}` : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">24h Volume</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  N/A
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Volume2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Liquidity</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {marketData?.liquidity ? `$${formatNumber(marketData.liquidity)}` : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Holders</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  N/A
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Token Info and Recent Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token Information */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Token Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {tokenMetadata?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Symbol</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {tokenMetadata?.symbol || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Decimals</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {tokenMetadata?.decimals || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Supply</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {marketData?.total_supply ? formatNumber(marketData.total_supply) : 'N/A'}
                  </p>
                </div>
                {tokenMetadata?.extensions?.website && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                    <a
                      href={tokenMetadata.extensions.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Visit Website</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Recent Trades</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Time</th>
                      <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                      <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Price</th>
                      <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Amount</th>
                      <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.length > 0 ? (
                      recentTrades.map((trade, index) => (
                        <tr key={`${trade.txHash}-${index}`} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="py-3 text-gray-600 dark:text-gray-400">
                            {timeAgo(trade.blockUnixTime)}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.txType === 'buy' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {trade.txType}
                            </span>
                          </td>
                          <td className="py-3 text-right text-gray-900 dark:text-white font-medium">
                            {formatPrice(trade.to.price || 0)}
                          </td>
                          <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                            {formatNumber(trade.to.uiAmount)}
                          </td>
                          <td className="py-3 text-right text-gray-900 dark:text-white font-medium">
                            ${formatNumber(trade.volumeUSD)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No recent trades available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
