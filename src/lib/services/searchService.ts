// 智能搜尋服務 - 整合法院判決書和通緝犯搜尋
import { CourtCrawler, CourtJudgment } from '../crawlers/courtCrawler';
import { WantedCrawler, WantedPerson } from '../crawlers/wantedCrawler';

// 司法搜尋參數接口
export interface JudicialSearchParams {
  keyword?: string;
  court?: string;
  caseType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}

// 司法搜尋結果接口
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

// 司法詳細結果接口
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

export interface SearchResult {
  type: 'judgment' | 'wanted' | 'clean' | 'judicial';
  data: CourtJudgment | WantedPerson | CleanRecord | JudicialDetailResult;
  relevanceScore: number;
}

export interface CleanRecord {
  name: string;
  status: 'clean';
  message: string;
  searchDate: Date;
  riskScore: 0;
}

export interface SearchOptions {
  includeJudgments?: boolean;
  includeWanted?: boolean;
  court?: string;
  caseType?: string;
  gender?: '男' | '女';
  ageMin?: number;
  ageMax?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchStats {
  totalResults: number;
  judgmentCount: number;
  wantedCount: number;
  averageRiskScore: number;
  searchTime: number;
}

export class SearchService {
  private courtCrawler: CourtCrawler;
  private wantedCrawler: WantedCrawler;
  private searchHistory: Array<{
    query: string;
    results: SearchResult[];
    timestamp: Date;
    stats: SearchStats;
  }> = [];

  constructor() {
    this.courtCrawler = new CourtCrawler();
    this.wantedCrawler = new WantedCrawler();
  }

  // 綜合搜尋
  async search(query: string, options: SearchOptions = {}): Promise<{
    results: SearchResult[];
    stats: SearchStats;
  }> {
    const startTime = Date.now();
    const results: SearchResult[] = [];
    
    try {
      console.log(`開始綜合搜尋: ${query}`, options);

      // 設定預設選項
      const searchOptions = {
        includeJudgments: true,
        includeWanted: true,
        ...options
      };

      // 並行搜尋法院判決書和通緝犯
      const searchPromises: Promise<CourtJudgment[] | WantedPerson[]>[] = [];

      if (searchOptions.includeJudgments) {
        searchPromises.push(
          this.courtCrawler.searchJudgments(query, {
            court: searchOptions.court,
            caseType: searchOptions.caseType,
            dateFrom: searchOptions.dateFrom,
            dateTo: searchOptions.dateTo
          })
        );
      }

      if (searchOptions.includeWanted) {
        searchPromises.push(
          this.wantedCrawler.searchWantedPersons(query, {
            gender: searchOptions.gender,
            ageMin: searchOptions.ageMin,
            ageMax: searchOptions.ageMax
          })
        );
      }

      const searchResults = await Promise.all(searchPromises);
      const searchTime = Date.now() - startTime;

      // 處理法院判決書結果
      if (searchOptions.includeJudgments && searchResults[0]) {
        const judgments = searchResults[0] as CourtJudgment[];
        judgments.forEach(judgment => {
          results.push({
            type: 'judgment',
            data: judgment,
            relevanceScore: this.calculateRelevanceScore(query, judgment.caseTitle + ' ' + judgment.summary)
          });
        });
      }

      // 處理通緝犯結果
      if (searchOptions.includeWanted) {
        const wantedIndex = searchOptions.includeJudgments ? 1 : 0;
        if (searchResults[wantedIndex]) {
          const wantedPersons = searchResults[wantedIndex] as WantedPerson[];
          wantedPersons.forEach(person => {
            results.push({
              type: 'wanted',
              data: person,
              relevanceScore: this.calculateRelevanceScore(query, person.name + ' ' + person.caseDetails)
            });
          });
        }
      }

      // 如果沒有找到任何結果，添加乾淨記錄
      if (results.length === 0) {
        const cleanRecord: CleanRecord = {
          name: query,
          status: 'clean',
          message: '在現有資料庫中未發現相關案件記錄，此人可能為正常公民',
          searchDate: new Date(),
          riskScore: 0
        };
        
        results.push({
          type: 'clean',
          data: cleanRecord,
          relevanceScore: 100
        });
        
        console.log('✅ 未發現問題記錄，此人為乾淨記錄');
      }

      // 按相關性分數排序
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // 計算統計資料
      const stats = this.calculateSearchStats(results, searchTime);

      // 儲存搜尋歷史
      this.searchHistory.push({
        query,
        results,
        timestamp: new Date(),
        stats
      });

      console.log(`搜尋完成: ${results.length} 筆結果`, stats);

      return { results, stats };
    } catch (error) {
      console.error('搜尋失敗:', error);
      throw error;
    }
  }

  // 快速搜尋（只搜尋法院判決書）
  async searchJudgments(query: string, options: Record<string, unknown> = {}): Promise<CourtJudgment[]> {
    return await this.courtCrawler.searchJudgments(query, options);
  }

  // 快速搜尋（只搜尋通緝犯）
  async searchWanted(query: string, options: Record<string, unknown> = {}): Promise<WantedPerson[]> {
    return await this.wantedCrawler.searchWantedPersons(query, options);
  }

  // 根據案號查詢判決書
  async getJudgmentByCaseNumber(caseNumber: string): Promise<CourtJudgment | null> {
    return await this.courtCrawler.getJudgmentByCaseNumber(caseNumber);
  }

  // 根據姓名查詢通緝犯
  async getWantedPersonByName(name: string): Promise<WantedPerson | null> {
    return await this.wantedCrawler.getWantedPersonByName(name);
  }

  // 智能司法搜尋 - 使用新的Netlify Functions
  async searchJudicialJudgments(params: JudicialSearchParams) {
    try {
      console.log('🔥 啟動智能司法搜尋系統 - 讓詐騙犯無所遁形！', params);
      
      // 使用新的智能司法搜尋 Function
      const functionUrl = this.getFunctionUrl('smart-judicial-search');
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`司法搜尋失敗: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '司法搜尋失敗');
      }

      // 轉換結果格式
      const results: SearchResult[] = data.results.map((result: JudicialDetailResult) => ({
        type: 'judicial' as const,
        data: result,
        relevanceScore: this.calculateRelevanceScore(params.keyword || '', result.caseTitle + ' ' + result.summary)
      }));

      // 如果沒有找到任何結果，添加乾淨記錄
      if (results.length === 0) {
        const cleanRecord: CleanRecord = {
          name: params.keyword || '',
          status: 'clean',
          message: '在司法院判決書資料庫中未發現相關案件記錄，此人可能為正常公民',
          searchDate: new Date(),
          riskScore: 0
        };
        
        results.push({
          type: 'clean',
          data: cleanRecord,
          relevanceScore: 100
        });
        
        console.log('✅ 司法院資料庫中未發現問題記錄，此人為乾淨記錄');
      }

      // 計算統計資料
      const stats = this.calculateSearchStats(results, 0);

      return {
        results,
        stats,
        totalAvailable: data.totalAvailable || results.length
      };
    } catch (error) {
      console.error('司法搜尋失敗:', error);
      
      // 搜尋失敗時返回乾淨記錄
      const cleanRecord: CleanRecord = {
        name: params.keyword || '',
        status: 'clean',
        message: '司法搜尋系統暫時無法使用，無法確認此人的司法記錄',
        searchDate: new Date(),
        riskScore: 0
      };
      
      return {
        results: [{
          type: 'clean',
          data: cleanRecord,
          relevanceScore: 100
        }],
        stats: {
          totalResults: 1,
          judgmentCount: 0,
          wantedCount: 0,
          averageRiskScore: 0,
          searchTime: 0
        },
        totalAvailable: 0
      };
    }
  }

  // 獲取司法判決書詳細內容
  async getJudicialDetail(detailUrl: string): Promise<JudicialDetailResult> {
    try {
      console.log('🔍 獲取司法判決書詳細內容:', detailUrl);
      
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
        console.log('✅ 成功獲取司法判決書詳細內容');
        return data.detail;
      } else {
        throw new Error(data.error || '獲取詳細內容失敗');
      }
    } catch (error) {
      console.error('獲取司法判決書詳細內容失敗:', error);
      throw error;
    }
  }

  // 獲取 Function URL
  private getFunctionUrl(functionName: string): string {
    if (process.env.NODE_ENV === 'production') {
      return `${window.location.origin}/.netlify/functions/${functionName}`;
    } else if (typeof window !== 'undefined' && window.location.port === '8888') {
      return `${window.location.origin}/.netlify/functions/${functionName}`;
    } else {
      return `http://localhost:8888/.netlify/functions/${functionName}`;
    }
  }

  // 計算相關性分數
  private calculateRelevanceScore(query: string, text: string): number {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    let score = 0;
    
    // 完全匹配
    if (textLower.includes(queryLower)) {
      score += 100;
    }
    
    // 部分匹配
    const queryWords = queryLower.split(' ');
    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        score += 20;
      }
    });
    
    // 開頭匹配加分
    if (textLower.startsWith(queryLower)) {
      score += 50;
    }
    
    return Math.min(score, 100);
  }

  // 計算搜尋統計
  private calculateSearchStats(results: SearchResult[], searchTime: number): SearchStats {
    const judgmentCount = results.filter(r => r.type === 'judgment' || r.type === 'judicial').length;
    const wantedCount = results.filter(r => r.type === 'wanted').length;
    
    const riskScores = results.map(r => {
      if (r.type === 'judgment') {
        return (r.data as CourtJudgment).riskScore;
      } else if (r.type === 'judicial') {
        return (r.data as JudicialDetailResult).riskScore;
      } else if (r.type === 'wanted') {
        return (r.data as WantedPerson).riskScore;
      } else {
        return 0; // clean record
      }
    });
    
    const averageRiskScore = riskScores.length > 0 
      ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length 
      : 0;

    return {
      totalResults: results.length,
      judgmentCount,
      wantedCount,
      averageRiskScore: Math.round(averageRiskScore),
      searchTime
    };
  }

  // 獲取搜尋歷史
  getSearchHistory() {
    return this.searchHistory;
  }

  // 清空搜尋歷史
  clearSearchHistory() {
    this.searchHistory = [];
  }

  // 獲取熱門搜尋關鍵字
  getPopularKeywords(limit: number = 10): Array<{ keyword: string; count: number }> {
    const keywordCount: Record<string, number> = {};
    
    this.searchHistory.forEach(entry => {
      const keyword = entry.query.toLowerCase();
      keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
    });
    
    return Object.entries(keywordCount)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
