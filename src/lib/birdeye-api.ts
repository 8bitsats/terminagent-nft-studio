const BIRDEYE_BASE_URL = 'https://public-api.birdeye.so';
const API_KEY = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY;

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL = 30000; // 30 seconds default TTL

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Rate limiting configuration
interface RateLimitConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultRateLimitConfig: RateLimitConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2
};

export interface TrendingToken {
  address: string;
  decimals: number;
  liquidity: number;
  logoURI: string;
  name: string;
  symbol: string;
  volume24hUSD: number;
  volume24hChangePercent: number;
  rank: number;
  price: number;
  price24hChangePercent: number;
  fdv: number;
  marketcap: number;
}

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  extensions?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    description?: string;
  };
  logo_uri?: string;
}

export interface TokenMarketData {
  address: string;
  price: number;
  liquidity: number;
  total_supply: number;
  circulating_supply: number;
  fdv: number;
  market_cap: number;
}

export interface TokenOverview {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  marketCap: number;
  fdv: number;
  logoURI: string;
  liquidity: number;
  lastTradeUnixTime: number;
  price: number;
  priceChange1hPercent: number;
  priceChange24hPercent: number;
  volume24hUSD: number;
  volume24hChangePercent: number;
}

export interface Trade {
  txHash: string;
  blockUnixTime: number;
  source: string;
  txType: string;
  from: {
    symbol: string;
    decimals: number;
    address: string;
    amount: string;
    uiAmount: number;
    price: number;
  };
  to: {
    symbol: string;
    decimals: number;
    address: string;
    amount: string;
    uiAmount: number;
    price: number;
  };
  volumeUSD: number;
}

export interface PriceData {
  value: number;
  updateUnixTime: number;
  updateHumanTime: string;
  priceChange24h: number;
  liquidity?: number;
}

export interface MemeToken {
  address: string;
  symbol: string;
  name: string;
  image_uri: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  created_at: number;
  updated_at: number;
  market_cap?: number;
  price?: number;
  price_change_24h?: number;
  volume_24h?: number;
  liquidity?: number;
  source: string;
  is_trending?: boolean;
  rank?: number;
  token_type: string;
  decimals: number;
}

export interface MemeTokenDetail extends MemeToken {
  total_supply?: number;
  circulating_supply?: number;
  fdv?: number;
  holder_count?: number;
  creator_address?: string;
  launch_price?: number;
  ath?: number;
  atl?: number;
  social_links?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  metadata?: {
    description?: string;
    attributes?: unknown[];
  };
}

export interface MemeTokenListResponse {
  tokens: MemeToken[];
  total: number;
  has_next: boolean;
}

export interface OHLCVCandle {
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  v_usd?: number; // volume in USD
  unix_time: number;
  address: string;
  type: string;
  currency: string;
}

export interface OHLCVResponse {
  is_scaled_ui_token?: boolean;
  items: OHLCVCandle[];
}

export interface WalletNetWorth {
  wallet_address: string;
  currency: string;
  total_value: string;
  current_timestamp: string;
  items: WalletToken[];
}

export interface WalletToken {
  address: string;
  decimals: number;
  price: number;
  balance: string;
  amount: number;
  network: string;
  name: string;
  symbol: string;
  logo_uri: string;
  value: string;
}

export interface WalletNetWorthHistory {
  timestamp: string;
  net_worth: number;
  net_worth_change: number;
  net_worth_change_percent: number;
}

export interface WalletPnL {
  meta: {
    address: string;
    currency: string;
    holding_check: boolean;
    time: string;
  };
  tokens: Record<string, {
    symbol: string;
    decimals: number;
    counts: {
      total_buy: number;
      total_sell: number;
      total_trade: number;
    };
    quantity: {
      total_bought_amount: number;
      total_sold_amount: number;
      holding: number;
    };
    cashflow_usd: {
      cost_of_quantity_sold: number;
      total_invested: number;
      total_sold: number;
      current_value: number;
    };
    pnl: {
      realized_profit_usd: number;
      realized_profit_percent: number;
      unrealized_usd: number;
      unrealized_percent: number;
      total_usd: number;
      total_percent: number;
      avg_profit_per_trade_usd: number;
    };
    pricing: {
      current_price: number;
      avg_buy_cost: number;
      avg_sell_cost: number;
    };
  }>;
}

class BirdeyeAPI {
  private baseUrl = BIRDEYE_BASE_URL;
  private apiKey = API_KEY;
  private cache = new RequestCache();
  private rateLimitConfig = defaultRateLimitConfig;

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(endpoint: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, unknown>);
    
    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  private calculateBackoffDelay(attempt: number): number {
    const delay = this.rateLimitConfig.baseDelay * (this.rateLimitConfig.backoffMultiplier ** attempt);
    return Math.min(delay, this.rateLimitConfig.maxDelay);
  }

  private async request<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache first
    const cachedData = this.cache.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add query parameters
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    }

    const headers: Record<string, string> = {
      'accept': 'application/json',
      'x-chain': 'solana',
    };

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    // Implement retry logic with exponential backoff
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.rateLimitConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString(), { headers });

        if (response.ok) {
          const data = await response.json();
          
          // Cache successful responses with different TTLs based on endpoint
          let cacheTTL = 30000; // Default 30 seconds
          if (endpoint.includes('trending') || endpoint.includes('meme')) {
            cacheTTL = 60000; // 1 minute for trending/meme data
          } else if (endpoint.includes('price')) {
            cacheTTL = 15000; // 15 seconds for price data
          } else if (endpoint.includes('ohlcv')) {
            cacheTTL = 120000; // 2 minutes for OHLCV data
          }
          
          this.cache.set(cacheKey, data, cacheTTL);
          return data;
        }

        // Handle rate limiting (429) with exponential backoff
        if (response.status === 429) {
          if (attempt < this.rateLimitConfig.maxRetries) {
            const delay = this.calculateBackoffDelay(attempt);
            console.warn(`Rate limited (429). Retrying in ${delay}ms... (attempt ${attempt + 1}/${this.rateLimitConfig.maxRetries + 1})`);
            await this.sleep(delay);
            continue;
          }
        }

        // Handle other HTTP errors
        const errorMessage = `Birdeye API error: ${response.status} ${response.statusText}`;
        lastError = new Error(errorMessage);
        
        // Don't retry on client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw lastError;
        }
        
        // Retry on server errors (5xx)
        if (attempt < this.rateLimitConfig.maxRetries && response.status >= 500) {
          const delay = this.calculateBackoffDelay(attempt);
          console.warn(`Server error (${response.status}). Retrying in ${delay}ms... (attempt ${attempt + 1}/${this.rateLimitConfig.maxRetries + 1})`);
          await this.sleep(delay);
          continue;
        }

        throw lastError;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on network errors beyond max attempts
        if (attempt >= this.rateLimitConfig.maxRetries) {
          break;
        }
        
        const delay = this.calculateBackoffDelay(attempt);
        console.warn(`Request failed. Retrying in ${delay}ms... (attempt ${attempt + 1}/${this.rateLimitConfig.maxRetries + 1})`);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  async getTrendingTokens(limit = 20): Promise<{ tokens: TrendingToken[] }> {
    const response = await this.request<{ success: boolean; data: { tokens: TrendingToken[] } }>('/defi/token_trending', {
      sort_by: 'rank',
      sort_type: 'asc',
      offset: 0,
      limit,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  async getTokenMetadata(address: string): Promise<TokenMetadata> {
    const response = await this.request<{ success: boolean; data: TokenMetadata }>('/defi/v3/token/meta-data/single', {
      address
    });
    return response.data;
  }

  async getTokenMarketData(address: string): Promise<TokenMarketData> {
    const response = await this.request<{ success: boolean; data: TokenMarketData }>('/defi/v3/token/market-data', {
      address,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  async getTokenOverview(address: string): Promise<TokenOverview> {
    const response = await this.request<{ success: boolean; data: TokenOverview }>('/defi/token_overview', {
      address,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  async getTokenTrades(address: string, limit = 50): Promise<{ items: Trade[] }> {
    const response = await this.request<{ success: boolean; data: { items: Trade[] } }>('/defi/txs/token', {
      address,
      offset: 0,
      limit,
      tx_type: 'swap',
      sort_type: 'desc',
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  async getTokenPrice(address: string): Promise<PriceData> {
    const response = await this.request<{ success: boolean; data: PriceData }>('/defi/price', {
      address,
      include_liquidity: true,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  async getMultipleTokenPrices(addresses: string[]): Promise<Record<string, PriceData>> {
    const response = await this.request<{ success: boolean; data: Record<string, PriceData> }>('/defi/multi_price', {
      list_address: addresses.join(','),
      include_liquidity: true,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  async searchTokens(keyword: string, limit = 20): Promise<{ items: unknown[] }> {
    const response = await this.request<{ success: boolean; data: { items: unknown[] } }>('/defi/v3/search', {
      keyword,
      target: 'token',
      search_mode: 'fuzzy',
      search_by: 'combination',
      sort_by: 'volume_24h_usd',
      sort_type: 'desc',
      offset: 0,
      limit,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  async getOHLCV(address: string, timeFrom: number, timeTo: number, type = '1h'): Promise<{ items: unknown[] }> {
    const response = await this.request<{ success: boolean; data: { items: unknown[] } }>('/defi/ohlcv', {
      address,
      type,
      currency: 'usd',
      time_from: timeFrom,
      time_to: timeTo,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  // Meme Token API Methods
  async getMemeTokens(
    limit = 20,
    offset = 0,
    sortBy: 'created_at' | 'market_cap' | 'volume_24h' | 'price_change_24h' = 'created_at',
    sortType: 'asc' | 'desc' = 'desc',
    source?: 'pump.fun' | 'moonshot' | 'jupiter',
    minMarketCap?: number,
    maxMarketCap?: number
  ): Promise<MemeTokenListResponse> {
    const params: Record<string, unknown> = {
      limit,
      offset,
      sort_by: sortBy,
      sort_type: sortType,
      ui_amount_mode: 'scaled'
    };

    if (source) params.source = source;
    if (minMarketCap) params.min_market_cap = minMarketCap;
    if (maxMarketCap) params.max_market_cap = maxMarketCap;

    const response = await this.request<{ success: boolean; data: MemeTokenListResponse }>('/defi/v3/token/meme/list', params);
    return response.data;
  }

  async getMemeTokenDetail(address: string): Promise<MemeTokenDetail> {
    const response = await this.request<{ success: boolean; data: MemeTokenDetail }>('/defi/v3/token/meme/detail/single', {
      address,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  async getTrendingMemeTokens(limit = 20): Promise<MemeTokenListResponse> {
    return this.getMemeTokens(limit, 0, 'volume_24h', 'desc');
  }

  async getNewMemeTokens(limit = 20): Promise<MemeTokenListResponse> {
    return this.getMemeTokens(limit, 0, 'created_at', 'desc');
  }

  async getPumpFunTokens(limit = 20): Promise<MemeTokenListResponse> {
    return this.getMemeTokens(limit, 0, 'created_at', 'desc', 'pump.fun');
  }

  async getMoonshotTokens(limit = 20): Promise<MemeTokenListResponse> {
    return this.getMemeTokens(limit, 0, 'created_at', 'desc', 'moonshot');
  }

  // OHLCV API Methods
  async getOHLCVV3(
    address: string,
    timeFrom: number,
    timeTo: number,
    type: '1s' | '15s' | '30s' | '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M' = '1h',
    currency: 'usd' | 'native' = 'usd'
  ): Promise<OHLCVResponse> {
    const response = await this.request<{ success: boolean; data: OHLCVResponse }>('/defi/v3/ohlcv', {
      address,
      type,
      currency,
      time_from: timeFrom,
      time_to: timeTo,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  async getOHLCVCount(
    address: string,
    count = 100,
    type: '1s' | '15s' | '30s' | '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M' = '1h',
    currency: 'usd' | 'native' = 'usd'
  ): Promise<OHLCVResponse> {
    const response = await this.request<{ success: boolean; data: OHLCVResponse }>('/defi/v3/ohlcv', {
      address,
      type,
      currency,
      mode: 'count',
      count_limit: count,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  // Wallet API Methods
  async getWalletNetWorth(wallet: string): Promise<WalletNetWorth> {
    const response = await this.request<{ success: boolean; data: WalletNetWorth }>('/wallet/v2/current-net-worth', {
      wallet,
      sort_by: 'value',
      sort_type: 'desc',
      limit: 100,
      offset: 0
    });
    return response.data;
  }

  async getWalletNetWorthHistory(
    wallet: string,
    count = 7,
    type: '1h' | '1d' = '1d',
    direction: 'back' | 'forward' = 'back'
  ): Promise<{ wallet_address: string; history: WalletNetWorthHistory[] }> {
    const response = await this.request<{ 
      success: boolean; 
      data: { wallet_address: string; history: WalletNetWorthHistory[] } 
    }>('/wallet/v2/net-worth', {
      wallet,
      count,
      direction,
      type,
      sort_type: 'desc'
    });
    return response.data;
  }

  async getWalletPnL(wallet: string, tokenAddresses: string[]): Promise<WalletPnL> {
    const response = await this.request<{ success: boolean; data: WalletPnL }>('/wallet/v2/pnl', {
      wallet,
      token_addresses: tokenAddresses.join(',')
    });
    return response.data;
  }

  async getWalletTokenBalance(wallet: string, tokenAddress: string): Promise<WalletToken> {
    const response = await this.request<{ success: boolean; data: WalletToken }>('/v1/wallet/token_balance', {
      wallet,
      token_address: tokenAddress,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }

  async getWalletPortfolio(wallet: string): Promise<{ items: WalletToken[] }> {
    const response = await this.request<{ success: boolean; data: { items: WalletToken[] } }>('/v1/wallet/token_list', {
      wallet,
      ui_amount_mode: 'scaled'
    });
    return response.data;
  }
}

export const birdeyeAPI = new BirdeyeAPI();
