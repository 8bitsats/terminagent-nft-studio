'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  Activity,
  Play,
  Square,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import type {
  TokenLaunch,
  TradeActivity,
} from '@/lib/pumpfun-monitor';
import {
  formatNumber,
  formatPrice,
  timeAgo,
  truncateAddress,
} from '@/lib/utils';

interface PumpFunStats {
  totalTokensLaunched: number;
  totalTrades: number;
  recentTrades: number;
  hourlyBuyVolume: number;
  hourlySellVolume: number;
  totalHourlyVolume: number;
}

export default function PumpFunMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [recentLaunches, setRecentLaunches] = useState<TokenLaunch[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeActivity[]>([]);
  const [stats, setStats] = useState<PumpFunStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  const fetchPumpFunData = async () => {
    try {
      const response = await fetch('/api/pumpfun');
      if (!response.ok) {
        throw new Error('Failed to fetch PumpFun data');
      }
      const data = await response.json();
      
      setRecentLaunches(data.recentLaunches || []);
      setRecentTrades(data.recentTrades || []);
      setStats(data.stats || null);
      setIsMonitoring(data.isMonitoring || false);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch PumpFun data:', err);
      setError('Failed to load PumpFun data');
    }
  };

  // Start/stop monitoring
  const toggleMonitoring = async () => {
    try {
      const response = await fetch('/api/pumpfun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isMonitoring ? 'stop' : 'start'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle monitoring');
      }

      setIsMonitoring(!isMonitoring);
      setError(null);
    } catch (err) {
      console.error('Failed to toggle monitoring:', err);
      setError('Failed to control monitor');
    }
  };

  // Auto-refresh data every 5 seconds
  useEffect(() => {
    fetchPumpFunData();
    const interval = setInterval(fetchPumpFunData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Pump.fun Monitor
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Real-time token launches and trading activity
            </p>
          </div>
        </div>
        
        <button
          onClick={toggleMonitoring}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isMonitoring
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isMonitoring ? (
            <>
              <Square className="w-4 h-4" />
              <span>Stop Monitor</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Start Monitor</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          isMonitoring 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-gray-400 dark:bg-gray-600'
        }`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isMonitoring ? 'Monitoring active' : 'Monitoring stopped'}
        </span>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Tokens Launched
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.totalTokensLaunched}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Trades
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.totalTrades}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Recent Trades (1h)
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.recentTrades}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">
              Buy Volume (1h)
            </p>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">
              {stats.hourlyBuyVolume.toFixed(2)} SOL
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">
              Sell Volume (1h)
            </p>
            <p className="text-lg font-bold text-red-700 dark:text-red-400">
              {stats.hourlySellVolume.toFixed(2)} SOL
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Volume (1h)
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.totalHourlyVolume.toFixed(2)} SOL
            </p>
          </div>
        </div>
      )}

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Token Launches */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span>Recent Token Launches</span>
          </h3>
          
          <div className="space-y-3">
            {recentLaunches.length > 0 ? (
              recentLaunches.slice(0, 10).map((launch, index) => (
                <div
                  key={`${launch.tokenMint}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link
                        href={`/token/${launch.tokenMint}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {launch.symbol || truncateAddress(launch.tokenMint, 4, 4)}
                      </Link>
                      {launch.name && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {launch.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Creator: {truncateAddress(launch.creator, 4, 4)}</span>
                      <span>{timeAgo(launch.timestamp)}</span>
                    </div>
                  </div>
                  <a
                    href={`https://solscan.io/tx/${launch.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    View Tx
                  </a>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No recent launches detected
              </p>
            )}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Live Trading Activity</span>
          </h3>
          
          <div className="space-y-3">
            {recentTrades.length > 0 ? (
              recentTrades.slice(0, 10).map((trade, index) => (
                <div
                  key={`${trade.signature}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.isBuy
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {trade.isBuy ? 'BUY' : 'SELL'}
                      </span>
                      <Link
                        href={`/token/${trade.tokenMint}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {truncateAddress(trade.tokenMint, 4, 4)}
                      </Link>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatNumber(trade.tokenAmount)} tokens</span>
                      <span>{trade.solAmount.toFixed(4)} SOL</span>
                      <span>{timeAgo(trade.timestamp)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatPrice(trade.price)} SOL
                    </p>
                    <a
                      href={`https://solscan.io/tx/${trade.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                    >
                      View Tx
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No recent trades detected
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
