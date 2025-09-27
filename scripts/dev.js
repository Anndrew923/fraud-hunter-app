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

// 設定環境變數
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// 啟動開發伺服器
const devProcess = spawn('npx', ['next', 'dev', '--turbopack', '--open'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
});

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
