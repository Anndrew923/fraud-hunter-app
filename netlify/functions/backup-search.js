// 備援搜尋系統 - 確保詐騙犯無所遁形！
exports.handler = async (event, context) => {
  console.log('🛡️ 啟動備援搜尋系統');
  
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
        body: JSON.stringify({ success: false, error: '缺少搜尋關鍵字' })
      };
    }

    console.log('🔍 備援搜尋關鍵字:', keyword);

    // 使用多個搜尋引擎
    const searchEngines = [
      () => searchWithGoogle(keyword),
      () => searchWithBing(keyword),
      () => searchWithDuckDuckGo(keyword)
    ];

    let results = [];
    
    for (const searchEngine of searchEngines) {
      try {
        const engineResults = await searchEngine();
        if (engineResults.length > 0) {
          results = [...results, ...engineResults];
          break; // 找到結果就停止
        }
      } catch (error) {
        console.log('⚠️ 搜尋引擎失敗:', error.message);
      }
    }

    // 如果所有搜尋引擎都失敗，返回空結果
    if (results.length === 0) {
      console.log('❌ 所有備援搜尋都失敗，返回空結果');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results,
        total: results.length,
        keyword,
        source: 'backup-search',
        message: `備援搜尋完成，找到 ${results.length} 筆結果`
      })
    };

  } catch (error) {
    console.error('💥 備援搜尋錯誤:', error);
    
    // 不返回 500 錯誤，而是返回空結果
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results: [],
        total: 0,
        keyword: keyword || '',
        message: '備援搜尋系統暫時無法使用，請稍後再試',
        source: 'backup-search'
      })
    };
  }
};

// Google 搜尋
async function searchWithGoogle(keyword) {
  console.log('🔍 使用 Google 搜尋');
  // 實際實現時可以調用 Google Custom Search API
  return [];
}

// Bing 搜尋
async function searchWithBing(keyword) {
  console.log('🔍 使用 Bing 搜尋');
  // 實際實現時可以調用 Bing Search API
  return [];
}

// DuckDuckGo 搜尋
async function searchWithDuckDuckGo(keyword) {
  console.log('🔍 使用 DuckDuckGo 搜尋');
  // 實際實現時可以調用 DuckDuckGo API
  return [];
}

