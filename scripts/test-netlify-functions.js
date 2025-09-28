#!/usr/bin/env node

const fetch = require('node-fetch');

console.log('🧪 測試 Netlify Functions...\n');

// 測試搜尋功能
async function testJudicialSearch() {
  console.log('🔍 測試司法院搜尋功能...');
  
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/judicial-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: '詐欺',
        page: 1
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 搜尋功能正常');
      console.log('📊 結果數量:', data.results?.length || 0);
      return true;
    } else {
      console.log('❌ 搜尋功能失敗:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ 搜尋功能錯誤:', error.message);
    return false;
  }
}

// 測試詳細內容功能
async function testJudicialDetail() {
  console.log('🔍 測試判決書詳細內容功能...');
  
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/judicial-detail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        detailUrl: 'https://arch.judicial.gov.tw/FJUD/FJUDQRY02_1.aspx'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 詳細內容功能正常');
      console.log('📊 案件標題:', data.detail?.caseTitle || '無');
      return true;
    } else {
      console.log('❌ 詳細內容功能失敗:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ 詳細內容功能錯誤:', error.message);
    return false;
  }
}

// 檢查 Netlify Dev 是否運行
async function checkNetlifyDev() {
  console.log('🔍 檢查 Netlify Dev 是否運行...');
  
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/judicial-search', {
      method: 'OPTIONS'
    });
    
    if (response.ok) {
      console.log('✅ Netlify Dev 正在運行');
      return true;
    } else {
      console.log('❌ Netlify Dev 未運行');
      return false;
    }
  } catch (error) {
    console.log('❌ Netlify Dev 未運行:', error.message);
    return false;
  }
}

// 主測試函數
async function main() {
  console.log('🚀 開始測試 Netlify Functions...\n');
  
  const isNetlifyDevRunning = await checkNetlifyDev();
  
  if (!isNetlifyDevRunning) {
    console.log('\n💡 請先啟動 Netlify Dev:');
    console.log('   npx netlify dev');
    console.log('\n然後重新執行此測試');
    return;
  }
  
  const searchOk = await testJudicialSearch();
  const detailOk = await testJudicialDetail();
  
  console.log('\n📊 測試結果:');
  console.log(`搜尋功能: ${searchOk ? '✅ 正常' : '❌ 失敗'}`);
  console.log(`詳細內容功能: ${detailOk ? '✅ 正常' : '❌ 失敗'}`);
  
  if (searchOk && detailOk) {
    console.log('\n🎉 所有 Netlify Functions 都正常！');
    console.log('🚀 可以部署到生產環境了');
  } else {
    console.log('\n⚠️  部分功能有問題，請檢查後再部署');
  }
}

main().catch(console.error);
