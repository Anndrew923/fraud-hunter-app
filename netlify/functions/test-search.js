// 簡化版測試搜尋 Function
exports.handler = async (event, context) => {
  // 處理 CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    console.log('測試搜尋 Function 被調用');
    console.log('請求方法:', event.httpMethod);
    console.log('請求體:', event.body);

    const { keyword } = JSON.parse(event.body || '{}');

    if (!keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '缺少搜尋關鍵字',
        }),
      };
    }

    // 返回測試結果
    const mockResults = [
      {
        caseTitle: `測試案件 - ${keyword}`,
        caseNumber: '測試-001',
        court: '測試法院',
        judgmentDate: '2024-01-01',
        summary: '這是一個測試結果',
        riskScore: 75,
        detailUrl: 'https://example.com/detail/1'
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results: mockResults,
        total: mockResults.length,
        keyword,
        message: '測試搜尋成功'
      }),
    };

  } catch (error) {
    console.error('測試搜尋失敗:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack,
      }),
    };
  }
};
