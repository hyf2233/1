/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wechat: {
          green: '#07C160',
          'green-dark': '#06AD56',
          'green-light': '#E8F8EF',
          bg: '#EDEDED',
          'bg-dark': '#E0E0E0',
          card: '#FFFFFF',
          text: '#191919',
          'text-secondary': '#576B95',
          'text-gray': '#999999',
          'text-light': '#B0B0B0',
          divider: '#E5E5E5',
          bubble: '#95EC69',
          'bubble-other': '#FFFFFF',
          danger: '#FA5151',
          warning: '#FFC300',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', '"SimSun"', 'serif'],
      },
      fontSize: {
        'title': ['24px', { fontWeight: '700', letterSpacing: '-0.3px' }],
        'subtitle': ['16px', { fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.6' }],
        'caption': ['12px', {}],
        'small': ['11px', {}],
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        slideUp: { from: { transform: 'translateY(100%)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { from: { transform: 'translateY(0)', opacity: '1' }, to: { transform: 'translateY(100%)', opacity: '0' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        typing: { '0%, 100%': { opacity: '0.2' }, '50%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
};
