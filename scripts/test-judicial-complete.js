#!/usr/bin/env node

const https = require('https');

console.log('🔍 測試司法院完整搜尋...\n');

const keyword = '杜啟宇';

// 使用您提供的cURL請求中的完整URL和參數
const searchUrl = 'https://judgment.judicial.gov.tw/FJUD/default.aspx';
const formData = new URLSearchParams();
formData.append('__VIEWSTATE', 'uaUzV7jsxyKFfC6Q8kJmy3co0xqogaP/W3gE1m/706hARdy7WugrIdEBuAEPBVd95Wc70xX45cgpALNTnZ/Oi3yt7l0Z64P+sB7wpfqNcNGi0qsXV+QhUQmV8j8yKJXqu/BHbVo1yEkPzvagl78qvMRM2vdcIP2HTg/yEv323uTp/+BAY8kSDOWUWG0awLpkU7VLR0sPld+bSHXTHO5B516Ig1XXy2h3Yd0YGl0bOm4jbQltc/NXOP5NMA5CZozocm1dZJGa+T3lghn+ECSh6CegAIzPqL//U2jGh1ICvym0npjdHyPTb+GODIpKa7ISNxyrP+tkS+h7Ax9ArUOJMXZTgg90PT4JnNis9Afq5GRATmL3xe/SKijrJ6E3VbXClQlKMilVAGrrT8qFnbvw7sqckLF7g6WEZ/acv0dOYfsz4ArS3A17lH5c+u7rl67Et+reFm9jhEwJtQaiakUK13Yz2mA=');
formData.append('__VIEWSTATEGENERATOR', '0FCFF17D');
formData.append('__EVENTVALIDATION', '3rKZAEUqQsjHs96POyG00sq1HDKlmxc0XktzLbVkn2B30y9vhB+lG7EQA4xogWHG02Mn2k82Uq335epudDYNZgpzDlc=');
formData.append('txtKW', keyword);
formData.append('judtype', 'JUDBOOK');
formData.append('ctl00$cp_content$btnSimpleQry', '送出查詢');

console.log('📡 搜尋 URL:', searchUrl);
console.log('📤 表單數據:', formData.toString());

const options = {
  method: 'POST',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Referer': 'https://judgment.judicial.gov.tw/FJUD/default.aspx'
  }
};

const req = https.request(searchUrl, options, (res) => {
  console.log('📊 狀態碼:', res.statusCode);
  console.log('📊 回應標頭:', res.headers);
  
  let html = '';
  
  res.on('data', (chunk) => {
    html += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 HTML 長度:', html.length);
    console.log('\n📄 HTML 前2000字:');
    console.log(html.substring(0, 2000));
    
    console.log('\n🔍 搜尋關鍵字 "杜啟宇" 在 HTML 中的位置:');
    const keywordIndex = html.indexOf(keyword);
    if (keywordIndex !== -1) {
      console.log('✅ 找到關鍵字，位置:', keywordIndex);
      console.log('📄 關鍵字前後500字:', html.substring(keywordIndex - 500, keywordIndex + 500));
    } else {
      console.log('❌ 未找到關鍵字');
    }
    
    console.log('\n🔍 搜尋案件相關內容:');
    const caseMatches = html.match(/[^<]*案件[^<]*/gi);
    if (caseMatches) {
      console.log('✅ 找到', caseMatches.length, '個案件相關內容');
      caseMatches.slice(0, 10).forEach((caseText, index) => {
        console.log(`\n📋 案件 ${index + 1}:`, caseText.trim());
      });
    } else {
      console.log('❌ 未找到案件相關內容');
    }
    
    console.log('\n🔍 搜尋表格相關標籤:');
    const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
    if (tableMatches) {
      console.log('✅ 找到', tableMatches.length, '個表格');
      tableMatches.forEach((table, index) => {
        console.log(`\n📋 表格 ${index + 1} (前500字):`);
        console.log(table.substring(0, 500));
      });
    } else {
      console.log('❌ 未找到表格');
    }
    
    console.log('\n🔍 搜尋連結標籤:');
    const linkMatches = html.match(/<a[^>]*href="[^"]*"[^>]*>[\s\S]*?<\/a>/gi);
    if (linkMatches) {
      console.log('✅ 找到', linkMatches.length, '個連結');
      linkMatches.slice(0, 10).forEach((link, index) => {
        console.log(`\n🔗 連結 ${index + 1}:`);
        console.log(link);
      });
    } else {
      console.log('❌ 未找到連結');
    }
    
    console.log('\n🔍 搜尋重定向相關內容:');
    if (html.includes('location.href') || html.includes('window.location')) {
      console.log('✅ 找到重定向相關內容');
      const redirectMatches = html.match(/location\.href[^;]*;?/gi);
      if (redirectMatches) {
        redirectMatches.forEach((redirect, index) => {
          console.log(`\n🔄 重定向 ${index + 1}:`, redirect);
        });
      }
    } else {
      console.log('❌ 未找到重定向相關內容');
    }
    
    console.log('\n🔍 搜尋JavaScript相關內容:');
    const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
    if (scriptMatches) {
      console.log('✅ 找到', scriptMatches.length, '個JavaScript腳本');
      scriptMatches.forEach((script, index) => {
        if (script.includes('search') || script.includes('query') || script.includes('result') || script.includes('submit')) {
          console.log(`\n📜 相關腳本 ${index + 1} (前500字):`);
          console.log(script.substring(0, 500));
        }
      });
    } else {
      console.log('❌ 未找到JavaScript腳本');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 請求錯誤:', error);
});

req.write(formData.toString());
req.end();
