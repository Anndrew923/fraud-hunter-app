// 生產環境配置
export const productionConfig = {
  // 控制台日誌設定
  logging: {
    // 生產環境下禁用詳細日誌
    enableDetailedLogs: process.env.NODE_ENV === 'development',
    // 只記錄重要錯誤
    logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
  },
  
  // 儀表板設定
  dashboard: {
    // 生產環境下使用更短的超時時間
    timeout: process.env.NODE_ENV === 'production' ? 2000 : 5000,
    // 生產環境下禁用重試
    maxRetries: process.env.NODE_ENV === 'production' ? 1 : 3,
    // 生產環境下優先使用預設資料
    preferDefaultData: process.env.NODE_ENV === 'production'
  },
  
  // 錯誤處理設定
  errorHandling: {
    // 生產環境下靜默處理非關鍵錯誤
    silentMode: process.env.NODE_ENV === 'production',
    // 只報告關鍵錯誤
    reportCriticalErrorsOnly: process.env.NODE_ENV === 'production'
  }
};

// 檢查是否為生產環境
export const isProduction = process.env.NODE_ENV === 'production';

// 檢查是否為開發環境
export const isDevelopment = process.env.NODE_ENV === 'development';
