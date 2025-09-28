// 簡化的司法院搜尋 Function - 直接搜尋結果頁面
exports.handler = async (event, context) => {
  console.log('🔍 簡化司法院搜尋 Function 被調用');
  
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

    // 使用您提供的cURL請求中的完整參數
    const searchUrl = 'https://judgment.judicial.gov.tw/FJUD/default.aspx';
    console.log('🔄 使用預設參數進行搜尋...');
    
    const formData = new URLSearchParams();
    formData.append('__VIEWSTATE', 'uaUzV7jsxyKFfC6Q8kJmy3co0xqogaP/W3gE1m/706hARdy7WugrIdEBuAEPBVd95Wc70xX45cgpALNTnZ/Oi3yt7l0Z64P+sB7wpfqNcNGi0qsXV+QhUQmV8j8yKJXqu/BHbVo1yEkPzvagl78qvMRM2vdcIP2HTg/yEv323uTp/+BAY8kSDOWUWG0awLpkU7VLR0sPld+bSHXTHO5B516Ig1XXy2h3Yd0YGl0bOm4jbQltc/NXOP5NMA5CZozocm1dZJGa+T3lghn+ECSh6CegAIzPqL//U2jGh1ICvym0npjdHyPTb+GODIpKa7ISNxyrP+tkS+h7Ax9ArUOJMXZTgg90PT4JnNis9Afq5GRATmL3xe/SKijrJ6E3VbXClQlKMilVAGrrT8qFnbvw7sqckLF7g6WEZ/acv0dOYfsz4ArS3A17lH5c+u7rl67Et+reFm9jhEwJtQaiakUK13Yz2mA=');
    formData.append('__VIEWSTATEGENERATOR', '0FCFF17D');
    formData.append('__EVENTVALIDATION', '3rKZAEUqQsjHs96POyG00sq1HDKlmxc0XktzLbVkn2B30y9vhB+lG7EQA4xogWHG02Mn2k82Uq335epudDYNZgpzDlc=');
    formData.append('txtKW', keyword);
    formData.append('judtype', 'JUDBOOK');
    formData.append('ctl00$cp_content$btnSimpleQry', '送出查詢');

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://judgment.judicial.gov.tw/FJUD/default.aspx'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`司法院搜尋失敗: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('📄 取得搜尋結果 HTML，長度:', html.length);

    // 解析搜尋結果
    const results = parseSearchResults(html, keyword);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results: results,
        total: results.length,
        keyword: keyword,
        message: `成功找到 ${results.length} 筆相關判決書`,
        source: 'simple-judicial-search'
      })
    };

  } catch (error) {
    console.error('💥 簡化司法院搜尋錯誤:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results: [],
        total: 0,
        keyword: keyword || '',
        message: '司法院搜尋暫時無法使用，請稍後再試',
        source: 'simple-judicial-search'
      })
    };
  }
};

// 解析搜尋結果
function parseSearchResults(html, keyword) {
  console.log('🔍 開始解析搜尋結果...');
  console.log('📄 HTML 長度:', html.length);
  console.log('📄 HTML 前500字:', html.substring(0, 500));
  
  const results = [];
  
  try {
    // 檢查是否包含搜尋結果
    if (html.includes('查無資料') || html.includes('無相關資料')) {
      console.log('❌ 搜尋結果顯示無資料');
      return results;
    }
    
    // 使用多種正則表達式模式來解析案件
    const patterns = [
      // 模式1: 標準的案件列表格式
      /<tr[^>]*class="[^"]*case[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
      // 模式2: 簡單的表格行
      /<tr[^>]*>([\s\S]*?<a[^>]*href="[^"]*"[^>]*>[\s\S]*?)<\/tr>/gi,
      // 模式3: 包含連結的行
      /<tr[^>]*>([\s\S]*?<a[^>]*href="[^"]*"[^>]*>[\s\S]*?<\/a>[\s\S]*?)<\/tr>/gi
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const rowHtml = match[1];
        
        // 提取案件標題和連結
        const titleMatch = rowHtml.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/i);
        if (titleMatch) {
          const detailUrl = titleMatch[1].startsWith('http') ? titleMatch[1] : `https://judgment.judicial.gov.tw${titleMatch[1]}`;
          const caseTitle = titleMatch[2].trim();
          
          // 跳過無效的連結
          if (caseTitle.includes('回上方') || caseTitle.includes('回頁首') || caseTitle.length < 5) {
            continue;
          }
          
          // 提取法院資訊
          const courtMatch = rowHtml.match(/([^<]+法院[^<]*)/i);
          const court = courtMatch ? courtMatch[1].trim() : '未知法院';
          
          // 提取日期
          const dateMatch = rowHtml.match(/(\d{3}-\d{2}-\d{2})/);
          const judgmentDate = dateMatch ? dateMatch[1] : '未知日期';
          
          // 提取案件類型
          const caseTypeMatch = rowHtml.match(/(\d{3}),([^,]+),(\d+)/);
          const year = caseTypeMatch ? caseTypeMatch[1] : '';
          const caseType = caseTypeMatch ? caseTypeMatch[2] : '';
          const caseNumber = caseTypeMatch ? caseTypeMatch[3] : '';
          
          // 提取檔案大小
          const sizeMatch = rowHtml.match(/\((\d+)K\)/);
          const fileSize = sizeMatch ? sizeMatch[1] : '0';
          
          const result = {
            serialNumber: results.length + 1,
            caseNumber: `${year}${caseType}${caseNumber}` || `案件-${results.length + 1}`,
            court: court,
            judgmentDate: judgmentDate,
            caseReason: '詐欺',
            summary: `與 ${keyword} 相關的判決書 - ${caseTitle}`,
            contentSize: `${fileSize}K`,
            detailUrl: detailUrl,
            riskScore: calculateRiskScore(caseType, court),
            source: 'real-data'
          };
          
          results.push(result);
          console.log(`✅ 找到案件: ${caseTitle}`);
        }
      }
    }
    
    // 如果沒有找到任何案件，嘗試更寬鬆的搜尋
    if (results.length === 0) {
      console.log('🔍 嘗試更寬鬆的搜尋模式...');
      
      // 搜尋所有包含關鍵字的連結
      const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*${keyword}[^<]*)<\/a>/gi;
      let linkMatch;
      
      while ((linkMatch = linkRegex.exec(html)) !== null) {
        const detailUrl = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://judgment.judicial.gov.tw${linkMatch[1]}`;
        const caseTitle = linkMatch[2].trim();
        
        if (caseTitle.length > 5) {
          const result = {
            serialNumber: results.length + 1,
            caseNumber: `案件-${results.length + 1}`,
            court: '未知法院',
            judgmentDate: '未知日期',
            caseReason: '詐欺',
            summary: `與 ${keyword} 相關的判決書 - ${caseTitle}`,
            contentSize: '未知',
            detailUrl: detailUrl,
            riskScore: 75,
            source: 'real-data'
          };
          
          results.push(result);
          console.log(`✅ 找到案件: ${caseTitle}`);
        }
      }
    }
    
    console.log(`✅ 解析完成，找到 ${results.length} 筆真實結果`);
    
  } catch (error) {
    console.log('⚠️ 解析搜尋結果時發生錯誤:', error.message);
  }
  
  return results;
}

// 計算風險分數
function calculateRiskScore(caseType, court) {
  let score = 0;
  
  // 根據案件類型加分
  if (caseType.includes('詐欺') || caseType.includes('詐騙')) score += 40;
  if (caseType.includes('金訴') || caseType.includes('金上訴')) score += 30;
  if (caseType.includes('銀行法')) score += 35;
  if (caseType.includes('偽造文書')) score += 25;
  
  // 根據法院加分
  if (court.includes('高等法院')) score += 20;
  if (court.includes('最高法院')) score += 25;
  
  return Math.min(score, 100);
}
