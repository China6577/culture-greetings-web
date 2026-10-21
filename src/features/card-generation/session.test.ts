import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearGenerationSession,
  clearLegacyDrafts,
  defaultGenerationDraft,
  loadGenerationSession,
  saveGenerationSession,
} from './session'
afterEach(() => {
  clearGenerationSession()
  vi.unstubAllGlobals()
})
describe('generation handoff and old-card removal', () => {
  it('keeps only a temporary handoff without persisting drafts', () => {
    const session = {
      draft: { ...defaultGenerationDraft, prompt: '生日', recipient: '朋友', sender: '我' },
      context: { country_code: 'CN' as const, locale: 'zh-CN' as const },
      composition_request_id: 'stable_generation_request_12345',
    }
    saveGenerationSession(session)
    expect(loadGenerationSession()).toBe(session)
    clearGenerationSession()
    expect(loadGenerationSession()).toBeNull()
  })
  it('clears every previous card and draft while preserving country preferences', () => {
    for (const name of ['localStorage', 'sessionStorage']) {
      const data = new Map(
        Object.entries({
          'kinship:preferences': 'CN',
          'kinship:card:old': 'private',
          'kinship:draft': 'private',
        }),
      )
      vi.stubGlobal(name, {
        get length() {
          return data.size
        },
        key: (index: number) => [...data.keys()][index] ?? null,
        removeItem: (key: string) => data.delete(key),
        data,
      })
    }
    clearLegacyDrafts()
    for (const storage of [localStorage, sessionStorage])
      expect(
        Object.fromEntries((storage as unknown as { data: Map<string, string> }).data),
      ).toEqual({ 'kinship:preferences': 'CN' })
  })
})
