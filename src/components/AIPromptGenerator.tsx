"use client";

import React, { useState, useEffect } from 'react';
import { Lightbulb, Brain, ChevronDown, Loader2 } from 'lucide-react';

interface AIPromptGeneratorProps {
  onSuggestion: (suggestion: string) => void;
  currentPrompt: string;
  mode?: 'image' | 'edit' | 'video';
}

export const AIPromptGenerator: React.FC<AIPromptGeneratorProps> = ({
  onSuggestion,
  currentPrompt,
  mode = 'image'
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      // Mock Grok-4 reasoning for prompt suggestions
      await new Promise(resolve => setTimeout(resolve, 2000));

      const contextualSuggestions = {
        image: [
          "A cyberpunk portrait of a Solana validator node as a sentient being, glowing green circuit patterns, neon atmosphere",
          "Abstract representation of blockchain consensus mechanisms as flowing liquid metal sculptures",
          "Futuristic trading floor where AI agents negotiate DeFi protocols in a cosmic marketplace",
          "Ethereal visualization of smart contract execution paths as luminous neural networks",
          "Digital oracle transmitting price data through crystalline data streams in space",
          "Holographic NFT gallery floating in a decentralized metaverse dimension"
        ],
        edit: [
          "Transform into a holographic projection with quantum interference patterns",
          "Add cyberpunk augmentations - neon implants, digital overlays, matrix-style effects",
          "Convert to liquid mercury flowing through geometric blockchain structures",
          "Enhance with cosmic energy auras and particle effects surrounding the subject",
          "Apply glitch art distortions with data corruption artifacts",
          "Overlay with translucent circuit board patterns and flowing code streams"
        ],
        video: [
          "Camera slowly orbits around the subject while digital particles flow in spiral patterns",
          "Time-lapse of blockchain transactions materializing as glowing data streams",
          "Smooth zoom through layers of a decentralized network visualization",
          "Rhythmic pulsing of colors synchronized with market price movements",
          "Gentle rotation with cascading light effects revealing hidden dimensions",
          "Dynamic morphing between different states of digital consciousness"
        ]
      };

      const baseSuggestions = contextualSuggestions[mode] || contextualSuggestions.image;

      // Add contextual suggestions based on current prompt
      let enhancedSuggestions = [...baseSuggestions];

      if (currentPrompt.toLowerCase().includes('solana')) {
        enhancedSuggestions.unshift("Enhanced Solana-themed: " + currentPrompt + " with proof-of-history spirals and validator nodes");
      }

      if (currentPrompt.toLowerCase().includes('nft')) {
        enhancedSuggestions.unshift("NFT Collection style: " + currentPrompt + " with unique metadata traits and rarity indicators");
      }

      if (currentPrompt.toLowerCase().includes('ai') || currentPrompt.toLowerCase().includes('robot')) {
        enhancedSuggestions.unshift("AI Consciousness theme: " + currentPrompt + " with neural network patterns and digital awakening");
      }

      setSuggestions(enhancedSuggestions.slice(0, 6));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      // Fallback suggestions
      setSuggestions([
        "A mystical portal between digital and physical realms",
        "Geometric patterns inspired by blockchain architecture",
        "Ethereal beings made of pure data and light"
      ]);
      setShowSuggestions(true);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (currentPrompt && currentPrompt.length > 10) {
      const delayedGeneration = setTimeout(() => {
        generateSuggestions();
      }, 1000);
      return () => clearTimeout(delayedGeneration);
    }
  }, [currentPrompt, mode]);

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!showSuggestions || suggestions.length === 0) {
            generateSuggestions();
          } else {
            setShowSuggestions(!showSuggestions);
          }
        }}
        className="flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 px-4 py-2 rounded-lg transition-all transform hover:scale-105"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Lightbulb className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isGenerating ? 'Channeling Grok...' : 'AI Suggestions'}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
      </button>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 border border-purple-800/50 rounded-lg shadow-lg backdrop-blur-sm z-40 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center text-xs text-purple-300 mb-2 px-2">
              <Brain className="w-3 h-3 mr-1" />
              Grok-4 Reasoning Suggestions
            </div>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => {
                  onSuggestion(suggestion);
                  setShowSuggestions(false);
                }}
                className="w-full p-3 hover:bg-gray-700/50 rounded text-left transition-all group"
              >
                <div className="text-green-400 text-sm group-hover:text-green-300 leading-relaxed">
                  {suggestion}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
