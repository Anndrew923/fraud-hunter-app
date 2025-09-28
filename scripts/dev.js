#!/usr/bin/env node

const { spawn } = require('child_process');
const { exec } = require('child_process');
const net = require('net');

console.log('🚀 啟動詐騙獵人開發伺服器（智能版）...\n');

// 設定環境變數（優化啟動速度，但保持穩定）
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=2048';

// 檢查端口是否可用
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// 尋找可用端口
async function findAvailablePort(startPort = 3000) {
  for (let port = startPort; port <= startPort + 10; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error('找不到可用端口');
}

// 啟動開發伺服器
async function startDevServer() {
  try {
    const port = await findAvailablePort(3000);
    console.log(`🌐 使用端口: ${port}`);
    
    const devProcess = spawn('npx', ['next', 'dev', '--port', port.toString()], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=2048'
      }
    });

    // 延遲開啟瀏覽器（確保伺服器已啟動）
    setTimeout(() => {
      const url = `http://localhost:${port}`;
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
    }, 3000); // 3秒後開啟瀏覽器

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

  } catch (error) {
    console.error('❌ 無法找到可用端口:', error.message);
    process.exit(1);
  }
}

// 啟動伺服器
startDevServer();
