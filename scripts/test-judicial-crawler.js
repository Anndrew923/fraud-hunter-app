// 測試司法院法學資料檢索系統爬蟲
const { judicialCrawler } = require('../src/lib/crawlers/judicialCrawler');

async function testJudicialCrawler() {
  console.log('🧪 開始測試司法院爬蟲系統...\n');

  try {
    // 測試搜尋功能
    console.log('1. 測試搜尋「詐欺」關鍵字...');
    const searchResults = await judicialCrawler.searchJudgments({
      keyword: '詐欺',
      page: 1
    });
    
    console.log(`✅ 搜尋完成，找到 ${searchResults.length} 筆結果`);
    
    if (searchResults.length > 0) {
      console.log('\n📋 前3筆搜尋結果:');
      searchResults.slice(0, 3).forEach((result, index) => {
        console.log(`${index + 1}. ${result.caseNumber}`);
        console.log(`   日期: ${result.judgmentDate}`);
        console.log(`   案由: ${result.caseReason}`);
        console.log(`   大小: ${result.contentSize}`);
        console.log(`   連結: ${result.detailUrl}`);
        console.log('');
      });

      // 測試取得詳細內容
      console.log('2. 測試取得第一筆判決書詳細內容...');
      const firstResult = searchResults[0];
      const detail = await judicialCrawler.getJudgmentDetail(firstResult.detailUrl);
      
      console.log('✅ 詳細內容取得成功');
      console.log(`   標題: ${detail.caseTitle}`);
      console.log(`   法院: ${detail.court}`);
      console.log(`   日期: ${detail.judgmentDate}`);
      console.log(`   案由: ${detail.caseReason}`);
      console.log(`   原告: ${detail.plaintiff || '無'}`);
      console.log(`   被告: ${detail.defendant || '無'}`);
      console.log(`   風險分數: ${detail.riskScore}`);
      console.log(`   摘要: ${detail.summary.substring(0, 100)}...`);
      console.log(`   相關法條: ${detail.relatedLaws.join(', ')}`);
    }

    console.log('\n🎉 司法院爬蟲系統測試完成！');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    console.error('詳細錯誤:', error);
  }
}

// 執行測試
testJudicialCrawler();
