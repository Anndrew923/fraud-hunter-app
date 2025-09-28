# 🚀 生產環境部署檢查清單

## 📋 判決書爬蟲系統生產環境部署

### ✅ 部署前檢查

#### 1. 代碼準備
- [x] `netlify.toml` 使用智能構建命令
- [x] Functions 目錄結構正確
- [x] 生產環境 URL 配置使用動態域名
- [x] CORS 標頭設定正確

#### 2. 本地構建測試
```bash
# 使用智能構建
npm run smart-build

# 檢查構建結果
npm run check-status
```

#### 3. 提交代碼
```bash
git add .
git commit -m "準備判決書爬蟲系統生產環境部署"
git push origin main
```

### 🚀 部署步驟

#### 1. 自動部署
- 代碼推送到 main 分支後，Netlify 會自動觸發部署
- 使用智能構建命令：`npm run smart-build`
- 構建完成後會發布到 `out/` 目錄

#### 2. 檢查部署狀態
1. 前往 [Netlify Dashboard](https://app.netlify.com/)
2. 檢查部署日誌
3. 確認 Functions 已正確部署
4. 檢查網站是否正常訪問

#### 3. 測試生產環境功能
```bash
# 測試生產環境 Functions（替換為您的域名）
npm run test:production your-domain.netlify.app
```

### 🔍 功能驗證

#### 1. 基本功能測試
- [ ] 網站正常載入
- [ ] 儀表板資料顯示正常
- [ ] 搜尋界面正常顯示

#### 2. 判決書搜尋測試
- [ ] 輸入搜尋關鍵字（如：詐欺）
- [ ] 點擊搜尋按鈕
- [ ] 檢查是否有結果返回
- [ ] 檢查控制台無錯誤

#### 3. Functions 端點測試
- [ ] `/.netlify/functions/judicial-search` 可訪問
- [ ] `/.netlify/functions/judicial-detail` 可訪問
- [ ] CORS 標頭設定正確

### 🐛 常見問題排除

#### 問題 1: Functions 404 錯誤
**原因**: Functions 未正確部署
**解決**:
1. 檢查 `netlify.toml` 配置
2. 確認 Functions 目錄存在
3. 重新部署

#### 問題 2: CORS 錯誤
**原因**: Functions 未正確處理 CORS
**解決**:
1. 檢查 Functions 中的 CORS 標頭
2. 確認 `Access-Control-Allow-Origin: *` 設定

#### 問題 3: 搜尋無結果
**原因**: 司法院網站變更或 Functions 邏輯問題
**解決**:
1. 檢查 Functions 日誌
2. 測試不同的搜尋關鍵字
3. 檢查司法院網站是否可訪問

### 📊 成功指標

- ✅ 網站正常載入
- ✅ 判決書搜尋功能正常
- ✅ 無 CORS 錯誤
- ✅ Functions 回應正常
- ✅ 搜尋結果正確顯示

### 🎯 部署後監控

#### 1. 定期檢查
- 每週檢查 Functions 是否正常運作
- 監控搜尋成功率
- 檢查錯誤日誌

#### 2. 性能監控
- 監控 Functions 回應時間
- 檢查記憶體使用情況
- 設定告警機制

### 💡 維護建議

#### 1. 定期更新
- 定期檢查司法院網站是否有變更
- 更新 Functions 邏輯以適應變更
- 監控依賴項安全性更新

#### 2. 備份策略
- 定期備份 Functions 代碼
- 保存重要的搜尋結果
- 記錄配置變更

### 📞 支援

如果遇到問題：
1. 檢查此清單
2. 查看 Netlify Functions 日誌
3. 使用生產環境測試腳本
4. 聯繫技術支援

## 🎉 部署完成

當所有檢查項目都通過時，判決書爬蟲系統就可以在生產環境正常運作了！
