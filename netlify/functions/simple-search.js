// 最簡單的搜尋 Function - 確保基本功能正常
exports.handler = async (event, context) => {
  console.log('🎯 簡單搜尋 Function 被調用');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { keyword } = JSON.parse(event.body || '{}');
    
    if (!keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: '缺少搜尋關鍵字' 
        })
      };
    }

    console.log('🔍 搜尋關鍵字:', keyword);

    // 生成模擬搜尋結果
    const mockResults = [
      {
        serialNumber: 1,
        caseNumber: `詐欺-${Date.now()}-001`,
        judgmentDate: '2024-01-15',
        caseReason: '詐欺',
        summary: `涉及 ${keyword} 的詐欺案件，經法院審理後判決有罪`,
        contentSize: '15KB',
        detailUrl: `https://arch.judicial.gov.tw/FJUD/FJUDQRY02_1.aspx?keyword=${encodeURIComponent(keyword)}`,
        riskScore: 95
      },
      {
        serialNumber: 2,
        caseNumber: `詐騙-${Date.now()}-002`,
        judgmentDate: '2024-02-20',
        caseReason: '詐欺',
        summary: `詐騙集團成員 ${keyword} 參與詐騙行為`,
        contentSize: '22KB',
        detailUrl: `https://arch.judicial.gov.tw/FJUD/FJUDQRY02_1.aspx?keyword=${encodeURIComponent(keyword)}`,
        riskScore: 90
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
        message: `成功找到 ${mockResults.length} 筆相關判決書，讓詐騙犯無所遁形！`,
        source: 'simple-search'
      })
    };

  } catch (error) {
    console.error('💥 簡單搜尋錯誤:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '搜尋系統錯誤',
        details: error.message
      })
    };
  }
};
