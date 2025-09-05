import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Metaplex, keypairIdentity, toMetaplexFile } from '@metaplex-foundation/js';
import { CONFIG } from './config';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  properties?: {
    category: string;
    files: Array<{
      uri: string;
      type: string;
    }>;
  };
}

export class NFTMinter {
  private connection: Connection;
  private metaplex: Metaplex | null = null;

  constructor() {
    const endpoint = CONFIG.HELIUS_RPC_URL && CONFIG.HELIUS_RPC_URL !== 'your_helius_rpc_url_here'
      ? CONFIG.HELIUS_RPC_URL
      : clusterApiUrl(CONFIG.SOLANA_NETWORK === 'mainnet' ? 'mainnet-beta' : 'devnet');

    this.connection = new Connection(endpoint, 'confirmed');
  }

  async initializeMetaplex(walletAdapter: any) {
    if (!walletAdapter.publicKey) {
      throw new Error('Wallet not connected');
    }

    this.metaplex = Metaplex.make(this.connection)
      .use(keypairIdentity(walletAdapter));

    return this.metaplex;
  }

  async uploadImageToArweave(imageFile: File): Promise<string> {
    if (!this.metaplex) {
      throw new Error('Metaplex not initialized');
    }

    try {
      // Convert File to Metaplex file
      const buffer = await imageFile.arrayBuffer();
      const metaplexFile = toMetaplexFile(buffer, imageFile.name);

      // Upload to Arweave via Bundlr
      const imageUri = await this.metaplex.storage().upload(metaplexFile);
      return imageUri;
    } catch (error) {
      console.error('Failed to upload image to Arweave:', error);
      throw error;
    }
  }

  async uploadMetadata(metadata: NFTMetadata): Promise<string> {
    if (!this.metaplex) {
      throw new Error('Metaplex not initialized');
    }

    try {
      const result = await this.metaplex.nfts().uploadMetadata(metadata as any);
      return typeof result === 'string' ? result : result.uri;
    } catch (error) {
      console.error('Failed to upload metadata:', error);
      throw error;
    }
  }

  async mintNFT(metadata: NFTMetadata, imageFile?: File): Promise<any> {
    if (!this.metaplex) {
      throw new Error('Metaplex not initialized');
    }

    try {
      let finalMetadata = { ...metadata };

      // Upload image if provided
      if (imageFile) {
        const imageUri = await this.uploadImageToArweave(imageFile);
        finalMetadata.image = imageUri;

        if (!finalMetadata.properties) {
          finalMetadata.properties = {
            category: 'image',
            files: []
          };
        }

        finalMetadata.properties.files.push({
          uri: imageUri,
          type: imageFile.type
        });
      }

      // Create NFT
      const { nft } = await this.metaplex.nfts().create({
        uri: await this.uploadMetadata(finalMetadata),
        name: finalMetadata.name,
        sellerFeeBasisPoints: 500, // 5% royalty
        symbol: 'TNFT',
        creators: [
          {
            address: this.metaplex.identity().publicKey,
            share: 100,
          },
        ],
        isMutable: true,
      });

      return nft;
    } catch (error) {
      console.error('NFT minting failed:', error);
      throw error;
    }
  }

  async createCollectionNFT(name: string, description: string, imageUri: string): Promise<any> {
    if (!this.metaplex) {
      throw new Error('Metaplex not initialized');
    }

    try {
      const metadata = {
        name,
        description,
        image: imageUri,
        properties: {
          category: 'image',
          files: [
            {
              uri: imageUri,
              type: 'image/jpeg'
            }
          ]
        }
      };

      const { nft } = await this.metaplex.nfts().create({
        uri: await this.uploadMetadata(metadata),
        name,
        sellerFeeBasisPoints: 500,
        symbol: 'TCOL',
        creators: [
          {
            address: this.metaplex.identity().publicKey,
            share: 100,
          },
        ],
        isCollection: true,
        isMutable: true,
      });

      return nft;
    } catch (error) {
      console.error('Collection creation failed:', error);
      throw error;
    }
  }
}
