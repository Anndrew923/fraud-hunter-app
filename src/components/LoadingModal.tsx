'use client';

import { useEffect, useState } from 'react';

interface LoadingModalProps {
  isVisible: boolean;
  title?: string;
  message?: string;
  progress?: number;
}

export default function LoadingModal({ 
  isVisible, 
  title = "載入中...", 
  message = "正在獲取最新資料，請稍候",
  progress 
}: LoadingModalProps) {
  const [dots, setDots] = useState('');

  // 動畫效果：載入點點
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-red-600 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* 標題 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            {/* 旋轉的圓圈動畫 */}
            <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {title}{dots}
          </h3>
          <p className="text-gray-400 text-sm">
            {message}
          </p>
        </div>

        {/* 進度條 */}
        {progress !== undefined && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>進度</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 提示訊息 */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span>請勿關閉此視窗</span>
          </div>
        </div>
      </div>
    </div>
  );
}
