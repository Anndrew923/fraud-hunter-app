// 通緝犯資料爬蟲
export interface WantedPerson {
  id: string;
  name: string;
  alias?: string;
  gender: '男' | '女';
  age: number;
  photoUrl?: string;
  caseDetails: string;
  crimeType: string;
  wantedDate: string;
  issuingCourt: string;
  sourceUrl: string;
  riskScore: number;
  status: 'active' | 'cleared';
  createdAt: Date;
}

export interface WantedCrawlerConfig {
  baseUrl: string;
  maxPages: number;
  delay: number;
  userAgent: string;
}

export class WantedCrawler {
  private config: WantedCrawlerConfig;
  private results: WantedPerson[] = [];

  constructor(config: Partial<WantedCrawlerConfig> = {}) {
    this.config = {
      baseUrl: 'https://www.cib.gov.tw/',
      maxPages: 10,
      delay: 1000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...config
    };
  }

  // 搜尋通緝犯
  async searchWantedPersons(query: string, options: {
    gender?: '男' | '女';
    ageMin?: number;
    ageMax?: number;
    crimeType?: string;
  } = {}): Promise<WantedPerson[]> {
    try {
      console.log(`開始搜尋通緝犯: ${query}`);
      
      // 模擬搜尋結果
      const mockResults = this.generateMockWantedResults(query, options);
      
      this.results = mockResults;
      return this.results;
    } catch (error) {
      console.error('搜尋通緝犯失敗:', error);
      throw error;
    }
  }

  // 根據姓名查詢
  async getWantedPersonByName(name: string): Promise<WantedPerson | null> {
    try {
      console.log(`查詢通緝犯: ${name}`);
      
      // 模擬根據姓名查詢
      const mockResult = this.generateMockWantedPerson(name);
      return mockResult;
    } catch (error) {
      console.error('查詢通緝犯失敗:', error);
      throw error;
    }
  }

  // 生成模擬通緝犯搜尋結果
  private generateMockWantedResults(query: string, _options: Record<string, unknown>): WantedPerson[] {
    const results: WantedPerson[] = [];
    const crimeTypes = ['詐欺', '竊盜', '傷害', '妨害自由', '毒品'];
    const courts = ['臺灣臺北地方法院', '臺灣新北地方法院', '臺灣士林地方法院'];
    const genders: ('男' | '女')[] = ['男', '女'];
    
    for (let i = 1; i <= 5; i++) {
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const age = 20 + Math.floor(Math.random() * 50);
      const crimeType = crimeTypes[Math.floor(Math.random() * crimeTypes.length)];
      
      results.push({
        id: `wanted_${Date.now()}_${i}`,
        name: `${query}${i}`,
        alias: `綽號${i}`,
        gender,
        age,
        photoUrl: `https://via.placeholder.com/150x200?text=${query}${i}`,
        caseDetails: `涉及${crimeType}案件，詳細案情...`,
        crimeType,
        wantedDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        issuingCourt: courts[Math.floor(Math.random() * courts.length)],
        sourceUrl: `https://www.cib.gov.tw/wanted/${i}`,
        riskScore: Math.floor(Math.random() * 100),
        status: 'active',
        createdAt: new Date()
      });
    }
    
    return results;
  }

  // 生成模擬通緝犯資料
  private generateMockWantedPerson(name: string): WantedPerson {
    return {
      id: `wanted_${Date.now()}`,
      name,
      alias: '綽號',
      gender: '男',
      age: 35,
      photoUrl: 'https://via.placeholder.com/150x200?text=通緝犯',
      caseDetails: '涉及詐欺案件，詳細案情...',
      crimeType: '詐欺',
      wantedDate: '2023-11-15',
      issuingCourt: '臺灣臺北地方法院',
      sourceUrl: `https://www.cib.gov.tw/wanted/${name}`,
      riskScore: 90,
      status: 'active',
      createdAt: new Date()
    };
  }

  // 計算風險分數
  private calculateRiskScore(person: WantedPerson): number {
    let score = 0;
    
    // 根據犯罪類型加分
    const highRiskCrimes = ['詐欺', '毒品', '傷害'];
    if (highRiskCrimes.includes(person.crimeType)) {
      score += 40;
    } else {
      score += 20;
    }
    
    // 根據年齡調整
    if (person.age < 30) score += 10;
    if (person.age > 50) score += 5;
    
    // 根據性別調整（僅供參考）
    if (person.gender === '男') score += 5;
    
    return Math.min(score, 100);
  }

  // 獲取搜尋結果
  getResults(): WantedPerson[] {
    return this.results;
  }

  // 清空結果
  clearResults(): void {
    this.results = [];
  }
}
