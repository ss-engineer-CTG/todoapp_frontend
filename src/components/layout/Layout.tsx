import React, { PropsWithChildren } from 'react';
import Header from './Header';

/**
 * メインレイアウトコンポーネント
 * ヘッダーと子コンポーネントを表示するための枠組みを提供
 */
const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 p-4">
        {children}
      </main>
      <footer className="py-4 px-6 bg-white border-t text-center text-gray-500 text-sm">
        © 2025 理想のToDoリスト
      </footer>
    </div>
  );
};

export default Layout;