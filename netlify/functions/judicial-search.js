// Netlify Function for 司法院法學資料檢索系統搜尋
// 使用 Node.js 18+ 內建的 fetch API

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
    console.log('收到搜尋請求:', event.body);
    
    const { keyword, court, caseType, startDate, endDate, page = 1 } = JSON.parse(event.body || '{}');

    if (!keyword) {
      console.log('錯誤: 缺少搜尋關鍵字');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: '缺少搜尋關鍵字' 
        }),
      };
    }

    console.log('開始搜尋司法院判決書:', { keyword, court, caseType, page });

    // 司法院法學資料檢索系統搜尋
    const searchUrl = 'https://arch.judicial.gov.tw/FJUD/FJUDQRY01_1.aspx';
    
    // 建立搜尋表單資料
    const formData = new URLSearchParams();
    formData.append('v_court', court || '');
    formData.append('v_sys', 'M'); // 刑事
    formData.append('jud_year', '');
    formData.append('jud_case', '');
    formData.append('jud_no', '');
    formData.append('jud_title', '');
    formData.append('keyword', keyword);
    formData.append('sdate', startDate || '');
    formData.append('edate', endDate || '');
    formData.append('jud_kind', '');
    formData.append('kw', keyword);
    formData.append('searchkw', keyword);

    console.log('🔄 嘗試連接司法院網站...');
    
    // 添加超時和重試機制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時
    
    try {
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`司法院搜尋失敗: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('司法院網站連接超時，請稍後再試');
      }
      
      console.log('⚠️ 司法院網站連接失敗:', error.message);
      // 不拋出錯誤，而是返回空結果
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          results: [],
          total: 0,
          keyword,
          message: '司法院網站暫時無法連接，請稍後再試',
          source: 'judicial-search'
        })
      };
    }

    const html = await response.text();
    console.log('取得搜尋結果 HTML，長度:', html.length);

    // 解析搜尋結果
    const results = parseSearchResults(html);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results,
        total: results.length,
        keyword,
      }),
    };

  } catch (error) {
    console.error('司法院搜尋失敗:', error);
    console.error('錯誤堆疊:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    };
  }
};

// 解析搜尋結果
function parseSearchResults(html) {
  const results = [];
  
  try {
    // 使用正則表達式解析搜尋結果表格
    const tableRegex = /<table[^>]*class="table"[^>]*>(.*?)<\/table>/s;
    const tableMatch = html.match(tableRegex);
    
    if (!tableMatch) {
      console.log('未找到搜尋結果表格');
      return results;
    }

    const tableHtml = tableMatch[1];
    
    // 解析每一行結果
    const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gs;
    const rows = tableHtml.match(rowRegex) || [];
    
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      const result = parseSearchResultRow(row, i + 1);
      if (result) {
        results.push(result);
      }
    }

    console.log(`解析完成，找到 ${results.length} 筆結果`);
    return results;
  } catch (error) {
    console.error('解析搜尋結果失敗:', error);
    return results;
  }
}

// 解析單一搜尋結果行
function parseSearchResultRow(rowHtml, serialNumber) {
  try {
    // 提取裁判字號和詳細頁面連結
    const caseNumberMatch = rowHtml.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/);
    if (!caseNumberMatch) return null;

    // 提取裁判日期
    const dateMatch = rowHtml.match(/<td[^>]*>(\d{3}\.\d{2}\.\d{2})<\/td>/);
    
    // 提取裁判案由
    const reasonMatch = rowHtml.match(/<td[^>]*>([^<]+)<\/td>/g);
    
    // 提取內容大小
    const sizeMatch = rowHtml.match(/\((\d+K)\)/);

    return {
      serialNumber,
      caseNumber: caseNumberMatch[2].trim(),
      judgmentDate: dateMatch ? dateMatch[1] : '',
      caseReason: reasonMatch && reasonMatch[1] ? reasonMatch[1].replace(/<[^>]*>/g, '').trim() : '',
      summary: '', // 需要進一步解析
      contentSize: sizeMatch ? sizeMatch[1] : '',
      detailUrl: 'https://arch.judicial.gov.tw' + caseNumberMatch[1],
    };
  } catch (error) {
    console.error('解析搜尋結果行失敗:', error);
    return null;
  }
}
