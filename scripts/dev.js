#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 啟動詐騙獵人開發伺服器（穩定版）...\n');

// 設定環境變數（優化啟動速度，但保持穩定）
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=2048';

// 啟動開發伺服器（使用標準 Next.js，不使用 Turbopack）
const devProcess = spawn('npx', ['next', 'dev', '--port', '3000'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=2048'
  }
});

// 延遲開啟瀏覽器（確保伺服器已啟動）
setTimeout(() => {
  const { exec } = require('child_process');
  const url = 'http://localhost:3000';
  console.log(`\n🌐 正在開啟瀏覽器: ${url}`);
  
  // 根據作業系統選擇開啟命令
  const openCommand = process.platform === 'win32' ? 'start' : 
                    process.platform === 'darwin' ? 'open' : 'xdg-open';
  
  exec(`${openCommand} ${url}`, (error) => {
    if (error) {
      console.log(`請手動開啟瀏覽器: ${url}`);
    } else {
      console.log('✅ 瀏覽器已開啟');
    }
  });
}, 3000); // 3秒後開啟瀏覽器，給更多時間啟動

devProcess.on('error', (err) => {
  console.error('❌ 啟動失敗:', err);
  process.exit(1);
});

devProcess.on('close', (code) => {
  console.log(`\n👋 開發伺服器已關閉 (退出碼: ${code})`);
  process.exit(code);
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n🛑 正在關閉開發伺服器...');
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在關閉開發伺服器...');
  devProcess.kill('SIGTERM');
});
