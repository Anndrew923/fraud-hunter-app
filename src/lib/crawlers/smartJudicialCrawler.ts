// 智能司法爬蟲 - 最穩定的司法院判決書搜尋系統
// 使用多重策略和智能錯誤處理，確保高成功率

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

export class SmartJudicialCrawler {
  private baseUrl = 'https://arch.judicial.gov.tw';
  private searchUrl = `${this.baseUrl}/FJUD/FJUDQRY01_1.aspx`;
  private detailUrl = `${this.baseUrl}/FJUD/FJUDQRY02_1.aspx`;
  private maxRetries = 3;
  private retryDelay = 1000; // 1秒

  /**
   * 智能搜尋判決書 - 多重策略確保成功率
   */
  async searchJudgments(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    console.log('🔥 啟動智能司法搜尋系統', params);
    
    // 搜尋策略列表（按穩定性排序）
    const strategies = [
      () => this.searchWithDirectFormSubmission(params),
      () => this.searchWithSimplifiedForm(params),
      () => this.searchWithMinimalParams(params),
      () => this.searchWithFallbackMethod(params)
    ];

    // 嘗試每個策略
    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`🎯 嘗試搜尋策略 ${i + 1}/${strategies.length}`);
        const results = await this.executeWithRetry(strategies[i], this.maxRetries);
        
        if (results && results.length > 0) {
          console.log(`✅ 策略 ${i + 1} 成功，找到 ${results.length} 筆結果`);
          return this.enhanceResults(results, params);
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
   * 策略1: 直接表單提交（最穩定）
   */
  private async searchWithDirectFormSubmission(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    console.log('📋 使用直接表單提交策略');
    
    // 先獲取搜尋頁面以取得ViewState
    const pageResponse = await fetch(this.searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!pageResponse.ok) {
      throw new Error(`獲取搜尋頁面失敗: ${pageResponse.status}`);
    }

    const pageHtml = await pageResponse.text();
    const viewState = this.extractViewState(pageHtml);
    const eventValidation = this.extractEventValidation(pageHtml);

    // 建立搜尋表單資料
    const formData = this.buildSearchFormData(params, viewState, eventValidation);

    // 提交搜尋表單
    const searchResponse = await fetch(this.searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': this.searchUrl,
        'Origin': this.baseUrl
      },
      body: formData
    });

    if (!searchResponse.ok) {
      throw new Error(`搜尋請求失敗: ${searchResponse.status}`);
    }

    const searchHtml = await searchResponse.text();
    return this.parseSearchResults(searchHtml);
  }

  /**
   * 策略2: 簡化表單提交
   */
  private async searchWithSimplifiedForm(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    console.log('🔧 使用簡化表單提交策略');
    
    const formData = new URLSearchParams();
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
    formData.append('__VIEWSTATE', '');
    formData.append('__EVENTVALIDATION', '');

    const response = await fetch(this.searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': this.searchUrl
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`簡化搜尋失敗: ${response.status}`);
    }

    const html = await response.text();
    return this.parseSearchResults(html);
  }

  /**
   * 策略3: 最小參數搜尋
   */
  private async searchWithMinimalParams(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    console.log('⚡ 使用最小參數搜尋策略');
    
    const formData = new URLSearchParams();
    formData.append('keyword', params.keyword || '');
    formData.append('v_sys', 'M');
    formData.append('__VIEWSTATE', '');
    formData.append('__EVENTVALIDATION', '');

    const response = await fetch(this.searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`最小參數搜尋失敗: ${response.status}`);
    }

    const html = await response.text();
    return this.parseSearchResults(html);
  }

  /**
   * 策略4: 備援方法
   */
  private async searchWithFallbackMethod(params: JudicialSearchParams): Promise<JudicialSearchResult[]> {
    console.log('🔄 使用備援搜尋策略');
    
    // 嘗試直接URL搜尋
    const searchParams = new URLSearchParams();
    if (params.keyword) searchParams.append('kw', params.keyword);
    if (params.court) searchParams.append('v_court', params.court);
    if (params.startDate) searchParams.append('sdate', params.startDate);
    if (params.endDate) searchParams.append('edate', params.endDate);
    searchParams.append('v_sys', 'M');

    const url = `${this.searchUrl}?${searchParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`備援搜尋失敗: ${response.status}`);
    }

    const html = await response.text();
    return this.parseSearchResults(html);
  }

  /**
   * 獲取判決書詳細內容
   */
  async getJudgmentDetail(detailUrl: string): Promise<JudicialDetailResult> {
    console.log('🔍 獲取判決書詳細內容:', detailUrl);
    
    try {
      const response = await fetch(detailUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
      });

      if (!response.ok) {
        throw new Error(`獲取詳細內容失敗: ${response.status}`);
      }

      const html = await response.text();
      return this.parseJudgmentDetail(html, detailUrl);
    } catch (error) {
      console.error('獲取判決書詳細內容失敗:', error);
      throw error;
    }
  }

  /**
   * 提取ViewState
   */
  private extractViewState(html: string): string {
    const match = html.match(/<input[^>]*name="__VIEWSTATE"[^>]*value="([^"]*)"[^>]*>/i);
    return match ? match[1] : '';
  }

  /**
   * 提取EventValidation
   */
  private extractEventValidation(html: string): string {
    const match = html.match(/<input[^>]*name="__EVENTVALIDATION"[^>]*value="([^"]*)"[^>]*>/i);
    return match ? match[1] : '';
  }

  /**
   * 建立搜尋表單資料
   */
  private buildSearchFormData(
    params: JudicialSearchParams, 
    viewState: string, 
    eventValidation: string
  ): URLSearchParams {
    const formData = new URLSearchParams();
    
    // ASP.NET 必要參數
    formData.append('__VIEWSTATE', viewState);
    formData.append('__EVENTVALIDATION', eventValidation);
    formData.append('__EVENTTARGET', '');
    formData.append('__EVENTARGUMENT', '');
    
    // 搜尋參數
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
    
    try {
      // 使用更強健的正則表達式解析
      const tableRegex = /<table[^>]*class="table"[^>]*>([\s\S]*?)<\/table>/i;
      const tableMatch = html.match(tableRegex);
      
      if (!tableMatch) {
        console.log('⚠️ 未找到搜尋結果表格');
        return results;
      }

      const tableHtml = tableMatch[1];
      
      // 解析每一行結果
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;
      let serialNumber = 1;

      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const result = this.parseSearchResultRow(rowMatch[1], serialNumber);
        if (result) {
          results.push(result);
          serialNumber++;
        }
      }

      console.log(`✅ 成功解析 ${results.length} 筆搜尋結果`);
    } catch (error) {
      console.error('解析搜尋結果失敗:', error);
    }

    return results;
  }

  /**
   * 解析單一搜尋結果行
   */
  private parseSearchResultRow(rowHtml: string, serialNumber: number): JudicialSearchResult | null {
    try {
      // 提取裁判字號和詳細頁面連結
      const caseNumberMatch = rowHtml.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/i);
      if (!caseNumberMatch) return null;

      // 提取裁判日期
      const dateMatch = rowHtml.match(/(\d{3}\.\d{2}\.\d{2})/);
      
      // 提取裁判案由
      const reasonMatch = rowHtml.match(/<td[^>]*>([^<]+)<\/td>/gi);
      const caseReason = reasonMatch && reasonMatch[1] ? 
        reasonMatch[1].replace(/<[^>]*>/g, '').trim() : '';
      
      // 提取內容大小
      const sizeMatch = rowHtml.match(/\((\d+K)\)/);

      return {
        serialNumber,
        caseNumber: caseNumberMatch[2].trim(),
        judgmentDate: dateMatch ? dateMatch[1] : '',
        caseReason,
        summary: '', // 需要進一步解析
        contentSize: sizeMatch ? sizeMatch[1] : '',
        detailUrl: this.baseUrl + caseNumberMatch[1],
        riskScore: this.calculateRiskScore(caseReason),
        source: 'smart-crawler'
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
    try {
      // 提取裁判字號
      const caseNumberMatch = html.match(/裁判字號[^>]*>([^<]+)</i);
      
      // 提取裁判日期
      const dateMatch = html.match(/裁判日期[^>]*>([^<]+)</i);
      
      // 提取裁判案由
      const reasonMatch = html.match(/裁判案由[^>]*>([^<]+)</i);
      
      // 提取當事人資訊
      const plaintiffMatch = html.match(/原告[^>]*>([^<]+)</i);
      const defendantMatch = html.match(/被告[^>]*>([^<]+)</i);
      
      // 提取主文
      const mainRulingMatch = html.match(/主文[^>]*>([^<]+)</i);
      
      // 提取事實及理由
      const factsMatch = html.match(/事實及理由[^>]*>([^<]+)</i);
      
      // 提取相關法條
      const lawsMatch = html.match(/相關法條[^>]*>([^<]+)</i);
      
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
        previousJudgments: []
      };
    } catch (error) {
      console.error('解析判決書詳細內容失敗:', error);
      throw error;
    }
  }

  /**
   * 計算風險分數
   */
  private calculateRiskScore(text: string): number {
    let score = 0;
    
    // 詐欺相關關鍵字
    const fraudKeywords = ['詐欺', '詐騙', '詐取', '詐術', '詐得', '詐財'];
    fraudKeywords.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
      score += matches * 10;
    });
    
    // 金額相關
    const amountKeywords = ['萬元', '千元', '百萬元', '億'];
    amountKeywords.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
      score += matches * 5;
    });
    
    // 刑期相關
    const sentenceKeywords = ['有期徒刑', '無期徒刑', '死刑'];
    sentenceKeywords.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
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
    const factsMatch = html.match(/事實及理由[^>]*>([^<]+)</i);
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

  /**
   * 增強搜尋結果
   */
  private enhanceResults(results: JudicialSearchResult[], params: JudicialSearchParams): JudicialSearchResult[] {
    return results.map(result => ({
      ...result,
      riskScore: this.calculateRiskScore(result.caseReason + ' ' + result.summary),
      source: 'smart-crawler'
    }));
  }

  /**
   * 執行重試機制
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`⚠️ 嘗試 ${i + 1}/${maxRetries} 失敗:`, lastError.message);
        
        if (i < maxRetries - 1) {
          await this.delay(this.retryDelay * (i + 1));
        }
      }
    }
    
    throw lastError || new Error('操作失敗');
  }

  /**
   * 延遲函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const smartJudicialCrawler = new SmartJudicialCrawler();
