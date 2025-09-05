'use client';

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Activity,
  BarChart3,
  DollarSign,
  Globe,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';

import MemeTokens from '@/components/MemeTokens';
import PumpFunMonitor from '@/components/PumpFunMonitor';
import TrendingTokens from '@/components/TrendingTokens';
import { birdeyeAPI } from '@/lib/birdeye-api';
import {
  formatNumber,
  formatPrice,
} from '@/lib/utils';

interface MarketStats {
  totalVolume24h: number;
  totalMarketCap: number;
  activePairs: number;
  averagePrice: number;
}

interface SearchToken {
  address: string;
  symbol?: string;
  name?: string;
  price?: number;
  price_change_24h_percent?: number;
}

interface SearchResult {
  type: string;
  result: SearchToken[];
}

export default function BlockchainExplorer() {
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalVolume24h: 0,
    totalMarketCap: 0,
    activePairs: 0,
    averagePrice: 0,
  });
  const [recentTrades, setRecentTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        
        // Get trending tokens to calculate market stats
        const trendingData = await birdeyeAPI.getTrendingTokens(20);
        
        // Calculate market statistics from trending tokens
        const stats = trendingData.tokens.reduce(
          (acc, token) => ({
            totalVolume24h: acc.totalVolume24h + token.volume24hUSD,
            totalMarketCap: acc.totalMarketCap + token.marketcap,
            activePairs: acc.activePairs + 1,
            averagePrice: acc.averagePrice + token.price,
          }),
          { totalVolume24h: 0, totalMarketCap: 0, activePairs: 0, averagePrice: 0 }
        );
        
        stats.averagePrice = stats.averagePrice / trendingData.tokens.length;
        setMarketStats(stats);
      } catch (error) {
        console.error('Failed to load market data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await birdeyeAPI.searchTokens(query, 10);
      setSearchResults(results.items as SearchResult[]);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, handleSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div className="absolute inset-0 w-8 h-8 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Solana Explorer
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Powered by Birdeye API
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens by name or symbol..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSearching && (
                  <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {searchResults.map((item: SearchResult, index: number) => (
                    <div key={index}>
                      {item.type === 'token' && item.result.map((token: SearchToken, tokenIndex: number) => (
                        <a
                          key={tokenIndex}
                          href={`/token/${token.address}`}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              {token.symbol?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {token.symbol || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {token.name || 'No name available'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatPrice(token.price || 0)}
                            </div>
                            <div className={`text-xs ${
                              (token.price_change_24h_percent || 0) >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {(token.price_change_24h_percent || 0) >= 0 ? '+' : ''}
                              {(token.price_change_24h_percent || 0).toFixed(2)}%
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <div className="text-gray-900 dark:text-white font-medium">
                  Solana Mainnet
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Live Data
                </div>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">24h Volume</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? '...' : `$${formatNumber(marketStats.totalVolume24h)}`}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Market Cap</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? '...' : `$${formatNumber(marketStats.totalMarketCap)}`}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Tokens</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? '...' : marketStats.activePairs.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? '...' : formatPrice(marketStats.averagePrice)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <button className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-md shadow-sm">
              Trending Tokens
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md">
              Recent Trades
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md">
              Top Gainers
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md">
              New Listings
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* PumpFun Live Monitor */}
          <PumpFunMonitor />
          
          {/* Trending Tokens */}
          <TrendingTokens limit={20} />
          
          {/* Meme Tokens Section */}
          <MemeTokens />
        </div>

        {/* Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-8">
          <div className="xl:col-span-3" />

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Live Stats</span>
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Network</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Solana</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Block Time</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">~400ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">TPS</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">~2,500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Validators</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">1,900+</span>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Top Movers</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">S</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">SOL</span>
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400">+5.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">U</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">USDC</span>
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400">+0.1%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">R</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">RAY</span>
                  </div>
                  <span className="text-sm text-red-600 dark:text-red-400">-2.3%</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <span>Quick Links</span>
              </h3>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  🔥 Pump.fun Tokens
                </a>
                <a href="#" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  💧 Raydium Pools
                </a>
                <a href="#" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  📊 Jupiter Aggregator
                </a>
                <a href="#" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  🌊 Orca Markets
                </a>
                <a href="#" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  📈 Meteora DLMM
                </a>
              </div>
            </div>

            {/* API Status */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Birdeye API Status
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  Connected & Active
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Real-time market data from Solana DEXs
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
