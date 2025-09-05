import OpenAI from 'openai';

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || 'moonshotai/kimi-k2-0905';

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
  defaultHeaders: {
    "HTTP-Referer": "https://terminagent-nft-studio.netlify.app", // Site URL for rankings
    "X-Title": "TerminAgent NFT Studio", // Site title for rankings
  },
});

export interface TokenAnalysis {
  summary: string;
  riskScore: number; // 1-10 scale (1 = very low risk, 10 = very high risk)
  sentiment: 'bullish' | 'bearish' | 'neutral';
  keyInsights: string[];
  recommendation: 'buy' | 'sell' | 'hold' | 'avoid';
  confidenceLevel: number; // 1-100 percentage
}

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap?: number;
  liquidity?: number;
  holders?: number;
  trades24h?: number;
  source?: string;
  security?: {
    isTrueToken?: boolean;
    freezeable?: boolean;
    mutableMetadata?: boolean;
    top10HolderPercent?: number;
  };
}

class TokenAnalysisService {
  private cache = new Map<string, { analysis: TokenAnalysis; timestamp: number }>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes cache

  private buildAnalysisPrompt(tokenData: TokenData): string {
    return `Analyze this Solana token and provide a comprehensive risk assessment:

Token Details:
- Symbol: ${tokenData.symbol}
- Name: ${tokenData.name}
- Address: ${tokenData.address}
- Current Price: $${tokenData.price}
- 24h Price Change: ${tokenData.priceChange24h?.toFixed(2)}%
- 24h Volume: $${tokenData.volume24h?.toLocaleString()}
${tokenData.marketCap ? `- Market Cap: $${tokenData.marketCap.toLocaleString()}` : ''}
${tokenData.liquidity ? `- Liquidity: $${tokenData.liquidity.toLocaleString()}` : ''}
${tokenData.holders ? `- Holders: ${tokenData.holders.toLocaleString()}` : ''}
${tokenData.trades24h ? `- 24h Trades: ${tokenData.trades24h.toLocaleString()}` : ''}
${tokenData.source ? `- Source/Platform: ${tokenData.source}` : ''}

Security Information:
${tokenData.security?.isTrueToken !== undefined ? `- Is True Token: ${tokenData.security.isTrueToken}` : ''}
${tokenData.security?.freezeable !== undefined ? `- Freezeable: ${tokenData.security.freezeable}` : ''}
${tokenData.security?.mutableMetadata !== undefined ? `- Mutable Metadata: ${tokenData.security.mutableMetadata}` : ''}
${tokenData.security?.top10HolderPercent !== undefined ? `- Top 10 Holders Control: ${(tokenData.security.top10HolderPercent * 100).toFixed(2)}%` : ''}

Please provide:
1. A concise 2-3 sentence summary of this token
2. Risk score (1-10, where 1=very low risk, 10=very high risk)
3. Market sentiment (bullish/bearish/neutral)
4. 3-5 key insights or red flags
5. Investment recommendation (buy/sell/hold/avoid)
6. Confidence level (1-100%)

Consider factors like:
- Price volatility and momentum
- Trading volume vs market cap ratio
- Liquidity depth
- Holder distribution concentration
- Security features and potential risks
- Platform source credibility
- Overall market conditions for meme/new tokens

Respond in this exact JSON format:
{
  "summary": "Brief 2-3 sentence analysis",
  "riskScore": 5,
  "sentiment": "neutral",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "recommendation": "hold",
  "confidenceLevel": 75
}`;
  }

  async analyzeToken(tokenData: TokenData): Promise<TokenAnalysis | null> {
    try {
      // Check cache first
      const cacheKey = `${tokenData.address}_${Math.floor(Date.now() / this.cacheTTL)}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.analysis;
      }

      if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
        console.warn('OpenRouter API key not configured');
        return null;
      }

      const completion = await openai.chat.completions.create({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a professional cryptocurrency analyst with expertise in Solana tokens, DeFi, and risk assessment. Provide accurate, data-driven analysis based on the metrics provided. Always respond in valid JSON format."
          },
          {
            role: "user",
            content: this.buildAnalysisPrompt(tokenData)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenRouter');
      }

      // Parse JSON response
      let analysis: TokenAnalysis;
      try {
        analysis = JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse OpenRouter response:', response);
        throw new Error('Invalid JSON response from AI model');
      }

      // Validate response structure
      if (!analysis.summary || !analysis.keyInsights || !Array.isArray(analysis.keyInsights)) {
        throw new Error('Invalid response structure from AI model');
      }

      // Cache the result
      this.cache.set(cacheKey, { analysis, timestamp: Date.now() });

      // Clean old cache entries
      this.cleanCache();

      return analysis;
    } catch (error) {
      console.error('Token analysis error:', error);
      return null;
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }

  // Bulk analyze multiple tokens
  async analyzeTokens(tokens: TokenData[]): Promise<Map<string, TokenAnalysis | null>> {
    const results = new Map<string, TokenAnalysis | null>();
    
    // Process tokens in batches to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const batchPromises = batch.map(async (token) => {
        const analysis = await this.analyzeToken(token);
        return { address: token.address, analysis };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.set(result.value.address, result.value.analysis);
        }
      }

      // Small delay between batches
      if (i + batchSize < tokens.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Get cached analysis without making new API call
  getCachedAnalysis(tokenAddress: string): TokenAnalysis | null {
    const cacheKey = `${tokenAddress}_${Math.floor(Date.now() / this.cacheTTL)}`;
    const cached = this.cache.get(cacheKey);
    return cached && Date.now() - cached.timestamp < this.cacheTTL ? cached.analysis : null;
  }

  // Clear all cached analyses
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export const tokenAnalysisService = new TokenAnalysisService();
export default tokenAnalysisService;
