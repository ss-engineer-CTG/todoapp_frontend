/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD',
            400: '#60A5FA',
            500: '#3B82F6',
            600: '#2563EB',
            700: '#1D4ED8',
            800: '#1E40AF',
            900: '#1E3A8A',
            950: '#172554',
          },
          completed: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
          },
          overdue: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
          },
        },
        fontFamily: {
          sans: [
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'Helvetica Neue',
            'Arial',
            'Noto Sans',
            'sans-serif',
            'Apple Color Emoji',
            'Segoe UI Emoji',
            'Segoe UI Symbol',
            'Noto Color Emoji',
          ],
        },
        spacing: {
          '0.5': '0.125rem',
          '1.5': '0.375rem',
          '2.5': '0.625rem',
          '3.5': '0.875rem',
        },
        transitionProperty: {
          'height': 'height',
          'spacing': 'margin, padding',
        },
        zIndex: {
          '5': '5',
          '15': '15',
          '25': '25',
          '35': '35',
          '45': '45',
        },
        opacity: {
          '15': '0.15',
          '35': '0.35',
          '85': '0.85',
          '95': '0.95',
        },
        cursor: {
          'grab': 'grab',
          'grabbing': 'grabbing',
          'ew-resize': 'ew-resize',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideInFromRight: {
            '0%': { transform: 'translateX(100%)' },
            '100%': { transform: 'translateX(0)' },
          },
          slideInFromTop: {
            '0%': { transform: 'translateY(-100%)' },
            '100%': { transform: 'translateY(0)' },
          },
        },
        animation: {
          fadeIn: 'fadeIn 0.3s ease-in-out',
          slideInFromRight: 'slideInFromRight 0.3s ease-in-out',
          slideInFromTop: 'slideInFromTop 0.3s ease-in-out',
        },
      },
    },
    plugins: [],
  }