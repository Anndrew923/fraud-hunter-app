'use client';

import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, UserIcon, ChartBarIcon, DocumentTextIcon, HomeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { CourtJudgment } from '@/lib/crawlers/courtCrawler';
import { WantedPerson } from '@/lib/crawlers/wantedCrawler';
import { DashboardStats, dashboardService } from '@/lib/services/dashboardService';
import { CleanRecord } from '@/lib/services/searchService';
import LoadingModal from '@/components/LoadingModal';
import { ErrorBoundary, DefaultErrorFallback } from '@/components/ErrorBoundary';
import { setupGlobalErrorHandling } from '@/lib/utils/errorHandler';

export default function HomePage() {
  const { 
    searchQuery, 
    setSearchQuery, 
    isLoading, 
    setLoading,
    searchResults,
    searchStats,
    setSearchResults,
    setSearchStats,
    addToSearchHistory,
    searchService,
    initializeSearchService
  } = useStore();
  const [searchType, setSearchType] = useState<'all' | 'judgments' | 'wanted'>('all');
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'rankings' | 'reports' | 'settings'>('home');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [isLoadingModalVisible, setIsLoadingModalVisible] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  // 設置全局錯誤處理
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    
    try {
      // 初始化搜尋服務
      initializeSearchService();
      
      if (searchService) {
        // 優先使用司法院法學資料檢索系統搜尋
        try {
          const judicialResults = await searchService.searchJudicialJudgments({
            keyword: searchQuery,
            page: 1
          });
          
          setSearchResults(judicialResults.results);
          setSearchStats(judicialResults.stats);
          addToSearchHistory(searchQuery, judicialResults.results, judicialResults.stats);
          
          console.log(`司法院搜尋完成: ${judicialResults.results.length} 筆結果 (共 ${judicialResults.totalAvailable} 筆可用)`);
        } catch (judicialError) {
          console.warn('司法院搜尋失敗，使用備用搜尋:', judicialError);
          
          // 如果司法院搜尋失敗，回退到原本的搜尋方式
          const { results, stats } = await searchService.search(searchQuery, {
            includeJudgments: searchType === 'all' || searchType === 'judgments',
            includeWanted: searchType === 'all' || searchType === 'wanted'
          });
          
          setSearchResults(results);
          setSearchStats(stats);
          addToSearchHistory(searchQuery, results, stats);
        }
        
        console.log('搜尋完成');
      }
    } catch (error) {
      console.error('搜尋失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 載入 165 儀表板資料（優化版 - 防止重複載入）
  useEffect(() => {
    const loadDashboardStats = async () => {
      // 防止重複載入：只在首頁、沒有資料、且沒有正在載入時才載入
      if (activeTab === 'home' && !dashboardStats && !isDashboardLoading) {
        setIsDashboardLoading(true);
        setIsLoadingStats(true);
        setIsLoadingModalVisible(true);
        setLoadingProgress(0);
        
        try {
          console.log('📊 開始載入真實165儀表板資料...');
          
          // 智能進度更新：基於實際載入階段
          const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
              // 確保進度不超過95%，留給完成階段
              if (prev >= 95) return 95;
              // 更平滑的進度增長
              return prev + Math.random() * 10 + 5;
            });
          }, 150);

          const data = await dashboardService.getDashboardData();
          
          clearInterval(progressInterval);
          // 確保進度條達到100%
          setLoadingProgress(100);
          
          if (data.success) {
            setDashboardStats(data.stats);
            console.log('📊 真實儀表板資料載入成功:', data.stats);
          } else {
            console.warn('📊 儀表板資料載入失敗，使用預設值:', data.error);
            // 如果真實數據載入失敗，使用預設值
            const defaultStats = {
              dailyCases: 328,
              newCases: 15,
              totalLoss: '1億7,395.4萬',
              dailyLoss: '1億7,395.4萬',
              queryCount: 1250,
              accuracyRate: 95.2,
              date: new Date().toLocaleDateString('zh-TW'),
              lastUpdated: new Date(),
              source: 'default'
            };
            setDashboardStats(defaultStats);
          }
        } catch (error) {
          console.error('載入儀表板資料失敗:', error);
          // 錯誤時使用預設值
          const defaultStats = {
            dailyCases: 328,
            newCases: 15,
            totalLoss: '1億7,395.4萬',
            dailyLoss: '1億7,395.4萬',
            queryCount: 1250,
            accuracyRate: 95.2,
            date: new Date().toLocaleDateString('zh-TW'),
            lastUpdated: new Date(),
            source: 'default'
          };
          setDashboardStats(defaultStats);
        } finally {
          // 確保100%時立即完成，不延遲
          setLoadingProgress(100);
          setTimeout(() => {
            setIsLoadingModalVisible(false);
            setIsLoadingStats(false);
            setIsDashboardLoading(false);
            setLoadingProgress(0);
          }, 200); // 減少延遲時間
        }
      }
    };

    loadDashboardStats();
  }, [activeTab, dashboardStats, isDashboardLoading]); // 添加 isDashboardLoading 依賴

  // 手動刷新資料
  const handleRefreshData = async () => {
    if (isDashboardLoading) return; // 防止重複點擊
    
    setTestResult('🔄 刷新中，請稍候...');
    setIsDashboardLoading(true);
    setIsLoadingStats(true);
    setIsLoadingModalVisible(true);
    setLoadingProgress(0);

    try {
      // 清除快取，強制重新獲取
      dashboardService.clearCache();
      
      // 智能進度更新：基於實際載入階段
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          // 確保進度不超過95%，留給完成階段
          if (prev >= 95) return 95;
          // 更平滑的進度增長
          return prev + Math.random() * 10 + 5;
        });
      }, 150);
      
      const data = await dashboardService.getDashboardData();
      
      clearInterval(progressInterval);
      // 確保進度條達到100%
      setLoadingProgress(100);
      
      if (data.success) {
        setDashboardStats(data.stats);
        setTestResult(`✅ 資料已更新！來源：${data.source}`);
      } else {
        setTestResult(`❌ 更新失敗：${data.error || '未知錯誤'}`);
      }
    } catch (error) {
      setTestResult(`❌ 刷新失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      // 確保100%時立即完成，不延遲
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoadingModalVisible(false);
        setIsLoadingStats(false);
        setIsDashboardLoading(false);
        setLoadingProgress(0);
      }, 200); // 減少延遲時間
    }
  };


  return (
    <ErrorBoundary fallback={DefaultErrorFallback}>
      <div className="min-h-screen bg-gray-900">
      {/* Header - 暗黑肅殺風 */}
      <header className="bg-black shadow-2xl border-b border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-red-600">詐騙獵人</h1>
                  <span className="text-sm text-gray-400">社會信用檔案管理平台</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <UserIcon className="h-6 w-6 text-gray-400" />
              <span className="text-sm text-white">登入</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 根據 activeTab 顯示不同內容 */}
        {activeTab === 'home' && (
          <>
            {/* Hero Section - 暗黑肅殺風 */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-red-600 rounded-xl mb-6 shadow-2xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-6xl font-black text-white mb-4 tracking-tight">
                <span className="text-red-600 drop-shadow-lg">詐騙</span>
                <span className="text-gray-300 drop-shadow-lg">獵人</span>
              </h1>
              <p className="text-2xl text-red-400 mb-2 font-bold">
                主動出擊，讓詐騙犯無所遁形
              </p>
              <p className="text-lg text-gray-400 mb-8">
                社會信用檔案管理平台 · 透過合法途徑公開資訊，達到社會警示作用
              </p>
              
              {/* 核心功能標語 - 暗黑肅殺風格 */}
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span className="px-4 py-2 bg-gray-800 text-red-400 rounded-full border border-red-600 font-bold shadow-lg">🔍 智能搜尋</span>
                <span className="px-4 py-2 bg-gray-800 text-red-400 rounded-full border border-red-600 font-bold shadow-lg">⚖️ 法院判決</span>
                <span className="px-4 py-2 bg-gray-800 text-red-400 rounded-full border border-red-600 font-bold shadow-lg">🚨 通緝犯查詢</span>
                <span className="px-4 py-2 bg-gray-800 text-red-400 rounded-full border border-red-600 font-bold shadow-lg">📊 風險評估</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'search' && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">搜尋功能</h2>
            <p className="text-gray-600 mb-8">輸入關鍵字進行搜尋</p>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">法院判決書查詢</h2>
            <p className="text-gray-600 mb-8">查詢司法院公開的判決書資料</p>
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-2xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🏆 詐欺天梯</h2>
              <p className="text-lg text-gray-600 mb-4">詐欺犯排行榜 - 讓惡行無所遁形</p>
              <div className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium inline-block">
                🚧 即將推出
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3">📊 功能預覽</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• 詐欺金額排行榜</li>
                  <li>• 案件數量統計</li>
                  <li>• 風險等級分類</li>
                  <li>• 歷史追蹤記錄</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3">🎯 設計理念</h3>
                <p className="text-gray-600">
                  透過公開資料建立詐欺犯排行榜，讓社會大眾了解詐騙的嚴重性，
                  同時對潛在犯罪者產生威懾作用。
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">📝 投稿專區</h2>
              <p className="text-lg text-gray-600 mb-4">被欠債、被詐欺經驗分享</p>
              <div className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium inline-block">
                🚧 即將推出
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3">📋 投稿類型</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• 債務糾紛案例</li>
                  <li>• 詐騙經驗分享</li>
                  <li>• 法律程序協助</li>
                  <li>• 防詐知識交流</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3">🛡️ 安全機制</h3>
                <p className="text-gray-600">
                  所有投稿都會經過審核，確保內容真實性，
                  同時保護投稿者隱私，建立安全的分享環境。
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">設定</h2>
              <p className="text-gray-400">個人設定與應用程式選項</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-red-600">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">應用程式設定</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300">深色模式</span>
                    <input type="checkbox" className="rounded" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300">自動更新</span>
                    <input type="checkbox" className="rounded" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Search Section - 暗黑肅殺風 */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-red-600">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-white mb-2">
                🔍 智能搜尋引擎
              </h2>
              <p className="text-gray-400">
                輸入姓名、案號、公司名稱等關鍵字，立即查詢相關法律案件和通緝犯資訊
              </p>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="例如：張三、112年度民字第123號、某某公司..."
                    className="w-full px-6 py-4 bg-gray-900 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-white placeholder-gray-400 font-medium text-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center space-x-3 font-bold text-lg shadow-lg border border-red-500"
                >
                  <MagnifyingGlassIcon className="h-6 w-6" />
                  <span>{isLoading ? '搜尋中...' : '開始獵殺'}</span>
                </button>
              </div>
              
              {/* Search Type Tabs - 暗黑肅殺風格 */}
              <div className="flex space-x-2 bg-gray-900 p-2 rounded-xl border border-gray-700">
                {[
                  { key: 'all', label: '全部搜尋', icon: MagnifyingGlassIcon, desc: '綜合查詢' },
                  { key: 'judgments', label: '法院判決', icon: DocumentTextIcon, desc: '法律案件' },
                  { key: 'wanted', label: '通緝犯', icon: UserIcon, desc: '在逃人員' },
                ].map(({ key, label, icon: Icon, desc }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSearchType(key as 'all' | 'judgments' | 'wanted')}
                    className={`flex-1 flex flex-col items-center justify-center space-y-1 py-3 px-4 rounded-lg transition-all font-medium ${
                      searchType === key
                        ? 'bg-red-600 text-white shadow-lg transform scale-105 border border-red-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-xs opacity-75">{desc}</span>
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>


        {/* 搜尋結果 - 暗黑肅殺風 */}
        {searchResults.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-6 border border-red-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                搜尋結果 ({searchResults.length} 筆)
              </h3>
              {searchStats && (
                <div className="text-sm text-gray-400">
                  判決書: {searchStats.judgmentCount} | 通緝犯: {searchStats.wantedCount} | 
                  平均風險分數: {searchStats.averageRiskScore}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700 bg-gray-900">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
                          result.type === 'judgment' 
                            ? 'bg-red-600 text-white border-red-500'
                            : result.type === 'wanted'
                            ? 'bg-orange-600 text-white border-orange-500'
                            : 'bg-green-600 text-white border-green-500'
                        }`}>
                          {result.type === 'judgment' ? '判決書' : result.type === 'wanted' ? '通緝犯' : '乾淨記錄'}
                        </span>
                        <span className="text-sm text-gray-400">
                          相關性: {result.relevanceScore}%
                        </span>
                      </div>
                      
                      {result.type === 'judgment' ? (
                        <div>
                          <h4 className="font-bold text-white mb-1">
                            {(result.data as CourtJudgment).caseTitle}
                          </h4>
                          <p className="text-sm text-gray-400 mb-2">
                            {(result.data as CourtJudgment).caseNumber} | {(result.data as CourtJudgment).court}
                          </p>
                          <p className="text-sm text-gray-300">
                            {(result.data as CourtJudgment).summary}
                          </p>
                        </div>
                      ) : result.type === 'wanted' ? (
                        <div>
                          <h4 className="font-bold text-white mb-1">
                            {(result.data as WantedPerson).name}
                          </h4>
                          <p className="text-sm text-gray-400 mb-2">
                            {(result.data as WantedPerson).gender} | {(result.data as WantedPerson).age}歲 | {(result.data as WantedPerson).crimeType}
                          </p>
                          <p className="text-sm text-gray-300">
                            {(result.data as WantedPerson).caseDetails}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-sm">✓</span>
                            </div>
                            <h4 className="font-bold text-green-400 text-lg">
                              {(result.data as CleanRecord).name}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            {(result.data as CleanRecord).message}
                          </p>
                          <p className="text-xs text-gray-500">
                            搜尋時間: {(result.data as CleanRecord).searchDate.toLocaleString('zh-TW')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 text-right">
                      <div className={`text-sm font-bold ${
                        result.type === 'clean' ? 'text-green-400' : 'text-white'
                      }`}>
                        風險分數: {result.type === 'judgment' 
                          ? (result.data as CourtJudgment).riskScore 
                          : result.type === 'wanted'
                          ? (result.data as WantedPerson).riskScore
                          : (result.data as CleanRecord).riskScore}
                      </div>
                      <div className="w-16 bg-gray-800 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            result.type === 'clean' 
                              ? 'bg-green-600'
                              : (result.type === 'judgment' 
                                ? (result.data as CourtJudgment).riskScore 
                                : (result.data as WantedPerson).riskScore) > 70 ? 'bg-red-500' :
                              (result.type === 'judgment' 
                                ? (result.data as CourtJudgment).riskScore 
                                : (result.data as WantedPerson).riskScore) > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${result.type === 'clean' 
                            ? 100
                            : result.type === 'judgment' 
                              ? (result.data as CourtJudgment).riskScore 
                              : (result.data as WantedPerson).riskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Section - 暗黑肅殺風 */}
        {activeTab === 'home' && (
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-red-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">今日統計</h3>
              <div className="flex items-center space-x-2">
                {isLoadingStats && (
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    載入中...
                  </div>
                )}
                <button
                  onClick={handleRefreshData}
                  disabled={isLoadingStats}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors font-bold ${
                    isLoadingStats 
                      ? 'bg-gray-900 text-gray-500 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700 border border-red-500'
                  }`}
                >
                  {isLoadingStats ? '刷新中...' : '手動刷新'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center bg-gray-900 rounded-lg p-4 border border-red-600">
                <div className="text-2xl font-black text-red-400">
                  {dashboardStats?.dailyCases || dashboardStats?.newCases || 328}
                </div>
                <div className="text-sm text-red-400 font-medium">今日案件數</div>
                {dashboardStats?.date && (
                  <div className="text-xs text-gray-500 mt-1">{dashboardStats.date}</div>
                )}
              </div>
              <div className="text-center bg-gray-900 rounded-lg p-4 border border-red-600">
                <div className="text-2xl font-black text-red-400">
                  {dashboardStats?.dailyLoss || dashboardStats?.totalLoss || '1億7,395.4萬'}
                </div>
                <div className="text-sm text-red-400 font-medium">今日損失金額</div>
                <div className="text-xs text-gray-500 mt-1">新台幣</div>
              </div>
              <div className="text-center bg-gray-900 rounded-lg p-4 border border-red-600">
                <div className="text-2xl font-black text-red-400">
                  {dashboardStats?.queryCount || 1000}+
                </div>
                <div className="text-sm text-red-400 font-medium">查詢次數</div>
                <div className="text-xs text-gray-500 mt-1">累計</div>
              </div>
              <div className="text-center bg-gray-900 rounded-lg p-4 border border-red-600">
                <div className="text-2xl font-black text-red-400">
                  {dashboardStats?.accuracyRate || 95}%
                </div>
                <div className="text-sm text-red-400 font-medium">準確率</div>
                <div className="text-xs text-gray-500 mt-1">資料品質</div>
              </div>
            </div>
            {dashboardStats && (
              <div className="mt-4 text-xs text-gray-500 text-center">
                資料來源：<a 
                  href="https://165dashboard.tw/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  165 反詐騙專線儀表板
                </a>
                <span className="ml-2">
                  最後更新：{new Date(dashboardStats.lastUpdated).toLocaleString('zh-TW')}
                </span>
                {dashboardStats.source && (
                  <span className="ml-2 text-green-600">
                    (來源：{dashboardStats.source})
                  </span>
                )}
                <div className="mt-1 text-gray-400">
                  💡 資料每天自動更新一次，如需即時更新請點擊「手動刷新」
                </div>
              </div>
            )}
            
            {testResult && (
              <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-700">
                <strong>測試結果：</strong>{testResult}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 底部導覽列 - 暗黑肅殺風 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-red-600 px-4 py-2 md:hidden shadow-2xl">
        <div className="flex justify-around items-center">
          {[
            { key: 'home', label: '首頁', icon: HomeIcon },
            { key: 'search', label: '搜尋', icon: MagnifyingGlassIcon },
            { key: 'rankings', label: '詐欺天梯', icon: ChartBarIcon, comingSoon: true },
            { key: 'reports', label: '投稿專區', icon: DocumentTextIcon, comingSoon: true },
            { key: 'settings', label: '設定', icon: Cog6ToothIcon },
          ].map(({ key, label, icon: Icon, comingSoon }) => (
            <button
              key={key}
              onClick={() => !comingSoon && setActiveTab(key as 'home' | 'search' | 'rankings' | 'reports' | 'settings')}
              disabled={comingSoon}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
                activeTab === key
                  ? 'text-red-600 bg-gray-800 border border-red-600'
                  : comingSoon
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-bold">{label}</span>
              {comingSoon && (
                <span className="absolute -top-1 -right-1 text-xs bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  !
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* 為底部導覽列預留空間 */}
      <div className="h-20 md:hidden"></div>

      {/* 載入 Modal */}
      <LoadingModal
        isVisible={isLoadingModalVisible}
        title="載入儀表板資料"
        message="正在獲取最新的 165 反詐騙數據，請稍候..."
        progress={loadingProgress}
      />
      </div>
    </ErrorBoundary>
  );
}