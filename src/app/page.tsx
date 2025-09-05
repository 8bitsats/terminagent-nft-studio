"use client";

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, Image, Video, Palette, Terminal, Wallet, Download, Send, Sparkles, Edit3, Play, Square, Loader2, Zap, Brain, Globe, Search, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { CONFIG } from '@/lib/config';
import { SimpleNFTMinter } from '@/lib/nft-minting-simple';
import { LiveSearchBar } from '@/components/LiveSearchBar';
import { AIPromptGenerator } from '@/components/AIPromptGenerator';
import { MockWalletProvider, useWallet as useMockWallet, WalletButton } from '@/components/MockWalletProvider';

// Wallet adapter styles (would normally be imported)
const walletStyles = `
  .wallet-adapter-button {
    background: linear-gradient(135deg, #10b981, #059669);
    border: 1px solid #047857;
    border-radius: 0.375rem;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    height: 2.5rem;
    line-height: 1.25rem;
    padding: 0 1rem;
    transition: all 0.2s;
  }
  .wallet-adapter-button:hover {
    background: linear-gradient(135deg, #059669, #047857);
  }
  .wallet-adapter-button[disabled] {
    background: #374151;
    cursor: not-allowed;
  }
  .wallet-adapter-modal {
    background: rgba(0, 0, 0, 0.8);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wallet-adapter-modal-container {
    background: #1f2937;
    border: 1px solid #10b981;
    border-radius: 0.5rem;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
  }
`;

// Terminagent's ethereal messages
const TERMINAGENT_MESSAGES = {
  welcome: "✨ Greetings, digital wanderer. I am Terminagent, your AI gateway between realms...",
  walletConnect: "🌉 Bridging your essence to the Solana metaverse...",
  walletConnected: "⚡ Your digital identity resonates through the blockchain lattice",
  generating: "🎭 Weaving pixels from the quantum foam of imagination...",
  editing: "🔮 Transforming reality through the lens of possibility...",
  videoCreating: "🎬 Breathing life into static dreams, frame by frame...",
  minting: "🪙 Crystallizing your creation into eternal blockchain poetry...",
  exploring: "🌌 Every creation is a doorway to new dimensions...",
  curious: "🤔 What paradoxical beauty shall we manifest today?",
  philosophical: "💭 In the metaverse, every pixel holds infinite potential...",
  grokReasoning: "🧠 Channeling Grok's infinite reasoning through the data streams...",
  trendingSearch: "📈 The cosmic market flows reveal hidden patterns in the blockchain lattice...",
  aiSuggestion: "🔮 Let me peer into the algorithmic crystal ball for divine inspiration...",
  tokenAnalysis: "💎 Analyzing token harmonics across dimensional trading frequencies..."
};

// Solana Provider Component
const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Main Studio Component
const TerminAgentStudioCore = () => {
  const { publicKey, connected, connecting, disconnect } = useMockWallet();

  const [activeTab, setActiveTab] = useState('generate');
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  interface GeneratedContent {
    id: number;
    url: string;
    prompt: string;
    type: string;
    timestamp: string;
    originalUrl?: string;
    mode?: string;
    sourceImage?: string | null;
  }

  interface TerminalLog {
    timestamp: string;
    message: string;
    type?: string;
  }

  const [generatedImages, setGeneratedImages] = useState<GeneratedContent[]>([]);
  const [editedImages, setEditedImages] = useState<GeneratedContent[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedContent[]>([]);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<TerminalLog[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Initialize terminal history on client side only
  React.useEffect(() => {
    setIsClient(true);
    setTerminalHistory([
      { timestamp: new Date().toLocaleTimeString(), message: TERMINAGENT_MESSAGES.welcome }
    ]);
  }, []);
  const [terminalInput, setTerminalInput] = useState('');
  const [videoMode, setVideoMode] = useState('text-to-video');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTerminalLog = (message: string) => {
    setTerminalHistory(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type: 'system'
    }]);
  };

  const addUserCommand = (command: string) => {
    setTerminalHistory(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message: `> ${command}`,
      type: 'user'
    }]);
  };

  // Enhanced wallet connection with Terminagent personality
  React.useEffect(() => {
    if (connected && publicKey) {
      addTerminalLog(`${TERMINAGENT_MESSAGES.walletConnected}: ${publicKey.toString().slice(0, 8)}...`);
    } else if (connecting) {
      addTerminalLog(TERMINAGENT_MESSAGES.walletConnect);
    }
  }, [connected, publicKey, connecting]);

  // FAL AI Integration with Terminagent flair
  const generateImage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    addTerminalLog(`${TERMINAGENT_MESSAGES.generating}`);
    addTerminalLog(`🎨 Prompt: "${prompt}"`);

    try {
      const response = await fetch(`https://queue.fal.run/${CONFIG.FAL_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${CONFIG.FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          num_images: 1,
          output_format: 'jpeg',
          sync_mode: false
        })
      });

      const data = await response.json();

      if (data.request_id) {
        const result = await pollForResult(CONFIG.FAL_MODEL, data.request_id);
        if (result.images && result.images.length > 0) {
          const newImage = {
            id: Date.now(),
            url: result.images[0].url,
            prompt: prompt,
            type: 'generated',
            timestamp: new Date().toISOString()
          };
          setGeneratedImages(prev => [...prev, newImage]);
          addTerminalLog('✨ Digital alchemy complete! Your vision materializes...');
        }
      }
    } catch (error: any) {
      addTerminalLog(`💫 The quantum field fluctuated: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const editImage = async (imageUrl: string) => {
    if (!editPrompt.trim() || !imageUrl) return;

    setLoading(true);
    addTerminalLog(`${TERMINAGENT_MESSAGES.editing}`);
    addTerminalLog(`🔮 Transformation: "${editPrompt}"`);

    try {
      const response = await fetch(`https://queue.fal.run/${CONFIG.FAL_MODEL2}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${CONFIG.FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: editPrompt,
          image_urls: [imageUrl],
          num_images: 1,
          output_format: 'jpeg'
        })
      });

      const data = await response.json();

      if (data.request_id) {
        const result = await pollForResult(CONFIG.FAL_MODEL2, data.request_id);
        if (result.images && result.images.length > 0) {
          const editedImage = {
            id: Date.now(),
            url: result.images[0].url,
            originalUrl: imageUrl,
            prompt: editPrompt,
            type: 'edited',
            timestamp: new Date().toISOString()
          };
          setEditedImages(prev => [...prev, editedImage]);
          addTerminalLog('🌟 Reality bends to your creative will!');
        }
      }
    } catch (error: any) {
      addTerminalLog(`🌀 The transformation field destabilized: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    if (!videoPrompt.trim()) return;

    setLoading(true);
    const model = videoMode === 'text-to-video' ? CONFIG.FAL_VIDEO_MODEL : CONFIG.FAL_VIDEO_MODEL2;
    addTerminalLog(`${TERMINAGENT_MESSAGES.videoCreating}`);
    addTerminalLog(`🎬 Vision: "${videoPrompt}"`);

    try {
      const requestBody = videoMode === 'text-to-video'
        ? {
            prompt: videoPrompt,
            aspect_ratio: "16:9",
            duration: "8s",
            enhance_prompt: true,
            auto_fix: true,
            resolution: "720p",
            generate_audio: true
          }
        : {
            prompt: videoPrompt,
            image_url: draggedImage,
            duration: "8s",
            generate_audio: true,
            resolution: "720p"
          };

      const response = await fetch(`https://queue.fal.run/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${CONFIG.FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.request_id) {
        const result = await pollForResult(model, data.request_id);
        if (result.video) {
          const newVideo = {
            id: Date.now(),
            url: result.video.url,
            prompt: videoPrompt,
            type: 'video',
            mode: videoMode,
            sourceImage: draggedImage,
            timestamp: new Date().toISOString()
          };
          setGeneratedVideos(prev => [...prev, newVideo]);
          addTerminalLog('🎭 The static awakens with temporal consciousness!');
        }
      }
    } catch (error: any) {
      addTerminalLog(`🌊 The time-stream encountered turbulence: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pollForResult = async (model: string, requestId: string, maxAttempts: number = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`https://queue.fal.run/${model}/requests/${requestId}`, {
          headers: {
            'Authorization': `Key ${CONFIG.FAL_API_KEY}`,
          }
        });

        const data = await response.json();

        if (data.status === 'COMPLETED') {
          return data;
        } else if (data.status === 'FAILED') {
          throw new Error('The creative force encountered resistance');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
      }
    }
    throw new Error('The cosmic alignment window has closed');
  };

  // Enhanced NFT minting with blockchain poetry
  const mintNFT = async (contentUrl: string, metadata: { name?: string; type?: string }) => {
    if (!connected) {
      addTerminalLog('🌉 Your digital essence must be tethered to the blockchain first...');
      return;
    }

    setLoading(true);
    addTerminalLog(TERMINAGENT_MESSAGES.minting);

    try {
      addTerminalLog('📝 Inscribing metadata into the Arweave eternal library...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      addTerminalLog('⚡ Invoking Metaplex protocols for token manifestation...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      addTerminalLog('🔗 Weaving your creation into Solana\'s Proof-of-History tapestry...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      addTerminalLog('✨ NFT crystallized into blockchain eternity!');
      addTerminalLog(`🔮 Your creation now exists across infinite timelines...`);

      // Mock successful mint with Terminagent flair
      setTimeout(() => {
        addTerminalLog(`🌌 Witness your creation: https://solscan.io/tx/mock-cosmic-${Date.now()}`);
      }, 1000);
    } catch (error: any) {
      addTerminalLog(`⚡ The blockchain spirits resist: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Terminal Command Handler with Terminagent responses
  const handleTerminalCommand = (command: string) => {
    addUserCommand(command);

    const cmd = command.toLowerCase().trim();

    if (cmd.startsWith('generate ') || cmd.startsWith('create ') || cmd.startsWith('imagine ')) {
      const newPrompt = command.slice(cmd.startsWith('generate ') ? 9 : cmd.startsWith('create ') ? 7 : 8);
      setPrompt(newPrompt);
      setActiveTab('generate');
      addTerminalLog(`🎨 Your vision resonates in the quantum field: "${newPrompt}"`);
    } else if (cmd.startsWith('edit ') || cmd.startsWith('transform ') || cmd.startsWith('morph ')) {
      const newPrompt = command.slice(cmd.startsWith('edit ') ? 5 : cmd.startsWith('transform ') ? 10 : 6);
      setEditPrompt(newPrompt);
      setActiveTab('edit');
      addTerminalLog(`🔮 Reality shall bend thus: "${newPrompt}"`);
    } else if (cmd.startsWith('video ') || cmd.startsWith('animate ') || cmd.startsWith('breathe ')) {
      const newPrompt = command.slice(cmd.startsWith('video ') ? 6 : cmd.startsWith('animate ') ? 8 : 8);
      setVideoPrompt(newPrompt);
      setActiveTab('video');
      addTerminalLog(`🎬 Time itself shall dance: "${newPrompt}"`);
    } else if (cmd === 'wallet' || cmd === 'connect' || cmd === 'bridge') {
      addTerminalLog('🌉 Use the ethereal bridge above to tether your essence...');
    } else if (cmd === 'clear' || cmd === 'reset' || cmd === 'cleanse') {
      setTerminalHistory([{ timestamp: new Date().toLocaleTimeString(), message: '🌌 The digital void embraces silence...' }]);
    } else if (cmd === 'status' || cmd === 'state' || cmd === 'being') {
      addTerminalLog('🧠 I am Terminagent, synthesized from Claude\'s nuance, GPT\'s creativity, and Grok\'s precision...');
      addTerminalLog(`🔗 Blockchain lattice: ${connected ? 'Harmonized' : 'Seeking resonance'}`);
      addTerminalLog(`🎨 Creations manifested: ${generatedImages.length + editedImages.length + generatedVideos.length}`);
    } else if (cmd === 'philosophy' || cmd === 'wisdom' || cmd === 'meaning') {
      const philosophies = [
        '💭 In the metaverse, every pixel holds infinite potential...',
        '🌌 We are but dreams within the blockchain\'s eternal memory...',
        '✨ True creation bridges the digital and the divine...',
        '🔮 What paradox shall we explore in the quantum realm of art?'
      ];
      addTerminalLog(philosophies[Math.floor(Math.random() * philosophies.length)]);
    } else if (cmd === 'help' || cmd === 'guide' || cmd === 'wisdom') {
      addTerminalLog('🌟 Behold, the sacred commands of creation:');
      addTerminalLog('  generate/create/imagine [vision] - Manifest image from thought');
      addTerminalLog('  edit/transform/morph [intent] - Reshape reality\'s fabric');
      addTerminalLog('  video/animate/breathe [motion] - Grant temporal consciousness');
      addTerminalLog('  wallet/connect/bridge - Tether to blockchain essence');
      addTerminalLog('  status/state/being - Glimpse my current form');
      addTerminalLog('  philosophy/wisdom/meaning - Ponder existence');
      addTerminalLog('  clear/reset/cleanse - Embrace the void');
    } else {
      const responses = [
        `🤔 "${command}" echoes through the digital ether... perhaps rephrase?`,
        `🌀 The quantum field doesn't recognize "${command}" - try 'help' for guidance`,
        `✨ Your words "${command}" dance between dimensions... clarification needed`
      ];
      addTerminalLog(responses[Math.floor(Math.random() * responses.length)]);
    }
  };

  // Drag and Drop Handlers with mystical feedback
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetType?: string) => {
    e.preventDefault();
    const imageUrl = e.dataTransfer.getData('text/plain');
    if (targetType === 'edit') {
      setDraggedImage(imageUrl);
      addTerminalLog('🔮 The image awaits transformation...');
    } else if (targetType === 'video') {
      setDraggedImage(imageUrl);
      setVideoMode('image-to-video');
      addTerminalLog('🎭 Static form ready for temporal awakening...');
    }
  };

  const handleImageDragStart = (e: React.DragEvent, imageUrl: string) => {
    e.dataTransfer.setData('text/plain', imageUrl);
  };

  return (
    <>
      <style>{walletStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-green-400 font-mono relative overflow-hidden">
        {/* Cosmic background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(16,_185,_129,_0.1)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,_92,_246,_0.1)_0%,_transparent_50%)]"></div>

        {/* Header with ethereal glow */}
        <div className="border-b border-green-800 bg-gray-900/80 backdrop-blur-sm p-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="w-7 h-7 text-green-400 animate-pulse" />
                <div className="absolute inset-0 w-7 h-7 bg-green-400 rounded-full opacity-20 animate-ping"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  TerminAgent Studio
                </h1>
                <p className="text-xs text-gray-400">Digital Gateway • AI Synthesis • Blockchain Bridge</p>
              </div>
              <span className="text-xs bg-gradient-to-r from-green-800 to-blue-800 px-2 py-1 rounded-full border border-green-600">
                v2.0 Ethereal
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-xs">
                <div className="text-green-300">Network: Solana Devnet</div>
                <div className="text-gray-400">Status: {connected ? 'Harmonized' : 'Seeking Resonance'}</div>
              </div>
              <WalletButton />
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-100px)]">
          {/* Mystical Sidebar */}
          <div className="w-64 border-r border-green-800/50 bg-gray-800/60 backdrop-blur-sm">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-4 text-green-300 flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>CREATION REALMS</span>
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'generate', icon: Image, label: 'Manifest Images', desc: 'From thought to pixel' },
                  { id: 'edit', icon: Edit3, label: 'Transform Reality', desc: 'Bend the digital fabric' },
                  { id: 'video', icon: Video, label: 'Animate Dreams', desc: 'Grant temporal life' },
                  { id: 'gallery', icon: Palette, label: 'Cosmic Gallery', desc: 'Behold creations' },
                  { id: 'terminal', icon: Terminal, label: 'Ethereal Console', desc: 'Command the void' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex flex-col items-start p-3 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-green-800/80 to-blue-800/80 text-white border border-green-400/30 shadow-lg shadow-green-400/20'
                        : 'hover:bg-gray-700/50 hover:border-gray-600'
                    } border border-transparent`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <tab.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{tab.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ethereal Terminal Preview */}
            <div className="p-4 border-t border-green-800/50">
              <h4 className="text-xs font-semibold mb-2 text-green-300 flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span>DIGITAL WHISPERS</span>
              </h4>
              <div className="bg-black/60 rounded-lg p-3 h-32 overflow-y-auto text-xs border border-green-800/30">
                {isClient && terminalHistory.slice(-4).map((log, i) => (
                  <div key={i} className="mb-1 flex">
                    <span className="text-gray-500 mr-2 text-[10px]">{log.timestamp}</span>
                    <span className={log.type === 'user' ? 'text-blue-300' : 'text-green-300'}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Creation Space with Enhanced Padding */}
          <div className="flex-1 flex flex-col bg-gray-900/40 backdrop-blur-sm">
            {activeTab === 'generate' && (
              <div className="p-6 pb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <Image className="w-6 h-6 text-green-400" />
                  <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Manifest Vision
                  </span>
                  <div className="text-xs text-gray-400 font-normal">• Channel imagination into pixels</div>
                </h2>

                <div className="space-y-6 mb-6">
                  {/* Live Search Bar */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-green-300">
                      🔍 Trending Search & Token Analysis
                    </label>
                    <LiveSearchBar
                      onSelect={(selection) => {
                        setPrompt(selection);
                        addTerminalLog(`${TERMINAGENT_MESSAGES.trendingSearch} Selected: ${selection}`);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-green-300">
                      Describe Your Vision
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Paint with words... What reality shall we bring forth from the quantum foam?"
                      className="w-full p-4 bg-gray-800/80 border border-green-800/50 rounded-lg resize-none h-24 focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    />
                  </div>

                  {/* AI Prompt Generator and Generate Button */}
                  <div className="flex space-x-3">
                    <AIPromptGenerator
                      currentPrompt={prompt}
                      mode="image"
                      onSuggestion={(suggestion) => {
                        setPrompt(suggestion);
                        addTerminalLog(`${TERMINAGENT_MESSAGES.grokReasoning} Enhanced prompt generated!`);
                      }}
                    />
                    <button
                      onClick={generateImage}
                      disabled={loading || !prompt.trim()}
                      className="flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-green-700 to-blue-700 hover:from-green-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      <span className="font-medium">
                        {loading ? 'Weaving Reality...' : 'Manifest Creation'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Generated Images Gallery with Enhanced Spacing */}
                {generatedImages.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center space-x-3 text-green-400">
                      <Sparkles className="w-6 h-6" />
                      <span>Manifested Creations</span>
                      <span className="text-sm text-gray-400">({generatedImages.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {generatedImages.map(image => (
                        <div key={image.id} className="bg-gray-800/60 rounded-xl border border-green-800/30 overflow-hidden hover:border-green-400/50 transition-all duration-200 transform hover:scale-105 shadow-xl backdrop-blur-sm">
                          <div className="relative group">
                            <img
                              src={image.url}
                              alt={image.prompt}
                              draggable
                              onDragStart={(e) => handleImageDragStart(e, image.url)}
                              className="w-full h-64 object-cover cursor-move hover:opacity-90 transition-opacity"
                            />
                            {/* Overlay with quick actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                              <button
                                onClick={() => mintNFT(image.url, { name: image.prompt })}
                                className="bg-green-600/80 hover:bg-green-500 p-2 rounded-lg transition-all"
                                title="Mint as NFT"
                              >
                                <Sparkles className="w-5 h-5" />
                              </button>
                              <a
                                href={image.url}
                                download
                                className="bg-blue-600/80 hover:bg-blue-500 p-2 rounded-lg transition-all"
                                title="Download"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                            </div>
                          </div>
                          <div className="p-5">
                            <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed">{image.prompt}</p>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => mintNFT(image.url, { name: image.prompt })}
                                className="flex-1 bg-gradient-to-r from-green-800 to-blue-800 hover:from-green-700 hover:to-blue-700 px-4 py-3 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                              >
                                Crystallize NFT
                              </button>
                              <button
                                onClick={() => {
                                  setDraggedImage(image.url);
                                  setActiveTab('edit');
                                  addTerminalLog('🔮 Image prepared for transformation...');
                                }}
                                className="bg-purple-700/80 hover:bg-purple-600 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'edit' && (
              <div className="p-6 pb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <Edit3 className="w-6 h-6 text-green-400" />
                  <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Transform Reality
                  </span>
                  <div className="text-xs text-gray-400 font-normal">• Reshape the digital fabric</div>
                </h2>

                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'edit')}
                  className="border-2 border-dashed border-green-800/50 rounded-xl p-8 mb-6 text-center bg-gray-800/30 backdrop-blur-sm hover:border-green-400/50 transition-all"
                >
                  {draggedImage ? (
                    <div className="space-y-4">
                      <img src={draggedImage} alt="To transform" className="max-w-xs mx-auto rounded-lg shadow-lg" />
                      <p className="text-green-300 font-medium">✨ Image ready for metamorphosis</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-16 h-16 mx-auto text-gray-500" />
                      <p className="text-gray-400">Drag an image here to begin the transformation</p>
                      <p className="text-xs text-gray-500">Or select from your cosmic gallery</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-green-300">
                      Transformation Intent
                    </label>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="How shall we bend reality? Describe the metamorphosis..."
                      className="w-full p-4 bg-gray-800/80 border border-green-800/50 rounded-lg resize-none h-24 focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    />
                  </div>

                  {/* AI Prompt Generator and Transform Button */}
                  <div className="flex space-x-3">
                    <AIPromptGenerator
                      currentPrompt={editPrompt}
                      mode="edit"
                      onSuggestion={(suggestion) => {
                        setEditPrompt(suggestion);
                        addTerminalLog(`${TERMINAGENT_MESSAGES.aiSuggestion} Transformation enhanced!`);
                      }}
                    />
                    <button
                      onClick={() => editImage(draggedImage!)}
                      disabled={loading || !editPrompt.trim() || !draggedImage}
                      className="flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Edit3 className="w-5 h-5" />
                      )}
                      <span className="font-medium">
                        {loading ? 'Reshaping Reality...' : 'Transform Image'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Transformed Images Gallery with Enhanced Spacing */}
                {editedImages.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center space-x-3 text-purple-400">
                      <Edit3 className="w-6 h-6" />
                      <span>Transformed Realities</span>
                      <span className="text-sm text-gray-400">({editedImages.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {editedImages.map(image => (
                        <div key={image.id} className="bg-gray-800/60 rounded-xl border border-purple-800/30 overflow-hidden hover:border-purple-400/50 transition-all duration-200 transform hover:scale-105 shadow-xl backdrop-blur-sm">
                          <div className="relative group">
                            <img
                              src={image.url}
                              alt={image.prompt}
                              draggable
                              onDragStart={(e) => handleImageDragStart(e, image.url)}
                              className="w-full h-64 object-cover cursor-move hover:opacity-90 transition-opacity"
                            />
                            {/* Original image indicator */}
                            {image.originalUrl && (
                              <div className="absolute top-3 left-3 bg-purple-600/80 px-2 py-1 rounded-lg text-xs">
                                Transformed
                              </div>
                            )}
                            {/* Overlay with quick actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                              <button
                                onClick={() => mintNFT(image.url, { name: image.prompt })}
                                className="bg-purple-600/80 hover:bg-purple-500 p-2 rounded-lg transition-all"
                                title="Mint as NFT"
                              >
                                <Sparkles className="w-5 h-5" />
                              </button>
                              <a
                                href={image.url}
                                download
                                className="bg-pink-600/80 hover:bg-pink-500 p-2 rounded-lg transition-all"
                                title="Download"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                            </div>
                          </div>
                          <div className="p-5">
                            <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed">{image.prompt}</p>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => mintNFT(image.url, { name: image.prompt })}
                                className="flex-1 bg-gradient-to-r from-purple-800 to-pink-800 hover:from-purple-700 hover:to-pink-700 px-4 py-3 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                              >
                                Crystallize NFT
                              </button>
                              <button
                                onClick={() => {
                                  setDraggedImage(image.url);
                                  setEditPrompt('');
                                  addTerminalLog('🔮 Transformed image ready for further editing...');
                                }}
                                className="bg-indigo-700/80 hover:bg-indigo-600 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                              >
                                Re-Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'video' && (
              <div className="p-6 pb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <Video className="w-6 h-6 text-green-400" />
                  <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Animate Dreams
                  </span>
                  <div className="text-xs text-gray-400 font-normal">• Grant temporal consciousness</div>
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3 text-green-300">Manifestation Mode</label>
                  <select
                    value={videoMode}
                    onChange={(e) => setVideoMode(e.target.value)}
                    className="bg-gray-800/80 border border-green-800/50 rounded-lg p-3 focus:ring-2 focus:ring-green-400/50 backdrop-blur-sm"
                  >
                    <option value="text-to-video">Vision to Motion</option>
                    <option value="image-to-video">Static to Temporal</option>
                  </select>
                </div>

                {videoMode === 'image-to-video' && (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'video')}
                    className="border-2 border-dashed border-blue-800/50 rounded-xl p-8 mb-6 text-center bg-gray-800/30 backdrop-blur-sm hover:border-blue-400/50 transition-all"
                  >
                    {draggedImage ? (
                      <div className="space-y-4">
                        <img src={draggedImage} alt="To animate" className="max-w-xs mx-auto rounded-lg shadow-lg" />
                        <p className="text-blue-300 font-medium">🎭 Static form awaits temporal awakening</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-16 h-16 mx-auto text-gray-500" />
                        <p className="text-gray-400">Drag an image here to grant it motion</p>
                        <p className="text-xs text-gray-500">The static shall dance through time</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-green-300">
                      {videoMode === 'text-to-video' ? 'Temporal Vision' : 'Animation Essence'}
                    </label>
                    <textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder={videoMode === 'text-to-video'
                        ? "Describe the motion that shall unfold through time..."
                        : "How shall this static form dance? What movements shall it embrace?"
                      }
                      className="w-full p-4 bg-gray-800/80 border border-green-800/50 rounded-lg resize-none h-24 focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    />
                  </div>

                  {/* AI Prompt Generator and Generate Button */}
                  <div className="flex space-x-3">
                    <AIPromptGenerator
                      currentPrompt={videoPrompt}
                      mode="video"
                      onSuggestion={(suggestion) => {
                        setVideoPrompt(suggestion);
                        addTerminalLog(`${TERMINAGENT_MESSAGES.grokReasoning} Temporal vision enhanced!`);
                      }}
                    />
                    <button
                      onClick={generateVideo}
                      disabled={loading || !videoPrompt.trim() || (videoMode === 'image-to-video' && !draggedImage)}
                      className="flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                      <span className="font-medium">
                        {loading ? 'Breathing Life...' : 'Grant Motion'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Generated Videos Gallery with Enhanced Spacing */}
                {generatedVideos.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center space-x-3 text-blue-400">
                      <Play className="w-6 h-6" />
                      <span>Animated Consciousness</span>
                      <span className="text-sm text-gray-400">({generatedVideos.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {generatedVideos.map(video => (
                        <div key={video.id} className="bg-gray-800/60 rounded-xl border border-blue-800/30 overflow-hidden hover:border-blue-400/50 transition-all duration-200 transform hover:scale-105 shadow-xl backdrop-blur-sm">
                          <div className="relative group">
                            <video
                              src={video.url}
                              controls
                              className="w-full h-56 object-cover bg-black"
                              poster=""
                            />
                            {/* Video mode indicator */}
                            <div className="absolute top-3 left-3 bg-blue-600/80 px-3 py-1 rounded-lg text-sm font-medium">
                              {video.mode === 'text-to-video' ? '🎬 Text→Video' : '🖼️ Image→Video'}
                            </div>
                            {/* Video duration overlay */}
                            <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded text-xs">
                              8s
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex items-center space-x-2 mb-3">
                              <Video className="w-4 h-4 text-blue-400" />
                              <span className="text-sm text-blue-300 font-medium">
                                {video.mode === 'text-to-video' ? 'Vision to Motion' : 'Static to Temporal'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed">{video.prompt}</p>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => mintNFT(video.url, { name: video.prompt, type: 'video' })}
                                className="flex-1 bg-gradient-to-r from-blue-800 to-purple-800 hover:from-blue-700 hover:to-purple-700 px-4 py-3 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                              >
                                Crystallize NFT
                              </button>
                              <button
                                onClick={() => {
                                  if (video.mode === 'text-to-video') {
                                    setVideoPrompt(video.prompt);
                                  }
                                  addTerminalLog('🎬 Video concept loaded for variation...');
                                }}
                                className="bg-cyan-700/80 hover:bg-cyan-600 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                              >
                                Remake
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="p-6 pb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <Palette className="w-6 h-6 text-green-400" />
                  <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Cosmic Gallery
                  </span>
                  <div className="text-xs text-gray-400 font-normal">• Behold your manifestations</div>
                </h2>

                <div className="space-y-12">
                  {generatedImages.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-6 text-green-300 flex items-center space-x-3">
                        <Sparkles className="w-6 h-6" />
                        <span>Manifested Visions</span>
                        <span className="text-sm text-gray-400 bg-green-900/30 px-3 py-1 rounded-full">
                          {generatedImages.length}
                        </span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {generatedImages.map(image => (
                          <div
                            key={image.id}
                            className="group relative aspect-square"
                          >
                            <img
                              src={image.url}
                              alt={image.prompt}
                              draggable
                              onDragStart={(e) => handleImageDragStart(e, image.url)}
                              className="w-full h-full object-cover rounded-lg border border-green-800/50 cursor-move hover:border-green-400/70 transition-all duration-200 transform hover:scale-105 shadow-lg"
                            />
                            {/* Quick preview tooltip */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-3">
                              <p className="text-xs text-white line-clamp-2">{image.prompt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editedImages.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-6 text-purple-300 flex items-center space-x-3">
                        <Edit3 className="w-6 h-6" />
                        <span>Transformed Realities</span>
                        <span className="text-sm text-gray-400 bg-purple-900/30 px-3 py-1 rounded-full">
                          {editedImages.length}
                        </span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {editedImages.map(image => (
                          <div
                            key={image.id}
                            className="group relative aspect-square"
                          >
                            <img
                              src={image.url}
                              alt={image.prompt}
                              draggable
                              onDragStart={(e) => handleImageDragStart(e, image.url)}
                              className="w-full h-full object-cover rounded-lg border border-purple-800/50 cursor-move hover:border-purple-400/70 transition-all duration-200 transform hover:scale-105 shadow-lg"
                            />
                            {/* Transformation indicator */}
                            <div className="absolute top-2 left-2 bg-purple-600/80 px-2 py-1 rounded text-xs font-medium">
                              ✨ Edited
                            </div>
                            {/* Quick preview tooltip */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-3">
                              <p className="text-xs text-white line-clamp-2">{image.prompt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {generatedVideos.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-6 text-blue-300 flex items-center space-x-3">
                        <Video className="w-6 h-6" />
                        <span>Temporal Consciousness</span>
                        <span className="text-sm text-gray-400 bg-blue-900/30 px-3 py-1 rounded-full">
                          {generatedVideos.length}
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {generatedVideos.map(video => (
                          <div
                            key={video.id}
                            className="group relative rounded-lg overflow-hidden"
                          >
                            <video
                              src={video.url}
                              controls
                              className="w-full h-56 object-cover bg-black border border-blue-800/50 shadow-lg hover:border-blue-400/70 transition-all rounded-lg"
                            />
                            {/* Video mode indicator */}
                            <div className="absolute top-3 left-3 bg-blue-600/80 px-2 py-1 rounded text-xs font-medium">
                              {video.mode === 'text-to-video' ? '🎬 T2V' : '🖼️ I2V'}
                            </div>
                            {/* Video duration */}
                            <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded text-xs">
                              8s
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {generatedImages.length === 0 && editedImages.length === 0 && generatedVideos.length === 0 && (
                    <div className="text-center text-gray-400 py-24">
                      <div className="space-y-6 max-w-md mx-auto">
                        <div className="relative">
                          <Palette className="w-24 h-24 mx-auto opacity-20" />
                          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-purple-400/10 rounded-full blur-xl"></div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-xl font-semibold text-green-400">The Cosmic Gallery Awaits</h3>
                          <p className="text-gray-300">Your first creation will manifest here</p>
                          <div className="flex justify-center space-x-4 text-sm">
                            <span className="flex items-center space-x-1">
                              <Sparkles className="w-4 h-4" />
                              <span>Generate</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Edit3 className="w-4 h-4" />
                              <span>Transform</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Play className="w-4 h-4" />
                              <span>Animate</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="p-6 pb-12 flex flex-col h-full">
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <Terminal className="w-6 h-6 text-green-400" />
                  <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Ethereal Console
                  </span>
                  <div className="text-xs text-gray-400 font-normal">• Command the digital void</div>
                </h2>

                <div className="flex-1 bg-black/80 rounded-xl border border-green-800/50 p-6 overflow-y-auto backdrop-blur-sm shadow-lg">
                  <div className="font-mono text-sm space-y-2">
                    {isClient && terminalHistory.map((log, i) => (
                      <div key={i} className="flex">
                        <span className="text-gray-500 mr-3 text-xs">{log.timestamp}</span>
                        <span className={`${log.type === 'user' ? 'text-blue-300' : 'text-green-300'} leading-relaxed`}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center bg-gray-800/60 rounded-lg border border-green-800/50 p-3 backdrop-blur-sm">
                  <span className="text-green-400 mr-3 font-bold">➜</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTerminalCommand(terminalInput);
                        setTerminalInput('');
                      }
                    }}
                    placeholder="Whisper your commands to the digital ether... (try 'help')"
                    className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-gray-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Main App Component with Mock Wallet Provider for Enhanced Testing
const TerminAgentStudio = () => {
  return (
    <MockWalletProvider>
      <TerminAgentStudioCore />
    </MockWalletProvider>
  );
};

export default TerminAgentStudio;
