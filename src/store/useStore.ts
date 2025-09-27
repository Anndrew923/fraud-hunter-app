import { create } from 'zustand';
import { User, RiskAssessment } from '@/types/database';
import { SearchResult, SearchStats, SearchService } from '@/lib/services/searchService';

interface AppState {
  // 用戶狀態
  user: User | null;
  isAuthenticated: boolean;
  
  // 搜尋狀態
  searchQuery: string;
  searchResults: SearchResult[];
  searchStats: SearchStats | null;
  isLoading: boolean;
  searchHistory: Array<{
    query: string;
    results: SearchResult[];
    timestamp: Date;
    stats: SearchStats;
  }>;
  
  // 風險評估
  riskAssessment: RiskAssessment | null;
  
  // UI 狀態
  sidebarOpen: boolean;
  currentPage: string;
  
  // 搜尋服務
  searchService: SearchService | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSearchStats: (stats: SearchStats | null) => void;
  setLoading: (loading: boolean) => void;
  setRiskAssessment: (assessment: RiskAssessment | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  
  // 搜尋動作
  addToSearchHistory: (query: string, results: SearchResult[], stats: SearchStats) => void;
  clearSearchResults: () => void;
  clearSearchHistory: () => void;
  initializeSearchService: () => void;
  
  // 重置狀態
  reset: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // 初始狀態
  user: null,
  isAuthenticated: false,
  searchQuery: '',
  searchResults: [],
  searchStats: null,
  isLoading: false,
  searchHistory: [],
  riskAssessment: null,
  sidebarOpen: false,
  currentPage: 'home',
  searchService: null,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSearchStats: (stats) => set({ searchStats: stats }),
  setLoading: (loading) => set({ isLoading: loading }),
  setRiskAssessment: (assessment) => set({ riskAssessment: assessment }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentPage: (page) => set({ currentPage: page }),
  
  // 搜尋動作
  addToSearchHistory: (query, results, stats) => set((state) => ({
    searchHistory: [
      {
        query,
        results,
        timestamp: new Date(),
        stats
      },
      ...state.searchHistory.slice(0, 49) // 保留最近50筆搜尋記錄
    ]
  })),
  
  clearSearchResults: () => set({ 
    searchResults: [], 
    searchStats: null,
    searchQuery: ''
  }),
  
  clearSearchHistory: () => set({ searchHistory: [] }),
  
  initializeSearchService: () => {
    if (!get().searchService) {
      set({ searchService: new SearchService() });
    }
  },
  
  // 重置狀態
  reset: () => set({
    user: null,
    isAuthenticated: false,
    searchQuery: '',
    searchResults: [],
    searchStats: null,
    isLoading: false,
    searchHistory: [],
    riskAssessment: null,
    sidebarOpen: false,
    currentPage: 'home',
    searchService: null,
  }),
}));
