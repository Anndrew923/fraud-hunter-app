// 案件分析 Function - 幫助判斷同名同姓
exports.handler = async (event, context) => {
  console.log('🔍 案件分析 Function 被調用');
  
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

    console.log('🔍 分析案件:', keyword);

    // 搜尋案件列表
    const searchUrl = `https://judgment.judicial.gov.tw/FJUD/qryresult.aspx?kw=${encodeURIComponent(keyword)}`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Referer': 'https://judgment.judicial.gov.tw/LAW_Mobile_FJUD//FJUD/default.aspx',
      },
    });

    if (!response.ok) {
      throw new Error(`案件搜尋失敗: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('📄 取得案件列表 HTML，長度:', html.length);

    // 解析案件列表
    const cases = parseCaseList(html, keyword);
    
    // 分析案件特徵
    const analysis = analyzeCases(cases);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        cases: cases,
        analysis: analysis,
        total: cases.length,
        keyword: keyword,
        message: `找到 ${cases.length} 個相關案件，分析完成`,
        source: 'case-analysis'
      })
    };

  } catch (error) {
    console.error('💥 案件分析錯誤:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        cases: [],
        analysis: null,
        total: 0,
        keyword: keyword || '',
        message: '案件分析暫時無法使用，請稍後再試',
        source: 'case-analysis'
      })
    };
  }
};

// 解析案件列表
function parseCaseList(html, keyword) {
  console.log('🔍 開始解析案件列表...');
  
  const cases = [];
  
  try {
    // 使用正則表達式解析案件列表
    const caseRegex = /<tr[^>]*class="[^"]*case[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    
    while ((match = caseRegex.exec(html)) !== null) {
      const rowHtml = match[1];
      
      // 提取案件資訊
      const caseInfo = extractCaseInfo(rowHtml, keyword);
      if (caseInfo) {
        cases.push(caseInfo);
      }
    }
    
    console.log(`✅ 解析完成，找到 ${cases.length} 個案件`);
    
  } catch (error) {
    console.log('⚠️ 解析案件列表時發生錯誤:', error.message);
  }
  
  return cases;
}

// 提取案件資訊
function extractCaseInfo(rowHtml, keyword) {
  try {
    // 提取案件標題和連結
    const titleMatch = rowHtml.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/i);
    if (!titleMatch) return null;
    
    const detailUrl = titleMatch[1].startsWith('http') ? titleMatch[1] : `https://judgment.judicial.gov.tw${titleMatch[1]}`;
    const caseTitle = titleMatch[2].trim();
    
    // 提取法院資訊
    const courtMatch = rowHtml.match(/<td[^>]*>([^<]+法院[^<]*)<\/td>/i);
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
    
    return {
      caseTitle,
      court,
      year,
      caseType,
      caseNumber,
      judgmentDate,
      fileSize: `${fileSize}K`,
      detailUrl,
      keyword,
      riskScore: calculateRiskScore(caseType, court)
    };
    
  } catch (error) {
    console.log('⚠️ 提取案件資訊時發生錯誤:', error.message);
    return null;
  }
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

// 分析案件特徵
function analyzeCases(cases) {
  if (cases.length === 0) {
    return {
      totalCases: 0,
      timeSpan: 0,
      courtDistribution: {},
      caseTypeDistribution: {},
      riskLevel: 'unknown',
      isSamePerson: 'unknown',
      recommendations: ['無案件資料']
    };
  }
  
  // 計算時間跨度
  const years = cases.map(c => parseInt(c.year)).filter(y => !isNaN(y));
  const timeSpan = years.length > 0 ? Math.max(...years) - Math.min(...years) : 0;
  
  // 法院分布
  const courtDistribution = {};
  cases.forEach(c => {
    courtDistribution[c.court] = (courtDistribution[c.court] || 0) + 1;
  });
  
  // 案件類型分布
  const caseTypeDistribution = {};
  cases.forEach(c => {
    caseTypeDistribution[c.caseType] = (caseTypeDistribution[c.caseType] || 0) + 1;
  });
  
  // 風險等級
  const avgRiskScore = cases.reduce((sum, c) => sum + c.riskScore, 0) / cases.length;
  let riskLevel = 'low';
  if (avgRiskScore >= 80) riskLevel = 'very-high';
  else if (avgRiskScore >= 60) riskLevel = 'high';
  else if (avgRiskScore >= 40) riskLevel = 'medium';
  
  // 是否為同一人判斷
  let isSamePerson = 'unknown';
  if (cases.length >= 5 && timeSpan >= 3) {
    isSamePerson = 'likely-same'; // 案件多且時間跨度長，可能是同一人
  } else if (cases.length <= 2) {
    isSamePerson = 'likely-different'; // 案件少，可能是不同人
  }
  
  // 建議
  const recommendations = [];
  if (cases.length >= 10) {
    recommendations.push('案件數量極多，建議詳細比對個人資料');
  }
  if (timeSpan >= 5) {
    recommendations.push('時間跨度長，需要確認是否為同一人');
  }
  if (avgRiskScore >= 70) {
    recommendations.push('風險分數極高，建議提高警覺');
  }
  
  return {
    totalCases: cases.length,
    timeSpan: timeSpan,
    courtDistribution: courtDistribution,
    caseTypeDistribution: caseTypeDistribution,
    riskLevel: riskLevel,
    isSamePerson: isSamePerson,
    recommendations: recommendations,
    avgRiskScore: Math.round(avgRiskScore)
  };
}
