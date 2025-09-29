// 司法判決書詳細內容 Function - 最穩定的詳細內容獲取
// 直接實現詳細內容獲取邏輯，避免TypeScript依賴問題

exports.handler = async (event, context) => {
  // 設定 CORS 標頭
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 處理 OPTIONS 請求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // 只處理 POST 請求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: '只支援 POST 請求' 
      })
    };
  }

  try {
    console.log('🔍 啟動司法判決書詳細內容 Function');
    
    // 解析請求參數
    const { detailUrl } = JSON.parse(event.body || '{}');
    console.log('📋 詳細內容URL:', detailUrl);

    // 驗證必要參數
    if (!detailUrl || detailUrl.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '請提供詳細內容URL'
        })
      };
    }

    // 獲取詳細內容
    console.log('📖 開始獲取詳細內容...');
    const detail = await getJudgmentDetail(detailUrl);
    
    console.log('✅ 詳細內容獲取成功');

    // 返回結果
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        detail,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ 獲取詳細內容失敗:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || '獲取詳細內容過程中發生錯誤',
        timestamp: new Date().toISOString()
      })
    };
  }
};
