#!/usr/bin/env node

const https = require('https');

console.log('🔍 調試司法院搜尋問題...\n');

const keyword = '杜啟宇';

// 首先檢查司法院網站是否正常
console.log('📡 檢查司法院網站狀態...');
const checkUrl = 'https://judgment.judicial.gov.tw/FJUD/default.aspx';

const checkOptions = {
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  }
};

const checkReq = https.request(checkUrl, checkOptions, (checkRes) => {
  console.log('📊 司法院網站狀態碼:', checkRes.statusCode);
  console.log('📊 司法院網站標頭:', checkRes.headers);
  
  let checkHtml = '';
  
  checkRes.on('data', (chunk) => {
    checkHtml += chunk;
  });
  
  checkRes.on('end', () => {
    console.log('📄 司法院網站 HTML 長度:', checkHtml.length);
    
    // 檢查是否有搜尋表單
    const formMatch = checkHtml.match(/<form[^>]*>[\s\S]*?<\/form>/gi);
    if (formMatch) {
      console.log('✅ 找到搜尋表單');
      formMatch.forEach((form, index) => {
        console.log(`\n📋 表單 ${index + 1} (前500字):`);
        console.log(form.substring(0, 500));
      });
    } else {
      console.log('❌ 未找到搜尋表單');
    }
    
    // 檢查是否有搜尋按鈕
    const buttonMatch = checkHtml.match(/<input[^>]*type="submit"[^>]*>/gi);
    if (buttonMatch) {
      console.log('✅ 找到搜尋按鈕');
      buttonMatch.forEach((button, index) => {
        console.log(`\n🔘 按鈕 ${index + 1}:`, button);
      });
    } else {
      console.log('❌ 未找到搜尋按鈕');
    }
    
    // 檢查是否有搜尋輸入框
    const inputMatch = checkHtml.match(/<input[^>]*name="txtKW"[^>]*>/gi);
    if (inputMatch) {
      console.log('✅ 找到搜尋輸入框');
      inputMatch.forEach((input, index) => {
        console.log(`\n📝 輸入框 ${index + 1}:`, input);
      });
    } else {
      console.log('❌ 未找到搜尋輸入框');
    }
    
    // 檢查是否有 ViewState
    const viewStateMatch = checkHtml.match(/name="__VIEWSTATE"[^>]*value="([^"]*)"/);
    if (viewStateMatch) {
      console.log('✅ 找到 ViewState');
      console.log('📄 ViewState 長度:', viewStateMatch[1].length);
    } else {
      console.log('❌ 未找到 ViewState');
    }
    
    // 檢查是否有 EventValidation
    const eventValidationMatch = checkHtml.match(/name="__EVENTVALIDATION"[^>]*value="([^"]*)"/);
    if (eventValidationMatch) {
      console.log('✅ 找到 EventValidation');
      console.log('📄 EventValidation 長度:', eventValidationMatch[1].length);
    } else {
      console.log('❌ 未找到 EventValidation');
    }
    
    // 檢查是否有 ViewStateGenerator
    const viewStateGeneratorMatch = checkHtml.match(/name="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"/);
    if (viewStateGeneratorMatch) {
      console.log('✅ 找到 ViewStateGenerator');
      console.log('📄 ViewStateGenerator:', viewStateGeneratorMatch[1]);
    } else {
      console.log('❌ 未找到 ViewStateGenerator');
    }
    
    // 檢查是否有搜尋結果相關的 JavaScript
    const scriptMatch = checkHtml.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
    if (scriptMatch) {
      console.log('✅ 找到 JavaScript');
      scriptMatch.forEach((script, index) => {
        if (script.includes('search') || script.includes('query') || script.includes('result')) {
          console.log(`\n📜 相關腳本 ${index + 1} (前300字):`);
          console.log(script.substring(0, 300));
        }
      });
    } else {
      console.log('❌ 未找到 JavaScript');
    }
  });
});

checkReq.on('error', (error) => {
  console.error('❌ 檢查請求錯誤:', error);
});

checkReq.end();
