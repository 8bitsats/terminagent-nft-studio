export const CONFIG = {
  OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.NEXT_PUBLIC_OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
  FAL_API_KEY: process.env.NEXT_PUBLIC_FAL_API_KEY || '',
  XAI_API_KEY: process.env.NEXT_PUBLIC_XAI_API_KEY || '',
  BIRDEYE_API_KEY: process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || '',
  FAL_MODEL: process.env.NEXT_PUBLIC_FAL_MODEL || 'fal-ai/nano-banana',
  FAL_MODEL2: process.env.NEXT_PUBLIC_FAL_MODEL2 || 'fal-ai/nano-banana/edit',
  FAL_VIDEO_MODEL: process.env.NEXT_PUBLIC_FAL_VIDEO_MODEL || 'fal-ai/veo3',
  FAL_VIDEO_MODEL2: process.env.NEXT_PUBLIC_FAL_VIDEO_MODEL2 || 'fal-ai/veo3/fast/image-to-video',
  HELIUS_RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=your-key',
  SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
} as const;
