import { sans, type CultureTheme } from '../types'
export default {
  id: 'global',
  country: 'GLOBAL',
  language: 'en-US',
  name: 'Global',
  nativeName: 'Around the world',
  greeting: 'Good wishes speak every language.',
  style: 'Global Minimal',
  caption: 'A world of ways to say you care.',
  colors: {
    primary: '#356962',
    secondary: '#d6e7e1',
    background: '#f7f9f8',
    ink: '#233c37',
    accent: '#285c54',
    surface: '#ffffff',
  },
  typography: { heading: sans, body: sans },
  assets: { background: '/art/global.svg', decorations: ['globe', 'orbit'] },
  animation: { entrance: 'fade', ambient: 'orbit' },
  culture: {
    symbols: ['Connection', 'Shared moments', 'Personal expression'],
    festivals: ['Your own special occasion'],
  },
} satisfies CultureTheme
