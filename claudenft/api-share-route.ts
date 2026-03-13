// src/app/api/social/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  shareToDiscord,
  shareToTelegram,
  trackShareEngagement,
} from '@/lib/integrations/social';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, nftData, discordWebhook, telegramBot, telegramChat, nftId } = body;

    if (!platform || !nftData) {
      return NextResponse.json(
        { error: 'Platform and NFT data are required' },
        { status: 400 }
      );
    }

    let result;

    switch (platform.toLowerCase()) {
      case 'discord':
        if (!discordWebhook) {
          return NextResponse.json(
            { error: 'Discord webhook URL is required' },
            { status: 400 }
          );
        }

        const discordMessage = {
          username: 'NFT AR Mask Generator',
          embeds: [
            {
              title: nftData.title,
              description: nftData.description,
              image: {
                url: nftData.imageUrl,
              },
              url: nftData.externalUrl || '',
              color: 5814783,
              fields: [
                {
                  name: 'Platform',
                  value: 'NFT AR Mask',
                  inline: true,
                },
              ],
            },
          ],
        };

        result = await shareToDiscord(discordWebhook, discordMessage);
        break;

      case 'telegram':
        if (!telegramBot || !telegramChat) {
          return NextResponse.json(
            { error: 'Telegram bot token and chat ID are required' },
            { status: 400 }
          );
        }

        const telegramMessage = {
          photo_url: nftData.imageUrl,
          caption: `<b>${nftData.title}</b>\n\n${nftData.description}`,
          reply_markup: nftData.externalUrl
            ? {
                inline_keyboard: [
                  [
                    {
                      text: 'View NFT',
                      url: nftData.externalUrl,
                    },
                  ],
                ],
              }
            : undefined,
        };

        result = await shareToTelegram(telegramBot, telegramChat, telegramMessage);
        break;

      case 'twitter':
        // Twitter is client-side only (no API key needed)
        result = {
          success: true,
          platform: 'twitter',
          message: 'Twitter share opened in new window',
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported platform' },
          { status: 400 }
        );
    }

    // Track engagement if nftId provided
    if (nftId) {
      try {
        await trackShareEngagement(nftId, platform, 'share');
      } catch (error) {
        console.error('Failed to track engagement:', error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        platform,
        data: result,
        message: `Shared to ${platform} successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Social share error:', error);
    return NextResponse.json(
      {
        error: 'Failed to share NFT',
        message: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const nftId = searchParams.get('nftId');
    const platform = searchParams.get('platform');

    if (action === 'track' && nftId && platform) {
      await trackShareEngagement(nftId, platform, 'view');

      return NextResponse.json(
        {
          success: true,
          message: 'Engagement tracked',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Social share API is ready',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Social tracking error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: String(error),
      },
      { status: 500 }
    );
  }
}
