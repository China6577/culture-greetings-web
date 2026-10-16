import { languages, type Language } from '../themes/types'
export interface LocationResult {
  country: string
  language: Language
  source: 'mock' | 'remote' | 'fallback'
}
export async function getLocation(signal?: AbortSignal): Promise<LocationResult> {
  try {
    const response = await fetch('/api/location', {
      signal: AbortSignal.any([AbortSignal.timeout(3500), ...(signal ? [signal] : [])]),
    })
    if (!response.ok) throw new Error('Location unavailable')
    const data: unknown = await response.json()
    if (
      !data ||
      typeof data !== 'object' ||
      !('country' in data) ||
      typeof data.country !== 'string'
    )
      throw new Error('Invalid location')
    const language =
      'language' in data && languages.includes(data.language as Language)
        ? (data.language as Language)
        : 'en-US'
    return {
      country: data.country,
      language,
      source: 'source' in data && data.source === 'mock' ? 'mock' : 'remote',
    }
  } catch {
    return { country: 'GLOBAL', language: 'en-US', source: 'fallback' }
  }
}
