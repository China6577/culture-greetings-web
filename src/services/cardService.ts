import { countryCodes, languages, type CountryCode, type Language } from '../themes/types'
import { readStorage, writeStorage } from '../utils/storage'
import { themes } from '../themes'
export const occasions = ['birthday', 'festival', 'thanks', 'celebration'] as const
export type Occasion = (typeof occasions)[number]
export interface Draft {
  recipient: string
  sender: string
  message: string
  occasion: Occasion
}
export interface Card extends Draft {
  id: string
  country: CountryCode
  language: Language
  createdAt: string
  version: 1
}
export const emptyDraft: Draft = { recipient: '', sender: '', message: '', occasion: 'birthday' }
export function isDraft(value: unknown): value is Draft {
  if (!value || typeof value !== 'object') return false
  const draft = value as Draft
  return (
    typeof draft.recipient === 'string' &&
    draft.recipient.length <= 60 &&
    typeof draft.sender === 'string' &&
    draft.sender.length <= 60 &&
    typeof draft.message === 'string' &&
    draft.message.length <= 500 &&
    occasions.includes(draft.occasion)
  )
}
export function isCard(value: unknown): value is Card {
  if (!isDraft(value)) return false
  const card = value as Card
  return (
    card.version === 1 &&
    typeof card.id === 'string' &&
    /^[\w-]{1,64}$/.test(card.id) &&
    countryCodes.includes(card.country) &&
    languages.includes(card.language) &&
    typeof card.createdAt === 'string' &&
    Number.isFinite(Date.parse(card.createdAt))
  )
}
export function loadDraft(): Draft {
  const draft = readStorage('kinship:draft', null)
  return isDraft(draft) ? draft : emptyDraft
}
// An adapter boundary for the next phase; the current implementation only prepares a local preview.
export function createPreview(draft: Draft, country: CountryCode): Card {
  if (!isDraft(draft) || !draft.recipient.trim() || !draft.sender.trim() || !draft.message.trim())
    throw new Error('Invalid draft')
  return {
    ...draft,
    id: crypto.randomUUID(),
    country,
    language: themes[country].language,
    createdAt: new Date().toISOString(),
    version: 1,
  }
}
export function saveCard(card: Card) {
  return writeStorage(`kinship:card:${card.id}`, card)
}
export function loadCard(id: string): Card | null {
  const card = readStorage<unknown>(`kinship:card:${id}`, null)
  return isCard(card) ? { ...card, language: themes[card.country].language } : null
}
export function encodeCard(card: Card): string {
  const bytes = new TextEncoder().encode(JSON.stringify(card))
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}
export function decodeCard(encoded: string | null): Card | null {
  if (!encoded || encoded.length > 12000) return null
  try {
    const binary = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'))
    const value: unknown = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))),
    )
    return isCard(value) ? { ...value, language: themes[value.country].language } : null
  } catch {
    return null
  }
}
export function cardLink(card: Card) {
  return `${window.location.origin}/card/${card.id}?d=${encodeCard(card)}`
}
