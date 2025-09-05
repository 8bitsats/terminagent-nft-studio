import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { pumpFunMonitor } from '@/lib/pumpfun-monitor';

export async function GET() {
  try {
    const stats = pumpFunMonitor.getStats();
    const recentLaunches = pumpFunMonitor.getRecentLaunches(10);
    const recentTrades = pumpFunMonitor.getAllRecentTrades().slice(-20);
    const isMonitoring = pumpFunMonitor.isCurrentlyMonitoring();

    return NextResponse.json({
      stats,
      recentLaunches,
      recentTrades,
      isMonitoring,
      success: true
    });
  } catch (error) {
    console.error('PumpFun API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch PumpFun data',
        stats: {
          totalTokensLaunched: 0,
          totalTrades: 0,
          recentTrades: 0,
          hourlyBuyVolume: 0,
          hourlySellVolume: 0,
          totalHourlyVolume: 0
        },
        recentLaunches: [],
        recentTrades: [],
        isMonitoring: false,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action || (action !== 'start' && action !== 'stop')) {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }

    if (action === 'start') {
      await pumpFunMonitor.startMonitoring();
    } else {
      pumpFunMonitor.stopMonitoring();
    }

    return NextResponse.json({
      success: true,
      isMonitoring: pumpFunMonitor.isCurrentlyMonitoring(),
      message: `Monitor ${action}ed successfully`
    });
  } catch (error) {
    console.error('PumpFun control error:', error);
    return NextResponse.json(
      { error: 'Failed to control PumpFun monitor' },
      { status: 500 }
    );
  }
}
