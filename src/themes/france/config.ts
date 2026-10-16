import { serif, sans, type CultureTheme } from '../types'
export default {
  id: 'france',
  country: 'FR',
  language: 'fr-FR',
  name: 'France',
  nativeName: 'France',
  greeting: 'Les petits mots font les grands bonheurs.',
  style: 'French Artistic',
  caption: 'Pour les moments qui comptent.',
  colors: {
    primary: '#D4AF37',
    secondary: '#F5E6D3',
    background: '#FFF9F3',
    ink: '#40352e',
    accent: '#786021',
    surface: '#fffdf9',
  },
  typography: { heading: serif, body: sans },
  assets: { background: '/art/france.svg', decorations: ['flower', 'paris', 'line-art'] },
  animation: { entrance: 'draw', ambient: 'light' },
  culture: {
    symbols: ['Parisian architecture', 'Floral illustration', 'Atelier art'],
    festivals: ['Fête de la Musique', 'Bastille Day'],
  },
} satisfies CultureTheme
