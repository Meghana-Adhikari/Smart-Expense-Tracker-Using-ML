/** Palette drawn from the product itself: ledger-green ink, rupee saffron, muted paper. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#12292E', soft: '#1C3A40', line: '#2C4E55' },
        paper: '#F1F4F0',
        leaf: { DEFAULT: '#1F7A6B', dark: '#175E52', tint: '#DDEDE8' },
        saffron: { DEFAULT: '#D99A12', tint: '#FBF0D2' },
        rose: { DEFAULT: '#B8405E', tint: '#F8E1E7' },
        slate2: '#5B6B6F',
      },
      fontFamily: { sans: ['"Schibsted Grotesk"', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 0 rgba(18,41,46,.06), 0 8px 24px -16px rgba(18,41,46,.25)' },
    },
  },
  plugins: [],
}
