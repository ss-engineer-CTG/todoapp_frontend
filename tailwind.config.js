/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // プライマリカラー
          primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554',
          },
        },
        // タスクステータス用の色
        backgroundColor: {
          'status-delayed': '#FECACA',
          'status-active': '#BFDBFE',
          'status-future': '#A7F3D0',
          'status-completed': '#E5E7EB',
        },
        borderColor: {
          'status-delayed': '#EF4444',
          'status-active': '#3B82F6',
          'status-future': '#10B981',
          'status-completed': '#9CA3AF',
        },
        textColor: {
          'status-delayed': '#B91C1C',
          'status-active': '#1E40AF',
          'status-future': '#047857',
          'status-completed': '#4B5563',
        },
        // スペーシング
        spacing: {
          'task-row': '40px',
          'task-bar': '36px',
          'timeline-label-width': '200px',
        },
        // アニメーション
        animation: {
          'fade-in': 'fadeIn 0.2s ease-in-out',
          'slide-up': 'slideUp 0.2s ease-in-out',
          'slide-down': 'slideDown 0.2s ease-in-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideUp: {
            '0%': { transform: 'translateY(10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          slideDown: {
            '0%': { transform: 'translateY(-10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
        },
        // Z-index
        zIndex: {
          'timeline-header': '10',
          'timeline-labels': '20',
          'timeline-item': '5',
          'timeline-item-selected': '10',
          'timeline-popover': '30',
          'modal': '50',
        },
        // カーソル
        cursor: {
          'e-resize': 'e-resize',
          'w-resize': 'w-resize',
          'ew-resize': 'ew-resize',
        },
      },
    },
    plugins: [],
  };