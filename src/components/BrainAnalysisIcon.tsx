'use client';

import type React from 'react';
import {
  useCallback,
  useState,
} from 'react';

import {
  AlertTriangle,
  Brain,
  Loader2,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import type {
  TokenAnalysis,
  TokenData,
} from '../lib/openrouter-client';
import { tokenAnalysisService } from '../lib/openrouter-client';

interface BrainAnalysisIconProps {
  tokenData: TokenData;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface AnalysisTooltipProps {
  analysis: TokenAnalysis;
  isVisible: boolean;
  onClose: () => void;
}

const AnalysisTooltip: React.FC<AnalysisTooltipProps> = ({ analysis, isVisible, onClose }) => {
  if (!isVisible) return null;

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 3) return 'text-green-400';
    if (riskScore <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy':
        return 'text-green-400 bg-green-400/10';
      case 'sell':
        return 'text-red-400 bg-red-400/10';
      case 'hold':
        return 'text-blue-400 bg-blue-400/10';
      case 'avoid':
        return 'text-red-600 bg-red-600/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Summary */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Summary</h4>
            <p className="text-sm text-gray-100">{analysis.summary}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-400">Risk Score</span>
              </div>
              <span className={`text-lg font-bold ${getRiskColor(analysis.riskScore)}`}>
                {analysis.riskScore}/10
              </span>
            </div>

            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {getSentimentIcon(analysis.sentiment)}
                <span className="text-xs text-gray-400">Sentiment</span>
              </div>
              <span className="text-lg font-bold text-white capitalize">
                {analysis.sentiment}
              </span>
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Recommendation</h4>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide ${getRecommendationColor(analysis.recommendation)}`}>
              {analysis.recommendation}
            </span>
            <span className="ml-2 text-xs text-gray-400">
              ({analysis.confidenceLevel}% confidence)
            </span>
          </div>

          {/* Key Insights */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Key Insights</h4>
            <ul className="space-y-1">
              {analysis.keyInsights.map((insight) => (
                <li key={insight} className="text-sm text-gray-100 flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BrainAnalysisIcon: React.FC<BrainAnalysisIconProps> = ({ 
  tokenData, 
  size = 'md', 
  className = '' 
}) => {
  const [analysis, setAnalysis] = useState<TokenAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check for cached analysis first
    const cachedAnalysis = tokenAnalysisService.getCachedAnalysis(tokenData.address);
    if (cachedAnalysis) {
      setAnalysis(cachedAnalysis);
      setShowTooltip(true);
      return;
    }

    // If no cached analysis, fetch new one
    setIsLoading(true);
    setError(null);

    try {
      const newAnalysis = await tokenAnalysisService.analyzeToken(tokenData);
      if (newAnalysis) {
        setAnalysis(newAnalysis);
        setShowTooltip(true);
      } else {
        setError('Analysis not available. Please check your OpenRouter API key.');
      }
    } catch (err) {
      console.error('Failed to analyze token:', err);
      setError('Failed to analyze token. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [tokenData]);

  const handleCloseTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Get cached analysis to show icon state
  const cachedAnalysis = tokenAnalysisService.getCachedAnalysis(tokenData.address);
  const hasAnalysis = cachedAnalysis || analysis;

  const getIconColor = () => {
    if (isLoading) return 'text-blue-400 animate-pulse';
    if (error) return 'text-red-400';
    if (hasAnalysis) {
      const riskScore = hasAnalysis.riskScore;
      if (riskScore <= 3) return 'text-green-400';
      if (riskScore <= 6) return 'text-yellow-400';
      return 'text-red-400';
    }
    return 'text-gray-400 hover:text-purple-400';
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`${sizeClasses[size]} ${getIconColor()} transition-colors cursor-pointer hover:scale-110 transform ${className}`}
        title={error || (hasAnalysis ? 'View AI Analysis' : 'Get AI Analysis')}
      >
        {isLoading ? (
          <Loader2 className={`${sizeClasses[size]} animate-spin`} />
        ) : (
          <Brain className={sizeClasses[size]} />
        )}
      </button>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded-lg shadow-lg z-40">
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-100 ml-2"
          >
            ×
          </button>
        </div>
      )}

      {analysis && (
        <AnalysisTooltip
          analysis={analysis}
          isVisible={showTooltip}
          onClose={handleCloseTooltip}
        />
      )}
    </>
  );
};

export default BrainAnalysisIcon;
