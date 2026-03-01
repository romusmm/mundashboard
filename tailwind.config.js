/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#F2F2F7',
        card: '#FFFFFF',
        accent: '#007AFF',
        'accent-hover': '#0062CC',
        tprimary: '#1C1C1E',
        tsecondary: '#6E6E73',
        ttertiary: '#AEAEB2',
      },
      fontFamily: {
        ui: ['Figtree', 'sans-serif'],
        number: ['Lora', 'serif'],
      },
      boxShadow: {
        soft: '0 8px 32px rgba(20, 20, 30, 0.08)',
      },
    },
  },
  plugins: [],
};
