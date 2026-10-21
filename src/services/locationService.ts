import type { Language } from '../themes/types'
export interface LocationResult {
  country: string
  language: Language
  source: 'browser'
}
export async function getLocation(): Promise<LocationResult> {
  const locale = typeof navigator === 'undefined' ? 'zh-CN' : navigator.language
  if (locale.startsWith('ja')) return { country: 'JP', language: 'ja-JP', source: 'browser' }
  if (locale.startsWith('fr')) return { country: 'FR', language: 'fr-FR', source: 'browser' }
  if (locale.startsWith('zh')) return { country: 'CN', language: 'zh-CN', source: 'browser' }
  if (locale.toLowerCase() === 'en-gb')
    return { country: 'GB', language: 'en-GB', source: 'browser' }
  return { country: 'GLOBAL', language: 'en-US', source: 'browser' }
}
