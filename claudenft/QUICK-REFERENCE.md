# 🚀 NFT AR Mask dApp - Quick Reference Card

## Setup in 5 Steps

```bash
1. npm install
2. cp .env.local.example .env.local
3. Get 4 free API keys (20 min) ⬇️
4. npm run dev
5. http://localhost:3000 ✅
```

---

## Get Free API Keys (20 minutes)

| Service | Link | Free Tier | Time |
|---------|------|-----------|------|
| **Mixpanel** | https://mixpanel.com | 100K events/month | 5 min |
| **nft.storage** | https://nft.storage | ♾️ Unlimited | 5 min |
| **Discord Webhook** | Discord Server | ♾️ Unlimited | 3 min |
| **Telegram Bot** | @BotFather | ♾️ Unlimited | 3 min |
| **OpenSea** (optional) | https://docs.opensea.io | Free tier | 2 min |
| **Alchemy** (optional) | https://alchemy.com | Free tier | 2 min |

---

## Environment Variables Template

```env
# Analytics (Required)
NEXT_PUBLIC_MIXPANEL_TOKEN=your_token

# Storage (Required)
NEXT_PUBLIC_NFT_STORAGE_KEY=your_key

# Social (Optional)
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=your_webhook
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_token
NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id

# Optional
OPENSEA_API_KEY=your_key
ALCHEMY_API_KEY=your_key
```

---

## Core Integrations

### 📊 Analytics
```typescript
import { trackEvent, trackNFTGeneration } from '@/lib/integrations/analytics';

trackEvent({ name: 'my_event', properties: { key: 'value' } });
trackNFTGeneration({ maskType: 'animal', duration: 2500 });
```

### 💾 Storage
```typescript
import { uploadNFTAsset } from '@/lib/integrations/storage';

const result = await uploadNFTAsset(file, metadata);
// Returns: { ipfsHash, url, pinataHash, arweaveHash }
```

### 🔗 NFT Verification
```typescript
import { verifySolanaNFT, verifyEthereumNFT } from '@/lib/integrations/onchain';

const nft = await verifySolanaNFT(address);
const nft = await verifyEthereumNFT(contractAddress, tokenId);
```

### 🚀 Social Sharing
```typescript
import { shareNFT, shareToTwitter } from '@/lib/integrations/social';

await shareNFT(nftData, { twitter: true, discord: { webhookUrl } });
shareToTwitter('Check out my NFT!', imageUrl, ['NFT', 'Web3']);
```

---

## API Endpoints

```bash
# Track analytics event
POST /api/analytics/track
{ "name": "event_name", "properties": {...} }

# Upload NFT file
POST /api/storage/upload
FormData: file, metadata

# Verify NFT
GET/POST /api/nft/verify
?chain=solana&address=xxx&tokenId=yyy

# Share on social
POST /api/social/share
{ "platform": "discord", "nftData": {...} }
```

---

## Common Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run type-check       # TypeScript check
npm start                # Run production build
```

---

## File Structure Cheatsheet

```
src/
├── lib/integrations/     # Core integrations
│   ├── analytics.ts
│   ├── storage.ts
│   ├── onchain.ts
│   └── social.ts
├── app/api/              # API routes
│   ├── analytics/
│   ├── storage/
│   ├── nft/
│   └── social/
├── components/pages/     # Page components
└── types/                # TypeScript definitions
```

---

## Debugging Tips

```javascript
// Browser console
const { trackEvent } = await import('@/lib/integrations/analytics.js');
trackEvent({ name: 'test' });

// Check Mixpanel
console.log(window.mixpanel);

// Check environment
console.log(process.env);

// API test
fetch('/api/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'test_event' })
});
```

---

## Testing Checklist

- [ ] Analytics events appear in Mixpanel
- [ ] File uploads to nft.storage
- [ ] NFT verification returns data
- [ ] Discord webhook posts message
- [ ] Telegram bot sends photo
- [ ] All API routes return 200
- [ ] Build completes without errors

---

## Error Codes Reference

| Code | Meaning | Fix |
|------|---------|-----|
| 400 | Bad Request | Check required parameters |
| 401 | Unauthorized | Check API key/token |
| 413 | File Too Large | Use file < 100MB |
| 500 | Server Error | Check logs, retry |
| Network Error | Connection failed | Check internet, API status |

---

## Performance Targets

| Operation | Target | Acceptable |
|-----------|--------|-----------|
| Upload file | < 3s | < 5s |
| Verify NFT | < 2s | < 3s |
| Track event | < 100ms | < 500ms |
| Share social | < 1s | < 2s |

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars in dashboard
# Redeploy
```

---

## Useful Links

- [Full Setup Guide](./SETUP-GUIDE.md)
- [Testing Guide](./TESTING-GUIDE.md)
- [Main README](./README.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

---

## Quick Troubleshooting

**"Cannot find module"**
```bash
rm -rf node_modules && npm install
```

**"API key not working"**
- Restart dev server
- Verify key in .env.local
- Check key hasn't expired

**"Port 3000 in use"**
```bash
npm run dev -- -p 3001
```

**"Type errors"**
```bash
npm run type-check
```

**"Build fails"**
```bash
npm run build 2>&1
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `.env.local` | Your API keys (CREATE THIS!) |
| `src/lib/integrations/` | Core functionality |
| `src/app/api/` | API endpoints |
| `package.json` | Dependencies |
| `next.config.js` | Next.js configuration |
| `tailwind.config.js` | Tailwind setup |

---

## Team Setup (Multiple Devs)

```bash
# Dev 1: Initial setup
git init
git add .
git commit -m "Initial commit"
git push

# Dev 2: Join project
git clone https://github.com/yourusername/nft-ar-mask-dapp.git
npm install
cp .env.local.example .env.local
# Add their own API keys
npm run dev
```

---

## Production Checklist

- [ ] All env vars set in Vercel
- [ ] .env.local NOT in git (in .gitignore)
- [ ] npm run build passes
- [ ] All APIs tested
- [ ] Analytics events tracked
- [ ] Error handling works
- [ ] Performance acceptable
- [ ] Security reviewed

---

## Support Resources

**Got stuck?**
1. Check SETUP-GUIDE.md
2. Check TESTING-GUIDE.md
3. Review API service docs
4. Check GitHub issues
5. Join Web3 communities

---

## Version Info

- **Node**: 16+ (18+ recommended)
- **npm**: 8+
- **Next.js**: 14.0
- **React**: 18.2
- **TypeScript**: 5.3

---

**Bookmark this page for quick reference!** 🔖

Made with ❤️ | v1.0.0 | Production Ready ✅
