import { sans, type CultureTheme } from '../types'
export default {
  id: 'japan',
  country: 'JP',
  language: 'ja-JP',
  name: 'Japan',
  nativeName: '日本',
  greeting: '心を込めて、あなたへ。',
  style: 'Japanese Minimal',
  caption: 'A little moment, a lasting feeling.',
  colors: {
    primary: '#F3B7C6',
    secondary: '#FFFFFF',
    background: '#F8F2E8',
    ink: '#383a36',
    accent: '#854557',
    surface: '#fffaf4',
  },
  typography: { heading: '"Yu Mincho", "Hiragino Mincho ProN", serif', body: sans },
  assets: { background: '/art/japan.svg', decorations: ['sakura', 'fuji', 'washi'] },
  animation: { entrance: 'unfold', ambient: 'petals' },
  culture: {
    symbols: ['桜 · Sakura', '富士山 · Mount Fuji', '和紙 · Washi'],
    festivals: ['花見 · Hanami', '七夕 · Tanabata'],
  },
} satisfies CultureTheme
