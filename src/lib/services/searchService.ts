// 搜尋服務 - 整合法院判決書和通緝犯搜尋
import { CourtCrawler, CourtJudgment } from '../crawlers/courtCrawler';
import { WantedCrawler, WantedPerson } from '../crawlers/wantedCrawler';
import { judicialCrawler, JudicialSearchParams } from '../crawlers/judicialCrawler';

export interface SearchResult {
  type: 'judgment' | 'wanted' | 'clean';
  data: CourtJudgment | WantedPerson | CleanRecord;
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

  // 使用司法院法學資料檢索系統搜尋判決書
  async searchJudicialJudgments(params: JudicialSearchParams) {
    try {
      console.log('開始司法院判決書搜尋:', params);
      
      // 搜尋判決書列表
      const searchResults = await judicialCrawler.searchJudgments(params);
      
      // 取得前5筆的詳細內容
      const detailedResults = await Promise.all(
        searchResults.slice(0, 5).map(async (result) => {
          try {
            const detail = await judicialCrawler.getJudgmentDetail(result.detailUrl);
            return {
              type: 'judgment' as const,
              data: detail,
              relevanceScore: this.calculateRelevanceScore(params.keyword || '', detail.caseTitle + ' ' + detail.summary)
            };
          } catch (error) {
            console.error('取得判決書詳細內容失敗:', error);
            return null;
          }
        })
      );

      // 過濾掉失敗的結果
      const validResults = detailedResults.filter(result => result !== null) as unknown as SearchResult[];

      // 如果沒有找到任何結果，添加乾淨記錄
      if (validResults.length === 0) {
        const cleanRecord: CleanRecord = {
          name: params.keyword || '',
          status: 'clean',
          message: '在司法院判決書資料庫中未發現相關案件記錄，此人可能為正常公民',
          searchDate: new Date(),
          riskScore: 0
        };
        
        validResults.push({
          type: 'clean',
          data: cleanRecord,
          relevanceScore: 100
        });
        
        console.log('✅ 司法院資料庫中未發現問題記錄，此人為乾淨記錄');
      }

      // 計算統計資料
      const stats = this.calculateSearchStats(validResults, 0);

      return {
        results: validResults,
        stats,
        totalAvailable: searchResults.length
      };
    } catch (error) {
      console.error('司法院判決書搜尋失敗:', error);
      throw error;
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
