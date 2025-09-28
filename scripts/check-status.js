#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 檢查詐騙獵人應用程式狀態...\n');

// 檢查項目結構
function checkProjectStructure() {
  console.log('📁 檢查項目結構...');
  
  const requiredFiles = [
    'package.json',
    'next.config.ts',
    'tsconfig.json',
    'src/app/page.tsx',
    'src/app/layout.tsx'
  ];
  
  const requiredDirs = [
    'src',
    'src/app',
    'src/lib',
    'src/components'
  ];
  
  let allGood = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - 缺失`);
      allGood = false;
    }
  }
  
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      console.log(`✅ ${dir}/`);
    } else {
      console.log(`❌ ${dir}/ - 缺失`);
      allGood = false;
    }
  }
  
  return allGood;
}

// 檢查構建狀態
function checkBuildStatus() {
  console.log('\n🔨 檢查構建狀態...');
  
  const buildDir = '.next';
  const staticDir = 'out';
  
  if (fs.existsSync(buildDir)) {
    console.log('✅ .next 資料夾存在');
    
    // 檢查構建時間
    const stats = fs.statSync(buildDir);
    const buildTime = new Date(stats.mtime);
    const now = new Date();
    const diffMinutes = Math.round((now - buildTime) / (1000 * 60));
    
    console.log(`📅 最後構建時間: ${buildTime.toLocaleString()}`);
    console.log(`⏰ 構建距今: ${diffMinutes} 分鐘前`);
    
    if (diffMinutes > 60) {
      console.log('⚠️  構建時間較久，建議重新構建');
    }
  } else {
    console.log('❌ .next 資料夾不存在，需要構建');
  }
  
  if (fs.existsSync(staticDir)) {
    console.log('✅ out 資料夾存在（靜態匯出）');
    
    // 檢查靜態檔案
    const staticFiles = ['index.html', '404.html'];
    for (const file of staticFiles) {
      if (fs.existsSync(path.join(staticDir, file))) {
        console.log(`✅ ${file} 已生成`);
      } else {
        console.log(`⚠️  ${file} 未找到`);
      }
    }
  } else {
    console.log('❌ out 資料夾不存在，需要構建');
  }
}

// 檢查依賴項
function checkDependencies() {
  console.log('\n📦 檢查依賴項...');
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    const requiredDeps = [
      'next',
      'react',
      'react-dom',
      'typescript',
      '@types/react',
      '@types/node'
    ];
    
    for (const dep of requiredDeps) {
      if (dependencies[dep] || devDependencies[dep]) {
        console.log(`✅ ${dep}`);
      } else {
        console.log(`❌ ${dep} - 缺失`);
      }
    }
  }
}

// 檢查端口使用情況
function checkPorts() {
  console.log('\n🌐 檢查端口使用情況...');
  
  const { exec } = require('child_process');
  
  exec('netstat -ano | findstr :3000', (error, stdout) => {
    if (stdout.includes('LISTENING')) {
      console.log('✅ 端口 3000 正在使用中（開發伺服器可能正在運行）');
    } else {
      console.log('ℹ️  端口 3000 未被使用');
    }
  });
  
  exec('netstat -ano | findstr :3001', (error, stdout) => {
    if (stdout.includes('LISTENING')) {
      console.log('✅ 端口 3001 正在使用中');
    } else {
      console.log('ℹ️  端口 3001 未被使用');
    }
  });
}

// 提供建議
function provideSuggestions() {
  console.log('\n💡 建議操作:');
  console.log('1. 快速啟動: npm run dev');
  console.log('2. 智能構建: npm run smart-build');
  console.log('3. 清理環境: npm run cleanup');
  console.log('4. 檢查狀態: npm run check-status');
  console.log('5. 快速檢查: npm run quick');
}

// 主函數
function main() {
  const structureOk = checkProjectStructure();
  checkBuildStatus();
  checkDependencies();
  checkPorts();
  provideSuggestions();
  
  console.log('\n🎯 總結:');
  if (structureOk) {
    console.log('✅ 項目結構完整');
    console.log('🚀 可以開始開發或構建');
  } else {
    console.log('❌ 項目結構不完整');
    console.log('🔧 請檢查缺失的檔案');
  }
}

main();
