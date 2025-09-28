// 資料壓縮服務
export interface CompressionConfig {
  enabled: boolean;
  algorithm: 'gzip' | 'brotli' | 'lz4';
  threshold: number; // 超過多少KB才壓縮
  quality: number; // 壓縮品質 1-9
}

export interface StorageStats {
  totalSize: number;
  compressedSize: number;
  compressionRatio: number;
  estimatedSavings: number;
}

export class DataCompressionService {
  private config: CompressionConfig;

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = {
      enabled: true,
      algorithm: 'gzip',
      threshold: 5, // 5KB
      quality: 6,
      ...config
    };
  }

  /**
   * 壓縮判決書內容
   */
  async compressJudgment(judgment: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.config.enabled) return judgment;

    const originalSize = JSON.stringify(judgment).length;
    
    if (originalSize < this.config.threshold * 1024) {
      return judgment; // 太小不壓縮
    }

    try {
      // 壓縮大文字欄位
      const compressed = { ...judgment };
      
      if (compressed.fullText) {
        compressed.fullText = await this.compressText(compressed.fullText as string);
        compressed._compressed = true;
        compressed._originalSize = originalSize;
      }

      return compressed;
    } catch (error) {
      console.error('壓縮失敗:', error);
      return judgment; // 壓縮失敗返回原始資料
    }
  }

  /**
   * 解壓縮判決書內容
   */
  async decompressJudgment(judgment: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!judgment._compressed) return judgment;

    try {
      const decompressed = { ...judgment };
      
      if (decompressed.fullText && judgment._compressed) {
        decompressed.fullText = await this.decompressText(decompressed.fullText as string);
        delete decompressed._compressed;
        delete decompressed._originalSize;
      }

      return decompressed;
    } catch (error) {
      console.error('解壓縮失敗:', error);
      return judgment;
    }
  }

  /**
   * 壓縮文字
   */
  private async compressText(text: string): Promise<string> {
    // 使用瀏覽器內建的 CompressionStream API
    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(text));
      writer.close();
      
      const chunks = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }
      
      return btoa(String.fromCharCode.apply(null, Array.from(compressed)));
    }
    
    // 降級方案：簡單的 Base64 編碼
    return btoa(text);
  }

  /**
   * 解壓縮文字
   */
  private async decompressText(compressedText: string): Promise<string> {
    try {
      // 使用瀏覽器內建的 DecompressionStream API
      if (typeof DecompressionStream !== 'undefined') {
        const compressed = Uint8Array.from(atob(compressedText), c => c.charCodeAt(0));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(compressed);
        writer.close();
        
        const chunks = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new TextDecoder().decode(decompressed);
      }
      
      // 降級方案：Base64 解碼
      return atob(compressedText);
    } catch (error) {
      console.error('解壓縮失敗:', error);
      return compressedText; // 解壓縮失敗返回原始資料
    }
  }

  /**
   * 計算儲存統計
   */
  calculateStorageStats(data: Record<string, unknown>[]): StorageStats {
    const totalSize = data.reduce((acc, item) => {
      return acc + JSON.stringify(item).length;
    }, 0);

    const compressedSize = data.reduce((acc, item) => {
      if (item._compressed) {
        return acc + JSON.stringify(item).length;
      }
      return acc + JSON.stringify(item).length * 0.3; // 假設30%壓縮率
    }, 0);

    return {
      totalSize,
      compressedSize,
      compressionRatio: compressedSize / totalSize,
      estimatedSavings: totalSize - compressedSize
    };
  }

  /**
   * 建議清理策略
   */
  suggestCleanupStrategy(data: Record<string, unknown>[]): {
    immediate: number; // 立即清理的數量
    archive: number;   // 建議封存的數量
    keep: number;      // 保留的數量
    estimatedSavings: number; // 預估節省空間
  } {
    const now = new Date();
    // const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const threeYearsAgo = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);

    let immediate = 0;
    let archive = 0;
    let keep = 0;
    let estimatedSavings = 0;

    data.forEach(item => {
      const judgmentDate = new Date(item.judgmentDate as string);
      const size = JSON.stringify(item).length;

      if (item.debtStatus === 'paid' || item.status === 'cleared') {
        immediate++;
        estimatedSavings += size;
      } else if (judgmentDate < threeYearsAgo) {
        archive++;
        estimatedSavings += size * 0.7; // 封存節省70%空間
      } else {
        keep++;
      }
    });

    return {
      immediate,
      archive,
      keep,
      estimatedSavings
    };
  }
}

export const dataCompressionService = new DataCompressionService();
