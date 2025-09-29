// 智能司法搜尋 Function - 最穩定的司法院判決書搜尋
// 直接實現智能搜尋邏輯，避免TypeScript依賴問題

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
    console.log('🔥 啟動智能司法搜尋 Function');
    
    // 解析請求參數
    const params = JSON.parse(event.body || '{}');
    console.log('📋 搜尋參數:', params);

    // 驗證必要參數
    if (!params.keyword || params.keyword.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '請提供搜尋關鍵字'
        })
      };
    }

    // 執行智能搜尋
    console.log('🔍 開始執行智能搜尋...');
    const searchResults = await performSmartSearch(params);
    
    console.log(`✅ 搜尋完成，找到 ${searchResults.length} 筆結果`);

    // 如果找到結果，取得前5筆的詳細內容
    let detailedResults = [];
    if (searchResults.length > 0) {
      console.log('📖 開始獲取詳細內容...');
      
      const detailPromises = searchResults.slice(0, 5).map(async (result) => {
        try {
          const detail = await getJudgmentDetail(result.detailUrl);
          return detail;
        } catch (error) {
          console.error('獲取詳細內容失敗:', error);
          return null;
        }
      });

      const detailResults = await Promise.all(detailPromises);
      detailedResults = detailResults.filter(result => result !== null);
      
      console.log(`✅ 成功獲取 ${detailedResults.length} 筆詳細內容`);
    }

    // 返回結果
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results: detailedResults,
        totalAvailable: searchResults.length,
        searchParams: params,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ 智能司法搜尋失敗:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || '搜尋過程中發生錯誤',
        timestamp: new Date().toISOString()
      })
    };
  }
};

// 智能搜尋實現函數
async function performSmartSearch(params) {
  const baseUrl = 'https://arch.judicial.gov.tw';
  const searchUrl = `${baseUrl}/FJUD/FJUDQRY01_1.aspx`;
  
  // 搜尋策略列表
  const strategies = [
    () => searchWithDirectFormSubmission(params, searchUrl, baseUrl),
    () => searchWithSimplifiedForm(params, searchUrl, baseUrl),
    () => searchWithMinimalParams(params, searchUrl, baseUrl),
    () => searchWithFallbackMethod(params, searchUrl, baseUrl)
  ];

  // 嘗試每個策略
  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`🎯 嘗試搜尋策略 ${i + 1}/${strategies.length}`);
      const results = await strategies[i]();
      
      if (results && results.length > 0) {
        console.log(`✅ 策略 ${i + 1} 成功，找到 ${results.length} 筆結果`);
        return results;
      } else {
        console.log(`⚠️ 策略 ${i + 1} 無結果，嘗試下一個策略`);
      }
    } catch (error) {
      console.log(`❌ 策略 ${i + 1} 失敗:`, error.message);
    }
  }

  console.log('💥 所有搜尋策略都失敗了');
  return [];
}

// 策略1: 直接表單提交
async function searchWithDirectFormSubmission(params, searchUrl, baseUrl) {
  console.log('📋 使用直接表單提交策略');
  
  // 先獲取搜尋頁面以取得ViewState
  const pageResponse = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  });

  if (!pageResponse.ok) {
    throw new Error(`獲取搜尋頁面失敗: ${pageResponse.status}`);
  }

  const pageHtml = await pageResponse.text();
  const viewState = extractViewState(pageHtml);
  const eventValidation = extractEventValidation(pageHtml);

  // 建立搜尋表單資料
  const formData = buildSearchFormData(params, viewState, eventValidation);

  // 提交搜尋表單
  const searchResponse = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': searchUrl,
      'Origin': baseUrl
    },
    body: formData
  });

  if (!searchResponse.ok) {
    throw new Error(`搜尋請求失敗: ${searchResponse.status}`);
  }

  const searchHtml = await searchResponse.text();
  return parseSearchResults(searchHtml, baseUrl);
}

// 策略2: 簡化表單提交
async function searchWithSimplifiedForm(params, searchUrl, baseUrl) {
  console.log('🔧 使用簡化表單提交策略');
  
  const formData = new URLSearchParams();
  formData.append('v_court', params.court || '');
  formData.append('v_sys', 'M'); // 刑事
  formData.append('jud_year', '');
  formData.append('jud_case', '');
  formData.append('jud_no', '');
  formData.append('jud_title', '');
  formData.append('keyword', params.keyword || '');
  formData.append('sdate', params.startDate || '');
  formData.append('edate', params.endDate || '');
  formData.append('jud_kind', '');
  formData.append('kw', params.keyword || '');
  formData.append('searchkw', params.keyword || '');
  formData.append('__VIEWSTATE', '');
  formData.append('__EVENTVALIDATION', '');

  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': searchUrl
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`簡化搜尋失敗: ${response.status}`);
  }

  const html = await response.text();
  return parseSearchResults(html, baseUrl);
}

// 策略3: 最小參數搜尋
async function searchWithMinimalParams(params, searchUrl, baseUrl) {
  console.log('⚡ 使用最小參數搜尋策略');
  
  const formData = new URLSearchParams();
  formData.append('keyword', params.keyword || '');
  formData.append('v_sys', 'M');
  formData.append('__VIEWSTATE', '');
  formData.append('__EVENTVALIDATION', '');

  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`最小參數搜尋失敗: ${response.status}`);
  }

  const html = await response.text();
  return parseSearchResults(html, baseUrl);
}

// 策略4: 備援方法
async function searchWithFallbackMethod(params, searchUrl, baseUrl) {
  console.log('🔄 使用備援搜尋策略');
  
  // 嘗試直接URL搜尋
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.append('kw', params.keyword);
  if (params.court) searchParams.append('v_court', params.court);
  if (params.startDate) searchParams.append('sdate', params.startDate);
  if (params.endDate) searchParams.append('edate', params.endDate);
  searchParams.append('v_sys', 'M');

  const url = `${searchUrl}?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`備援搜尋失敗: ${response.status}`);
  }

  const html = await response.text();
  return parseSearchResults(html, baseUrl);
}

// 獲取判決書詳細內容
async function getJudgmentDetail(detailUrl) {
  console.log('🔍 獲取判決書詳細內容:', detailUrl);
  
  const response = await fetch(detailUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    }
  });

  if (!response.ok) {
    throw new Error(`獲取詳細內容失敗: ${response.status}`);
  }

  const html = await response.text();
  return parseJudgmentDetail(html, detailUrl);
}

// 提取ViewState
function extractViewState(html) {
  const match = html.match(/<input[^>]*name="__VIEWSTATE"[^>]*value="([^"]*)"[^>]*>/i);
  return match ? match[1] : '';
}

// 提取EventValidation
function extractEventValidation(html) {
  const match = html.match(/<input[^>]*name="__EVENTVALIDATION"[^>]*value="([^"]*)"[^>]*>/i);
  return match ? match[1] : '';
}

// 建立搜尋表單資料
function buildSearchFormData(params, viewState, eventValidation) {
  const formData = new URLSearchParams();
  
  // ASP.NET 必要參數
  formData.append('__VIEWSTATE', viewState);
  formData.append('__EVENTVALIDATION', eventValidation);
  formData.append('__EVENTTARGET', '');
  formData.append('__EVENTARGUMENT', '');
  
  // 搜尋參數
  formData.append('v_court', params.court || '');
  formData.append('v_sys', 'M'); // 刑事
  formData.append('jud_year', '');
  formData.append('jud_case', '');
  formData.append('jud_no', '');
  formData.append('jud_title', '');
  formData.append('keyword', params.keyword || '');
  formData.append('sdate', params.startDate || '');
  formData.append('edate', params.endDate || '');
  formData.append('jud_kind', '');
  formData.append('kw', params.keyword || '');
  formData.append('searchkw', params.keyword || '');
  
  return formData;
}

// 解析搜尋結果
function parseSearchResults(html, baseUrl) {
  const results = [];
  
  try {
    // 使用更強健的正則表達式解析
    const tableRegex = /<table[^>]*class="table"[^>]*>([\s\S]*?)<\/table>/i;
    const tableMatch = html.match(tableRegex);
    
    if (!tableMatch) {
      console.log('⚠️ 未找到搜尋結果表格');
      return results;
    }

    const tableHtml = tableMatch[1];
    
    // 解析每一行結果
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    let serialNumber = 1;

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const result = parseSearchResultRow(rowMatch[1], serialNumber, baseUrl);
      if (result) {
        results.push(result);
        serialNumber++;
      }
    }

    console.log(`✅ 成功解析 ${results.length} 筆搜尋結果`);
  } catch (error) {
    console.error('解析搜尋結果失敗:', error);
  }

  return results;
}

// 解析單一搜尋結果行
function parseSearchResultRow(rowHtml, serialNumber, baseUrl) {
  try {
    // 提取裁判字號和詳細頁面連結
    const caseNumberMatch = rowHtml.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/i);
    if (!caseNumberMatch) return null;

    // 提取裁判日期
    const dateMatch = rowHtml.match(/(\d{3}\.\d{2}\.\d{2})/);
    
    // 提取裁判案由
    const reasonMatch = rowHtml.match(/<td[^>]*>([^<]+)<\/td>/gi);
    const caseReason = reasonMatch && reasonMatch[1] ? 
      reasonMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    
    // 提取內容大小
    const sizeMatch = rowHtml.match(/\((\d+K)\)/);

    return {
      serialNumber,
      caseNumber: caseNumberMatch[2].trim(),
      judgmentDate: dateMatch ? dateMatch[1] : '',
      caseReason,
      summary: '', // 需要進一步解析
      contentSize: sizeMatch ? sizeMatch[1] : '',
      detailUrl: baseUrl + caseNumberMatch[1],
      riskScore: calculateRiskScore(caseReason),
      source: 'smart-crawler'
    };
  } catch (error) {
    console.error('解析搜尋結果行失敗:', error);
    return null;
  }
}

// 解析判決書詳細內容
function parseJudgmentDetail(html, detailUrl) {
  try {
    // 提取裁判字號
    const caseNumberMatch = html.match(/裁判字號[^>]*>([^<]+)</i);
    
    // 提取裁判日期
    const dateMatch = html.match(/裁判日期[^>]*>([^<]+)</i);
    
    // 提取裁判案由
    const reasonMatch = html.match(/裁判案由[^>]*>([^<]+)</i);
    
    // 提取當事人資訊
    const plaintiffMatch = html.match(/原告[^>]*>([^<]+)</i);
    const defendantMatch = html.match(/被告[^>]*>([^<]+)</i);
    
    // 提取主文
    const mainRulingMatch = html.match(/主文[^>]*>([^<]+)</i);
    
    // 提取事實及理由
    const factsMatch = html.match(/事實及理由[^>]*>([^<]+)</i);
    
    // 提取相關法條
    const lawsMatch = html.match(/相關法條[^>]*>([^<]+)</i);
    
    // 計算風險分數
    const riskScore = calculateRiskScore(html);

    return {
      caseTitle: caseNumberMatch ? caseNumberMatch[1].trim() : '',
      caseNumber: caseNumberMatch ? caseNumberMatch[1].trim() : '',
      court: extractCourtName(caseNumberMatch ? caseNumberMatch[1] : ''),
      judgmentDate: dateMatch ? dateMatch[1].trim() : '',
      caseReason: reasonMatch ? reasonMatch[1].trim() : '',
      summary: extractSummary(html),
      riskScore,
      plaintiff: plaintiffMatch ? plaintiffMatch[1].trim() : '',
      defendant: defendantMatch ? defendantMatch[1].trim() : '',
      mainRuling: mainRulingMatch ? mainRulingMatch[1].trim() : '',
      factsAndReasons: factsMatch ? factsMatch[1].trim() : '',
      relatedLaws: lawsMatch ? parseRelatedLaws(lawsMatch[1]) : [],
      previousJudgments: []
    };
  } catch (error) {
    console.error('解析判決書詳細內容失敗:', error);
    throw error;
  }
}

// 計算風險分數
function calculateRiskScore(text) {
  let score = 0;
  
  // 詐欺相關關鍵字
  const fraudKeywords = ['詐欺', '詐騙', '詐取', '詐術', '詐得', '詐財'];
  fraudKeywords.forEach(keyword => {
    const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
    score += matches * 10;
  });
  
  // 金額相關
  const amountKeywords = ['萬元', '千元', '百萬元', '億'];
  amountKeywords.forEach(keyword => {
    const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
    score += matches * 5;
  });
  
  // 刑期相關
  const sentenceKeywords = ['有期徒刑', '無期徒刑', '死刑'];
  sentenceKeywords.forEach(keyword => {
    const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
    score += matches * 15;
  });
  
  return Math.min(score, 100);
}

// 提取法院名稱
function extractCourtName(caseNumber) {
  if (caseNumber.includes('最高法院')) return '最高法院';
  if (caseNumber.includes('高等法院')) return '高等法院';
  if (caseNumber.includes('地方法院')) return '地方法院';
  return '未知法院';
}

// 提取摘要
function extractSummary(html) {
  const factsMatch = html.match(/事實及理由[^>]*>([^<]+)</i);
  if (factsMatch) {
    return factsMatch[1].substring(0, 200) + '...';
  }
  return '';
}

// 解析相關法條
function parseRelatedLaws(lawsText) {
  return lawsText.split(/[，,]/).map(law => law.trim()).filter(law => law.length > 0);
}
