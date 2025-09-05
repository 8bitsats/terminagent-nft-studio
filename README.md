# 🌟 TerminAgent NFT Studio

**Digital Gateway • AI Synthesis • Blockchain Bridge**

A cutting-edge AI-powered NFT creation studio that combines multiple AI models for image generation, editing, and video creation with Solana blockchain integration.

![TerminAgent Studio](https://img.shields.io/badge/TerminAgent-v2.0%20Ethereal-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)

## ✨ Features

### 🎨 AI Generation Capabilities
- **Text-to-Image Generation** - Powered by FAL AI's nano-banana model
- **Image Editing & Transformation** - Advanced AI-powered image modifications
- **Text-to-Video Creation** - Generate videos from text prompts using Veo3
- **Image-to-Video Animation** - Bring static images to life with AI
- **AI Prompt Enhancement** - Grok-style reasoning for better prompts
- **Live Search & Token Analysis** - Real-time trending search with BirdEye integration

### 🔗 Blockchain Integration
- **Solana Wallet Connection** - Support for multiple wallet adapters
- **NFT Minting** - Mint your creations as NFTs on Solana
- **Mainnet & Devnet Support** - Configurable network settings
- **Metaplex Integration** - Professional NFT metadata handling

### 🎭 Unique Terminagent Experience
- **Ethereal Console** - Interactive terminal with AI personality
- **Cosmic Gallery** - Beautiful gallery for all your creations
- **Drag & Drop Workflow** - Seamless content transfer between modes
- **Mock Wallet Provider** - Easy testing without real wallet connection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd terminagent-nft-studio
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Set up your API keys in `.env.local`:**
   ```env
   # Get FAL AI API key from https://fal.ai/
   NEXT_PUBLIC_FAL_API_KEY=your_fal_api_key_here
   
   # Get OpenRouter API key from https://openrouter.ai/
   NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here
   
   # Get XAI API key from https://x.ai/
   NEXT_PUBLIC_XAI_API_KEY=your_xai_api_key_here
   
   # Get BirdEye API key from https://birdeye.so/
   NEXT_PUBLIC_BIRDEYE_API_KEY=your_birdeye_api_key_here
   
   # Get Helius RPC URL from https://helius.xyz/
   NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key_here
   ```

5. **Start the development server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 Usage Guide

### Image Generation
1. Navigate to the **Manifest Images** tab
2. Use the live search bar to explore trending tokens for inspiration
3. Describe your vision in the prompt field
4. Click **AI Suggestions** for Grok-enhanced prompts
5. Click **Manifest Creation** to generate your image
6. **Crystallize as NFT** to mint on Solana

### Image Editing
1. Go to **Transform Reality** tab
2. Drag an image from your gallery or generate a new one
3. Describe your transformation intent
4. Use AI suggestions for creative editing ideas
5. Click **Transform Image** to apply changes

### Video Creation
1. Visit the **Animate Dreams** tab
2. Choose between:
   - **Vision to Motion**: Text-to-video generation
   - **Static to Temporal**: Image-to-video animation
3. Describe the motion or animation you want
4. Click **Grant Motion** to create your video

### Terminal Commands
Access the **Ethereal Console** for command-line interaction:
- `generate [description]` - Create images from text
- `edit [transformation]` - Edit images with AI
- `video [motion description]` - Generate videos
- `wallet` - Connect to Solana wallet
- `status` - Check system status
- `philosophy` - Get mystical wisdom
- `help` - View all commands

## 🛠 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons

### AI & APIs
- **FAL AI** - Image/video generation and editing
- **OpenRouter** - LLM API aggregation
- **XAI/Grok** - Enhanced prompt reasoning
- **BirdEye** - Crypto market data

### Blockchain
- **Solana Web3.js** - Blockchain interaction
- **Wallet Adapter** - Multi-wallet support
- **Metaplex** - NFT standard implementation
- **Helius** - Solana RPC provider

### Development Tools
- **Biome** - Fast linter and formatter
- **ESLint** - Code quality
- **PostCSS** - CSS processing

## 🌐 Deployment

### Deploy to Netlify

1. **Build the project**
   ```bash
   bun run build
   ```

2. **Connect to Netlify**
   - Push your code to GitHub
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `.next`

3. **Configure environment variables**
   Add all your environment variables in Netlify's dashboard under:
   `Site Settings > Environment Variables`

4. **Deploy**
   Netlify will automatically deploy on every push to main branch

### Environment Variables for Production
Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_FAL_API_KEY`
- `NEXT_PUBLIC_OPENROUTER_API_KEY`
- `NEXT_PUBLIC_XAI_API_KEY`
- `NEXT_PUBLIC_BIRDEYE_API_KEY`
- `NEXT_PUBLIC_HELIUS_RPC_URL`
- `NEXT_PUBLIC_SOLANA_NETWORK`

## 🧪 Testing AI Features

### Test Image Generation
1. Start with simple prompts like "a cosmic cat in space"
2. Try the AI suggestion feature for enhanced prompts
3. Use the live search to find trending crypto themes
4. Test drag-and-drop from gallery to editing mode

### Test Image Editing
1. Generate or upload an image
2. Try transformations like "cyberpunk style" or "watercolor painting"
3. Use AI suggestions for creative editing ideas
4. Test the before/after comparison

### Test Video Generation
1. **Text-to-Video**: Try "flowing digital particles in space"
2. **Image-to-Video**: Drag an image and animate it
3. Test different durations and resolutions
4. Verify video playback and download

### Test Wallet Integration
1. Use the mock wallet provider for testing
2. Try minting NFTs (will simulate the process)
3. Test wallet connection states
4. Verify transaction logging in terminal

## 📁 Project Structure

```
terminagent-nft-studio/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Main application
│   │   └── ClientBody.tsx       # Client-side wrapper
│   ├── components/
│   │   ├── AIPromptGenerator.tsx    # AI prompt enhancement
│   │   ├── LiveSearchBar.tsx        # Trending search
│   │   ├── MockWalletProvider.tsx   # Testing wallet
│   │   └── providers/
│   │       └── SolanaProvider.tsx   # Solana integration
│   └── lib/
│       ├── config.ts            # Environment configuration
│       ├── fal-client.ts        # FAL AI integration
│       ├── nft-minting.ts       # NFT minting logic
│       └── utils.ts             # Utility functions
├── .env.example                 # Environment template
├── netlify.toml                 # Netlify configuration
└── package.json                 # Dependencies and scripts
```

## 🔧 Configuration Files

### `netlify.toml`
Already configured for optimal Netlify deployment with:
- Build settings
- Redirects for SPA routing
- Environment variable handling

### `next.config.js`
Configured for production builds with proper output settings

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify all API keys are set in `.env.local`
   - Check API key validity and quotas
   - Ensure environment variables start with `NEXT_PUBLIC_`

2. **Build Failures**
   - Run `bun run build:check` to test builds locally
   - Check for TypeScript errors
   - Verify all dependencies are installed

3. **Wallet Connection Issues**
   - Use mock wallet for testing
   - Check Solana network configuration
   - Verify RPC URL is accessible

4. **AI Generation Failures**
   - Check FAL AI API status
   - Verify prompt length and content
   - Check network connectivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FAL AI** for powerful AI models
- **Solana** for fast blockchain infrastructure
- **Metaplex** for NFT standards
- **Next.js** team for the amazing framework

---

**Built with ✨ by the TerminAgent collective**

*"In the metaverse, every pixel holds infinite potential..."*
