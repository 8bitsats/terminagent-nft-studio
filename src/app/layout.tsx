import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';

import type { Metadata } from 'next';
import {
  Geist,
  Geist_Mono,
} from 'next/font/google';

import { SolanaProvider } from '@/components/providers/SolanaProvider';
import TrendingTicker from '@/components/TrendingTicker';

// Declare custom element for ElevenLabs ConvAI
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': {
        'agent-id': string;
      };
    }
  }
}

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solana Explorer",
  description: "Complete Solana blockchain explorer powered by Birdeye API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-black text-green-400`}
        suppressHydrationWarning
      >
        <SolanaProvider>
          <TrendingTicker />
          {children}
          <elevenlabs-convai agent-id="agent_01jyqnyjhjf209zwa369bwn9s2" />
        </SolanaProvider>
        <script 
          src="https://unpkg.com/@elevenlabs/convai-widget-embed" 
          async 
          type="text/javascript">
        </script>
      </body>
    </html>
  );
}
