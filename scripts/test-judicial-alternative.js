#!/usr/bin/env node

const https = require('https');

console.log('🔍 測試司法院替代搜尋方式...\n');

const keyword = '杜啟宇';

// 嘗試使用不同的搜尋方式
const searchUrls = [
  `https://judgment.judicial.gov.tw/FJUD/qryresult.aspx?kw=${encodeURIComponent(keyword)}`,
  `https://judgment.judicial.gov.tw/FJUD/qryresult.aspx?kw=${encodeURIComponent(keyword)}&judtype=JUDBOOK`,
  `https://judgment.judicial.gov.tw/FJUD/qryresult.aspx?kw=${encodeURIComponent(keyword)}&judtype=JUDBOOK&ctl00$cp_content$btnSimpleQry=送出查詢`,
  `https://judgment.judicial.gov.tw/FJUD/qryresult.aspx?kw=${encodeURIComponent(keyword)}&judtype=JUDBOOK&ctl00$cp_content$btnSimpleQry=送出查詢&__VIEWSTATE=uaUzV7jsxyKFfC6Q8kJmy3co0xqogaP/W3gE1m/706hARdy7WugrIdEBuAEPBVd95Wc70xX45cgpALNTnZ/Oi3yt7l0Z64P+sB7wpfqNcNGi0qsXV+QhUQmV8j8yKJXqu/BHbVo1yEkPzvagl78qvMRM2vdcIP2HTg/yEv323uTp/+BAY8kSDOWUWG0awLpkU7VLR0sPld+bSHXTHO5B516Ig1XXy2h3Yd0YGl0bOm4jbQltc/NXOP5NMA5CZozocm1dZJGa+T3lghn+ECSh6CegAIzPqL//U2jGh1ICvym0npjdHyPTb+GODIpKa7ISNxyrP+tkS+h7Ax9ArUOJMXZTgg90PT4JnNis9Afq5GRATmL3xe/SKijrJ6E3VbXClQlKMilVAGrrT8qFnbvw7sqckLF7g6WEZ/acv0dOYfsz4ArS3A17lH5c+u7rl67Et+reFm9jhEwJtQaiakUK13Yz2mA=&__VIEWSTATEGENERATOR=0FCFF17D&__EVENTVALIDATION=3rKZAEUqQsjHs96POyG00sq1HDKlmxc0XktzLbVkn2B30y9vhB+lG7EQA4xogWHG02Mn2k82Uq335epudDYNZgpzDlc=`
];

for (let i = 0; i < searchUrls.length; i++) {
  const searchUrl = searchUrls[i];
  console.log(`\n📡 測試 ${i + 1}: ${searchUrl}`);
  
  const options = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  };

  const req = https.request(searchUrl, options, (res) => {
    console.log(`📊 狀態碼: ${res.statusCode}`);
    
    let html = '';
    
    res.on('data', (chunk) => {
      html += chunk;
    });
    
    res.on('end', () => {
      console.log(`📄 HTML 長度: ${html.length}`);
      
      const keywordIndex = html.indexOf(keyword);
      if (keywordIndex !== -1) {
        console.log(`✅ 找到關鍵字，位置: ${keywordIndex}`);
        console.log(`📄 關鍵字前後200字: ${html.substring(keywordIndex - 200, keywordIndex + 200)}`);
      } else {
        console.log('❌ 未找到關鍵字');
      }
      
      const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
      if (tableMatches) {
        console.log(`✅ 找到 ${tableMatches.length} 個表格`);
        tableMatches.forEach((table, index) => {
          console.log(`\n📋 表格 ${index + 1} (前300字):`);
          console.log(table.substring(0, 300));
        });
      } else {
        console.log('❌ 未找到表格');
      }
      
      const linkMatches = html.match(/<a[^>]*href="[^"]*"[^>]*>[\s\S]*?<\/a>/gi);
      if (linkMatches) {
        console.log(`✅ 找到 ${linkMatches.length} 個連結`);
        linkMatches.slice(0, 5).forEach((link, index) => {
          console.log(`\n🔗 連結 ${index + 1}:`);
          console.log(link);
        });
      } else {
        console.log('❌ 未找到連結');
      }
    });
  });

  req.on('error', (error) => {
    console.error(`❌ 請求錯誤: ${error}`);
  });

  req.end();
  
  // 等待一下再測試下一個URL
  if (i < searchUrls.length - 1) {
    setTimeout(() => {}, 1000);
  }
}
