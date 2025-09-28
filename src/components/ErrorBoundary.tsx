'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // 靜默記錄錯誤，避免控制台噪音
    console.error('ErrorBoundary 捕獲錯誤:', _error.message);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">發生錯誤</h2>
            <p className="text-gray-400 mb-6">應用程式遇到問題，請重新整理頁面</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              重新整理
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 預設錯誤頁面組件
export function DefaultErrorFallback({ error: _error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-4">載入錯誤</h2>
        <p className="text-gray-400 mb-6">
          儀表板資料載入失敗，請稍後再試
        </p>
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            重試
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            重新整理頁面
          </button>
        </div>
      </div>
    </div>
  );
}
