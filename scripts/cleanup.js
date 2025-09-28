#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🧹 清理開發環境...\n');

// 清理 Node.js 進程
function cleanupNodeProcesses() {
  return new Promise((resolve) => {
    console.log('🔄 清理 Node.js 進程...');
    exec('taskkill /f /im node.exe', (error) => {
      if (error) {
        console.log('✅ 沒有需要清理的 Node.js 進程');
      } else {
        console.log('✅ Node.js 進程已清理');
      }
      resolve();
    });
  });
}

// 清理 .next 資料夾
function cleanupNextFolder() {
  return new Promise((resolve) => {
    console.log('🔄 清理 .next 資料夾...');
    exec('rmdir /s /q .next', (error) => {
      if (error) {
        console.log('✅ .next 資料夾已清理或不存在');
      } else {
        console.log('✅ .next 資料夾已清理');
      }
      resolve();
    });
  });
}

// 等待端口釋放
function waitForPortRelease() {
  return new Promise((resolve) => {
    console.log('⏳ 等待端口釋放...');
    setTimeout(() => {
      console.log('✅ 端口已釋放');
      resolve();
    }, 2000);
  });
}

// 主清理流程
async function cleanup() {
  try {
    await cleanupNodeProcesses();
    await cleanupNextFolder();
    await waitForPortRelease();
    
    console.log('\n🎉 清理完成！現在可以啟動開發伺服器了');
    console.log('💡 執行 "npm run dev" 開始開發');
  } catch (error) {
    console.error('❌ 清理過程中發生錯誤:', error);
  }
}

cleanup();
