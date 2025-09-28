#!/usr/bin/env node

const { spawn } = require('child_process');
const { exec } = require('child_process');

console.log('🚀 啟動詐騙獵人本地開發環境（含 Netlify Functions）...\n');

// 檢查端口是否被佔用
function checkPort(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      resolve(stdout.includes('LISTENING'));
    });
  });
}

// 啟動 Netlify Dev
async function startNetlifyDev() {
  console.log('🔄 啟動 Netlify Dev 伺服器...');
  
  const netlifyProcess = spawn('npx', ['netlify', 'dev'], {
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  netlifyProcess.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(text);
    
    // 檢查是否啟動成功
    if (text.includes('Server now ready on')) {
      console.log('✅ Netlify Dev 伺服器已啟動');
    }
  });

  netlifyProcess.stderr.on('data', (data) => {
    console.log('Netlify Dev:', data.toString());
  });

  netlifyProcess.on('error', (err) => {
    console.error('❌ Netlify Dev 啟動失敗:', err);
  });

  return netlifyProcess;
}

// 等待端口可用
async function waitForPort(port, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const isListening = await checkPort(port);
    if (isListening) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}

// 主啟動流程
async function main() {
  try {
    // 檢查端口 8888 是否已被佔用
    const port8888InUse = await checkPort(8888);
    if (port8888InUse) {
      console.log('⚠️  端口 8888 已被佔用，可能已有 Netlify Dev 在運行');
      console.log('💡 請先停止現有的 Netlify Dev 進程，或直接訪問 http://localhost:8888');
      return;
    }

    // 啟動 Netlify Dev
    const netlifyProcess = await startNetlifyDev();
    
    // 等待 Netlify Dev 啟動
    console.log('⏳ 等待 Netlify Dev 啟動...');
    const isReady = await waitForPort(8888, 30000);
    
    if (isReady) {
      console.log('\n🎉 本地開發環境已準備就緒！');
      console.log('🌐 應用程式網址: http://localhost:8888');
      console.log('🔧 Netlify Functions: http://localhost:8888/.netlify/functions/');
      console.log('\n💡 現在可以測試判決書搜尋功能了！');
      console.log('\n🛑 按 Ctrl+C 停止伺服器');
    } else {
      console.log('❌ Netlify Dev 啟動超時');
      netlifyProcess.kill();
    }

    // 優雅關閉
    process.on('SIGINT', () => {
      console.log('\n🛑 正在關閉開發伺服器...');
      netlifyProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 正在關閉開發伺服器...');
      netlifyProcess.kill('SIGTERM');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ 啟動失敗:', error);
    process.exit(1);
  }
}

main();
