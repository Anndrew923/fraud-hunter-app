import { Theme } from '@/contexts/ThemeContext';

// 預定義的類名映射，避免動態類名問題
const themeClassMaps: Record<Theme, Record<string, string>> = {
  dark: {
    background: 'bg-gray-900',
    surface: 'bg-gray-800',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    primary: 'text-red-600',
    border: 'border-red-600',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-red-700',
    button: 'bg-red-600 hover:bg-red-700',
    input: 'bg-gray-800 border-red-600 text-white placeholder-gray-400',
    card: 'bg-gray-800 border border-red-600',
    nav: 'bg-gray-800 border-t border-red-600',
    navItem: 'text-gray-400 hover:text-white',
    navItemActive: 'text-red-600 bg-gray-800',
  },
  steel: {
    background: 'bg-slate-900',
    surface: 'bg-slate-800',
    text: 'text-white',
    textSecondary: 'text-slate-400',
    primary: 'text-cyan-400',
    border: 'border-cyan-500',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600',
    button: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700',
    input: 'bg-slate-900 border-cyan-500 text-white placeholder-slate-400',
    card: 'bg-slate-800 border border-cyan-500',
    nav: 'bg-slate-800 border-t border-cyan-500',
    navItem: 'text-slate-400 hover:text-white',
    navItemActive: 'text-cyan-400 bg-slate-800',
  },
  pink: {
    background: 'bg-pink-50',
    surface: 'bg-white',
    text: 'text-gray-800',
    textSecondary: 'text-pink-500',
    primary: 'text-pink-600',
    border: 'border-pink-300',
    gradientFrom: 'from-pink-400',
    gradientTo: 'to-rose-400',
    button: 'bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500',
    input: 'bg-pink-50 border-pink-300 text-gray-800 placeholder-pink-400',
    card: 'bg-white border border-pink-300',
    nav: 'bg-pink-100 border-t border-pink-300',
    navItem: 'text-pink-500 hover:text-pink-600',
    navItemActive: 'text-pink-600 bg-pink-200',
  },
};

export const getThemeClasses = (theme: Theme) => {
  return themeClassMaps[theme];
};

export const getThemeSpecificClasses = (theme: Theme, component: string) => {
  const baseClasses = getThemeClasses(theme);
  
  switch (component) {
    case 'header':
      return {
        ...baseClasses,
        container: `${baseClasses.surface} shadow-lg border-b ${baseClasses.border}`,
        icon: `bg-gradient-to-br ${baseClasses.gradientFrom} ${baseClasses.gradientTo} rounded-full`,
        title: baseClasses.primary,
        subtitle: baseClasses.textSecondary,
      };
    
    case 'hero':
      return {
        ...baseClasses,
        icon: `bg-gradient-to-br ${baseClasses.gradientFrom} ${baseClasses.gradientTo} rounded-full`,
        title: baseClasses.text,
        primaryText: baseClasses.primary,
        secondaryText: baseClasses.textSecondary,
        tag: `${baseClasses.surface} ${baseClasses.primary} rounded-full border ${baseClasses.border}`,
      };
    
    case 'search':
      return {
        ...baseClasses,
        container: `${baseClasses.surface} rounded-2xl shadow-xl p-8 border ${baseClasses.border}`,
        input: `${baseClasses.background} border-2 ${baseClasses.border} rounded-xl focus:ring-2 focus:ring-${baseClasses.primary.split('-')[1]}-500 focus:border-${baseClasses.primary.split('-')[1]}-500 ${baseClasses.text} placeholder-${baseClasses.textSecondary.split('-')[1]}-400 font-medium text-lg`,
        button: `bg-gradient-to-r ${baseClasses.gradientFrom} ${baseClasses.gradientTo} text-white rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center space-x-3 font-bold text-lg shadow-lg border ${baseClasses.border}`,
        tab: `${baseClasses.background} p-2 rounded-xl border ${baseClasses.border}`,
        tabActive: `bg-gradient-to-r ${baseClasses.gradientFrom} ${baseClasses.gradientTo} text-white shadow-lg transform scale-105 border ${baseClasses.border}`,
        tabInactive: `${baseClasses.textSecondary} hover:${baseClasses.text} hover:${baseClasses.surface} border border-transparent`,
      };
    
    case 'stats':
      return {
        ...baseClasses,
        container: `${baseClasses.surface} rounded-lg shadow-xl p-6 border ${baseClasses.border}`,
        card: `${baseClasses.background} rounded-lg p-4 border ${baseClasses.border}`,
        number: baseClasses.primary,
        label: baseClasses.primary,
        sublabel: baseClasses.textSecondary,
        button: `bg-gradient-to-r ${baseClasses.gradientFrom} ${baseClasses.gradientTo} text-white hover:opacity-90 border ${baseClasses.border}`,
        buttonDisabled: `${baseClasses.background} ${baseClasses.textSecondary} cursor-not-allowed`,
      };
    
    case 'results':
      return {
        ...baseClasses,
        container: `${baseClasses.surface} rounded-lg shadow-xl p-6 mb-6 border ${baseClasses.border}`,
        item: `border ${baseClasses.border} rounded-lg p-4 hover:${baseClasses.background} ${baseClasses.surface}`,
        badge: `${baseClasses.primary} text-white border ${baseClasses.border}`,
        title: baseClasses.text,
        subtitle: baseClasses.textSecondary,
        content: baseClasses.textSecondary,
      };
    
    case 'quickAction':
      return {
        ...baseClasses,
        container: `bg-gradient-to-r ${baseClasses.background} ${baseClasses.surface} rounded-2xl p-8 mb-12 border ${baseClasses.border}`,
        title: baseClasses.text,
        subtitle: baseClasses.textSecondary,
        card: `${baseClasses.surface} rounded-lg shadow-lg border ${baseClasses.border}`,
        cardTitle: baseClasses.primary,
        cardContent: baseClasses.textSecondary,
      };
    
    case 'nav':
      return {
        ...baseClasses,
        container: `fixed bottom-0 left-0 right-0 ${baseClasses.surface} border-t ${baseClasses.border} px-4 py-2 md:hidden shadow-xl`,
        item: `flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative`,
        itemActive: `${baseClasses.primary} ${baseClasses.background} border ${baseClasses.border}`,
        itemInactive: `${baseClasses.textSecondary} hover:${baseClasses.text} hover:${baseClasses.background}`,
        itemDisabled: `${baseClasses.textSecondary} cursor-not-allowed`,
        badge: `${baseClasses.primary} text-white rounded-full w-4 h-4 flex items-center justify-center font-bold`,
      };
    
    default:
      return baseClasses;
  }
};
