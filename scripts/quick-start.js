#!/usr/bin/env node

const { exec } = require('child_process');

console.log('⚡ 快速啟動詐騙獵人開發伺服器...\n');

// 快速檢查並啟動
function quickStart() {
  console.log('🔍 檢查端口狀態...');
  
  exec('netstat -ano | findstr :3000', (error, stdout) => {
    if (stdout.includes('LISTENING')) {
      console.log('✅ 開發伺服器已在運行！');
      console.log('🌐 請開啟瀏覽器訪問: http://localhost:3000');
    } else {
      console.log('🚀 啟動開發伺服器...');
      exec('npm run dev', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 啟動失敗:', error);
          return;
        }
        console.log(stdout);
        if (stderr) console.error(stderr);
      });
    }
  });
}

quickStart();
