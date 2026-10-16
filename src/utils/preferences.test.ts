import { describe, expect, it } from 'vitest'
import { restorePreferences } from './preferences'
import { countryCodes } from '../themes/types'
import { themes } from '../themes'

describe('Country-locked preferences', () => {
  it('discards legacy language and theme overrides while keeping country and motion', () => {
    expect(
      restorePreferences({ country: 'JP', language: 'fr-FR', theme: 'CN', motion: false }),
    ).toEqual({ country: 'JP', motion: false })
  })
  it('restores every supported country and rejects unknown or corrupted preferences', () => {
    for (const country of countryCodes)
      expect(restorePreferences({ country })).toEqual({ country, motion: true })
    for (const invalid of [null, 'JP', {}, { country: 'DE' }])
      expect(restorePreferences(invalid)).toBeNull()
  })
  it('has exactly one language for each country', () => {
    expect(Object.fromEntries(countryCodes.map((code) => [code, themes[code].language]))).toEqual({
      CN: 'zh-CN',
      JP: 'ja-JP',
      US: 'en-US',
      GB: 'en-GB',
      FR: 'fr-FR',
      GLOBAL: 'en-US',
    })
  })
})
