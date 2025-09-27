// 法院判決書爬蟲
export interface CourtJudgment {
  id: string;
  caseNumber: string;
  caseTitle: string;
  court: string;
  judgmentDate: string;
  caseType: string;
  summary: string;
  fullText: string;
  defendant: string;
  plaintiff: string;
  judge: string;
  sourceUrl: string;
  riskScore: number;
  createdAt: Date;
}

export interface CrawlerConfig {
  baseUrl: string;
  maxPages: number;
  delay: number; // 毫秒
  userAgent: string;
}

export class CourtCrawler {
  private config: CrawlerConfig;
  private results: CourtJudgment[] = [];

  constructor(config: Partial<CrawlerConfig> = {}) {
    this.config = {
      baseUrl: 'https://judgment.judicial.gov.tw/FJUD/',
      maxPages: 10,
      delay: 1000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...config
    };
  }

  // 搜尋判決書
  async searchJudgments(query: string, options: {
    court?: string;
    caseType?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<CourtJudgment[]> {
    try {
      console.log(`開始搜尋判決書: ${query}`);
      
      // 模擬搜尋結果（實際實作時會調用真實 API）
      const mockResults = this.generateMockResults(query, options);
      
      this.results = mockResults;
      return this.results;
    } catch (error) {
      console.error('搜尋判決書失敗:', error);
      throw error;
    }
  }

  // 根據案號查詢
  async getJudgmentByCaseNumber(caseNumber: string): Promise<CourtJudgment | null> {
    try {
      console.log(`查詢案號: ${caseNumber}`);
      
      // 模擬根據案號查詢
      const mockResult = this.generateMockJudgment(caseNumber);
      return mockResult;
    } catch (error) {
      console.error('查詢案號失敗:', error);
      throw error;
    }
  }

  // 生成模擬搜尋結果
  private generateMockResults(query: string, _options: Record<string, unknown>): CourtJudgment[] {
    const results: CourtJudgment[] = [];
    const courts = ['臺灣臺北地方法院', '臺灣新北地方法院', '臺灣士林地方法院'];
    const caseTypes = ['民事', '刑事', '行政'];
    
    for (let i = 1; i <= 5; i++) {
      results.push({
        id: `judgment_${Date.now()}_${i}`,
        caseNumber: `112年度${caseTypes[i % 3]}字第${1000 + i}號`,
        caseTitle: `${query}相關案件 ${i}`,
        court: courts[i % courts.length],
        judgmentDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        caseType: caseTypes[i % caseTypes.length],
        summary: `這是關於「${query}」的判決書摘要，涉及相關法律爭議...`,
        fullText: `完整的判決書內容...`,
        defendant: `被告${i}`,
        plaintiff: `原告${i}`,
        judge: `法官${i}`,
        sourceUrl: `https://judgment.judicial.gov.tw/FJUD/data.aspx?id=${i}`,
        riskScore: Math.floor(Math.random() * 100),
        createdAt: new Date()
      });
    }
    
    return results;
  }

  // 生成模擬判決書
  private generateMockJudgment(caseNumber: string): CourtJudgment {
    return {
      id: `judgment_${Date.now()}`,
      caseNumber,
      caseTitle: `詐騙案件 - ${caseNumber}`,
      court: '臺灣臺北地方法院',
      judgmentDate: '2023-12-01',
      caseType: '刑事',
      summary: '被告因詐欺罪被判處有期徒刑...',
      fullText: '完整的判決書內容...',
      defendant: '張三',
      plaintiff: '李四',
      judge: '王法官',
      sourceUrl: `https://judgment.judicial.gov.tw/FJUD/data.aspx?id=${caseNumber}`,
      riskScore: 85,
      createdAt: new Date()
    };
  }

  // 計算風險分數
  private calculateRiskScore(judgment: CourtJudgment): number {
    let score = 0;
    
    // 根據案件類型加分
    if (judgment.caseType === '刑事') score += 30;
    if (judgment.caseType === '民事') score += 10;
    
    // 根據關鍵字加分
    const highRiskKeywords = ['詐欺', '詐騙', '背信', '侵占', '偽造'];
    const text = `${judgment.caseTitle} ${judgment.summary}`.toLowerCase();
    
    highRiskKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 20;
    });
    
    return Math.min(score, 100);
  }

  // 獲取搜尋結果
  getResults(): CourtJudgment[] {
    return this.results;
  }

  // 清空結果
  clearResults(): void {
    this.results = [];
  }
}
