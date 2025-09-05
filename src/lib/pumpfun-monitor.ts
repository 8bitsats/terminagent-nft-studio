import {
  Connection,
  ParsedTransactionWithMeta,
  PublicKey,
} from '@solana/web3.js';

// Types for Pump.fun transaction data
interface PumpFunTradeEvent {
  mint: string;
  solAmount: number;
  tokenAmount: number;
  isBuy: boolean;
  user: string;
  timestamp: number;
  virtualSolReserves: number;
  virtualTokenReserves: number;
}

interface TokenLaunch {
  tokenMint: string;
  creator: string;
  name?: string;
  symbol?: string;
  uri?: string;
  timestamp: number;
  signature: string;
}

interface TradeActivity {
  tokenMint: string;
  trader: string;
  isBuy: boolean;
  solAmount: number;
  tokenAmount: number;
  timestamp: number;
  signature: string;
  price: number;
}

class PumpFunMonitor {
  private connection: Connection;
  private pumpFunProgramId: PublicKey;
  private isMonitoring: boolean = false;
  private tokenLaunches: Map<string, TokenLaunch> = new Map();
  private recentTrades: TradeActivity[] = [];
  private maxTradeHistory: number = 1000;

  constructor(rpcUrl?: string, wsUrl?: string) {
    this.connection = new Connection(
      rpcUrl || process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com",
      {
        wsEndpoint: wsUrl || process.env.NEXT_PUBLIC_HELIUS_WS_URL || "wss://api.mainnet-beta.solana.com",
        commitment: "confirmed"
      }
    );
    this.pumpFunProgramId = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
  }

  // Start monitoring Pump.fun activity
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log("Monitor is already running");
      return;
    }

    this.isMonitoring = true;
    console.log("🚀 Starting Pump.fun Monitor");
    console.log(`📡 Monitoring program: ${this.pumpFunProgramId.toString()}`);

    try {
      // Monitor logs for all Pump.fun transactions
      this.connection.onLogs(
        this.pumpFunProgramId,
        async (logs, context) => {
          await this.handleLogUpdate(logs, context);
        },
        "confirmed"
      );

      console.log("✅ Monitor started successfully");
    } catch (error) {
      console.error("❌ Failed to start monitor:", error);
      this.isMonitoring = false;
    }
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log("🛑 Monitor stopped");
  }

  // Handle incoming log updates
  private async handleLogUpdate(logs: any, context: any): Promise<void> {
    try {
      if (!logs.logs || !logs.signature) return;

      const signature = logs.signature;
      
      // Check for new token launches
      if (this.isTokenLaunch(logs.logs)) {
        console.log(`🆕 New token launch detected: ${signature}`);
        await this.processTokenLaunch(signature);
      }
      
      // Check for trading activity
      if (this.isTradeActivity(logs.logs)) {
        console.log(`💰 Trade detected: ${signature}`);
        await this.processTradeActivity(signature);
      }

    } catch (error) {
      console.error("Error handling log update:", error);
    }
  }

  // Check if logs indicate a token launch
  private isTokenLaunch(logs: string[]): boolean {
    return logs.some(log => 
      log.includes("Program log: Instruction: InitializeMint2") ||
      log.includes("Program log: Instruction: Create")
    );
  }

  // Check if logs indicate trading activity
  private isTradeActivity(logs: string[]): boolean {
    return logs.some(log => 
      log.includes("Program log: Instruction: Buy") ||
      log.includes("Program log: Instruction: Sell") ||
      log.includes("TradeEvent")
    );
  }

  // Process token launch transaction
  private async processTokenLaunch(signature: string): Promise<void> {
    try {
      const transaction = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        console.log("❌ Could not fetch transaction");
        return;
      }

      const tokenLaunch = this.parseTokenLaunch(transaction, signature);
      if (tokenLaunch) {
        this.tokenLaunches.set(tokenLaunch.tokenMint, tokenLaunch);
        this.onTokenLaunch(tokenLaunch);
      }
    } catch (error) {
      console.error("Error processing token launch:", error);
    }
  }

  // Process trade activity transaction
  private async processTradeActivity(signature: string): Promise<void> {
    try {
      const transaction = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        console.log("❌ Could not fetch transaction");
        return;
      }

      const trade = this.parseTradeActivity(transaction, signature);
      if (trade) {
        this.recentTrades.push(trade);
        
        // Keep only recent trades
        if (this.recentTrades.length > this.maxTradeHistory) {
          this.recentTrades = this.recentTrades.slice(-this.maxTradeHistory);
        }
        
        this.onTradeActivity(trade);
      }
    } catch (error) {
      console.error("Error processing trade activity:", error);
    }
  }

  // Parse token launch from transaction
  private parseTokenLaunch(transaction: ParsedTransactionWithMeta, signature: string): TokenLaunch | null {
    try {
      if (!transaction.meta || !transaction.transaction) return null;

      // Look for token mint in transaction accounts
      const accounts = transaction.transaction.message.accountKeys;
      let tokenMint = "";
      let creator = "";

      // The first signer is typically the creator
      if (accounts.length > 0) {
        creator = accounts[0].pubkey.toString();
      }

      // Look for newly created mint account
      if (transaction.meta.postTokenBalances) {
        for (const balance of transaction.meta.postTokenBalances) {
          if (balance.mint) {
            tokenMint = balance.mint;
            break;
          }
        }
      }

      if (!tokenMint) {
        // Fallback: look in account keys for potential mint
        const mintAccount = accounts.find(acc => 
          acc.pubkey.toString().length === 44 && // Typical mint address length
          !acc.signer
        );
        if (mintAccount) {
          tokenMint = mintAccount.pubkey.toString();
        }
      }

      if (!tokenMint) return null;

      return {
        tokenMint,
        creator,
        timestamp: Date.now(),
        signature
      };
    } catch (error) {
      console.error("Error parsing token launch:", error);
      return null;
    }
  }

  // Parse trade activity from transaction
  private parseTradeActivity(transaction: ParsedTransactionWithMeta, signature: string): TradeActivity | null {
    try {
      if (!transaction.meta || !transaction.transaction) return null;

      const accounts = transaction.transaction.message.accountKeys;
      let trader = "";
      let tokenMint = "";
      let solAmount = 0;
      let tokenAmount = 0;
      let isBuy = false;

      // The first signer is typically the trader
      if (accounts.length > 0) {
        trader = accounts[0].pubkey.toString();
      }

      // Analyze SOL balance changes to determine trade direction and amount
      if (transaction.meta.preBalances && transaction.meta.postBalances) {
        const balanceChange = transaction.meta.postBalances[0] - transaction.meta.preBalances[0];
        solAmount = Math.abs(balanceChange) / 1e9; // Convert lamports to SOL
        isBuy = balanceChange < 0; // If SOL decreased, it's a buy
      }

      // Get token mint and amount from token balance changes
      if (transaction.meta.preTokenBalances && transaction.meta.postTokenBalances) {
        for (let i = 0; i < transaction.meta.postTokenBalances.length; i++) {
          const preBalance = transaction.meta.preTokenBalances.find(b => b.accountIndex === transaction.meta!.postTokenBalances![i].accountIndex);
          const postBalance = transaction.meta.postTokenBalances[i];
          
          if (preBalance && postBalance.mint) {
            const tokenChange = postBalance.uiTokenAmount.uiAmount! - (preBalance.uiTokenAmount.uiAmount || 0);
            if (Math.abs(tokenChange) > 0) {
              tokenMint = postBalance.mint;
              tokenAmount = Math.abs(tokenChange);
              break;
            }
          }
        }
      }

      if (!tokenMint || solAmount === 0) return null;

      const price = tokenAmount > 0 ? solAmount / tokenAmount : 0;

      return {
        tokenMint,
        trader,
        isBuy,
        solAmount,
        tokenAmount,
        timestamp: Date.now(),
        signature,
        price
      };
    } catch (error) {
      console.error("Error parsing trade activity:", error);
      return null;
    }
  }

  // Event handlers (override these for custom behavior)
  protected onTokenLaunch(launch: TokenLaunch): void {
    console.log("🚀 NEW TOKEN LAUNCH:");
    console.log(`  Token: ${launch.tokenMint}`);
    console.log(`  Creator: ${launch.creator}`);
    console.log(`  Signature: ${launch.signature}`);
    console.log(`  Time: ${new Date(launch.timestamp).toLocaleString()}`);
    console.log("─".repeat(60));
  }

  protected onTradeActivity(trade: TradeActivity): void {
    const action = trade.isBuy ? "BUY" : "SELL";
    const emoji = trade.isBuy ? "🟢" : "🔴";
    
    console.log(`${emoji} ${action} ACTIVITY:`);
    console.log(`  Token: ${trade.tokenMint}`);
    console.log(`  Trader: ${trade.trader}`);
    console.log(`  Amount: ${trade.tokenAmount.toLocaleString()} tokens`);
    console.log(`  SOL: ${trade.solAmount.toFixed(6)} SOL`);
    console.log(`  Price: ${trade.price.toFixed(9)} SOL per token`);
    console.log(`  Signature: ${trade.signature}`);
    console.log("─".repeat(60));
  }

  // Get statistics
  getStats(): any {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentTrades = this.recentTrades.filter(trade => now - trade.timestamp < oneHour);
    
    const buyVolume = recentTrades
      .filter(trade => trade.isBuy)
      .reduce((sum, trade) => sum + trade.solAmount, 0);
    
    const sellVolume = recentTrades
      .filter(trade => !trade.isBuy)
      .reduce((sum, trade) => sum + trade.solAmount, 0);

    return {
      totalTokensLaunched: this.tokenLaunches.size,
      totalTrades: this.recentTrades.length,
      recentTrades: recentTrades.length,
      hourlyBuyVolume: buyVolume,
      hourlySellVolume: sellVolume,
      totalHourlyVolume: buyVolume + sellVolume
    };
  }

  // Get recent launches
  getRecentLaunches(limit: number = 10): TokenLaunch[] {
    return Array.from(this.tokenLaunches.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Get recent trades for a specific token
  getTokenTrades(tokenMint: string, limit: number = 50): TradeActivity[] {
    return this.recentTrades
      .filter(trade => trade.tokenMint === tokenMint)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Public getter methods for React components
  public getTokenLaunches(): Map<string, TokenLaunch> {
    return this.tokenLaunches;
  }

  public getAllRecentTrades(): TradeActivity[] {
    return this.recentTrades;
  }

  public isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}

// Enhanced monitor with additional features
class EnhancedPumpFunMonitor extends PumpFunMonitor {
  private volumeThreshold: number;
  private priceChangeThreshold: number;

  constructor(rpcUrl?: string, wsUrl?: string, volumeThreshold: number = 1.0, priceChangeThreshold: number = 0.5) {
    super(rpcUrl, wsUrl);
    this.volumeThreshold = volumeThreshold;
    this.priceChangeThreshold = priceChangeThreshold;
  }

  protected onTradeActivity(trade: TradeActivity): void {
    super.onTradeActivity(trade);

    // Alert for high volume trades
    if (trade.solAmount >= this.volumeThreshold) {
      console.log(`🚨 HIGH VOLUME ALERT: ${trade.solAmount.toFixed(2)} SOL trade!`);
    }

    // Check for price movements (simplified)
    const recentTrades = this.getTokenTrades(trade.tokenMint, 10);
    if (recentTrades.length >= 2) {
      const previousPrice = recentTrades[1].price;
      const currentPrice = trade.price;
      const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;

      if (Math.abs(priceChange) >= this.priceChangeThreshold * 100) {
        const direction = priceChange > 0 ? "📈 UP" : "📉 DOWN";
        console.log(`${direction} PRICE MOVEMENT: ${Math.abs(priceChange).toFixed(2)}% change!`);
      }
    }
  }
}

// Export types and classes
export type { PumpFunTradeEvent, TokenLaunch, TradeActivity };
export { EnhancedPumpFunMonitor, PumpFunMonitor };

// Create a singleton instance for use across the application
export const pumpFunMonitor = new EnhancedPumpFunMonitor(
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
  process.env.NEXT_PUBLIC_HELIUS_WS_URL,
  2.0, // Alert for trades >= 2 SOL
  0.2  // Alert for price changes >= 20%
);
