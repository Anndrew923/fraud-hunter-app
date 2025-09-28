// Netlify Function for 司法院判決書詳細內容
const fetch = require('node-fetch');

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
    const { detailUrl } = JSON.parse(event.body || '{}');

    if (!detailUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '缺少詳細頁面網址' }),
      };
    }

    console.log('開始取得判決書詳細內容:', detailUrl);

    const response = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`取得詳細內容失敗: ${response.status}`);
    }

    const html = await response.text();
    console.log('取得詳細內容 HTML，長度:', html.length);

    // 解析詳細內容
    const detail = parseJudgmentDetail(html, detailUrl);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        detail,
      }),
    };

  } catch (error) {
    console.error('取得判決書詳細內容失敗:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};

// 解析判決書詳細內容
function parseJudgmentDetail(html, detailUrl) {
  try {
    // 提取裁判字號
    const caseNumberMatch = html.match(/裁判字號[^>]*>([^<]+)</);
    
    // 提取裁判日期
    const dateMatch = html.match(/裁判日期[^>]*>([^<]+)</);
    
    // 提取裁判案由
    const reasonMatch = html.match(/裁判案由[^>]*>([^<]+)</);
    
    // 提取當事人資訊
    const plaintiffMatch = html.match(/原告[^>]*>([^<]+)</);
    const defendantMatch = html.match(/被告[^>]*>([^<]+)</);
    
    // 提取主文
    const mainRulingMatch = html.match(/主文[^>]*>([^<]+)</);
    
    // 提取事實及理由
    const factsMatch = html.match(/事實及理由[^>]*>([^<]+)</);
    
    // 提取相關法條
    const lawsMatch = html.match(/相關法條[^>]*>([^<]+)</);
    
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
      previousJudgments: [],
    };
  } catch (error) {
    console.error('解析判決書詳細內容失敗:', error);
    return {
      caseTitle: '',
      caseNumber: '',
      court: '未知法院',
      judgmentDate: '',
      caseReason: '',
      summary: '',
      riskScore: 0,
      plaintiff: '',
      defendant: '',
      mainRuling: '',
      factsAndReasons: '',
      relatedLaws: [],
      previousJudgments: [],
    };
  }
}

// 計算風險分數
function calculateRiskScore(html) {
  let score = 0;
  
  // 詐欺相關關鍵字
  const fraudKeywords = ['詐欺', '詐騙', '詐取', '詐術', '詐得', '詐財'];
  fraudKeywords.forEach(keyword => {
    const matches = (html.match(new RegExp(keyword, 'g')) || []).length;
    score += matches * 10;
  });
  
  // 金額相關
  const amountKeywords = ['萬元', '千元', '百萬元', '億'];
  amountKeywords.forEach(keyword => {
    const matches = (html.match(new RegExp(keyword, 'g')) || []).length;
    score += matches * 5;
  });
  
  // 刑期相關
  const sentenceKeywords = ['有期徒刑', '無期徒刑', '死刑'];
  sentenceKeywords.forEach(keyword => {
    const matches = (html.match(new RegExp(keyword, 'g')) || []).length;
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
  // 嘗試從事實及理由中提取前200字作為摘要
  const factsMatch = html.match(/事實及理由[^>]*>([^<]+)</);
  if (factsMatch) {
    return factsMatch[1].substring(0, 200) + '...';
  }
  return '';
}

// 解析相關法條
function parseRelatedLaws(lawsText) {
  return lawsText.split(/[，,]/).map(law => law.trim()).filter(law => law.length > 0);
}
