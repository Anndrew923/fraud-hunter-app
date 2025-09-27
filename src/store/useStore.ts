import { create } from 'zustand';
import { User, CourtJudgment, WantedPerson, RiskAssessment } from '@/types/database';

interface AppState {
  // 用戶狀態
  user: User | null;
  isAuthenticated: boolean;
  
  // 搜尋狀態
  searchQuery: string;
  searchResults: {
    judgments: CourtJudgment[];
    wantedPersons: WantedPerson[];
  };
  isLoading: boolean;
  
  // 風險評估
  riskAssessment: RiskAssessment | null;
  
  // UI 狀態
  sidebarOpen: boolean;
  currentPage: string;
  
  // Actions
  setUser: (user: User | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: { judgments: CourtJudgment[]; wantedPersons: WantedPerson[] }) => void;
  setLoading: (loading: boolean) => void;
  setRiskAssessment: (assessment: RiskAssessment | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  
  // 重置狀態
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  // 初始狀態
  user: null,
  isAuthenticated: false,
  searchQuery: '',
  searchResults: {
    judgments: [],
    wantedPersons: [],
  },
  isLoading: false,
  riskAssessment: null,
  sidebarOpen: false,
  currentPage: 'home',
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setLoading: (loading) => set({ isLoading: loading }),
  setRiskAssessment: (assessment) => set({ riskAssessment: assessment }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentPage: (page) => set({ currentPage: page }),
  
  // 重置狀態
  reset: () => set({
    user: null,
    isAuthenticated: false,
    searchQuery: '',
    searchResults: { judgments: [], wantedPersons: [] },
    isLoading: false,
    riskAssessment: null,
    sidebarOpen: false,
    currentPage: 'home',
  }),
}));
