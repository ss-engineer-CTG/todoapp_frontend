import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // ローカルストレージから初期テーマを取得またはシステム設定に基づいて決定
  const getInitialTheme = (): Theme => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // システムのカラースキーム設定を確認
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };
  
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  
  // テーマを切り替える
  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  // テーマを直接設定
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  // テーマが変更されたら、DOC要素のクラスとローカルストレージを更新
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // システムのカラースキーム設定が変更されたときの処理
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // ユーザーが明示的にテーマを設定していなければ、システム設定に合わせる
      if (!localStorage.getItem('theme')) {
        setThemeState(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  const value = {
    theme,
    toggleTheme,
    setTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};