# 🧪 NFT AR Mask dApp - Integration Testing Guide

## Testing Overview

This guide walks you through testing each integration to ensure everything works before deployment.

## Pre-Test Checklist

- [ ] All API keys added to `.env.local`
- [ ] `npm install` completed
- [ ] Dev server running: `npm run dev`
- [ ] No console errors
- [ ] Browser DevTools open (F12)

---

## 1. Analytics Integration Test

### Test Mixpanel

**Time: 5 minutes**

1. **Open browser console** (F12 → Console tab)

2. **Initialize Mixpanel:**
   ```javascript
   const { initializeMixpanel } = await import('/src/lib/integrations/analytics.js');
   await initializeMixpanel();
   ```

3. **Track test event:**
   ```javascript
   const { trackEvent } = await import('/src/lib/integrations/analytics.js');
   trackEvent({
     name: 'test_event',
     properties: {
       test: true,
       timestamp: new Date().toISOString()
     }
   });
   ```

4. **Verify in Mixpanel Dashboard:**
   - Visit https://mixpanel.com → Your Project
   - Go to "Events" tab
   - Look for "test_event" in live feed
   - ✅ Should appear within 10 seconds

5. **Expected Result:**
   ```
   ✅ Event tracked: test_event
   📊 Event tracked: test_event
   ```

### Test Event Tracking

```javascript
// Test different event types
const { trackNFTGeneration, trackARView, trackSocialShare } = 
  await import('/src/lib/integrations/analytics.js');

// Test NFT generation tracking
trackNFTGeneration({
  maskType: 'animal',
  style: 'cyberpunk',
  duration: 2500
});

// Test AR view tracking
trackARView('nft_123');

// Test social share tracking
trackSocialShare('twitter', 'nft_456');
```

**Expected in Mixpanel:**
- nft_generated
- ar_view_opened
- social_shared

---

## 2. Storage Integration Test

### Test nft.storage Upload

**Time: 10 minutes**

1. **Create test file:**
   ```javascript
   // In browser console
   const canvas = document.createElement('canvas');
   canvas.width = 256;
   canvas.height = 256;
   const ctx = canvas.getContext('2d');
   ctx.fillStyle = '#ff00ff';
   ctx.fillRect(0, 0, 256, 256);
   
   canvas.toBlob(async (blob) => {
     // blob is ready to upload
     console.log('Test blob created:', blob);
   });
   ```

2. **Upload via API:**
   ```bash
   curl -X POST http://localhost:3000/api/storage/upload \
     -F "file=@test-image.jpg" \
     -F "metadata={\"name\":\"Test NFT\",\"description\":\"Test\"}"
   ```

3. **Expected Response:**
   ```json
   {
     "success": true,
     "data": {
       "ipfsHash": "QmXxxxx...",
       "url": "https://nft.storage/QmXxxxx...",
       "timestamp": "2024-01-15T10:30:00.000Z"
     }
   }
   ```

4. **Verify File:**
   - Visit returned URL in browser
   - Image should load ✅
   - Try accessing in 24 hours (persistence test)

### Test Storage Quota

```javascript
const { checkStorageQuota } = await import('/src/lib/integrations/storage.js');
const quota = await checkStorageQuota();
console.log('Storage used:', quota.used, 'bytes');
```

**Expected Output:**
```
✅ Storage quota check complete
{ used: 1024000, available: Infinity }
```

---

## 3. On-Chain Verification Test

### Test Solana NFT Verification

**Time: 5 minutes**

1. **Get a test Solana NFT address** (from Solscan or Magic Eden)
   - Example: `EzzzHkBuJYbK1...`

2. **Test via API:**
   ```bash
   curl "http://localhost:3000/api/nft/verify?chain=solana&address=YOUR_NFT_ADDRESS"
   ```

3. **Expected Response:**
   ```json
   {
     "success": true,
     "data": {
       "isValid": true,
       "verified": true,
       "source": "solana",
       "address": "...",
       "metadata": {
         "name": "NFT Name",
         "description": "NFT Description",
         "image": "https://..."
       }
     }
   }
   ```

### Test Ethereum NFT Verification

**Time: 5 minutes**

1. **Get test Ethereum contract:**
   - Visit OpenSea.io
   - Find any NFT
   - Get contract address & token ID

2. **Test via API:**
   ```bash
   curl "http://localhost:3000/api/nft/verify?chain=ethereum&address=0x1234...&tokenId=1"
   ```

3. **Expected Response:**
   - Should return NFT metadata
   - Should include image URL
   - Should include owner info ✅

### Test Batch Verification

```javascript
const { batchVerifyNFTs } = await import('/src/lib/integrations/onchain.js');

const nfts = [
  { address: 'solana_address_1', chain: 'solana' },
  { address: 'solana_address_2', chain: 'solana' }
];

const results = await batchVerifyNFTs(nfts);
console.log('Verification results:', results);
```

---

## 4. Social Sharing Test

### Test Discord Webhook

**Time: 3 minutes**

1. **Test via API:**
   ```bash
   curl -X POST http://localhost:3000/api/social/share \
     -H "Content-Type: application/json" \
     -d '{
       "platform": "discord",
       "discordWebhook": "YOUR_WEBHOOK_URL",
       "nftData": {
         "title": "Test NFT",
         "description": "This is a test NFT",
         "imageUrl": "https://via.placeholder.com/256"
       }
     }'
   ```

2. **Expected Result:**
   - Message appears in Discord channel ✅
   - Includes image embed
   - Includes title and description

### Test Telegram

**Time: 3 minutes**

1. **Get bot token and chat ID** (from setup)

2. **Test via API:**
   ```bash
   curl -X POST http://localhost:3000/api/social/share \
     -H "Content-Type: application/json" \
     -d '{
       "platform": "telegram",
       "telegramBot": "YOUR_BOT_TOKEN",
       "telegramChat": "YOUR_CHAT_ID",
       "nftData": {
         "title": "Test NFT",
         "description": "Test description",
         "imageUrl": "https://via.placeholder.com/256"
       }
     }'
   ```

2. **Expected Result:**
   - Photo message in Telegram chat ✅
   - Caption shows title & description

### Test Twitter Share

```javascript
// Twitter uses client-side share only
const { shareToTwitter } = await import('/src/lib/integrations/social.js');

shareToTwitter(
  'Check out my NFT! #NFT #Web3',
  'https://image-url.jpg',
  ['NFT', 'Web3', 'Crypto']
);

// Should open Twitter intent window
```

---

## 5. End-to-End Integration Test

### Complete Workflow Test

**Time: 15 minutes**

1. **Generate & Store NFT:**
   ```javascript
   // 1. Create canvas NFT
   const canvas = document.createElement('canvas');
   canvas.width = 512;
   canvas.height = 512;
   const ctx = canvas.getContext('2d');
   
   // Draw something
   ctx.fillStyle = '#00ff00';
   ctx.fillRect(0, 0, 512, 512);
   
   // 2. Convert to blob
   canvas.toBlob(async (blob) => {
     // 3. Upload to storage
     const formData = new FormData();
     formData.append('file', blob, 'nft.png');
     formData.append('metadata', JSON.stringify({
       name: 'My Generated NFT',
       description: 'Generated with AR Mask'
     }));
     
     const response = await fetch('/api/storage/upload', {
       method: 'POST',
       body: formData
     });
     
     const result = await response.json();
     console.log('NFT stored at:', result.data.url);
     
     // Save ipfsHash for later
     const { ipfsHash } = result.data;
   });
   ```

2. **Share Generated NFT:**
   ```javascript
   // Share to all platforms
   const shareRequest = {
     platform: 'discord',
     discordWebhook: process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL,
     nftData: {
       title: 'My Generated NFT',
       description: 'Generated with NFT AR Mask',
       imageUrl: 'https://nft.storage/' + ipfsHash,
       externalUrl: `${window.location.origin}/nft/${ipfsHash}`
     }
   };
     
   const response = await fetch('/api/social/share', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(shareRequest)
   });
   
   console.log('Shared!');
   ```

3. **Verify Analytics:**
   - Check Mixpanel for events ✅
   - Should see: nft_generated, social_shared

---

## 6. Performance Test

### Measure Integration Performance

```javascript
// Measure storage upload speed
const startTime = performance.now();

// ... perform upload ...

const endTime = performance.now();
const duration = endTime - startTime;
console.log(`Upload took ${duration}ms`);
```

**Expected Performance:**
- Storage upload: < 5 seconds (< 10MB file)
- NFT verification: < 2 seconds
- Analytics tracking: < 100ms
- Social share: < 1 second

---

## 7. Error Handling Test

### Test Error Scenarios

**Invalid File Upload:**
```bash
# 100MB+ file (should fail)
curl -X POST http://localhost:3000/api/storage/upload \
  -F "file=@huge-file.bin"
```

**Expected Error:**
```json
{
  "error": "File size exceeds 100MB limit"
}
```

**Invalid NFT Address:**
```bash
curl "http://localhost:3000/api/nft/verify?chain=solana&address=invalid"
```

**Expected Error:**
```json
{
  "isValid": false,
  "verified": false
}
```

**Missing Webhook:**
```bash
curl -X POST http://localhost:3000/api/social/share \
  -H "Content-Type: application/json" \
  -d '{"platform": "discord"}'
```

**Expected Error:**
```json
{
  "error": "Discord webhook URL is required"
}
```

---

## Test Results Checklist

- [ ] **Analytics** - Events appear in Mixpanel
- [ ] **Storage** - Files upload and URL works
- [ ] **Solana** - NFT verification returns data
- [ ] **Ethereum** - NFT verification returns data
- [ ] **Discord** - Message posts to channel
- [ ] **Telegram** - Photo posts to chat
- [ ] **Twitter** - Share intent opens
- [ ] **E2E** - Full workflow completes
- [ ] **Performance** - All operations < 5s
- [ ] **Error Handling** - Proper error responses

---

## Monitoring in Production

### Set Up Alerts

1. **Mixpanel Alerts:**
   - Go to Project Settings
   - Set up error event alerts
   - Get notified if tracking fails

2. **nft.storage Monitoring:**
   - Monitor uploads monthly
   - Set storage quota alerts

3. **API Health:**
   - Monitor endpoint response times
   - Track error rates
   - Use Sentry or similar

---

## Common Test Issues

| Issue | Solution |
|-------|----------|
| API returns 401 | Check API key is valid and in `.env.local` |
| File upload fails | Verify file size < 100MB, correct Content-Type |
| Webhook not working | Test URL directly with curl, check Discord permissions |
| NFT verify returns false | Verify address is correct, network matches |
| No Mixpanel events | Check token is correct, browser console for errors |

---

## Debugging Commands

```bash
# Check environment variables loaded
echo $NEXT_PUBLIC_NFT_STORAGE_KEY

# Test API endpoint
curl http://localhost:3000/api/storage/upload

# Check Next.js build
npm run build

# Type check
npm run type-check

# View dev server logs
npm run dev 2>&1 | grep -E "(error|warn|INFO)"
```

---

## Deployment Testing

Before pushing to production:

1. Run full test suite
2. Test all integrations
3. Check performance
4. Verify error handling
5. Test on different browsers/devices

```bash
# Build production bundle
npm run build

# Test production build
npm start

# Run all tests
npm run test
```

---

✅ **All tests passing? You're ready to deploy!**
