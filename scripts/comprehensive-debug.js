#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🔥 地毯式檢查判決書搜尋系統...\n');

// 測試所有可能的端點和配置
async function comprehensiveTest() {
  const domain = 'fraud-hunter-app.netlify.app';
  const baseUrl = `https://${domain}`;
  
  console.log(`🎯 目標域名: ${domain}`);
  console.log(`🌐 完整網址: ${baseUrl}\n`);
  
  // 1. 測試網站基本連接
  await testBasicConnection(baseUrl);
  
  // 2. 測試 Functions 目錄
  await testFunctionsDirectory(baseUrl);
  
  // 3. 測試 CORS 預檢
  await testCORSPreflight(baseUrl);
  
  // 4. 測試搜尋 Function
  await testSearchFunction(baseUrl);
  
  // 5. 測試詳細內容 Function
  await testDetailFunction(baseUrl);
  
  // 6. 測試簡化版 Function
  await testSimpleFunction(baseUrl);
  
  // 7. 檢查司法院網站連接
  await testJudicialWebsite();
  
  console.log('\n🎯 地毯式檢查完成！');
}

// 測試基本連接
async function testBasicConnection(url) {
  console.log('1️⃣ 測試網站基本連接...');
  
  try {
    const response = await makeRequest(url);
    console.log(`✅ 網站連接正常 (${response.status})`);
    
    if (response.body.includes('詐騙獵人')) {
      console.log('✅ 網站內容正確');
    } else {
      console.log('⚠️ 網站內容可能不正確');
    }
  } catch (error) {
    console.log(`❌ 網站連接失敗: ${error.message}`);
  }
  console.log('');
}

// 測試 Functions 目錄
async function testFunctionsDirectory(baseUrl) {
  console.log('2️⃣ 測試 Functions 目錄...');
  
  const functions = [
    'judicial-search',
    'judicial-detail', 
    'test-search',
    'fetch-dashboard'
  ];
  
  for (const func of functions) {
    try {
      const url = `${baseUrl}/.netlify/functions/${func}`;
      const response = await makeRequest(url, 'OPTIONS');
      
      if (response.status === 200) {
        console.log(`✅ ${func} Function 存在`);
      } else {
        console.log(`⚠️ ${func} Function 狀態: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${func} Function 錯誤: ${error.message}`);
    }
  }
  console.log('');
}

// 測試 CORS 預檢
async function testCORSPreflight(baseUrl) {
  console.log('3️⃣ 測試 CORS 預檢...');
  
  try {
    const response = await makeRequest(`${baseUrl}/.netlify/functions/judicial-search`, 'OPTIONS');
    
    if (response.status === 200) {
      console.log('✅ CORS 預檢正常');
      
      const headers = response.headers;
      if (headers['access-control-allow-origin'] === '*') {
        console.log('✅ CORS 標頭正確');
      } else {
        console.log('⚠️ CORS 標頭可能不正確');
      }
    } else {
      console.log(`❌ CORS 預檢失敗: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ CORS 預檢錯誤: ${error.message}`);
  }
  console.log('');
}

// 測試搜尋 Function
async function testSearchFunction(baseUrl) {
  console.log('4️⃣ 測試搜尋 Function...');
  
  try {
    const response = await makeRequest(`${baseUrl}/.netlify/functions/judicial-search`, 'POST', {
      keyword: '詐欺',
      page: 1
    });
    
    console.log(`📊 搜尋 Function 狀態: ${response.status}`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      if (data.success) {
        console.log('✅ 搜尋 Function 正常');
        console.log(`📋 結果數量: ${data.results?.length || 0}`);
      } else {
        console.log(`⚠️ 搜尋 Function 失敗: ${data.error}`);
      }
    } else {
      console.log(`❌ 搜尋 Function 錯誤: ${response.status}`);
      console.log(`📄 錯誤內容: ${response.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`❌ 搜尋 Function 異常: ${error.message}`);
  }
  console.log('');
}

// 測試詳細內容 Function
async function testDetailFunction(baseUrl) {
  console.log('5️⃣ 測試詳細內容 Function...');
  
  try {
    const response = await makeRequest(`${baseUrl}/.netlify/functions/judicial-detail`, 'POST', {
      detailUrl: 'https://arch.judicial.gov.tw/FJUD/FJUDQRY02_1.aspx'
    });
    
    console.log(`📊 詳細內容 Function 狀態: ${response.status}`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      if (data.success) {
        console.log('✅ 詳細內容 Function 正常');
      } else {
        console.log(`⚠️ 詳細內容 Function 失敗: ${data.error}`);
      }
    } else {
      console.log(`❌ 詳細內容 Function 錯誤: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ 詳細內容 Function 異常: ${error.message}`);
  }
  console.log('');
}

// 測試簡化版 Function
async function testSimpleFunction(baseUrl) {
  console.log('6️⃣ 測試簡化版 Function...');
  
  try {
    const response = await makeRequest(`${baseUrl}/.netlify/functions/test-search`, 'POST', {
      keyword: '測試'
    });
    
    console.log(`📊 簡化版 Function 狀態: ${response.status}`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      if (data.success) {
        console.log('✅ 簡化版 Function 正常');
        console.log(`📋 測試結果: ${data.message}`);
      } else {
        console.log(`⚠️ 簡化版 Function 失敗: ${data.error}`);
      }
    } else {
      console.log(`❌ 簡化版 Function 錯誤: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ 簡化版 Function 異常: ${error.message}`);
  }
  console.log('');
}

// 測試司法院網站連接
async function testJudicialWebsite() {
  console.log('7️⃣ 測試司法院網站連接...');
  
  try {
    const response = await makeRequest('https://arch.judicial.gov.tw/FJUD/FJUDQRY01_1.aspx');
    
    if (response.status === 200) {
      console.log('✅ 司法院網站連接正常');
      
      if (response.body.includes('法學資料檢索系統')) {
        console.log('✅ 司法院網站內容正確');
      } else {
        console.log('⚠️ 司法院網站內容可能已變更');
      }
    } else {
      console.log(`❌ 司法院網站連接失敗: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ 司法院網站連接錯誤: ${error.message}`);
  }
  console.log('');
}

// 通用請求函數
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      }
    };

    if (data && method === 'POST') {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 執行測試
comprehensiveTest().catch(console.error);
