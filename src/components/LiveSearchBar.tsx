"use client";

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Loader2 } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  price: string;
  change: string;
  rank: number;
}

interface LiveSearchBarProps {
  onSelect: (selection: string) => void;
}

export const LiveSearchBar: React.FC<LiveSearchBarProps> = ({ onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<Token[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch trending tokens on mount
  useEffect(() => {
    fetchTrendingTokens();
  }, []);

  const fetchTrendingTokens = async () => {
    try {
      // Mock Birdeye API call
      const mockTrending = [
        { symbol: 'SOL', name: 'Solana', price: '$180.50', change: '+5.2%', rank: 1 },
        { symbol: 'BONK', name: 'Bonk', price: '$0.00003', change: '+12.8%', rank: 2 },
        { symbol: 'JUP', name: 'Jupiter', price: '$0.85', change: '-2.1%', rank: 3 },
        { symbol: 'WIF', name: 'dogwifhat', price: '$2.45', change: '+8.9%', rank: 4 },
        { symbol: 'PYTH', name: 'Pyth Network', price: '$0.38', change: '+3.4%', rank: 5 }
      ];
      setTrendingTokens(mockTrending);
    } catch (error) {
      console.error('Failed to fetch trending tokens:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Mock search results
      const mockResults = trendingTokens.filter(token =>
        token.symbol.toLowerCase().includes(query.toLowerCase()) ||
        token.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search tokens, trends, or ask for AI suggestions..."
          className="w-full pl-10 pr-12 py-3 bg-gray-800/80 border border-green-800/50 rounded-lg text-green-400 placeholder-gray-500 focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-400 animate-spin" />
        )}
      </div>

      {/* Search Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 border border-green-800/50 rounded-lg shadow-lg backdrop-blur-sm z-50 max-h-80 overflow-y-auto">
          {searchQuery && searchResults.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-green-300 mb-2 px-2">Search Results</div>
              {searchResults.map((token, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onSelect(`${token.name} (${token.symbol})`);
                    setShowDropdown(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-700/50 rounded text-left"
                >
                  <div>
                    <div className="text-green-400 font-medium">{token.symbol}</div>
                    <div className="text-xs text-gray-400">{token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400">{token.price}</div>
                    <div className={`text-xs ${token.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searchQuery && (
            <div className="p-2">
              <div className="flex items-center text-xs text-green-300 mb-2 px-2">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending Tokens
              </div>
              {trendingTokens.slice(0, 5).map((token, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onSelect(`${token.name} trending token in cyberpunk style`);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-700/50 rounded text-left"
                >
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">#{token.rank}</span>
                    <div>
                      <div className="text-green-400 font-medium">{token.symbol}</div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400">{token.price}</div>
                    <div className={`text-xs ${token.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
