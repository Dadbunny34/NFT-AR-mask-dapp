// src/app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

// In-memory event storage (use database in production)
const events: AnalyticsEvent[] = [];

export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsEvent = await request.json();

    // Validate event
    if (!body.name) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Add timestamp if not provided
    const event = {
      ...body,
      timestamp: body.timestamp || new Date().toISOString(),
    };

    // Store event
    events.push(event);

    // Log to console
    console.log(`📊 Event tracked: ${event.name}`, event.properties);

    // In production, you would:
    // 1. Save to database
    // 2. Send to analytics service
    // 3. Trigger webhooks if needed

    return NextResponse.json(
      {
        success: true,
        eventId: `evt_${Date.now()}`,
        message: 'Event tracked successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const eventName = searchParams.get('eventName');

    let filteredEvents = events;

    if (eventName) {
      filteredEvents = events.filter((e) => e.name === eventName);
    }

    return NextResponse.json(
      {
        success: true,
        total: filteredEvents.length,
        events: filteredEvents.slice(-limit),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Failed to fetch events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
