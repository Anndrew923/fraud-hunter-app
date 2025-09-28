// 資料清理服務
import { db } from '../firebase';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { dataCompressionService } from './dataCompression';

export interface CleanupConfig {
  enabled: boolean;
  schedule: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    yearly: boolean;
  };
  rules: CleanupRule[];
}

export interface CleanupRule {
  id: string;
  name: string;
  condition: string;
  action: 'delete' | 'archive' | 'compress' | 'mark_expired';
  priority: number;
  enabled: boolean;
}

export interface CleanupResult {
  success: boolean;
  processed: number;
  deleted: number;
  archived: number;
  compressed: number;
  errors: string[];
  spaceSaved: number;
}

export class CleanupService {
  private config: CleanupConfig;

  constructor(config: Partial<CleanupConfig> = {}) {
    this.config = {
      enabled: true,
      schedule: {
        daily: true,
        weekly: true,
        monthly: true,
        yearly: true
      },
      rules: this.getDefaultRules(),
      ...config
    };
  }

  /**
   * 執行每日清理
   */
  async runDailyCleanup(): Promise<CleanupResult> {
    console.log('🧹 開始執行每日清理...');
    
    const result: CleanupResult = {
      success: true,
      processed: 0,
      deleted: 0,
      archived: 0,
      compressed: 0,
      errors: [],
      spaceSaved: 0
    };

    try {
      // 清理已清償的債務
      await this.cleanupPaidDebts(result);
      
      // 標記6個月未執行的案件
      await this.markExpiredCases(result);
      
      // 壓縮大檔案
      await this.compressLargeFiles(result);

      console.log('✅ 每日清理完成:', result);
    } catch (error) {
      console.error('❌ 每日清理失敗:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : '未知錯誤');
    }

    return result;
  }

  /**
   * 執行每週清理
   */
  async runWeeklyCleanup(): Promise<CleanupResult> {
    console.log('🧹 開始執行每週清理...');
    
    const result: CleanupResult = {
      success: true,
      processed: 0,
      deleted: 0,
      archived: 0,
      compressed: 0,
      errors: [],
      spaceSaved: 0
    };

    try {
      // 清理爭議案件
      await this.cleanupDisputedCases(result);
      
      // 更新風險評分
      await this.updateRiskScores(result);
      
      // 生成清理報告
      await this.generateCleanupReport(result);

      console.log('✅ 每週清理完成:', result);
    } catch (error) {
      console.error('❌ 每週清理失敗:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : '未知錯誤');
    }

    return result;
  }

  /**
   * 執行每月清理
   */
  async runMonthlyCleanup(): Promise<CleanupResult> {
    console.log('🧹 開始執行每月清理...');
    
    const result: CleanupResult = {
      success: true,
      processed: 0,
      deleted: 0,
      archived: 0,
      compressed: 0,
      errors: [],
      spaceSaved: 0
    };

    try {
      // 清理3年無活動資料
      await this.cleanupInactiveData(result);
      
      // 更新時效狀態
      await this.updateExpirationStatus(result);
      
      // 生成月度報告
      await this.generateMonthlyReport(result);

      console.log('✅ 每月清理完成:', result);
    } catch (error) {
      console.error('❌ 每月清理失敗:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : '未知錯誤');
    }

    return result;
  }

  /**
   * 執行每年清理
   */
  async runYearlyCleanup(): Promise<CleanupResult> {
    console.log('🧹 開始執行每年清理...');
    
    const result: CleanupResult = {
      success: true,
      processed: 0,
      deleted: 0,
      archived: 0,
      compressed: 0,
      errors: [],
      spaceSaved: 0
    };

    try {
      // 清理15年時效已過資料
      await this.cleanupExpiredData(result);
      
      // 封存舊資料
      await this.archiveOldData(result);
      
      // 生成年度報告
      await this.generateYearlyReport(result);

      console.log('✅ 每年清理完成:', result);
    } catch (error) {
      console.error('❌ 每年清理失敗:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : '未知錯誤');
    }

    return result;
  }

  /**
   * 清理已清償的債務
   */
  private async cleanupPaidDebts(result: CleanupResult): Promise<void> {
    try {
      const judgmentsRef = collection(db, 'judgments');
      const q = query(judgmentsRef, where('debtStatus', '==', 'paid'));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let deletedCount = 0;
      let spaceSaved = 0;

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const size = JSON.stringify(data).length;
        
        batch.delete(docSnapshot.ref);
        deletedCount++;
        spaceSaved += size;
      });

      if (deletedCount > 0) {
        await batch.commit();
        result.deleted += deletedCount;
        result.spaceSaved += spaceSaved;
        console.log(`✅ 清理已清償債務: ${deletedCount} 筆，節省空間: ${this.formatBytes(spaceSaved)}`);
      }
    } catch (error) {
      console.error('清理已清償債務失敗:', error);
      result.errors.push('清理已清償債務失敗');
    }
  }

  /**
   * 標記6個月未執行的案件
   */
  private async markExpiredCases(result: CleanupResult): Promise<void> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const judgmentsRef = collection(db, 'judgments');
      const q = query(
        judgmentsRef,
        where('judgmentDate', '<', sixMonthsAgo),
        where('executionStatus', '!=', 'executed')
      );
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let processedCount = 0;

      snapshot.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, {
          status: 'expired',
          lastUpdated: new Date()
        });
        processedCount++;
      });

      if (processedCount > 0) {
        await batch.commit();
        result.processed += processedCount;
        console.log(`✅ 標記過期案件: ${processedCount} 筆`);
      }
    } catch (error) {
      console.error('標記過期案件失敗:', error);
      result.errors.push('標記過期案件失敗');
    }
  }

  /**
   * 壓縮大檔案
   */
  private async compressLargeFiles(result: CleanupResult): Promise<void> {
    try {
      const judgmentsRef = collection(db, 'judgments');
      const q = query(judgmentsRef, where('_compressed', '==', false));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let compressedCount = 0;
      let spaceSaved = 0;

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const originalSize = JSON.stringify(data).length;
        
        if (originalSize > 5 * 1024) { // 大於5KB才壓縮
          const compressed = await dataCompressionService.compressJudgment(data);
          const compressedSize = JSON.stringify(compressed).length;
          
          batch.update(docSnapshot.ref, compressed);
          compressedCount++;
          spaceSaved += (originalSize - compressedSize);
        }
      }

      if (compressedCount > 0) {
        await batch.commit();
        result.compressed += compressedCount;
        result.spaceSaved += spaceSaved;
        console.log(`✅ 壓縮大檔案: ${compressedCount} 筆，節省空間: ${this.formatBytes(spaceSaved)}`);
      }
    } catch (error) {
      console.error('壓縮大檔案失敗:', error);
      result.errors.push('壓縮大檔案失敗');
    }
  }

  /**
   * 清理爭議案件
   */
  private async cleanupDisputedCases(result: CleanupResult): Promise<void> {
    try {
      const judgmentsRef = collection(db, 'judgments');
      const q = query(judgmentsRef, where('disputed', '==', true));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let processedCount = 0;

      snapshot.forEach((docSnapshot) => {
        // 標記為需要人工審核
        batch.update(docSnapshot.ref, {
          status: 'under_review',
          lastUpdated: new Date()
        });
        processedCount++;
      });

      if (processedCount > 0) {
        await batch.commit();
        result.processed += processedCount;
        console.log(`✅ 處理爭議案件: ${processedCount} 筆`);
      }
    } catch (error) {
      console.error('清理爭議案件失敗:', error);
      result.errors.push('清理爭議案件失敗');
    }
  }

  /**
   * 更新風險評分
   */
  private async updateRiskScores(result: CleanupResult): Promise<void> {
    try {
      const judgmentsRef = collection(db, 'judgments');
      const snapshot = await getDocs(judgmentsRef);

      const batch = writeBatch(db);
      let processedCount = 0;

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const newRiskScore = this.calculateRiskScore(data);
        
        if (newRiskScore !== data.riskScore) {
          batch.update(docSnapshot.ref, {
            riskScore: newRiskScore,
            lastUpdated: new Date()
          });
          processedCount++;
        }
      });

      if (processedCount > 0) {
        await batch.commit();
        result.processed += processedCount;
        console.log(`✅ 更新風險評分: ${processedCount} 筆`);
      }
    } catch (error) {
      console.error('更新風險評分失敗:', error);
      result.errors.push('更新風險評分失敗');
    }
  }

  /**
   * 清理3年無活動資料
   */
  private async cleanupInactiveData(result: CleanupResult): Promise<void> {
    try {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      const judgmentsRef = collection(db, 'judgments');
      const q = query(
        judgmentsRef,
        where('lastAccessed', '<', threeYearsAgo),
        where('status', '!=', 'active')
      );
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let archivedCount = 0;
      let spaceSaved = 0;

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const size = JSON.stringify(data).length;
        
        // 移到封存集合
        batch.update(docSnapshot.ref, {
          status: 'archived',
          archivedAt: new Date()
        });
        archivedCount++;
        spaceSaved += size * 0.3; // 封存節省70%空間
      });

      if (archivedCount > 0) {
        await batch.commit();
        result.archived += archivedCount;
        result.spaceSaved += spaceSaved;
        console.log(`✅ 封存無活動資料: ${archivedCount} 筆，節省空間: ${this.formatBytes(spaceSaved)}`);
      }
    } catch (error) {
      console.error('清理無活動資料失敗:', error);
      result.errors.push('清理無活動資料失敗');
    }
  }

  /**
   * 清理15年時效已過資料
   */
  private async cleanupExpiredData(result: CleanupResult): Promise<void> {
    try {
      const fifteenYearsAgo = new Date();
      fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);

      const judgmentsRef = collection(db, 'judgments');
      const q = query(judgmentsRef, where('judgmentDate', '<', fifteenYearsAgo));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let deletedCount = 0;
      let spaceSaved = 0;

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const size = JSON.stringify(data).length;
        
        batch.delete(docSnapshot.ref);
        deletedCount++;
        spaceSaved += size;
      });

      if (deletedCount > 0) {
        await batch.commit();
        result.deleted += deletedCount;
        result.spaceSaved += spaceSaved;
        console.log(`✅ 清理過期資料: ${deletedCount} 筆，節省空間: ${this.formatBytes(spaceSaved)}`);
      }
    } catch (error) {
      console.error('清理過期資料失敗:', error);
      result.errors.push('清理過期資料失敗');
    }
  }

  /**
   * 計算風險評分
   */
  private calculateRiskScore(data: Record<string, unknown>): number {
    let score = 0;
    
    // 根據案件類型加分
    if (data.caseType === '刑事') score += 30;
    if (data.caseType === '民事') score += 10;
    
    // 根據關鍵字加分
    const highRiskKeywords = ['詐欺', '詐騙', '背信', '侵占', '偽造'];
    const text = `${data.caseTitle} ${data.summary}`.toLowerCase();
    
    highRiskKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 20;
    });
    
    return Math.min(score, 100);
  }

  /**
   * 格式化位元組
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 獲取預設清理規則
   */
  private getDefaultRules(): CleanupRule[] {
    return [
      {
        id: 'debt_paid',
        name: '債務已清償',
        condition: 'debtStatus === "paid"',
        action: 'delete',
        priority: 1,
        enabled: true
      },
      {
        id: 'expired_15_years',
        name: '15年時效已過',
        condition: 'now > judgmentDate + 15 years',
        action: 'delete',
        priority: 2,
        enabled: true
      },
      {
        id: 'expired_6_months',
        name: '6個月未執行',
        condition: 'now > judgmentDate + 6 months && executionStatus !== "executed"',
        action: 'mark_expired',
        priority: 3,
        enabled: true
      },
      {
        id: 'inactive_3_years',
        name: '3年無活動',
        condition: 'now > lastAccessed + 3 years',
        action: 'archive',
        priority: 4,
        enabled: true
      }
    ];
  }

  /**
   * 生成清理報告
   */
  private async generateCleanupReport(result: CleanupResult): Promise<void> {
    // 實作報告生成邏輯
    console.log('📊 生成清理報告:', result);
  }

  /**
   * 生成月度報告
   */
  private async generateMonthlyReport(result: CleanupResult): Promise<void> {
    // 實作月度報告生成邏輯
    console.log('📊 生成月度報告:', result);
  }

  /**
   * 生成年度報告
   */
  private async generateYearlyReport(result: CleanupResult): Promise<void> {
    // 實作年度報告生成邏輯
    console.log('📊 生成年度報告:', result);
  }

  /**
   * 更新時效狀態
   */
  private async updateExpirationStatus(_result: CleanupResult): Promise<void> {
    // 實作時效狀態更新邏輯
    console.log('🕒 更新時效狀態');
  }

  /**
   * 封存舊資料
   */
  private async archiveOldData(_result: CleanupResult): Promise<void> {
    // 實作資料封存邏輯
    console.log('📦 封存舊資料');
  }
}

export const cleanupService = new CleanupService();
