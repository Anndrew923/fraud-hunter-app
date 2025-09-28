#!/usr/bin/env node

const fetch = require('node-fetch');

console.log('🧪 測試生產環境 Netlify Functions...\n');

// 測試生產環境 Functions
async function testProductionFunctions(domain) {
  console.log(`🔍 測試域名: ${domain}`);
  
  const baseUrl = `https://${domain}`;
  const functions = [
    {
      name: '司法院搜尋',
      url: `${baseUrl}/.netlify/functions/judicial-search`,
      method: 'POST',
      body: { keyword: '詐欺', page: 1 }
    },
    {
      name: '判決書詳細內容',
      url: `${baseUrl}/.netlify/functions/judicial-detail`,
      method: 'POST',
      body: { detailUrl: 'https://arch.judicial.gov.tw/FJUD/FJUDQRY02_1.aspx' }
    }
  ];

  for (const func of functions) {
    try {
      console.log(`\n🔄 測試 ${func.name}...`);
      
      const response = await fetch(func.url, {
        method: func.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(func.body),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${func.name} 正常`);
        console.log(`📊 狀態: ${data.success ? '成功' : '失敗'}`);
        
        if (func.name === '司法院搜尋') {
          console.log(`📋 結果數量: ${data.results?.length || 0}`);
        }
      } else {
        console.log(`❌ ${func.name} 失敗: ${response.status}`);
        const errorText = await response.text();
        console.log(`錯誤詳情: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ${func.name} 錯誤: ${error.message}`);
    }
  }
}

// 主函數
async function main() {
  const domain = process.argv[2];
  
  if (!domain) {
    console.log('使用方法: node scripts/test-production-functions.js <your-domain>');
    console.log('例如: node scripts/test-production-functions.js fraud-hunter-app.netlify.app');
    return;
  }

  await testProductionFunctions(domain);
  
  console.log('\n🎯 測試完成！');
  console.log('💡 如果所有 Functions 都正常，表示生產環境配置正確');
}

main().catch(console.error);
