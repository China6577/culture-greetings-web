import { sans, type CultureTheme } from '../types'
export default {
  id: 'usa',
  country: 'US',
  language: 'en-US',
  name: 'United States',
  nativeName: 'United States',
  greeting: 'Here’s to your next great chapter.',
  style: 'Modern Celebration',
  caption: 'Big moments. Even bigger feelings.',
  colors: {
    primary: '#1E3A8A',
    secondary: '#DC2626',
    background: '#FFFFFF',
    ink: '#202d44',
    accent: '#1E3A8A',
    surface: '#f4f6fc',
  },
  typography: { heading: sans, body: sans },
  assets: { background: '/art/usa.svg', decorations: ['balloon', 'ribbon', 'confetti'] },
  animation: { entrance: 'celebrate', ambient: 'confetti' },
  culture: {
    symbols: ['Balloons', 'Confetti', 'Fireworks'],
    festivals: ['Thanksgiving', 'Independence Day'],
  },
} satisfies CultureTheme
