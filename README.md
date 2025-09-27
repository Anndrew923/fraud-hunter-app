# 詐騙獵人 - 社會信用檔案管理平台

## 專案簡介

「詐騙獵人」是一個社會信用檔案管理平台，透過合法途徑公開相關資訊，達到社會警示作用，促進誠信社會建設。

## 主要功能

- 🔍 **法院判決書查詢** - 查詢司法院公開的判決書資料
- 👤 **通緝犯資料查詢** - 查詢警政署公開的通緝犯資訊
- 📊 **風險評估分析** - 基於公開資料進行風險評估
- 📄 **文件審核系統** - AI 自動審核法律文件
- 💬 **法律諮詢服務** - 提供基本法律諮詢

## 技術架構

- **前端**: Next.js 15 + TypeScript + Tailwind CSS
- **後端**: Firebase (Firestore + Functions + Auth + Storage)
- **部署**: Netlify
- **狀態管理**: Zustand
- **UI 組件**: Headless UI + Heroicons

## 開發環境設定

### 必要條件

- Node.js 18+
- npm 或 yarn
- Firebase 專案
- Netlify 帳號

### 安裝步驟

1. 複製專案
```bash
git clone <repository-url>
cd fraud-hunter-app
```

2. 安裝依賴
```bash
npm install
```

3. 設定 Firebase（推薦使用快速設定腳本）
```bash
npm run setup:firebase
```

或手動設定：
```bash
# 建立 .env.local 檔案並填入 Firebase 配置
# 詳細步驟請參考 FIREBASE_SETUP.md
```

4. 啟動開發伺服器
```bash
npm run dev
```

5. 開啟瀏覽器訪問 `http://localhost:3000`

### Firebase 設定

詳細的 Firebase 設定步驟請參考 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

快速設定：
1. 執行 `npm run setup:firebase`
2. 按照提示輸入 Firebase 配置資訊
3. 在瀏覽器中點擊「檢查配置」按鈕驗證設定
4. 點擊「測試 Firebase」按鈕測試連線

## 專案結構

```
fraud-hunter-app/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React 組件
│   ├── lib/                # 工具函數
│   ├── store/              # Zustand 狀態管理
│   ├── types/              # TypeScript 類型定義
│   └── config/             # 配置文件
├── public/                 # 靜態資源
├── netlify.toml           # Netlify 配置
└── package.json           # 專案依賴
```

## 部署

### Netlify 部署

1. 連接 GitHub 倉庫到 Netlify
2. 設定建置命令: `npm run build`
3. 設定發布目錄: `out`
4. 設定環境變數
5. 部署

### 環境變數

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 開發規範

- 使用 TypeScript 進行類型檢查
- 使用 ESLint 進行代碼檢查
- 使用 Prettier 進行代碼格式化
- 遵循 Next.js 最佳實踐
- 使用 Tailwind CSS 進行樣式設計

## 授權

MIT License

## 聯絡資訊

如有問題或建議，請聯繫開發團隊。