#!/usr/bin/env node

const https = require('https');

console.log('🔍 測試司法院簡單搜尋...\n');

const keyword = '杜啟宇';

// 嘗試直接搜尋結果頁面
const searchUrl = `https://judgment.judicial.gov.tw/FJUD/qryresult.aspx?kw=${encodeURIComponent(keyword)}`;

console.log('📡 搜尋 URL:', searchUrl);

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
  console.log('📊 狀態碼:', res.statusCode);
  console.log('📊 回應標頭:', res.headers);
  
  // 檢查是否有重定向
  if (res.statusCode === 302 || res.statusCode === 301) {
    console.log('🔄 檢測到重定向:', res.headers.location);
  }
  
  let html = '';
  
  res.on('data', (chunk) => {
    html += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 HTML 長度:', html.length);
    console.log('\n📄 HTML 前1000字:');
    console.log(html.substring(0, 1000));
    
    console.log('\n🔍 搜尋關鍵字 "杜啟宇" 在 HTML 中的位置:');
    const keywordIndex = html.indexOf(keyword);
    if (keywordIndex !== -1) {
      console.log('✅ 找到關鍵字，位置:', keywordIndex);
      console.log('📄 關鍵字前後200字:', html.substring(keywordIndex - 200, keywordIndex + 200));
    } else {
      console.log('❌ 未找到關鍵字');
    }
    
    console.log('\n🔍 搜尋案件相關內容:');
    const caseMatches = html.match(/[^<]*案件[^<]*/gi);
    if (caseMatches) {
      console.log('✅ 找到', caseMatches.length, '個案件相關內容');
      caseMatches.slice(0, 5).forEach((caseText, index) => {
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
        console.log(`\n📋 表格 ${index + 1} (前300字):`);
        console.log(table.substring(0, 300));
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
  });
});

req.on('error', (error) => {
  console.error('❌ 請求錯誤:', error);
});

req.end();
