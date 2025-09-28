#!/usr/bin/env node

const https = require('https');

console.log('🔍 測試司法院表單提交搜尋...\n');

const keyword = '杜啟宇';

// 第一步：獲取表單頁面
const formUrl = 'https://judgment.judicial.gov.tw/FJUD/default.aspx';
console.log('📡 第一步：獲取表單頁面...');
console.log('URL:', formUrl);

const formOptions = {
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  }
};

const formReq = https.request(formUrl, formOptions, (formRes) => {
  console.log('📊 表單頁面狀態碼:', formRes.statusCode);
  
  let formHtml = '';
  
  formRes.on('data', (chunk) => {
    formHtml += chunk;
  });
  
  formRes.on('end', () => {
    console.log('📄 表單頁面 HTML 長度:', formHtml.length);
    
    // 提取 ViewState 和相關參數
    const viewStateMatch = formHtml.match(/name="__VIEWSTATE" id="__VIEWSTATE" value="([^"]*)"/);
    const viewStateGeneratorMatch = formHtml.match(/name="__VIEWSTATEGENERATOR" id="__VIEWSTATEGENERATOR" value="([^"]*)"/);
    const eventValidationMatch = formHtml.match(/name="__EVENTVALIDATION" id="__EVENTVALIDATION" value="([^"]*)"/);

    const viewState = viewStateMatch ? viewStateMatch[1] : '';
    const viewStateGenerator = viewStateGeneratorMatch ? viewStateGeneratorMatch[1] : '';
    const eventValidation = eventValidationMatch ? eventValidationMatch[1] : '';

    console.log('🔍 提取的參數:');
    console.log('  - ViewState:', viewState ? `已獲取 (${viewState.length} 字元)` : '❌ 未獲取');
    console.log('  - ViewStateGenerator:', viewStateGenerator ? `已獲取 (${viewStateGenerator})` : '❌ 未獲取');
    console.log('  - EventValidation:', eventValidation ? `已獲取 (${eventValidation.length} 字元)` : '❌ 未獲取');

    if (!viewState || !viewStateGenerator || !eventValidation) {
      console.log('❌ 無法獲取必要的表單參數，搜尋失敗');
      return;
    }

    // 第二步：提交搜尋表單
    console.log('\n📡 第二步：提交搜尋表單...');
    
    const searchUrl = 'https://judgment.judicial.gov.tw/FJUD/default.aspx';
    const formData = new URLSearchParams();
    formData.append('__VIEWSTATE', viewState);
    formData.append('__VIEWSTATEGENERATOR', viewStateGenerator);
    formData.append('__EVENTVALIDATION', eventValidation);
    formData.append('txtKW', keyword);
    formData.append('judtype', 'JUDBOOK');
    formData.append('ctl00$cp_content$btnSubmit', '送出查詢');

    console.log('📤 表單數據:', formData.toString());

    const searchOptions = {
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

    const searchReq = https.request(searchUrl, searchOptions, (searchRes) => {
      console.log('📊 搜尋結果狀態碼:', searchRes.statusCode);
      console.log('📊 搜尋結果標頭:', searchRes.headers);
      
      let searchHtml = '';
      
      searchRes.on('data', (chunk) => {
        searchHtml += chunk;
      });
      
      searchRes.on('end', () => {
        console.log('\n📄 搜尋結果 HTML 長度:', searchHtml.length);
        console.log('\n📄 搜尋結果前1000字:');
        console.log(searchHtml.substring(0, 1000));
        
        console.log('\n🔍 搜尋關鍵字 "杜啟宇" 在搜尋結果中的位置:');
        const keywordIndex = searchHtml.indexOf(keyword);
        if (keywordIndex !== -1) {
          console.log('✅ 找到關鍵字，位置:', keywordIndex);
          console.log('📄 關鍵字前後200字:', searchHtml.substring(keywordIndex - 200, keywordIndex + 200));
        } else {
          console.log('❌ 未找到關鍵字');
        }
        
        console.log('\n🔍 搜尋案件相關內容:');
        const caseMatches = searchHtml.match(/[^<]*案件[^<]*/gi);
        if (caseMatches) {
          console.log('✅ 找到', caseMatches.length, '個案件相關內容');
          caseMatches.slice(0, 5).forEach((caseText, index) => {
            console.log(`\n📋 案件 ${index + 1}:`, caseText.trim());
          });
        } else {
          console.log('❌ 未找到案件相關內容');
        }
        
        console.log('\n🔍 搜尋表格相關標籤:');
        const tableMatches = searchHtml.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
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
        const linkMatches = searchHtml.match(/<a[^>]*href="[^"]*"[^>]*>[\s\S]*?<\/a>/gi);
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

    searchReq.on('error', (error) => {
      console.error('❌ 搜尋請求錯誤:', error);
    });

    searchReq.write(formData.toString());
    searchReq.end();
  });
});

formReq.on('error', (error) => {
  console.error('❌ 表單請求錯誤:', error);
});

formReq.end();
