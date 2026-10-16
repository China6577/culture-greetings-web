import china from './china/config'
import japan from './japan/config'
import usa from './usa/config'
import uk from './uk/config'
import france from './france/config'
import global from './global/config'
import type { CountryCode, CultureTheme } from './types'
export const themes: Record<CountryCode, CultureTheme> = {
  CN: china,
  JP: japan,
  US: usa,
  GB: uk,
  FR: france,
  GLOBAL: global,
}
export const cultureThemes = Object.values(themes)
export function resolveTheme(country: string): CultureTheme {
  return themes[country.toUpperCase() as CountryCode] ?? global
}
