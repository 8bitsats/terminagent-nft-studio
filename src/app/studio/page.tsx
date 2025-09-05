'use client';

import {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';

import {
  Send,
  Mic,
  MicOff,
  Upload,
  Settings,
  Sparkles,
  Brain,
  MessageSquare,
  Wand2,
  Bot,
  User,
  Download,
  Copy,
  RefreshCw,
} from 'lucide-react';

import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'audio';
  timestamp: Date;
  model?: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface ModelOption {
  id: string;
  name: string;
  provider: 'openrouter' | 'openai' | 'fal';
  capabilities: string[];
  description: string;
}

const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'deepseek/deepseek-chat-v3.1',
    name: 'DeepSeek Chat v3.1',
    provider: 'openrouter',
    capabilities: ['text', 'code'],
    description: 'Advanced reasoning and coding model'
  },
  {
    id: 'openai/gpt-5-chat',
    name: 'GPT-5 Chat',
    provider: 'openrouter',
    capabilities: ['text', 'vision', 'reasoning'],
    description: 'Latest OpenAI model with advanced reasoning'
  },
  {
    id: 'anthropic/claude-opus-4.1',
    name: 'Claude Opus 4.1',
    provider: 'openrouter',
    capabilities: ['text', 'vision', 'analysis'],
    description: 'Anthropic\'s most capable model'
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'openrouter',
    capabilities: ['text', 'vision', 'fast'],
    description: 'Fast Google multimodal model'
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'openrouter',
    capabilities: ['text', 'vision', 'creative'],
    description: 'Balanced performance and creativity'
  },
  {
    id: 'mistralai/mistral-medium-3.1',
    name: 'Mistral Medium 3.1',
    provider: 'openrouter',
    capabilities: ['text', 'vision', 'multilingual'],
    description: 'European AI with vision capabilities'
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    capabilities: ['image-generation'],
    description: 'OpenAI\'s latest image generation model'
  },
  {
    id: 'fal-model',
    name: 'FAL Image Model',
    provider: 'fal',
    capabilities: ['image-generation', 'fast'],
    description: 'Fast image generation via FAL'
  },
];

export default function StudioPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelOption>(AVAILABLE_MODELS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateWithOpenRouter = async (prompt: string, imageBase64?: string) => {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'TerminAgent Studio',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel.id,
        messages: [
          {
            role: 'user',
            content: imageBase64 ? [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ] : prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const generateImageWithOpenAI = async (prompt: string) => {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].url;
  };

  const generateImageWithFAL = async (prompt: string) => {
    const response = await fetch(`https://fal.run/fal-ai/${process.env.NEXT_PUBLIC_FAL_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.NEXT_PUBLIC_FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: 'square_hd',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1
      })
    });

    if (!response.ok) {
      throw new Error(`FAL API error: ${response.status}`);
    }

    const data = await response.json();
    return data.images[0].url;
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      type: selectedFile?.type.startsWith('image/') ? 'image' : 'text',
      timestamp: new Date(),
      imageUrl: previewUrl || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      let response: string | null = null;
      let imageUrl: string | null = null;

      if (selectedModel.capabilities.includes('image-generation')) {
        // Image generation models
        if (selectedModel.provider === 'openai') {
          imageUrl = await generateImageWithOpenAI(inputText);
        } else if (selectedModel.provider === 'fal') {
          imageUrl = await generateImageWithFAL(inputText);
        }
        response = `Generated image: ${inputText}`;
      } else {
        // Text/vision models
        let imageBase64: string | undefined;
        
        if (selectedFile && selectedFile.type.startsWith('image/')) {
          imageBase64 = await convertFileToBase64(selectedFile);
        }

        if (selectedModel.provider === 'openrouter') {
          response = await generateWithOpenRouter(inputText, imageBase64);
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'Generated content',
        type: imageUrl ? 'image' : 'text',
        timestamp: new Date(),
        model: selectedModel.name,
        imageUrl: imageUrl || undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        type: 'text',
        timestamp: new Date(),
        model: selectedModel.name
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      setInputText('');
      removeFile();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="relative">
                  <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  <div className="absolute inset-0 w-8 h-8 bg-purple-400 rounded-full opacity-20 animate-ping"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    TerminAgent Studio
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Multi-Modal AI Playground
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Explorer
              </Link>
              <button
                onClick={() => {/* TODO: Implement settings */}}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Model Selection</span>
              </h3>
              
              <div className="space-y-3">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedModel.id === model.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {model.description}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {model.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <button className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Clear Chat</span>
                  </button>
                  <button className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export Chat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-200px)] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
                    <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Welcome to TerminAgent Studio</p>
                    <p className="text-sm">Start a conversation with any AI model or generate images</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        
                        <div className={`rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          {message.type === 'image' && message.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={message.imageUrl}
                                alt="Generated or uploaded image"
                                className="max-w-full h-auto rounded-lg"
                              />
                              {message.role === 'assistant' && (
                                <div className="flex space-x-2 mt-2">
                                  <button
                                    onClick={() => downloadImage(message.imageUrl || '', `generated-${message.id}.png`)}
                                    className="p-1 text-xs bg-white/20 hover:bg-white/30 rounded"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                          
                          {message.role === 'assistant' && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                              <span className="text-xs opacity-70">
                                {message.model} • {message.timestamp.toLocaleTimeString()}
                              </span>
                              <button
                                onClick={() => copyToClipboard(message.content)}
                                className="p-1 text-xs hover:bg-white/20 rounded"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300 animate-spin" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Generating response...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                {previewUrl && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedFile?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedFile?.type}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsRecording(!isRecording)}
                      className={`p-3 transition-colors ${
                        isRecording
                          ? 'text-red-600 hover:text-red-700'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    
                    <button
                      type="submit"
                      disabled={(!inputText.trim() && !selectedFile) || isGenerating}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
