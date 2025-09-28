# 🚀 判決書爬蟲系統部署檢查清單

## 📋 部署前檢查

### 1. 本地測試
```bash
# 測試 Netlify Functions
npm run test:netlify-functions

# 測試智能構建
npm run smart-build

# 檢查狀態
npm run check-status
```

### 2. Netlify 配置檢查
- ✅ `netlify.toml` 使用智能構建命令
- ✅ Functions 目錄設定正確
- ✅ 環境變數設定（如需要）

### 3. 生產環境 URL 配置
- ✅ 使用動態 URL (`window.location.origin`)
- ✅ 不硬編碼特定域名

## 🔧 部署步驟

### 1. 提交代碼
```bash
git add .
git commit -m "修正判決書爬蟲系統部署配置"
git push origin main
```

### 2. 檢查 Netlify 部署
1. 前往 [Netlify Dashboard](https://app.netlify.com/)
2. 檢查部署狀態
3. 查看 Functions 是否正確部署
4. 測試 Functions 端點

### 3. 測試生產環境
1. 訪問您的網站
2. 嘗試搜尋判決書
3. 檢查瀏覽器控制台是否有錯誤

## 🐛 常見問題排除

### 問題 1: Functions 404 錯誤
**原因**: Netlify Functions 未正確部署
**解決**: 檢查 `netlify.toml` 配置和 Functions 目錄

### 問題 2: CORS 錯誤
**原因**: Functions 未正確處理 CORS
**解決**: 檢查 Functions 中的 CORS 標頭設定

### 問題 3: 搜尋無結果
**原因**: 司法院網站結構變更或 Functions 邏輯問題
**解決**: 檢查 Functions 日誌和搜尋邏輯

## 📊 監控和維護

### 1. 定期檢查
- 每月檢查 Functions 是否正常運作
- 監控搜尋成功率
- 檢查司法院網站是否有變更

### 2. 日誌監控
- 查看 Netlify Functions 日誌
- 監控錯誤率和回應時間
- 設定告警機制

## 🎯 成功指標

- ✅ 搜尋功能正常運作
- ✅ 詳細內容可以正確取得
- ✅ 無 CORS 錯誤
- ✅ 回應時間在合理範圍內
- ✅ 錯誤率低於 5%

## 📞 支援

如果遇到問題，請：
1. 檢查此清單
2. 查看 Netlify Functions 日誌
3. 測試本地環境
4. 聯繫技術支援
