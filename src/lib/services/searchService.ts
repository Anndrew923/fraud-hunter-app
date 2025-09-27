// 搜尋服務 - 整合法院判決書和通緝犯搜尋
import { CourtCrawler, CourtJudgment } from '../crawlers/courtCrawler';
import { WantedCrawler, WantedPerson } from '../crawlers/wantedCrawler';

export interface SearchResult {
  type: 'judgment' | 'wanted';
  data: CourtJudgment | WantedPerson;
  relevanceScore: number;
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
    const judgmentCount = results.filter(r => r.type === 'judgment').length;
    const wantedCount = results.filter(r => r.type === 'wanted').length;
    
    const riskScores = results.map(r => {
      if (r.type === 'judgment') {
        return (r.data as CourtJudgment).riskScore;
      } else {
        return (r.data as WantedPerson).riskScore;
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
