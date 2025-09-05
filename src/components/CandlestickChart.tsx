'use client';

import { useState, useEffect, useRef } from 'react';
import { birdeyeAPI, type OHLCVCandle } from '@/lib/birdeye-api';
import { formatNumber, formatPrice } from '@/lib/utils';

interface CandlestickChartProps {
  tokenAddress: string;
  symbol?: string;
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  height?: number;
}

export default function CandlestickChart({ 
  tokenAddress, 
  symbol = 'TOKEN', 
  timeframe = '1h',
  height = 400 
}: CandlestickChartProps) {
  const [candles, setCandles] = useState<OHLCVCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<OHLCVCandle | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fetchCandles = async () => {
      try {
        setLoading(true);
        const response = await birdeyeAPI.getOHLCVCount(
          tokenAddress,
          100,
          timeframe
        );
        setCandles(response.items || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching OHLCV data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCandles, 30000);
    return () => clearInterval(interval);
  }, [tokenAddress, timeframe]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (error || candles.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-red-400">{error || 'No chart data available'}</div>
        </div>
      </div>
    );
  }

  // Calculate min and max prices for scaling
  const prices = candles.flatMap(c => [c.h, c.l]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  const chartWidth = 800;
  const chartHeight = height - 80; // Reserve space for labels
  const candleWidth = Math.max(2, (chartWidth - 40) / candles.length - 2);

  const scaleY = (price: number) => {
    return chartHeight - ((price - minPrice + padding) / (priceRange + 2 * padding)) * chartHeight;
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosition({ x: event.clientX, y: event.clientY });
    
    // Find the closest candle
    const candleIndex = Math.floor((x - 20) / (candleWidth + 2));
    if (candleIndex >= 0 && candleIndex < candles.length) {
      setHoveredCandle(candles[candleIndex]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    window.location.href = `?timeframe=${newTimeframe}`;
  };

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
  ];

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{symbol} Price Chart</h3>
          <p className="text-gray-400 text-sm">
            Current: {formatPrice(candles[candles.length - 1]?.c || 0)}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => handleTimeframeChange(tf.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeframe === tf.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          width={chartWidth}
          height={height}
          className="w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          viewBox={`0 0 ${chartWidth} ${height}`}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

          {/* Price labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const price = minPrice + ratio * priceRange;
            const y = scaleY(price);
            return (
              <g key={ratio}>
                <line
                  x1={20}
                  y1={y}
                  x2={chartWidth - 20}
                  y2={y}
                  stroke="#4B5563"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
                <text
                  x={chartWidth - 15}
                  y={y + 4}
                  fill="#9CA3AF"
                  fontSize="10"
                  textAnchor="end"
                >
                  {formatPrice(price)}
                </text>
              </g>
            );
          })}

          {/* Candlesticks */}
          {candles.map((candle, index) => {
            const x = 20 + index * (candleWidth + 2);
            const isGreen = candle.c >= candle.o;
            const color = isGreen ? '#10B981' : '#EF4444';
            
            const highY = scaleY(candle.h);
            const lowY = scaleY(candle.l);
            const openY = scaleY(candle.o);
            const closeY = scaleY(candle.c);
            
            const bodyTop = Math.min(openY, closeY);
            const bodyBottom = Math.max(openY, closeY);
            const bodyHeight = Math.max(1, bodyBottom - bodyTop);

            return (
              <g key={`${candle.unix_time}-${index}`}>
                {/* Wick */}
                <line
                  x1={x + candleWidth / 2}
                  y1={highY}
                  x2={x + candleWidth / 2}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1"
                />
                
                {/* Body */}
                <rect
                  x={x}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isGreen ? color : 'none'}
                  stroke={color}
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Volume bars */}
          {candles.length > 0 && (
            <g>
              {candles.map((candle, index) => {
                const maxVolume = Math.max(...candles.map(c => c.v));
                const volumeHeight = (candle.v / maxVolume) * 50;
                const x = 20 + index * (candleWidth + 2);
                const y = chartHeight + 30;
                const isGreen = candle.c >= candle.o;
                
                return (
                  <rect
                    key={`vol-${candle.unix_time}-${index}`}
                    x={x}
                    y={y - volumeHeight}
                    width={candleWidth}
                    height={volumeHeight}
                    fill={isGreen ? '#10B981' : '#EF4444'}
                    opacity="0.3"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredCandle && (
          <div
            className="fixed bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm z-50 pointer-events-none"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 100,
            }}
          >
            <div className="text-white font-medium mb-2">
              {new Date(hoveredCandle.unix_time * 1000).toLocaleString()}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between space-x-4">
                <span className="text-gray-400">Open:</span>
                <span className="text-white">{formatPrice(hoveredCandle.o)}</span>
              </div>
              <div className="flex justify-between space-x-4">
                <span className="text-gray-400">High:</span>
                <span className="text-green-400">{formatPrice(hoveredCandle.h)}</span>
              </div>
              <div className="flex justify-between space-x-4">
                <span className="text-gray-400">Low:</span>
                <span className="text-red-400">{formatPrice(hoveredCandle.l)}</span>
              </div>
              <div className="flex justify-between space-x-4">
                <span className="text-gray-400">Close:</span>
                <span className="text-white">{formatPrice(hoveredCandle.c)}</span>
              </div>
              <div className="flex justify-between space-x-4">
                <span className="text-gray-400">Volume:</span>
                <span className="text-white">{formatNumber(hoveredCandle.v)}</span>
              </div>
              {hoveredCandle.v_usd && (
                <div className="flex justify-between space-x-4">
                  <span className="text-gray-400">Volume USD:</span>
                  <span className="text-white">${formatNumber(hoveredCandle.v_usd)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
