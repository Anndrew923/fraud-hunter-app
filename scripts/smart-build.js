#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 智能構建詐騙獵人應用程式...\n');

// 構建狀態追蹤
let buildStartTime = Date.now();
let isBuilding = true;
let buildStep = 0;
const totalSteps = 5;

const buildSteps = [
  '清理快取檔案',
  '檢查 TypeScript 類型',
  '編譯 Next.js 應用程式',
  '優化靜態資源',
  '生成最終構建檔案'
];

// 進度顯示函數
function showProgress(step, message) {
  const progress = Math.round((step / totalSteps) * 100);
  const elapsed = Math.round((Date.now() - buildStartTime) / 1000);
  
  console.log(`\n📊 構建進度: ${progress}% (${step}/${totalSteps})`);
  console.log(`⏱️  已用時間: ${elapsed}秒`);
  console.log(`🔄 當前步驟: ${message}`);
  console.log('─'.repeat(50));
}

// 超時控制
const BUILD_TIMEOUT = 300000; // 5分鐘超時
let timeoutId;

function startTimeout() {
  timeoutId = setTimeout(() => {
    if (isBuilding) {
      console.log('\n⏰ 構建超時（5分鐘），正在終止...');
      console.log('💡 建議：');
      console.log('   1. 檢查是否有語法錯誤');
      console.log('   2. 嘗試清理 .next 資料夾');
      console.log('   3. 重新啟動終端機');
      process.exit(1);
    }
  }, BUILD_TIMEOUT);
}

function clearBuildTimeout() {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}

// 清理快取
async function cleanupCache() {
  showProgress(1, buildSteps[0]);
  
  try {
    // 清理 .next 資料夾
    if (fs.existsSync('.next')) {
      console.log('🧹 清理 .next 資料夾...');
      await new Promise((resolve, reject) => {
        const { exec } = require('child_process');
        exec('Remove-Item -Recurse -Force .next', (error) => {
          if (error) {
            console.log('⚠️  清理 .next 失敗，繼續構建...');
          } else {
            console.log('✅ .next 資料夾已清理');
          }
          resolve();
        });
      });
    }
    
    // 清理 node_modules/.cache
    if (fs.existsSync('node_modules/.cache')) {
      console.log('🧹 清理 node_modules/.cache...');
      await new Promise((resolve) => {
        const { exec } = require('child_process');
        exec('Remove-Item -Recurse -Force node_modules/.cache', () => {
          console.log('✅ 快取已清理');
          resolve();
        });
      });
    }
    
    console.log('✅ 清理完成');
  } catch (error) {
    console.log('⚠️  清理過程中出現錯誤，繼續構建...');
  }
}

// 檢查 TypeScript
async function checkTypeScript() {
  showProgress(2, buildSteps[1]);
  
  return new Promise((resolve, reject) => {
    console.log('🔍 檢查 TypeScript 類型...');
    
    const tscProcess = spawn('npx', ['tsc', '--noEmit'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    tscProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    tscProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    tscProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript 類型檢查通過');
        resolve();
      } else {
        console.log('❌ TypeScript 類型檢查失敗');
        console.log('錯誤詳情:', errorOutput);
        reject(new Error('TypeScript 類型檢查失敗'));
      }
    });
  });
}

// 執行 Next.js 構建
async function buildNextApp() {
  showProgress(3, buildSteps[2]);
  
  return new Promise((resolve, reject) => {
    console.log('🔨 開始編譯 Next.js 應用程式...');
    console.log('💡 這通常需要 30-60 秒，請耐心等待...');
    
    const buildProcess = spawn('npx', ['next', 'build'], {
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096'
      }
    });
    
    let output = '';
    let errorOutput = '';
    
    buildProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // 顯示關鍵進度訊息
      if (text.includes('Compiled successfully')) {
        console.log('✅ 編譯成功！');
      } else if (text.includes('Creating an optimized production build')) {
        console.log('🔄 正在創建優化版本...');
      } else if (text.includes('Generating static pages')) {
        console.log('🔄 正在生成靜態頁面...');
      } else if (text.includes('Finalizing page optimization')) {
        console.log('🔄 正在完成頁面優化...');
      }
    });
    
    buildProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Next.js 構建完成');
        resolve();
      } else {
        console.log('❌ Next.js 構建失敗');
        console.log('錯誤詳情:', errorOutput);
        reject(new Error('Next.js 構建失敗'));
      }
    });
  });
}

// 檢查構建結果
async function checkBuildResult() {
  showProgress(4, buildSteps[3]);
  
  const buildDir = '.next';
  const staticDir = 'out';
  
  if (fs.existsSync(buildDir)) {
    console.log('✅ 構建目錄已創建');
    
    // 檢查靜態匯出
    if (fs.existsSync(staticDir)) {
      console.log('✅ 靜態檔案已生成');
      
      // 檢查主要檔案
      const files = ['index.html', '404.html'];
      for (const file of files) {
        if (fs.existsSync(path.join(staticDir, file))) {
          console.log(`✅ ${file} 已生成`);
        } else {
          console.log(`⚠️  ${file} 未找到`);
        }
      }
    } else {
      console.log('⚠️  靜態匯出目錄未找到');
    }
  } else {
    throw new Error('構建目錄未創建');
  }
}

// 完成構建
function finishBuild() {
  showProgress(5, buildSteps[4]);
  
  const totalTime = Math.round((Date.now() - buildStartTime) / 1000);
  
  console.log('\n🎉 構建完成！');
  console.log(`⏱️  總用時: ${totalTime}秒`);
  console.log('📁 構建檔案位置: ./out/');
  console.log('🚀 可以部署到 Netlify 或其他靜態託管服務');
  console.log('\n💡 下一步:');
  console.log('   • 本地測試: npm run dev');
  console.log('   • 部署: 將 out/ 資料夾上傳到託管服務');
  
  isBuilding = false;
  clearBuildTimeout();
}

// 主構建流程
async function main() {
  try {
    startTimeout();
    
    await cleanupCache();
    await checkTypeScript();
    await buildNextApp();
    await checkBuildResult();
    finishBuild();
    
  } catch (error) {
    console.log('\n❌ 構建失敗！');
    console.log('錯誤:', error.message);
    console.log('\n🔧 建議解決方案:');
    console.log('1. 檢查程式碼語法錯誤');
    console.log('2. 執行: npm run cleanup');
    console.log('3. 重新執行: npm run smart-build');
    console.log('4. 如果問題持續，請檢查依賴項');
    
    isBuilding = false;
    clearTimeout();
    process.exit(1);
  }
}

// 處理中斷信號
process.on('SIGINT', () => {
  console.log('\n\n🛑 構建被用戶中斷');
  console.log('💡 您可以稍後重新執行: npm run smart-build');
  isBuilding = false;
  clearBuildTimeout();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 構建被終止');
  isBuilding = false;
  clearBuildTimeout();
  process.exit(0);
});

// 啟動構建
main();
