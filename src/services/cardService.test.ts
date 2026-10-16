import { describe, expect, it } from 'vitest'
import { createPreview, decodeCard, encodeCard, isCard, isDraft } from './cardService'
import { resolveTheme } from '../themes'
import zh from '../locales/zh-CN.json'
import ja from '../locales/ja-JP.json'
import us from '../locales/en-US.json'
import gb from '../locales/en-GB.json'
import fr from '../locales/fr-FR.json'
const draft = {
  recipient: '小林 🌸',
  sender: 'Élodie',
  message: '祝你生日快乐！\nお誕生日おめでとう。\nAvec toute mon affection.',
  occasion: 'birthday' as const,
}
describe('Shareable local cards', () => {
  it('round-trips multilingual messages without changing the original text', () => {
    const card = createPreview(draft, 'JP')
    expect(decodeCard(encodeCard(card))).toEqual(card)
  })
  it('rejects corrupt, oversized and incompatible shared data', () => {
    expect(decodeCard('this-is-not-a-card')).toBeNull()
    expect(decodeCard('a'.repeat(12001))).toBeNull()
    expect(isCard({ ...createPreview(draft, 'CN'), country: 'invalid' })).toBe(false)
    expect(isCard({ ...createPreview(draft, 'CN'), version: 2 })).toBe(false)
  })
  it('rejects invalid draft input and preserves HTML as text', () => {
    expect(() => createPreview({ ...draft, message: ' ' }, 'CN')).toThrow()
    expect(isDraft({ ...draft, message: 'a'.repeat(501) })).toBe(false)
    expect(isDraft({ ...draft, occasion: 'unsupported' })).toBe(false)
    const card = createPreview({ ...draft, message: '<script>alert(1)</script>' }, 'CN')
    expect(decodeCard(encodeCard(card))?.message).toBe('<script>alert(1)</script>')
  })
})
describe('Country-locked card language', () => {
  it('derives the card language and normalizes legacy mismatched share data', () => {
    const card = createPreview(draft, 'JP')
    expect(card.language).toBe('ja-JP')
    expect(decodeCard(encodeCard({ ...card, language: 'fr-FR' }))?.language).toBe('ja-JP')
  })
})

describe('Culture and translation registry', () => {
  it('maps supported country codes and safely falls back for unsupported regions', () => {
    expect(resolveTheme('jp').country).toBe('JP')
    expect(resolveTheme('GB').language).toBe('en-GB')
    expect(resolveTheme('DE').country).toBe('GLOBAL')
    expect(resolveTheme('')).toMatchObject({ country: 'GLOBAL', language: 'en-US' })
  })
  it('provides identical, non-empty translation keys for all five locales', () => {
    for (const locale of [zh, ja, gb, fr]) {
      expect(Object.keys(locale).sort()).toEqual(Object.keys(us).sort())
      expect(Object.values(locale).every((value) => value.trim().length > 0)).toBe(true)
    }
  })
})
