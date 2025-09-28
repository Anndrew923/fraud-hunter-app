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

    // 只返回空結果，不使用模擬資料
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results: [],
        total: 0,
        keyword,
        message: '未找到相關判決書記錄',
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
