"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Wallet } from 'lucide-react';

interface MockPublicKey {
  toString: () => string;
}

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: MockPublicKey | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  connecting: false,
  publicKey: null,
  connect: async () => {},
  disconnect: () => {}
});

interface MockWalletProviderProps {
  children: ReactNode;
}

export const MockWalletProvider: React.FC<MockWalletProviderProps> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<MockPublicKey | null>(null);

  const connect = async () => {
    setConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockKey = 'TerminAgent' + Math.random().toString(36).substring(2, 15);
    setPublicKey({ toString: () => mockKey });
    setConnected(true);
    setConnecting(false);
  };

  const disconnect = () => {
    setConnected(false);
    setPublicKey(null);
  };

  return (
    <WalletContext.Provider value={{ connected, connecting, publicKey, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);

// Mock Wallet Button Component
export const WalletButton: React.FC = () => {
  const { connected, connecting, publicKey, connect, disconnect } = useWallet();

  return (
    <button
      onClick={connected ? disconnect : connect}
      disabled={connecting}
      className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 px-4 py-2 rounded-lg transition-all"
    >
      <Wallet className="w-4 h-4" />
      <span>
        {connecting ? 'Bridging...' :
         connected ? `${publicKey?.toString().slice(0, 8)}...` :
         'Connect Wallet'}
      </span>
    </button>
  );
};
