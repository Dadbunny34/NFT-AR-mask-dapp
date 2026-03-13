// src/lib/integrations/analytics.ts
import { AnalyticsEvent, AnalyticsConfig } from '@/types/analytics';

// Analytics Configuration
const config: AnalyticsConfig = {
  mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '',
  environment: process.env.NODE_ENV || 'development',
};

// Initialize Mixpanel
let mixpanelInstance: any = null;

export const initializeMixpanel = async () => {
  if (typeof window === 'undefined' || !config.mixpanelToken) return;
  
  try {
    const mixpanel = await import('mixpanel-browser');
    mixpanel.init(config.mixpanelToken, {
      track_pageview: true,
      persistence: 'localStorage',
    });
    mixpanelInstance = mixpanel;
    console.log('✅ Mixpanel initialized');
  } catch (error) {
    console.error('❌ Mixpanel initialization failed:', error);
  }
};

// Track Event Function
export const trackEvent = async (event: AnalyticsEvent) => {
  try {
    // Track in Mixpanel
    if (mixpanelInstance) {
      mixpanelInstance.track(event.name, {
        ...event.properties,
        timestamp: new Date().toISOString(),
        environment: config.environment,
      });
    }

    // Track in Plausible
    if (config.plausibleDomain && typeof window !== 'undefined') {
      await fetch('https://plausible.io/api/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: config.plausibleDomain,
          name: event.name,
          url: window.location.href,
          props: event.properties,
        }),
      });
    }

    // Log to server for backup
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

    console.log(`📊 Event tracked: ${event.name}`);
  } catch (error) {
    console.error('❌ Failed to track event:', error);
  }
};

// User Identification
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (mixpanelInstance) {
    mixpanelInstance.identify(userId);
    if (properties) {
      mixpanelInstance.people.set(properties);
    }
  }
};

// Session Management
export const startSession = () => {
  trackEvent({
    name: 'session_start',
    properties: {
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      timestamp: new Date().toISOString(),
    },
  });
};

export const endSession = () => {
  trackEvent({
    name: 'session_end',
    properties: {
      timestamp: new Date().toISOString(),
    },
  });
};

// NFT Generation Analytics
export const trackNFTGeneration = (metadata: {
  maskType: string;
  style: string;
  duration: number;
}) => {
  trackEvent({
    name: 'nft_generated',
    properties: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  });
};

// AR View Analytics
export const trackARView = (nftId: string) => {
  trackEvent({
    name: 'ar_view_opened',
    properties: {
      nftId,
      timestamp: new Date().toISOString(),
    },
  });
};

// Social Share Analytics
export const trackSocialShare = (platform: 'twitter' | 'discord' | 'telegram', nftId: string) => {
  trackEvent({
    name: 'social_shared',
    properties: {
      platform,
      nftId,
      timestamp: new Date().toISOString(),
    },
  });
};

// Error Tracking
export const trackError = (error: Error, context: string) => {
  trackEvent({
    name: 'error_occurred',
    properties: {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    },
  });
};

// Performance Metrics
export const trackPerformanceMetric = (metricName: string, value: number, unit: string) => {
  trackEvent({
    name: 'performance_metric',
    properties: {
      metric: metricName,
      value,
      unit,
      timestamp: new Date().toISOString(),
    },
  });
};

// Export config
export { config };
