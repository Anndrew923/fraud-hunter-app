import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '@/lib/services/dashboardService';

export async function GET(request: NextRequest) {
  try {
    const data = await dashboardService.getDashboardData();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 分鐘快取
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Dashboard API 錯誤:', error);
    
    return NextResponse.json(
      {
        stats: {
          newCases: 500,
          totalLoss: '2.5億',
          queryCount: 1000,
          accuracyRate: 95,
          lastUpdated: new Date().toISOString(),
        },
        source: 'fallback',
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      },
      {
        status: 200, // 即使出錯也返回預設資料
        headers: {
          'Cache-Control': 'public, max-age=60', // 1 分鐘快取
        },
      }
    );
  }
}

// 支援 CORS 預檢請求
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
