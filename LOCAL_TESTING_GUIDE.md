# 🧪 本地測試指南

## 📋 判決書爬蟲系統本地測試

### 🚨 重要說明
判決書爬蟲系統需要 **Netlify Functions** 才能正常運作，因為需要解決 CORS 問題。

## 🚀 本地測試方法

### 方法 1: 使用 Netlify Dev（推薦）

```bash
# 啟動包含 Netlify Functions 的開發環境
npm run dev:netlify
```

這會：
- ✅ 啟動 Netlify Dev 伺服器（端口 8888）
- ✅ 自動載入 Netlify Functions
- ✅ 解決 CORS 問題
- ✅ 支援判決書搜尋功能

**訪問網址**: http://localhost:8888

### 方法 2: 傳統 Next.js 開發（功能受限）

```bash
# 傳統開發模式
npm run dev
```

**限制**:
- ❌ 無法使用判決書搜尋功能
- ❌ 會出現 CORS 錯誤
- ✅ 其他功能正常（儀表板、UI 等）

**訪問網址**: http://localhost:3000

## 🔧 測試步驟

### 1. 啟動開發環境
```bash
npm run dev:netlify
```

### 2. 等待啟動完成
看到以下訊息表示啟動成功：
```
✅ Netlify Dev 伺服器已啟動
🎉 本地開發環境已準備就緒！
🌐 應用程式網址: http://localhost:8888
```

### 3. 測試判決書搜尋
1. 開啟瀏覽器訪問 http://localhost:8888
2. 在搜尋框輸入關鍵字（如：詐欺）
3. 點擊搜尋按鈕
4. 檢查是否有結果返回

### 4. 檢查控制台
- ✅ 應該看到「司法院搜尋成功」訊息
- ❌ 不應該有 `net::ERR_CONNECTION_REFUSED` 錯誤

## 🐛 常見問題排除

### 問題 1: 端口 8888 被佔用
**解決方法**:
```bash
# 檢查端口使用情況
netstat -ano | findstr :8888

# 停止佔用端口的進程
taskkill /f /pid <進程ID>
```

### 問題 2: Netlify Dev 啟動失敗
**解決方法**:
```bash
# 安裝 Netlify CLI
npm install -g netlify-cli

# 重新啟動
npm run dev:netlify
```

### 問題 3: Functions 404 錯誤
**解決方法**:
1. 檢查 `netlify/functions/` 目錄是否存在
2. 確認 `netlify.toml` 配置正確
3. 重新啟動 Netlify Dev

### 問題 4: 搜尋無結果
**可能原因**:
- 司法院網站暫時無法訪問
- 搜尋關鍵字太特殊
- Functions 邏輯問題

**解決方法**:
1. 嘗試不同的搜尋關鍵字
2. 檢查 Functions 日誌
3. 稍後再試

## 📊 測試檢查清單

- [ ] Netlify Dev 成功啟動
- [ ] 可以訪問 http://localhost:8888
- [ ] 判決書搜尋功能正常
- [ ] 無 CORS 錯誤
- [ ] 控制台無錯誤訊息
- [ ] 搜尋結果正確顯示

## 💡 開發建議

### 日常開發
- 使用 `npm run dev:netlify` 進行完整功能測試
- 使用 `npm run dev` 進行快速 UI 開發

### 功能測試
- 定期測試判決書搜尋功能
- 檢查不同搜尋關鍵字的結果
- 驗證詳細內容頁面

### 部署前檢查
- 確保本地測試通過
- 檢查所有功能正常運作
- 驗證無錯誤訊息

## 🚀 下一步

本地測試通過後，可以：
1. 提交代碼到 Git
2. 部署到 Netlify
3. 測試生產環境功能
