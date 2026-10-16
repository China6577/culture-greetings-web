import { serif, sans, type CultureTheme } from '../types'
export default {
  id: 'uk',
  country: 'GB',
  language: 'en-GB',
  name: 'United Kingdom',
  nativeName: 'United Kingdom',
  greeting: 'A little note, with warmest wishes.',
  style: 'British Classic',
  caption: 'Thoughtful words, beautifully delivered.',
  colors: {
    primary: '#064E3B',
    secondary: '#7F1D1D',
    background: '#f3f1e7',
    ink: '#263e35',
    accent: '#064E3B',
    surface: '#fffdf4',
  },
  typography: { heading: serif, body: sans },
  assets: { background: '/art/uk.svg', decorations: ['stamp', 'letter', 'tea'] },
  animation: { entrance: 'letter', ambient: 'handwriting' },
  culture: {
    symbols: ['Postage stamps', 'Afternoon tea', 'Historic gardens'],
    festivals: ['Christmas', 'Bonfire Night'],
  },
} satisfies CultureTheme
