import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ThemeProvider } from './context/ThemeContext';

// アプリケーションのルートノードを取得
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element with id "root" was not found in the document.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);