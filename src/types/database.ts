// 資料庫類型定義

// 法院判決書
export interface CourtJudgment {
  id: string;
  caseNumber: string;
  caseTitle: string;
  court: string;
  judgmentDate: string;
  caseType: string;
  defendant: string;
  plaintiff: string;
  judgmentContent: string;
  keywords: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

// 通緝犯資料
export interface WantedPerson {
  id: string;
  name: string;
  alias: string[];
  photo: string;
  caseDescription: string;
  crimeType: string;
  wantedDate: string;
  reward: number;
  contact: string;
  status: 'active' | 'captured' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

// 用戶資料
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  subscription: 'free' | 'premium' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

// 搜尋記錄
export interface SearchRecord {
  id: string;
  userId: string;
  query: string;
  results: number;
  timestamp: Date;
  filters: Record<string, any>;
}

// 風險評估
export interface RiskAssessment {
  id: string;
  personName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    criminalRecords: number;
    wantedStatus: boolean;
    relatedCases: number;
    timeFactor: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 文件審核
export interface DocumentReview {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewResult: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
