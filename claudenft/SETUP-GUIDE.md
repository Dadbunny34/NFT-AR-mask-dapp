# 🚀 NFT AR Mask dApp - Complete Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [API Keys Configuration](#api-keys-configuration)
4. [Local Development](#local-development)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 16+ (recommended 18+)
- npm or yarn package manager
- Git
- A code editor (VS Code recommended)
- 20 minutes for setup

## Project Setup

### Step 1: Initialize the Project

```bash
# Create a new directory
mkdir nft-ar-mask-dapp
cd nft-ar-mask-dapp

# Initialize git
git init

# Create directory structure
mkdir -p src/{lib/integrations,app/{api,components/pages},types}
```

### Step 2: Install Dependencies

```bash
# Copy the provided package.json and install dependencies
npm install

# Or with yarn
yarn install
```

**Key Dependencies:**
- `next` - React framework
- `typescript` - Type safety
- `tailwindcss` - Styling
- `axios` - HTTP client
- `mixpanel` - Analytics
- `three` - 3D rendering (for AR)
- `ethers` - Web3 integration

## API Keys Configuration (20 minutes)

### 1. **Mixpanel Analytics** (5 min) ✨ FREE
```
Signup: https://mixpanel.com
Free tier: 100K events/month
```

**Steps:**
1. Visit https://mixpanel.com
2. Click "Sign Up"
3. Create account with email
4. Create new project
5. Copy "Project Token" from settings
6. Add to `.env.local`: `NEXT_PUBLIC_MIXPANEL_TOKEN=your_token`

### 2. **nft.storage** (5 min) ✨ FREE + UNLIMITED
```
Signup: https://nft.storage
Free tier: Unlimited IPFS storage
```

**Steps:**
1. Visit https://nft.storage
2. Click "Sign In" → "Sign up"
3. Connect with email
4. Verify email
5. Go to "API Keys" section
6. Copy your API key
7. Add to `.env.local`: `NEXT_PUBLIC_NFT_STORAGE_KEY=your_key`

### 3. **Pinata** (5 min) ✨ FREE (Optional Backup)
```
Signup: https://pinata.cloud
Free tier: 1GB storage
```

**Steps:**
1. Visit https://pinata.cloud
2. Click "Sign Up"
3. Create account
4. Go to "API Keys"
5. Create new key
6. Add to `.env.local`:
   ```
   NEXT_PUBLIC_PINATA_KEY=your_key
   NEXT_PUBLIC_PINATA_SECRET=your_secret
   ```

### 4. **Discord Webhook** (3 min) ✨ FREE
```
For sharing to Discord servers
```

**Steps:**
1. Open Discord server where you have admin rights
2. Go to Settings → Webhooks
3. Click "Create Webhook"
4. Copy webhook URL
5. Add to `.env.local`: `NEXT_PUBLIC_DISCORD_WEBHOOK_URL=your_url`

### 5. **Telegram Bot Token** (3 min) ✨ FREE
```
For sharing to Telegram
```

**Steps:**
1. Open Telegram → Search "@BotFather"
2. Type `/start`
3. Type `/newbot`
4. Follow prompts to create bot
5. Copy bot token
6. Add to `.env.local`: `NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_token`

Get Chat ID:
1. Add bot to your Telegram chat
2. Send message to bot
3. Visit: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`
4. Find chat id in response
5. Add to `.env.local`: `NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id`

### 6. **Optional: OpenSea API** (for Ethereum)
```
Signup: https://docs.opensea.io/reference/api-overview
Free tier: Basic access
```

**Steps:**
1. Visit OpenSea docs
2. Request API key
3. Add to `.env.local`: `OPENSEA_API_KEY=your_key`

### 7. **Optional: Alchemy API** (for Polygon)
```
Signup: https://www.alchemy.com
Free tier: Generous limits
```

**Steps:**
1. Create account at alchemy.com
2. Create app
3. Copy API key
4. Add to `.env.local`: `ALCHEMY_API_KEY=your_key`

## Configuration File Setup

### Copy Environment Template

```bash
# Copy example to local
cp .env.local.example .env.local

# Edit with your API keys
nano .env.local  # or use your editor
```

### `.env.local` Template

```env
# Analytics
NEXT_PUBLIC_MIXPANEL_TOKEN=your_token
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

# Storage
NEXT_PUBLIC_NFT_STORAGE_KEY=your_key
NEXT_PUBLIC_PINATA_KEY=your_key
NEXT_PUBLIC_PINATA_SECRET=your_secret

# On-chain
OPENSEA_API_KEY=your_key
ALCHEMY_API_KEY=your_key

# Social
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=your_webhook
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_token
NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Local Development

### Start Development Server

```bash
# Install dependencies if not done
npm install

# Start dev server
npm run dev

# Server will run at http://localhost:3000
```

### Project Structure

```
src/
├── lib/
│   └── integrations/
│       ├── analytics.ts      # Mixpanel tracking
│       ├── storage.ts        # nft.storage & IPFS
│       ├── onchain.ts        # NFT verification
│       └── social.ts         # Twitter, Discord, Telegram
├── app/
│   ├── api/
│   │   ├── analytics/
│   │   ├── storage/
│   │   ├── nft/
│   │   └── social/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── pages/
│       ├── GeneratePage.tsx
│       ├── GalleryPage.tsx
│       └── ARViewerPage.tsx
└── types/
    └── (TypeScript definitions)
```

### File Placement

Copy the provided files to their correct locations:

```bash
# Create directory structure
mkdir -p src/lib/integrations
mkdir -p src/app/api/{analytics,storage,nft,social}
mkdir -p src/components/pages

# Copy integration files
cp analytics.ts src/lib/integrations/
cp storage.ts src/lib/integrations/
cp onchain.ts src/lib/integrations/
cp social.ts src/lib/integrations/

# Copy API routes
cp api-track-route.ts src/app/api/analytics/track/route.ts
cp api-upload-route.ts src/app/api/storage/upload/route.ts
cp api-verify-route.ts src/app/api/nft/verify/route.ts
cp api-share-route.ts src/app/api/social/share/route.ts
```

### Hot Reload Development

The Next.js dev server supports hot module replacement:
- Edit files and save
- Changes appear immediately in browser
- No manual refresh needed

### Type Checking

```bash
# Check TypeScript errors
npm run type-check

# Or in watch mode
npx tsc --watch
```

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to connect Git repo
# Add environment variables in Vercel dashboard
```

### Manual Deployment Steps

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Test production build locally:**
   ```bash
   npm run build
   npm start
   ```

3. **Push to Git:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

4. **Connect to Vercel:**
   - Visit vercel.com
   - Import Git repository
   - Add environment variables
   - Deploy!

### Environment Variables on Vercel

1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Set `NODE_ENV=production`
4. Redeploy

## Testing

### Test Analytics
```typescript
// In browser console
const { trackEvent } = await import('@/lib/integrations/analytics');
trackEvent({ name: 'test_event', properties: { test: true } });
```

### Test Storage
```bash
curl -X POST http://localhost:3000/api/storage/upload \
  -F "file=@yourfile.jpg"
```

### Test NFT Verification
```bash
curl "http://localhost:3000/api/nft/verify?chain=solana&address=YOUR_NFT_ADDRESS"
```

### Test Social Sharing
```bash
curl -X POST http://localhost:3000/api/social/share \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "discord",
    "discordWebhook": "YOUR_WEBHOOK",
    "nftData": {
      "title": "My NFT",
      "description": "Test NFT",
      "imageUrl": "https://example.com/image.jpg"
    }
  }'
```

## Troubleshooting

### Common Issues

**Issue: "Cannot find module"**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules
npm install
```

**Issue: Environment variables not loaded**
```bash
# Verify .env.local exists in root directory
ls -la .env.local

# Restart dev server
npm run dev
```

**Issue: CORS errors**
```
// Check next.config.js headers configuration
// Add allowed origins to remotePatterns
```

**Issue: API key invalid**
```bash
# Verify key is correct:
# 1. Copy directly from service dashboard
# 2. Check for extra spaces
# 3. Restart dev server
```

**Issue: Port 3000 already in use**
```bash
# Use different port
npm run dev -- -p 3001
```

### Debug Mode

```bash
# Run with verbose logging
DEBUG=* npm run dev

# Check Mixpanel initialization
// In browser console
console.log(window.mixpanel);
```

### Getting Help

1. Check logs: `npm run dev` console output
2. Check Network tab in DevTools
3. Check browser console for errors
4. Review API response payloads
5. Enable debug mode

## Next Steps

1. ✅ Follow setup above
2. ✅ Create `.env.local` with API keys
3. ✅ Run `npm install && npm run dev`
4. ✅ Test each integration
5. ✅ Deploy to Vercel
6. ✅ Share with team!

## Support

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **API Service Docs**:
  - nft.storage: https://nft.storage/docs
  - Mixpanel: https://mixpanel.com/help
  - OpenSea: https://docs.opensea.io
  - Telegram: https://core.telegram.org/bots/api
  - Discord: https://discord.com/developers/docs

---

**Setup Time: ~20 minutes** ⏱️

All services are **completely free** to get started! 🎉
