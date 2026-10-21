import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLocation } from './locationService'
afterEach(() => vi.unstubAllGlobals())
describe('browser country suggestion', () => {
  it('uses local browser language without a simulated IP API', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    for (const [language, country] of [
      ['zh-CN', 'CN'],
      ['ja-JP', 'JP'],
      ['fr-FR', 'FR'],
      ['en-GB', 'GB'],
      ['de-DE', 'GLOBAL'],
    ]) {
      vi.stubGlobal('navigator', { language })
      expect((await getLocation()).country).toBe(country)
    }
    expect(fetch).not.toHaveBeenCalled()
  })
})
