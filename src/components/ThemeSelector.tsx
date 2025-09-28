'use client';

import { useTheme, Theme } from '@/contexts/ThemeContext';

const themeOptions = [
  { key: 'dark' as Theme, name: '暗黑肅殺風', description: '血紅 + 深黑，肅殺冷酷', emoji: '🖤' },
  { key: 'steel' as Theme, name: '鋼鐵冷酷風', description: '青藍 + 鋼鐵灰，專業冷靜', emoji: '🔧' },
  { key: 'pink' as Theme, name: '粉嫩少女風', description: '粉紅 + 玫瑰，可愛溫柔', emoji: '💕' },
];

export default function ThemeSelector() {
  const { theme, setTheme, themeConfig } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-bold text-${themeConfig.colors.text} mb-2`}>
          🎨 主題設定
        </h3>
        <p className={`text-sm text-${themeConfig.colors.textSecondary}`}>
          選擇您喜歡的視覺風格，系統會自動套用到整個應用程式
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {themeOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setTheme(option.key)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              theme === option.key
                ? `border-${themeConfig.colors.primary} bg-${themeConfig.colors.surface} shadow-lg`
                : `border-${themeConfig.colors.border} bg-${themeConfig.colors.background} hover:border-${themeConfig.colors.primary} hover:bg-${themeConfig.colors.surface}`
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-2xl">{option.emoji}</div>
              <div className="flex-1">
                <div className={`font-bold text-${themeConfig.colors.text}`}>
                  {option.name}
                </div>
                <div className={`text-sm text-${themeConfig.colors.textSecondary}`}>
                  {option.description}
                </div>
              </div>
              {theme === option.key && (
                <div className={`w-6 h-6 rounded-full bg-${themeConfig.colors.primary} flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className={`p-4 bg-${themeConfig.colors.surface} rounded-xl border border-${themeConfig.colors.border}`}>
        <div className={`text-sm text-${themeConfig.colors.textSecondary}`}>
          💡 <strong className={`text-${themeConfig.colors.text}`}>提示：</strong>
          主題設定會自動保存，下次開啟應用程式時會記住您的選擇。
        </div>
      </div>
    </div>
  );
}
