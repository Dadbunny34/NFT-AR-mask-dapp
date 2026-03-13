# 🎭 MaskForge — NFT → 3D → AR Mask dApp

Transform your Solana NFTs into photorealistic 3D models and wear them as augmented reality face masks.

## ✨ Features

- **NFT Gallery** — Connect wallet, browse your Solana NFT collection
- **AI 3D Generation** — Transform 2D NFT images into 3D models via Meshy.ai
- **On-chain Minting** — Mint your 3D model as a new NFT on Solana (optional, 0.05 SOL on mainnet)
- **AR Face Masks** — Try on 3D models as real-time face masks using Banuba WebAR
- **MediaPipe Fallback** — If Banuba fails, seamlessly falls back to MediaPipe Face Mesh + Three.js

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Solana | @solana/wallet-adapter, @metaplex-foundation/js, @solana/web3.js |
| 3D Generation | Meshy.ai Image-to-3D API |
| AR Engine | Banuba WebAR SDK (primary) + MediaPipe Face Mesh (fallback) |
| 3D Rendering | Three.js + @react-three/fiber + @react-three/drei |
| State | Zustand |
| Deployment | Vercel |

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd nft-ar-mask-dapp

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 API Keys Needed

| Service | Purpose | Get it at |
|---------|---------|-----------|
| Meshy.ai | 3D model generation | https://app.meshy.ai |
| Banuba | WebAR face tracking | https://www.banuba.com |
| nft.storage | IPFS metadata storage | https://nft.storage (optional) |

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Landing page
│   ├── layout.tsx         # Root layout + wallet provider
│   ├── globals.css        # Global styles + Solana theme
│   ├── gallery/page.tsx   # NFT gallery
│   ├── generate/page.tsx  # 3D generation
│   ├── mint/page.tsx      # NFT minting
│   ├── ar/page.tsx        # AR face mask
│   └── api/
│       ├── generate/      # Meshy.ai proxy routes
│       └── mint/          # Mint helper route
├── components/
│   ├── Navbar.tsx         # Navigation bar
│   ├── ModelViewer.tsx    # Three.js GLB viewer
│   ├── BanubaAR.tsx       # Banuba WebAR component
│   └── MediaPipeFallback.tsx  # MediaPipe + Three.js fallback
├── lib/
│   ├── fetchNfts.ts       # Metaplex NFT fetcher
│   ├── mintNft.ts         # NFT minting logic
│   └── utils.ts           # Utility functions
├── providers/
│   └── WalletProvider.tsx # Solana wallet context
└── store/
    └── useAppStore.ts     # Zustand global state
```

## 🔄 App Flow

1. **Connect Wallet** → Phantom, Solflare, etc.
2. **Browse NFTs** → Gallery pulls your Solana NFTs via Metaplex
3. **Select & Generate** → Sends NFT image to Meshy.ai, polls for 3D result
4. **Preview 3D** → Interactive Three.js viewer with orbit controls
5. **Mint (Optional)** → Creates new NFT with GLB as animation_url
6. **AR Mask** → Banuba WebAR maps 3D model to your face in real-time

## 🌐 Networks

- **Devnet** — Free testing, no SOL required for minting
- **Mainnet** — 0.05 SOL minting fee, real NFTs

Switch via `NEXT_PUBLIC_SOLANA_NETWORK` in `.env.local`.

## 📦 Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add your environment variables in the Vercel dashboard.

## 📄 License

MIT
