#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 啟動詐騙獵人開發伺服器...\n');

// 檢查並清理快取（安全模式）
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  console.log('🧹 清理舊的快取檔案...');
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
  } catch (error) {
    console.log('⚠️  快取清理失敗，但可以繼續運行:', error.message);
  }
}

// 設定環境變數（優化啟動速度）
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.NEXT_PRIVATE_DEBUG_CACHE = '0';
process.env.NEXT_PRIVATE_DEBUG_MEMORY = '0';
process.env.NEXT_PRIVATE_DEBUG_SWC = '0';

// 啟動開發伺服器
const devProcess = spawn('npx', ['next', 'dev', '--turbopack', '--port', '3000'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096'
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
}, 2000); // 2秒後開啟瀏覽器

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
