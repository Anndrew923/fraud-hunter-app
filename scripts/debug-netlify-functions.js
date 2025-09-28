#!/usr/bin/env node

const fetch = require('node-fetch');

console.log('🔍 調試 Netlify Functions 錯誤...\n');

// 測試 Functions 端點
async function testFunction(url, name, body) {
  console.log(`🔄 測試 ${name}...`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`📊 狀態碼: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name} 成功`);
      console.log(`📋 回應:`, JSON.stringify(data, null, 2));
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ ${name} 失敗`);
      console.log(`🚨 錯誤詳情:`, errorText);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} 網路錯誤:`, error.message);
    return false;
  }
}

// 測試 OPTIONS 請求（CORS 預檢）
async function testCORS(url, name) {
  console.log(`🔄 測試 ${name} CORS...`);
  
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
    });

    console.log(`📊 CORS 狀態碼: ${response.status}`);
    
    if (response.ok) {
      console.log(`✅ ${name} CORS 正常`);
      return true;
    } else {
      console.log(`❌ ${name} CORS 失敗`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} CORS 錯誤:`, error.message);
    return false;
  }
}

// 主測試函數
async function main() {
  const domain = 'fraud-hunter-app.netlify.app';
  const baseUrl = `https://${domain}`;
  
  console.log(`🎯 測試域名: ${domain}\n`);
  
  // 測試 CORS
  await testCORS(`${baseUrl}/.netlify/functions/judicial-search`, '司法院搜尋');
  await testCORS(`${baseUrl}/.netlify/functions/judicial-detail`, '判決書詳細');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 測試搜尋功能
  const searchResult = await testFunction(
    `${baseUrl}/.netlify/functions/judicial-search`,
    '司法院搜尋',
    { keyword: '杜啟宇', page: 1 }
  );
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 測試詳細內容功能
  const detailResult = await testFunction(
    `${baseUrl}/.netlify/functions/judicial-detail`,
    '判決書詳細',
    { detailUrl: 'https://arch.judicial.gov.tw/FJUD/FJUDQRY02_1.aspx' }
  );
  
  console.log('\n📊 測試結果總結:');
  console.log(`搜尋功能: ${searchResult ? '✅ 正常' : '❌ 失敗'}`);
  console.log(`詳細功能: ${detailResult ? '✅ 正常' : '❌ 失敗'}`);
  
  if (!searchResult || !detailResult) {
    console.log('\n🔧 建議解決方案:');
    console.log('1. 檢查 Netlify Functions 日誌');
    console.log('2. 確認 Functions 代碼無語法錯誤');
    console.log('3. 檢查依賴項是否正確安裝');
    console.log('4. 重新部署 Functions');
  }
}

main().catch(console.error);
