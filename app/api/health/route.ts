import { NextResponse } from 'next/server';
import { getStats } from '@/lib/store';

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    const stats = getStats();
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL ? 'vercel' : 'development',
      stats: {
        totalLogs: stats.totalLogs,
        totalSessions: stats.totalSessions
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Health check failed' },
      { status: 500 }
    );
  }
}
