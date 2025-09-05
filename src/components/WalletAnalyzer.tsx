'use client';

import { useState, useEffect, useCallback } from 'react';
import { birdeyeAPI, type WalletNetWorth, type WalletNetWorthHistory, type WalletToken } from '@/lib/birdeye-api';
import { formatNumber, formatPrice } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from 'lucide-react';

interface WalletAnalyzerProps {
  walletAddress: string;
  onClose?: () => void;
}

export default function WalletAnalyzer({ walletAddress, onClose }: WalletAnalyzerProps) {
  const [netWorth, setNetWorth] = useState<WalletNetWorth | null>(null);
  const [history, setHistory] = useState<WalletNetWorthHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'history' | 'network'>('portfolio');

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch current net worth and portfolio
      const [netWorthData, historyData] = await Promise.all([
        birdeyeAPI.getWalletNetWorth(walletAddress),
        birdeyeAPI.getWalletNetWorthHistory(walletAddress, 7, '1d')
      ]);
      
      setNetWorth(netWorthData);
      setHistory(historyData.history);
      setError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading wallet data...</div>
        </div>
      </div>
    );
  }

  if (error || !netWorth) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-red-400">{error || 'No wallet data available'}</div>
        </div>
      </div>
    );
  }

  const totalValue = Number.parseFloat(netWorth.total_value);
  const sortedTokens = netWorth.items.sort((a, b) => Number.parseFloat(b.value) - Number.parseFloat(a.value));
  const topTokens = sortedTokens.slice(0, 10);

  // Calculate portfolio distribution
  const portfolioData = topTokens.map(token => ({
    symbol: token.symbol,
    value: Number.parseFloat(token.value),
    percentage: (Number.parseFloat(token.value) / totalValue) * 100
  }));

  // Calculate historical performance
  const latestHistory = history[0];
  const oldestHistory = history[history.length - 1];
  const totalChange = latestHistory && oldestHistory ? 
    latestHistory.net_worth - oldestHistory.net_worth : 0;
  const totalChangePercent = oldestHistory?.net_worth ? 
    (totalChange / oldestHistory.net_worth) * 100 : 0;

  const renderPortfolio = () => (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Total Value</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${formatNumber(totalValue)}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <PieChart className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Token Count</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {netWorth.items.length}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            {totalChangePercent >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <span className="text-gray-400 text-sm">7d Change</span>
          </div>
          <div className={`text-2xl font-bold ${
            totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Token Holdings */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Holdings</h3>
        <div className="space-y-3">
          {topTokens.map((token, index) => (
            <div key={token.address} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  {token.logo_uri ? (
                    <img
                      src={token.logo_uri}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {token.symbol.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">{token.symbol}</div>
                  <div className="text-gray-400 text-sm">{token.name}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-white font-medium">
                  ${formatNumber(Number.parseFloat(token.value))}
                </div>
                <div className="text-gray-400 text-sm">
                  {token.amount.toLocaleString()} {token.symbol}
                </div>
                <div className="text-blue-400 text-sm">
                  {((Number.parseFloat(token.value) / totalValue) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      {/* Net Worth Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Net Worth History (7 days)</h3>
        <div className="h-64 relative">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Chart lines and data visualization */}
            {history.length > 1 && (
              <g>
                {history.map((point, index) => {
                  const x = (index / (history.length - 1)) * 350 + 25;
                  const maxValue = Math.max(...history.map(h => h.net_worth));
                  const minValue = Math.min(...history.map(h => h.net_worth));
                  const range = maxValue - minValue || 1;
                  const y = 175 - ((point.net_worth - minValue) / range) * 150;
                  
                  return (
                    <g key={point.timestamp}>
                      <circle
                        cx={x}
                        cy={y}
                        r="3"
                        fill="#3B82F6"
                      />
                      {index > 0 && (
                        <line
                          x1={(index - 1) / (history.length - 1) * 350 + 25}
                          y1={175 - ((history[index - 1].net_worth - minValue) / range) * 150}
                          x2={x}
                          y2={y}
                          stroke="#3B82F6"
                          strokeWidth="2"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Daily Changes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 pb-2">Date</th>
                <th className="text-right text-gray-400 pb-2">Net Worth</th>
                <th className="text-right text-gray-400 pb-2">Change</th>
                <th className="text-right text-gray-400 pb-2">%</th>
              </tr>
            </thead>
            <tbody>
              {history.map((point, index) => (
                <tr key={point.timestamp} className="border-b border-gray-700/50">
                  <td className="py-2 text-white">
                    {new Date(point.timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-right text-white">
                    ${formatNumber(point.net_worth)}
                  </td>
                  <td className={`py-2 text-right ${
                    point.net_worth_change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {point.net_worth_change >= 0 ? '+' : ''}
                    ${formatNumber(Math.abs(point.net_worth_change))}
                  </td>
                  <td className={`py-2 text-right ${
                    point.net_worth_change_percent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {point.net_worth_change_percent >= 0 ? '+' : ''}
                    {point.net_worth_change_percent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderNetwork = () => (
    <div className="space-y-6">
      {/* Portfolio Composition Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Composition</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {portfolioData.map((token, index) => {
                const startAngle = portfolioData.slice(0, index).reduce((sum, t) => sum + (t.percentage / 100) * 360, 0);
                const endAngle = startAngle + (token.percentage / 100) * 360;
                const startRadians = (startAngle * Math.PI) / 180;
                const endRadians = (endAngle * Math.PI) / 180;
                
                const x1 = 100 + 80 * Math.cos(startRadians);
                const y1 = 100 + 80 * Math.sin(startRadians);
                const x2 = 100 + 80 * Math.cos(endRadians);
                const y2 = 100 + 80 * Math.sin(endRadians);
                
                const largeArcFlag = token.percentage > 50 ? 1 : 0;
                const pathData = [
                  `M 100 100`,
                  `L ${x1} ${y1}`,
                  `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');
                
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];
                
                return (
                  <path
                    key={token.symbol}
                    d={pathData}
                    fill={colors[index % colors.length]}
                    stroke="#1F2937"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>
          
          {/* Legend */}
          <div className="space-y-2">
            {portfolioData.map((token, index) => {
              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];
              return (
                <div key={token.symbol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-white text-sm">{token.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">{token.percentage.toFixed(1)}%</div>
                    <div className="text-gray-400 text-xs">${formatNumber(token.value)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Diversification Metrics */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Diversification Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {portfolioData[0]?.percentage.toFixed(1)}%
            </div>
            <div className="text-gray-400 text-sm">Largest Holding</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {portfolioData.slice(0, 3).reduce((sum, t) => sum + t.percentage, 0).toFixed(1)}%
            </div>
            <div className="text-gray-400 text-sm">Top 3 Holdings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {netWorth.items.length}
            </div>
            <div className="text-gray-400 text-sm">Total Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {netWorth.items.filter(t => Number.parseFloat(t.value) > 1).length}
            </div>
            <div className="text-gray-400 text-sm">Positions >$1</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wallet className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Wallet Analysis</h2>
              <p className="text-gray-400 text-sm font-mono">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { id: 'portfolio', label: 'Portfolio', icon: DollarSign },
            { id: 'history', label: 'History', icon: BarChart3 },
            { id: 'network', label: 'Network', icon: PieChart },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'portfolio' && renderPortfolio()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'network' && renderNetwork()}
      </div>
    </div>
  );
}
