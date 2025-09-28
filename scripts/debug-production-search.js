#!/usr/bin/env node

const https = require('https');

console.log('🔍 調試生產環境搜尋問題...\n');

const keyword = '杜啟宇';

// 模擬我們的Netlify Function的邏輯
async function testProductionSearch() {
  try {
    console.log('📡 第一步：獲取表單頁面...');
    
    // 第一步：獲取表單頁面
    const formUrl = 'https://judgment.judicial.gov.tw/FJUD/default.aspx';
    const formResponse = await fetch(formUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!formResponse.ok) {
      throw new Error(`獲取表單失敗: ${formResponse.status} ${formResponse.statusText}`);
    }

    const formHtml = await formResponse.text();
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
    formData.append('ctl00$cp_content$btnSimpleQry', '送出查詢');

    console.log('📤 表單數據:', formData.toString());

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://judgment.judicial.gov.tw/FJUD/default.aspx'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`司法院搜尋失敗: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('\n📄 搜尋結果 HTML 長度:', html.length);
    console.log('\n📄 搜尋結果前2000字:');
    console.log(html.substring(0, 2000));
    
    console.log('\n🔍 搜尋關鍵字 "杜啟宇" 在搜尋結果中的位置:');
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

  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

testProductionSearch();
