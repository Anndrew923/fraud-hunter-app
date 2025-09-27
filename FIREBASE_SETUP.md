# 🔥 Firebase 設定指南

## 📋 設定步驟

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 專案名稱：`fraud-hunter-app`
4. 選擇是否啟用 Google Analytics（建議選擇「是」）
5. 選擇 Analytics 帳戶（或建立新帳戶）
6. 點擊「建立專案」

### 2. 啟用 Firestore 資料庫

1. 在專案儀表板中，點擊「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇「以測試模式開始」（稍後可以調整安全規則）
4. 選擇資料庫位置（建議選擇 `asia-east1` 或 `asia-southeast1`）
5. 點擊「完成」

### 3. 啟用 Authentication

1. 在專案儀表板中，點擊「Authentication」
2. 點擊「開始使用」
3. 前往「登入方法」標籤
4. 啟用以下登入方法：
   - 電子郵件/密碼
   - Google（可選）
   - 匿名（可選）

### 4. 取得 Firebase 配置

1. 在專案儀表板中，點擊「專案設定」（齒輪圖示）
2. 滾動到「您的應用程式」區段
3. 點擊「</>」圖示（Web 應用程式）
4. 應用程式暱稱：`fraud-hunter-web`
5. 勾選「也為此應用程式設定 Firebase Hosting」（可選）
6. 點擊「註冊應用程式」
7. 複製 Firebase 配置物件

### 5. 建立環境變數檔案

在專案根目錄建立 `.env.local` 檔案：

```env
# Firebase 配置
NEXT_PUBLIC_FIREBASE_API_KEY=你的_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=你的專案_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=你的專案_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=你的專案_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=你的_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=你的_app_id

# 應用程式配置
NEXT_PUBLIC_APP_NAME=詐騙獵人
NEXT_PUBLIC_APP_VERSION=1.0.0

# 開發模式
NODE_ENV=development
```

### 6. 設定 Firestore 安全規則

在 Firestore 的「規則」標籤中，設定以下規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允許所有讀取，但需要認證才能寫入
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 7. 測試連線

執行以下命令測試 Firebase 連線：

```bash
npm run dev
```

## 🔧 進階設定

### 設定 Firebase Storage（可選）

1. 在專案儀表板中，點擊「Storage」
2. 點擊「開始使用」
3. 選擇「以測試模式開始」
4. 選擇位置（與 Firestore 相同）

### 設定 Firebase Functions（可選）

1. 在專案儀表板中，點擊「Functions」
2. 點擊「開始使用」
3. 安裝 Firebase CLI：`npm install -g firebase-tools`
4. 登入：`firebase login`
5. 初始化：`firebase init functions`

## 📝 注意事項

1. **安全性**：生產環境中請調整 Firestore 安全規則
2. **環境變數**：確保 `.env.local` 在 `.gitignore` 中
3. **測試**：先在測試模式中驗證功能
4. **備份**：定期備份 Firestore 資料

## 🚀 完成後

設定完成後，你的應用程式將能夠：
- 連接到 Firestore 資料庫
- 使用 Firebase Authentication
- 儲存和讀取搜尋記錄
- 管理用戶資料

---

**下一步**：完成 Firebase 設定後，我們將整合真實的 API 並完善搜尋功能！
