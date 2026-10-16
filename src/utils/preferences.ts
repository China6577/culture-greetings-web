import { countryCodes, type CountryCode } from '../themes/types'

export interface Preferences {
  country: CountryCode
  motion: boolean
}

// Legacy independent theme/language overrides are deliberately discarded.
export function restorePreferences(value: unknown): Preferences | null {
  if (!value || typeof value !== 'object' || !('country' in value)) return null
  if (!countryCodes.includes(value.country as CountryCode)) return null
  return {
    country: value.country as CountryCode,
    motion: !('motion' in value) || value.motion !== false,
  }
}
