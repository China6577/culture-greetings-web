export const countryCodes = ['CN', 'JP', 'US', 'GB', 'FR', 'GLOBAL'] as const
export type CountryCode = (typeof countryCodes)[number]
export const languages = ['zh-CN', 'ja-JP', 'en-US', 'en-GB', 'fr-FR'] as const
export type Language = (typeof languages)[number]
export interface CultureTheme {
  id: string
  country: CountryCode
  language: Language
  name: string
  nativeName: string
  greeting: string
  style: string
  caption: string
  colors: {
    primary: string
    secondary: string
    background: string
    ink: string
    accent: string
    surface: string
  }
  typography: { heading: string; body: string }
  assets: { background: string; decorations: string[] }
  animation: { entrance: string; ambient: string }
  culture: { symbols: string[]; festivals: string[] }
}
export const serif =
  '"Iowan Old Style", "Palatino Linotype", "Noto Serif SC", "Songti SC", SimSun, serif'
export const sans = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
