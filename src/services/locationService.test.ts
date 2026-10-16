import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLocation } from './locationService'
afterEach(() => vi.unstubAllGlobals())
describe('Location adapter', () => {
  it('recognises the explicitly marked mock response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ country: 'CN', language: 'zh-CN', source: 'mock' }),
      }),
    )
    expect(await getLocation()).toEqual({ country: 'CN', language: 'zh-CN', source: 'mock' })
  })
  it('fails safely on network, HTTP and invalid JSON responses', async () => {
    for (const result of [
      Promise.reject(new Error('offline')),
      Promise.resolve({ ok: false }),
      Promise.resolve({ ok: true, json: async () => '<html>' }),
    ]) {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(result))
      expect(await getLocation()).toEqual({
        country: 'GLOBAL',
        language: 'en-US',
        source: 'fallback',
      })
    }
  })
  it('uses a supported language if the remote response has an invalid locale', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ country: 'DE', language: 'de-DE' }) }),
    )
    expect(await getLocation()).toEqual({ country: 'DE', language: 'en-US', source: 'remote' })
  })
})
