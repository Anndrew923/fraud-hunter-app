// 最強健的司法院判決書爬蟲 - 讓詐騙犯無所遁形！

export interface JudicialSearchParams {
  keyword?: string;
  court?: string;
  caseType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}

export interface JudicialSearchResult {
  serialNumber: number;
  caseNumber: string;
  judgmentDate: string;
  caseReason: string;
  summary: string;
  contentSize: string;
  detailUrl: string;
  riskScore?: number;
  source?: string;
}

export interface JudicialDetailResult {
  caseTitle: string;
  caseNumber: string;
  court: string;
  judgmentDate: string;
  caseReason: string;
  summary: string;
  riskScore: number;
  plaintiff?: string;
  defendant?: string;
  mainRuling: string;
  factsAndReasons: string;
  relatedLaws: string[];
  previousJudgments: string[];
}

export class RobustJudicialCrawler {
  private baseUrl = 'https://arch.judicial.gov.tw';

  /**
   * 多重備援搜尋系統 - 讓詐騙犯無所遁形！
   */
  async searchJudgments(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    console.log('🔥 啟動多重備援搜尋系統 - 讓詐騙犯無所遁形！', params);
    
    // 搜尋策略列表（只使用真實資料，避免毀謗風險）
    const searchStrategies = [
      () => this.searchWithOriginalFunction(params),
      () => this.searchWithRobustFunction(params),
      () => this.searchWithBackupFunction(params)
    ];

    // 嘗試每個搜尋策略
    for (let i = 0; i < searchStrategies.length; i++) {
      try {
        console.log(`🎯 嘗試搜尋策略 ${i + 1}/${searchStrategies.length}`);
        const results = await searchStrategies[i]();
        
        if (results && results.length > 0) {
          console.log(`✅ 策略 ${i + 1} 成功，找到 ${results.length} 筆結果`);
          return results;
        } else {
          console.log(`⚠️ 策略 ${i + 1} 無結果，嘗試下一個策略`);
        }
      } catch (error) {
        console.log(`❌ 策略 ${i + 1} 失敗:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log('💥 所有搜尋策略都失敗了');
    return [];
  }

  /**
   * 策略 1: 使用簡單搜尋 Function（最穩定）
   */
  private async searchWithSimpleFunction(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    console.log('🎯 使用簡單搜尋 Function（最穩定）');
    
    const functionUrl = this.getFunctionUrl('simple-search');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`簡單搜尋失敗: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.results : [];
  }

  /**
   * 策略 2: 使用強健搜尋 Function
   */
  private async searchWithRobustFunction(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    console.log('🛡️ 使用強健搜尋 Function');
    
    const functionUrl = this.getFunctionUrl('robust-search');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.log(`⚠️ 強健搜尋失敗: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.success ? data.results : [];
  }

  /**
   * 策略 2: 使用備援搜尋 Function
   */
  private async searchWithBackupFunction(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    console.log('🔄 使用備援搜尋 Function');
    
    const functionUrl = this.getFunctionUrl('backup-search');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.log(`⚠️ 備援搜尋失敗: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.success ? data.results : [];
  }

  /**
   * 策略 3: 使用原始搜尋 Function
   */
  private async searchWithOriginalFunction(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    console.log('📋 使用原始搜尋 Function');
    
    const functionUrl = this.getFunctionUrl('judicial-search');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.log(`⚠️ 原始搜尋失敗: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.success ? data.results : [];
  }


  /**
   * 獲取判決書詳細內容
   */
  async getJudgmentDetail(detailUrl: string): Promise<JudicialDetailResult> {
    console.log('🔍 獲取判決書詳細內容:', detailUrl);
    
    try {
      const functionUrl = this.getFunctionUrl('judicial-detail');
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailUrl }),
      });

      if (!response.ok) {
        throw new Error(`詳細內容請求失敗: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 成功獲取判決書詳細內容');
        return data.result;
      } else {
        throw new Error(data.error || '獲取詳細內容失敗');
      }
    } catch (error) {
      console.error('獲取判決書詳細內容失敗:', error);
      
      // 搜尋失敗時返回空結果，不使用模擬資料
      throw new Error('無法獲取判決書詳細內容');
    }
  }


  /**
   * 獲取 Function URL
   */
  private getFunctionUrl(functionName: string): string {
    if (process.env.NODE_ENV === 'production') {
      return `${window.location.origin}/.netlify/functions/${functionName}`;
    } else if (typeof window !== 'undefined' && window.location.port === '8888') {
      return `${window.location.origin}/.netlify/functions/${functionName}`;
    } else {
      return `http://localhost:8888/.netlify/functions/${functionName}`;
    }
  }

  /**
   * 計算風險分數
   */
  calculateRiskScore(result: JudicialSearchResult): number {
    let score = 0;
    
    // 根據案件類型加分
    if (result.caseReason.includes('詐欺')) score += 30;
    if (result.caseReason.includes('詐騙')) score += 25;
    if (result.caseReason.includes('洗錢')) score += 20;
    if (result.caseReason.includes('組織犯罪')) score += 35;
    
    // 根據摘要內容加分
    if (result.summary.includes('詐欺')) score += 20;
    if (result.summary.includes('詐騙')) score += 15;
    if (result.summary.includes('洗錢')) score += 10;
    if (result.summary.includes('集團')) score += 25;
    
    // 根據法院加分
    if (result.caseNumber.includes('高院')) score += 10;
    if (result.caseNumber.includes('最高法院')) score += 15;
    
    return Math.min(score, 100); // 最高 100 分
  }
}
