// src/lib/integrations/social.ts
import axios from 'axios';

interface ShareResult {
  success: boolean;
  platform: 'twitter' | 'discord' | 'telegram';
  messageId?: string;
  url?: string;
  error?: string;
  timestamp: string;
}

// Twitter/X Sharing
export const shareToTwitter = async (
  text: string,
  imageUrl?: string,
  hashtags: string[] = []
): Promise<ShareResult> => {
  try {
    // Direct Twitter intent (client-side, no API key needed)
    const hashtagString = hashtags.length > 0 ? ` ${hashtags.map((tag) => `#${tag}`).join(' ')}` : '';
    const tweetText = encodeURIComponent(`${text}${hashtagString}`);
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

    if (typeof window !== 'undefined') {
      window.open(twitterUrl, '_blank', 'width=600,height=400');
    }

    console.log('✅ Twitter share intent opened');
    return {
      success: true,
      platform: 'twitter',
      url: twitterUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Twitter sharing failed:', error);
    return {
      success: false,
      platform: 'twitter',
      error: String(error),
      timestamp: new Date().toISOString(),
    };
  }
};

// Discord Webhook Sharing
export const shareToDiscord = async (
  webhookUrl: string,
  message: {
    username?: string;
    avatar_url?: string;
    content?: string;
    embeds?: Array<{
      title: string;
      description: string;
      image: { url: string };
      url: string;
      color: number;
      fields?: Array<{ name: string; value: string; inline: boolean }>;
    }>;
  }
): Promise<ShareResult> => {
  try {
    const response = await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Message shared to Discord');
    return {
      success: true,
      platform: 'discord',
      messageId: response.data?.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Discord sharing failed:', error);
    return {
      success: false,
      platform: 'discord',
      error: String(error),
      timestamp: new Date().toISOString(),
    };
  }
};

// Telegram Bot Sharing
export const shareToTelegram = async (
  botToken: string,
  chatId: string,
  message: {
    text?: string;
    photo_url?: string;
    caption?: string;
    reply_markup?: any;
  }
): Promise<ShareResult> => {
  try {
    let response;

    if (message.photo_url) {
      // Share as photo with caption
      response = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        {
          chat_id: chatId,
          photo: message.photo_url,
          caption: message.caption || message.text,
          parse_mode: 'HTML',
          reply_markup: message.reply_markup,
        }
      );
    } else {
      // Share as text message
      response = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: message.text,
          parse_mode: 'HTML',
          reply_markup: message.reply_markup,
        }
      );
    }

    console.log('✅ Message shared to Telegram');
    return {
      success: true,
      platform: 'telegram',
      messageId: response.data?.result?.message_id?.toString(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Telegram sharing failed:', error);
    return {
      success: false,
      platform: 'telegram',
      error: String(error),
      timestamp: new Date().toISOString(),
    };
  }
};

// Share NFT to multiple platforms at once
export const shareNFT = async (
  nftData: {
    title: string;
    description: string;
    imageUrl: string;
    externalUrl?: string;
    hashtags?: string[];
  },
  platforms: {
    twitter?: boolean;
    discord?: { webhookUrl: string };
    telegram?: { botToken: string; chatId: string };
  }
): Promise<ShareResult[]> => {
  const results: ShareResult[] = [];

  // Twitter
  if (platforms.twitter) {
    const twitterResult = await shareToTwitter(
      `Check out my new NFT: ${nftData.title}\n\n${nftData.description}\n\n${nftData.externalUrl || ''}`,
      nftData.imageUrl,
      nftData.hashtags
    );
    results.push(twitterResult);
  }

  // Discord
  if (platforms.discord) {
    const discordMessage = {
      username: 'NFT AR Mask Generator',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      embeds: [
        {
          title: nftData.title,
          description: nftData.description,
          image: {
            url: nftData.imageUrl,
          },
          url: nftData.externalUrl || '',
          color: 5814783, // Cyan color
          fields: [
            {
              name: 'Platform',
              value: 'NFT AR Mask',
              inline: true,
            },
            {
              name: 'Type',
              value: 'Generated NFT',
              inline: true,
            },
          ],
        },
      ],
    };

    const discordResult = await shareToDiscord(platforms.discord.webhookUrl, discordMessage);
    results.push(discordResult);
  }

  // Telegram
  if (platforms.telegram) {
    const telegramMessage = {
      photo_url: nftData.imageUrl,
      caption: `<b>${nftData.title}</b>\n\n${nftData.description}\n\n${nftData.externalUrl || ''}`,
      reply_markup: {
        inline_keyboard: nftData.externalUrl
          ? [
              [
                {
                  text: 'View NFT',
                  url: nftData.externalUrl,
                },
              ],
            ]
          : undefined,
      },
    };

    const telegramResult = await shareToTelegram(
      platforms.telegram.botToken,
      platforms.telegram.chatId,
      telegramMessage
    );
    results.push(telegramResult);
  }

  return results;
};

// Generate shareable link
export const generateShareableLink = (nftId: string, baseUrl: string = ''): string => {
  const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://nft-ar-mask.com');
  return `${url}/nft/${nftId}`;
};

// Share via native share API (mobile)
export const shareNFTNative = async (
  nftData: {
    title: string;
    description: string;
    imageUrl: string;
    externalUrl?: string;
  }
): Promise<boolean> => {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: nftData.title,
        text: nftData.description,
        url: nftData.externalUrl || window.location.href,
      });
      console.log('✅ Native share successful');
      return true;
    } else {
      console.log('⚠️ Native share not supported on this device');
      return false;
    }
  } catch (error) {
    console.error('❌ Native share failed:', error);
    return false;
  }
};

// Generate QR code for sharing
export const generateShareQRCode = (nftId: string, baseUrl: string = ''): string => {
  const shareLink = generateShareableLink(nftId, baseUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareLink)}`;
};

// Track share engagement
export const trackShareEngagement = async (
  nftId: string,
  platform: string,
  engagementType: 'view' | 'click' | 'share'
): Promise<void> => {
  try {
    await axios.post('/api/social/engagement', {
      nftId,
      platform,
      engagementType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to track engagement:', error);
  }
};

// Get social preview metadata (OG tags)
export const generateSocialPreviewMetadata = (
  nftData: {
    title: string;
    description: string;
    imageUrl: string;
    externalUrl?: string;
  }
) => {
  return {
    'og:title': nftData.title,
    'og:description': nftData.description,
    'og:image': nftData.imageUrl,
    'og:url': nftData.externalUrl,
    'og:type': 'website',
    'twitter:card': 'summary_large_image',
    'twitter:title': nftData.title,
    'twitter:description': nftData.description,
    'twitter:image': nftData.imageUrl,
  };
};

export { ShareResult };
