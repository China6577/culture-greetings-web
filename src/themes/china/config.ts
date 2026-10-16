import { serif, sans, type CultureTheme } from '../types'
export default {
  id: 'china',
  country: 'CN',
  language: 'zh-CN',
  name: 'China',
  nativeName: '中国',
  greeting: '山海有情，岁岁相伴',
  style: 'Traditional Chinese',
  caption: '山水之间，心意绵长。',
  colors: {
    primary: '#C8102E',
    secondary: '#FFD700',
    background: '#FFF7E6',
    ink: '#302d29',
    accent: '#a2112b',
    surface: '#fffcf5',
  },
  typography: { heading: serif, body: sans },
  assets: { background: '/art/china.svg', decorations: ['lantern', 'cloud', 'seal'] },
  animation: { entrance: 'ink', ambient: 'gold' },
  culture: {
    symbols: ['山水 · Landscape', '灯笼 · Lantern', '祥云 · Auspicious clouds'],
    festivals: ['春节 · Spring Festival', '中秋 · Mid-Autumn Festival'],
  },
} satisfies CultureTheme
