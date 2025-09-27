#!/usr/bin/env node

/**
 * Firebase 快速設定腳本
 * 此腳本會引導你完成 Firebase 專案設定
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('🔥 Firebase 快速設定腳本');
  console.log('========================\n');

  console.log('請按照以下步驟設定 Firebase：\n');

  console.log('1. 前往 https://console.firebase.google.com/');
  console.log('2. 建立新專案「fraud-hunter-app」');
  console.log('3. 啟用 Firestore 和 Authentication');
  console.log('4. 取得 Web 應用程式配置\n');

  const config = {};

  try {
    config.apiKey = await question('請輸入 API Key: ');
    config.authDomain = await question('請輸入 Auth Domain (例如: project-id.firebaseapp.com): ');
    config.projectId = await question('請輸入 Project ID: ');
    config.storageBucket = await question('請輸入 Storage Bucket (例如: project-id.appspot.com): ');
    config.messagingSenderId = await question('請輸入 Messaging Sender ID: ');
    config.appId = await question('請輸入 App ID: ');

    // 建立 .env.local 檔案
    const envContent = `# Firebase 配置
NEXT_PUBLIC_FIREBASE_API_KEY=${config.apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${config.authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${config.projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${config.storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${config.appId}

# 應用程式配置
NEXT_PUBLIC_APP_NAME=詐騙獵人
NEXT_PUBLIC_APP_VERSION=1.0.0

# 開發模式
NODE_ENV=development
`;

    const envPath = path.join(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ .env.local 檔案已建立！');
    console.log('📁 檔案位置:', envPath);
    console.log('\n🚀 現在可以執行以下命令測試 Firebase：');
    console.log('   npm run dev');
    console.log('\n然後在瀏覽器中點擊「測試 Firebase」按鈕');

  } catch (error) {
    console.error('❌ 設定失敗:', error.message);
  } finally {
    rl.close();
  }
}

main();
