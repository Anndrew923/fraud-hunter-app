// 本地儲存服務 - 簡單有效的資料管理
export interface StorageConfig {
  maxItems: number;
  expiryDays: number;
  compression: boolean;
}

export interface StoredData {
  id: string;
  data: unknown;
  timestamp: number;
  expiry: number;
  compressed?: boolean;
}

export class LocalStorageService {
  private config: StorageConfig;
  private prefix = 'fraud_hunter_';

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      maxItems: 100, // 最多儲存100筆資料
      expiryDays: 30, // 30天過期
      compression: true, // 啟用壓縮
      ...config
    };
  }

  /**
   * 儲存搜尋結果
   */
  saveSearchResult(query: string, results: unknown[]): void {
    try {
      const key = `${this.prefix}search_${this.generateId(query)}`;
      const data: StoredData = {
        id: key,
        data: {
          query,
          results,
          count: results.length
        },
        timestamp: Date.now(),
        expiry: Date.now() + (this.config.expiryDays * 24 * 60 * 60 * 1000),
        compressed: this.config.compression
      };

      const serialized = this.config.compression 
        ? this.compress(JSON.stringify(data))
        : JSON.stringify(data);

      localStorage.setItem(key, serialized);
      this.cleanup(); // 清理過期資料
      
      console.log(`✅ 搜尋結果已儲存: ${query} (${results.length} 筆)`);
    } catch (error) {
      console.error('儲存搜尋結果失敗:', error);
    }
  }

  /**
   * 取得搜尋結果
   */
  getSearchResult(query: string): unknown[] | null {
    try {
      const key = `${this.prefix}search_${this.generateId(query)}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;

      const data: StoredData = this.config.compression 
        ? JSON.parse(this.decompress(stored))
        : JSON.parse(stored);

      // 檢查是否過期
      if (Date.now() > data.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return (data.data as { results: unknown[] }).results;
    } catch (error) {
      console.error('取得搜尋結果失敗:', error);
      return null;
    }
  }

  /**
   * 儲存判決書詳細內容
   */
  saveJudgmentDetail(caseNumber: string, detail: unknown): void {
    try {
      const key = `${this.prefix}judgment_${this.generateId(caseNumber)}`;
      const data: StoredData = {
        id: key,
        data: detail,
        timestamp: Date.now(),
        expiry: Date.now() + (this.config.expiryDays * 24 * 60 * 60 * 1000),
        compressed: this.config.compression
      };

      const serialized = this.config.compression 
        ? this.compress(JSON.stringify(data))
        : JSON.stringify(data);

      localStorage.setItem(key, serialized);
      this.cleanup();
      
      console.log(`✅ 判決書詳細內容已儲存: ${caseNumber}`);
    } catch (error) {
      console.error('儲存判決書詳細內容失敗:', error);
    }
  }

  /**
   * 取得判決書詳細內容
   */
  getJudgmentDetail(caseNumber: string): unknown | null {
    try {
      const key = `${this.prefix}judgment_${this.generateId(caseNumber)}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;

      const data: StoredData = this.config.compression 
        ? JSON.parse(this.decompress(stored))
        : JSON.parse(stored);

      // 檢查是否過期
      if (Date.now() > data.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('取得判決書詳細內容失敗:', error);
      return null;
    }
  }

  /**
   * 取得所有搜尋歷史
   */
  getAllSearchHistory(): Array<{query: string, results: unknown[], timestamp: number}> {
    const history: Array<{query: string, results: unknown[], timestamp: number}> = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${this.prefix}search_`)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data: StoredData = this.config.compression 
              ? JSON.parse(this.decompress(stored))
              : JSON.parse(stored);

            // 檢查是否過期
            if (Date.now() <= data.expiry) {
              history.push({
                query: (data.data as { query: string }).query,
                results: (data.data as { results: unknown[] }).results,
                timestamp: data.timestamp
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('取得搜尋歷史失敗:', error);
    }

    // 按時間排序，最新的在前
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 清理過期資料
   */
  cleanup(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const data: StoredData = this.config.compression 
                ? JSON.parse(this.decompress(stored))
                : JSON.parse(stored);

              if (Date.now() > data.expiry) {
                keysToRemove.push(key);
              }
            } catch {
              // 解析失敗的資料也刪除
              keysToRemove.push(key);
            }
          }
        }
      }

      // 刪除過期資料
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 清理了 ${keysToRemove.length} 筆過期資料`);
      }

      // 如果資料太多，刪除最舊的
      this.enforceMaxItems();
    } catch (error) {
      console.error('清理資料失敗:', error);
    }
  }

  /**
   * 強制限制資料數量
   */
  private enforceMaxItems(): void {
    try {
      const allData: Array<{key: string, timestamp: number}> = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const data: StoredData = this.config.compression 
                ? JSON.parse(this.decompress(stored))
                : JSON.parse(stored);

              allData.push({
                key,
                timestamp: data.timestamp
              });
            } catch {
              // 解析失敗的資料也刪除
              localStorage.removeItem(key);
            }
          }
        }
      }

      // 如果超過最大數量，刪除最舊的
      if (allData.length > this.config.maxItems) {
        allData.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = allData.slice(0, allData.length - this.config.maxItems);
        
        toRemove.forEach(item => localStorage.removeItem(item.key));
        console.log(`🧹 清理了 ${toRemove.length} 筆舊資料，保持 ${this.config.maxItems} 筆限制`);
      }
    } catch (error) {
      console.error('強制限制資料數量失敗:', error);
    }
  }

  /**
   * 取得儲存統計
   */
  getStorageStats(): {
    totalItems: number;
    totalSize: number;
    searchResults: number;
    judgmentDetails: number;
    oldestItem: number;
    newestItem: number;
  } {
    let totalItems = 0;
    let totalSize = 0;
    let searchResults = 0;
    let judgmentDetails = 0;
    let oldestItem = Date.now();
    let newestItem = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            totalItems++;
            totalSize += stored.length;
            
            if (key.includes('search_')) searchResults++;
            if (key.includes('judgment_')) judgmentDetails++;

            try {
              const data: StoredData = this.config.compression 
                ? JSON.parse(this.decompress(stored))
                : JSON.parse(stored);

              if (data.timestamp < oldestItem) oldestItem = data.timestamp;
              if (data.timestamp > newestItem) newestItem = data.timestamp;
            } catch {
              // 忽略解析失敗的資料
            }
          }
        }
      }
    } catch (error) {
      console.error('取得儲存統計失敗:', error);
    }

    return {
      totalItems,
      totalSize,
      searchResults,
      judgmentDetails,
      oldestItem,
      newestItem
    };
  }

  /**
   * 清空所有資料
   */
  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 清空了 ${keysToRemove.length} 筆資料`);
    } catch (error) {
      console.error('清空資料失敗:', error);
    }
  }

  /**
   * 生成ID
   */
  private generateId(input: string): string {
    // 簡單的hash函數
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 轉換為32位整數
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 簡單壓縮（Base64編碼）
   */
  private compress(data: string): string {
    try {
      return btoa(data);
    } catch {
      return data;
    }
  }

  /**
   * 簡單解壓縮（Base64解碼）
   */
  private decompress(compressed: string): string {
    try {
      return atob(compressed);
    } catch {
      return compressed;
    }
  }
}

export const localStorageService = new LocalStorageService();
