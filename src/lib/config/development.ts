// 本地開發環境配置
export const developmentConfig = {
  // 儀表板設定
  dashboard: {
    // 本地開發環境下使用更短的超時時間
    timeout: 2000,
    // 本地開發環境下禁用重複解析
    disableRepeatedParsing: true,
    // 本地開發環境下優先使用快取
    preferCache: true,
    // 本地開發環境下快速降級
    fastFallback: true
  },
  
  // 解析設定
  parsing: {
    // 本地開發環境下使用簡化的解析模式
    useQuickPatterns: true,
    // 本地開發環境下禁用詳細日誌
    disableDetailedLogs: false,
    // 本地開發環境下使用超時機制
    useTimeout: true,
    // 超時時間（毫秒）
    timeoutMs: 1000
  },
  
  // 錯誤處理設定
  errorHandling: {
    // 本地開發環境下靜默處理非關鍵錯誤
    silentMode: false,
    // 本地開發環境下記錄所有錯誤
    logAllErrors: true
  }
};

// 檢查是否為本地開發環境
export const isLocalDevelopment = process.env.NODE_ENV === 'development' && 
  (process.env.NEXT_PUBLIC_APP_ENV === 'local' || 
   process.env.NODE_ENV === 'development');
