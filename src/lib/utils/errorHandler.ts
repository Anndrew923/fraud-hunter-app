// 全局錯誤處理工具
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCount = 0;
  private maxErrors = 10; // 最大錯誤數量，超過後靜默處理

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // 處理錯誤，避免控制台噪音
  handleError(error: Error, context: string = 'Unknown'): void {
    this.errorCount++;
    
    // 如果錯誤太多，靜默處理
    if (this.errorCount > this.maxErrors) {
      return;
    }

    // 只記錄重要錯誤
    if (this.isImportantError(error)) {
      console.error(`[${context}] 重要錯誤:`, error.message);
    } else {
      console.log(`[${context}] 錯誤已處理:`, error.message);
    }
  }

  // 判斷是否為重要錯誤
  private isImportantError(error: Error): boolean {
    const importantPatterns = [
      'NetworkError',
      'TypeError',
      'ReferenceError',
      'SyntaxError'
    ];

    return importantPatterns.some(pattern => 
      error.name.includes(pattern) || error.message.includes(pattern)
    );
  }

  // 重置錯誤計數
  resetErrorCount(): void {
    this.errorCount = 0;
  }

  // 安全的異步操作包裝器
  async safeAsync<T>(
    operation: () => Promise<T>,
    fallback: T,
    context: string = 'AsyncOperation'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error as Error, context);
      return fallback;
    }
  }

  // 安全的同步操作包裝器
  safeSync<T>(
    operation: () => T,
    fallback: T,
    context: string = 'SyncOperation'
  ): T {
    try {
      return operation();
    } catch (error) {
      this.handleError(error as Error, context);
      return fallback;
    }
  }
}

// 導出單例實例
export const errorHandler = ErrorHandler.getInstance();

// 全局錯誤處理器
export function setupGlobalErrorHandling(): void {
  // 捕獲未處理的 Promise 拒絕
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(
      new Error(event.reason?.message || 'Unhandled Promise Rejection'),
      'UnhandledRejection'
    );
    event.preventDefault(); // 防止控制台錯誤
  });

  // 捕獲全局錯誤
  window.addEventListener('error', (event) => {
    errorHandler.handleError(
      new Error(event.message || 'Global Error'),
      'GlobalError'
    );
  });
}
