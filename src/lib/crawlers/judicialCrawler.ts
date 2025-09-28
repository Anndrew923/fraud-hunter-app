import { CourtJudgment } from './courtCrawler';

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

export class JudicialCrawler {
  private baseUrl = 'https://arch.judicial.gov.tw';
  private searchUrl = `${this.baseUrl}/FJUD/FJUDQRY01_1.aspx`;
  private detailUrl = `${this.baseUrl}/FJUD/FJUDQRY02_1.aspx`;

  /**
   * 搜尋判決書
   */
  async searchJudgments(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    try {
      console.log('🔍 開始搜尋司法院真實判決書資料...', params);
      
      // 使用 Netlify Function 來避免 CORS 問題
      const functionUrl = process.env.NODE_ENV === 'production' 
        ? 'https://fraud-hunter.netlify.app/.netlify/functions/judicial-search'
        : 'http://localhost:8888/.netlify/functions/judicial-search';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`搜尋請求失敗: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ 司法院搜尋成功，找到 ${data.results.length} 筆真實判決書`);
        return data.results;
      } else {
        throw new Error(data.error || '搜尋失敗');
      }
    } catch (error) {
      console.error('搜尋判決書失敗:', error);
      
      // 搜尋失敗時返回空陣列，不顯示模擬資料
      console.log('❌ 司法院搜尋失敗，返回空結果');
      return [];
    }
  }

  /**
   * 取得判決書詳細內容
   */
  async getJudgmentDetail(detailUrl: string): Promise<JudicialDetailResult> {
    try {
      console.log('🔍 開始取得判決書真實詳細內容...', detailUrl);
      
      // 使用 Netlify Function 來避免 CORS 問題
      const functionUrl = process.env.NODE_ENV === 'production' 
        ? 'https://fraud-hunter.netlify.app/.netlify/functions/judicial-detail'
        : 'http://localhost:8888/.netlify/functions/judicial-detail';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ detailUrl }),
      });

      if (!response.ok) {
        throw new Error(`取得詳細內容失敗: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 判決書詳細內容取得成功');
        return data.detail;
      } else {
        throw new Error(data.error || '取得詳細內容失敗');
      }
    } catch (error) {
      console.error('取得判決書詳細內容失敗:', error);
      
      // 取得詳細內容失敗時返回空資料
      console.log('❌ 判決書詳細內容取得失敗，返回空資料');
      return {
        caseTitle: '',
        caseNumber: '',
        court: '',
        judgmentDate: '',
        caseReason: '',
        summary: '',
        riskScore: 0,
        plaintiff: '',
        defendant: '',
        mainRuling: '',
        factsAndReasons: '',
        relatedLaws: [],
        previousJudgments: []
      };
    }
  }

  /**
   * 建立搜尋表單資料
   */
  private buildSearchFormData(params: JudicialSearchParams): URLSearchParams {
    const formData = new URLSearchParams();
    
    // 基本搜尋參數
    formData.append('v_court', params.court || '');
    formData.append('v_sys', 'M'); // 刑事
    formData.append('jud_year', '');
    formData.append('jud_case', '');
    formData.append('jud_no', '');
    formData.append('jud_title', '');
    formData.append('keyword', params.keyword || '');
    formData.append('sdate', params.startDate || '');
    formData.append('edate', params.endDate || '');
    formData.append('jud_kind', '');
    formData.append('kw', params.keyword || '');
    formData.append('searchkw', params.keyword || '');
    
    return formData;
  }

  /**
   * 解析搜尋結果
   */
  private parseSearchResults(html: string): JudicialSearchResult[] {
    const results: JudicialSearchResult[] = [];
    
    // 使用正則表達式解析搜尋結果表格
    const tableRegex = /<table[^>]*class="table"[^>]*>([\s\S]*?)<\/table>/;
    const tableMatch = html.match(tableRegex);
    
    if (!tableMatch) {
      return results;
    }

    const tableHtml = tableMatch[1];
    
    // 解析每一行結果
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    const rows = tableHtml.match(rowRegex) || [];
    
    for (const row of rows) {
      const result = this.parseSearchResultRow(row);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 解析單一搜尋結果行
   */
  private parseSearchResultRow(rowHtml: string): JudicialSearchResult | null {
    try {
      // 提取序號
      const serialMatch = rowHtml.match(/<td[^>]*>(\d+)\.<\/td>/);
      if (!serialMatch) return null;

      // 提取裁判字號和詳細頁面連結
      const caseNumberMatch = rowHtml.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/);
      if (!caseNumberMatch) return null;

      // 提取裁判日期
      const dateMatch = rowHtml.match(/<td[^>]*>(\d{3}\.\d{2}\.\d{2})<\/td>/);
      
      // 提取裁判案由
      const reasonMatch = rowHtml.match(/<td[^>]*>([^<]+)<\/td>/g);
      
      // 提取內容大小
      const sizeMatch = rowHtml.match(/\((\d+K)\)/);

      return {
        serialNumber: parseInt(serialMatch[1]),
        caseNumber: caseNumberMatch[2].trim(),
        judgmentDate: dateMatch ? dateMatch[1] : '',
        caseReason: reasonMatch && reasonMatch[1] ? reasonMatch[1].replace(/<[^>]*>/g, '').trim() : '',
        summary: '', // 需要進一步解析
        contentSize: sizeMatch ? sizeMatch[1] : '',
        detailUrl: this.baseUrl + caseNumberMatch[1],
      };
    } catch (error) {
      console.error('解析搜尋結果行失敗:', error);
      return null;
    }
  }

  /**
   * 解析判決書詳細內容
   */
  private parseJudgmentDetail(html: string, detailUrl: string): JudicialDetailResult {
    // 提取裁判字號
    const caseNumberMatch = html.match(/裁判字號[^>]*>([^<]+)</);
    
    // 提取裁判日期
    const dateMatch = html.match(/裁判日期[^>]*>([^<]+)</);
    
    // 提取裁判案由
    const reasonMatch = html.match(/裁判案由[^>]*>([^<]+)</);
    
    // 提取當事人資訊
    const plaintiffMatch = html.match(/原告[^>]*>([^<]+)</);
    const defendantMatch = html.match(/被告[^>]*>([^<]+)</);
    
    // 提取主文
    const mainRulingMatch = html.match(/主文[^>]*>([^<]+)</);
    
    // 提取事實及理由
    const factsMatch = html.match(/事實及理由[^>]*>([^<]+)</);
    
    // 提取相關法條
    const lawsMatch = html.match(/相關法條[^>]*>([^<]+)</);
    
    // 計算風險分數
    const riskScore = this.calculateRiskScore(html);

    return {
      caseTitle: caseNumberMatch ? caseNumberMatch[1].trim() : '',
      caseNumber: caseNumberMatch ? caseNumberMatch[1].trim() : '',
      court: this.extractCourtName(caseNumberMatch ? caseNumberMatch[1] : ''),
      judgmentDate: dateMatch ? dateMatch[1].trim() : '',
      caseReason: reasonMatch ? reasonMatch[1].trim() : '',
      summary: this.extractSummary(html),
      riskScore,
      plaintiff: plaintiffMatch ? plaintiffMatch[1].trim() : '',
      defendant: defendantMatch ? defendantMatch[1].trim() : '',
      mainRuling: mainRulingMatch ? mainRulingMatch[1].trim() : '',
      factsAndReasons: factsMatch ? factsMatch[1].trim() : '',
      relatedLaws: lawsMatch ? this.parseRelatedLaws(lawsMatch[1]) : [],
      previousJudgments: [],
    };
  }

  /**
   * 計算風險分數
   */
  private calculateRiskScore(html: string): number {
    let score = 0;
    
    // 詐欺相關關鍵字
    const fraudKeywords = ['詐欺', '詐騙', '詐取', '詐術', '詐得', '詐財'];
    fraudKeywords.forEach(keyword => {
      const matches = (html.match(new RegExp(keyword, 'g')) || []).length;
      score += matches * 10;
    });
    
    // 金額相關
    const amountKeywords = ['萬元', '千元', '百萬元', '億'];
    amountKeywords.forEach(keyword => {
      const matches = (html.match(new RegExp(keyword, 'g')) || []).length;
      score += matches * 5;
    });
    
    // 刑期相關
    const sentenceKeywords = ['有期徒刑', '無期徒刑', '死刑'];
    sentenceKeywords.forEach(keyword => {
      const matches = (html.match(new RegExp(keyword, 'g')) || []).length;
      score += matches * 15;
    });
    
    return Math.min(score, 100);
  }

  /**
   * 提取法院名稱
   */
  private extractCourtName(caseNumber: string): string {
    if (caseNumber.includes('最高法院')) return '最高法院';
    if (caseNumber.includes('高等法院')) return '高等法院';
    if (caseNumber.includes('地方法院')) return '地方法院';
    return '未知法院';
  }

  /**
   * 提取摘要
   */
  private extractSummary(html: string): string {
    // 嘗試從事實及理由中提取前200字作為摘要
    const factsMatch = html.match(/事實及理由[^>]*>([^<]+)</);
    if (factsMatch) {
      return factsMatch[1].substring(0, 200) + '...';
    }
    return '';
  }

  /**
   * 解析相關法條
   */
  private parseRelatedLaws(lawsText: string): string[] {
    return lawsText.split(/[，,]/).map(law => law.trim()).filter(law => law.length > 0);
  }
}

export const judicialCrawler = new JudicialCrawler();
