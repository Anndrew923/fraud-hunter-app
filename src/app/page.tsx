'use client';

import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, UserIcon, ChartBarIcon, DocumentTextIcon, HomeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { CourtJudgment } from '@/lib/crawlers/courtCrawler';
import { WantedPerson } from '@/lib/crawlers/wantedCrawler';
import { DashboardStats, dashboardService } from '@/lib/services/dashboardService';

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
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'judgments' | 'wanted' | 'settings'>('home');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    
    try {
      // 初始化搜尋服務
      initializeSearchService();
      
      if (searchService) {
        // 執行搜尋
        const { results, stats } = await searchService.search(searchQuery, {
          includeJudgments: searchType === 'all' || searchType === 'judgments',
          includeWanted: searchType === 'all' || searchType === 'wanted'
        });
        
        // 更新狀態
        setSearchResults(results);
        setSearchStats(stats);
        addToSearchHistory(searchQuery, results, stats);
        
        console.log('搜尋完成:', { results: results.length, stats });
      }
    } catch (error) {
      console.error('搜尋失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 載入 165 儀表板資料
  useEffect(() => {
    const loadDashboardStats = async () => {
      if (activeTab === 'home') {
        setIsLoadingStats(true);
        try {
          const data = await dashboardService.getDashboardData();
          if (data.success) {
            setDashboardStats(data.stats);
          }
        } catch (error) {
          console.error('載入儀表板資料失敗:', error);
        } finally {
          setIsLoadingStats(false);
        }
      }
    };

    loadDashboardStats();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">詐騙獵人</h1>
              <span className="ml-2 text-sm text-gray-500">社會信用檔案管理平台</span>
            </div>
            <div className="flex items-center space-x-4">
              <UserIcon className="h-6 w-6 text-gray-400" />
              <span className="text-sm text-gray-700">登入</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 根據 activeTab 顯示不同內容 */}
        {activeTab === 'home' && (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                獵殺詐騙，無所遁形
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                透過合法途徑公開相關資訊，達到社會警示作用，促進誠信社會建設
              </p>
            </div>
          </>
        )}

        {activeTab === 'search' && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">搜尋功能</h2>
            <p className="text-gray-600 mb-8">輸入關鍵字進行搜尋</p>
          </div>
        )}

        {activeTab === 'judgments' && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">法院判決書查詢</h2>
            <p className="text-gray-600 mb-8">查詢司法院公開的判決書資料</p>
          </div>
        )}

        {activeTab === 'wanted' && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">通緝犯資料查詢</h2>
            <p className="text-gray-600 mb-8">查詢警政署公開的通緝犯資訊</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">設定</h2>
            <p className="text-gray-600 mb-8">個人設定與應用程式選項</p>
          </div>
        )}


        {/* Search Section - 在所有標籤中顯示 */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋姓名、案號或關鍵字..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span>{isLoading ? '搜尋中...' : '搜尋'}</span>
              </button>
            </div>
            
            {/* Search Type Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: 'all', label: '全部', icon: MagnifyingGlassIcon },
                { key: 'judgments', label: '判決書', icon: DocumentTextIcon },
                { key: 'wanted', label: '通緝犯', icon: UserIcon },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSearchType(key as 'all' | 'judgments' | 'wanted')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors font-medium ${
                    searchType === key
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Features Grid - 只在首頁顯示 */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-800">法院判決書查詢</h3>
              </div>
              <p className="text-gray-700 font-medium">
                查詢司法院公開的判決書資料，了解相關法律案件資訊
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <UserIcon className="h-8 w-8 text-red-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-800">通緝犯資料查詢</h3>
              </div>
              <p className="text-gray-700 font-medium">
                查詢警政署公開的通緝犯資訊，提高社會安全意識
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-800">風險評估分析</h3>
              </div>
              <p className="text-gray-700 font-medium">
                基於公開資料進行風險評估，提供客觀的信用分析
              </p>
            </div>
          </div>
        )}

        {/* 搜尋結果 */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                搜尋結果 ({searchResults.length} 筆)
              </h3>
              {searchStats && (
                <div className="text-sm text-gray-500">
                  判決書: {searchStats.judgmentCount} | 通緝犯: {searchStats.wantedCount} | 
                  平均風險分數: {searchStats.averageRiskScore}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          result.type === 'judgment' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.type === 'judgment' ? '判決書' : '通緝犯'}
                        </span>
                        <span className="text-sm text-gray-500">
                          相關性: {result.relevanceScore}%
                        </span>
                      </div>
                      
                      {result.type === 'judgment' ? (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {(result.data as CourtJudgment).caseTitle}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {(result.data as CourtJudgment).caseNumber} | {(result.data as CourtJudgment).court}
                          </p>
                          <p className="text-sm text-gray-700">
                            {(result.data as CourtJudgment).summary}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {(result.data as WantedPerson).name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {(result.data as WantedPerson).gender} | {(result.data as WantedPerson).age}歲 | {(result.data as WantedPerson).crimeType}
                          </p>
                          <p className="text-sm text-gray-700">
                            {(result.data as WantedPerson).caseDetails}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        風險分數: {result.type === 'judgment' 
                          ? (result.data as CourtJudgment).riskScore 
                          : (result.data as WantedPerson).riskScore}
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            (result.type === 'judgment' 
                              ? (result.data as CourtJudgment).riskScore 
                              : (result.data as WantedPerson).riskScore) > 70 ? 'bg-red-500' :
                            (result.type === 'judgment' 
                              ? (result.data as CourtJudgment).riskScore 
                              : (result.data as WantedPerson).riskScore) > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${result.type === 'judgment' 
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

        {/* Stats Section - 只在首頁顯示 */}
        {activeTab === 'home' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">今日統計</h3>
              {isLoadingStats && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  載入中...
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardStats?.newCases || 500}
                </div>
                <div className="text-sm text-gray-700 font-medium">新增案件</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {dashboardStats?.totalLoss || '2.5億'}
                </div>
                <div className="text-sm text-gray-700 font-medium">台幣損失</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {dashboardStats?.queryCount || 1000}+
                </div>
                <div className="text-sm text-gray-700 font-medium">查詢次數</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardStats?.accuracyRate || 95}%
                </div>
                <div className="text-sm text-gray-700 font-medium">準確率</div>
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
              </div>
            )}
          </div>
        )}
      </main>

      {/* 底部導覽列 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="flex justify-around items-center">
          {[
            { key: 'home', label: '首頁', icon: HomeIcon },
            { key: 'search', label: '搜尋', icon: MagnifyingGlassIcon },
            { key: 'judgments', label: '判決書', icon: DocumentTextIcon },
            { key: 'wanted', label: '通緝犯', icon: UserIcon },
            { key: 'settings', label: '設定', icon: Cog6ToothIcon },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'home' | 'search' | 'judgments' | 'wanted' | 'settings')}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === key
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 為底部導覽列預留空間 */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
}