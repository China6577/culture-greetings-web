import type { Composition, GenerationSession, GenerationJob } from '../types/card'
import { agentRoles } from '../types/card'
import { countryCodes } from '../themes/types'
import { themes } from '../themes'
import { isAnimationPlan } from '../features/card-animation/plan'
export class ApiError extends Error {
  constructor(
    public code: string,
    public status = 0,
  ) {
    super(code)
    this.name = 'ApiError'
  }
}
async function responseJson(response: Response): Promise<unknown> {
  let value: unknown
  try {
    value = await response.json()
  } catch {
    throw new ApiError('invalid_response', response.status)
  }
  if (!response.ok)
    throw new ApiError(
      (value as { error?: { code?: string } })?.error?.code ?? 'request_failed',
      response.status,
    )
  return value
}
export function isComposition(value: unknown): value is Composition {
  if (!value || typeof value !== 'object') return false
  const card = value as Composition
  return (
    card.version === 3 &&
    typeof card.id === 'string' &&
    /^[A-Za-z0-9_-]{20,64}$/.test(card.id) &&
    countryCodes.includes(card.country_code) &&
    themes[card.country_code].language === card.locale &&
    typeof card.recipient === 'string' &&
    card.recipient.length > 0 &&
    card.recipient.length <= 60 &&
    typeof card.sender === 'string' &&
    card.sender.length > 0 &&
    card.sender.length <= 60 &&
    typeof card.title === 'string' &&
    card.title.length <= 80 &&
    typeof card.custom_message === 'string' &&
    card.custom_message.length <= 500 &&
    card.image_model === 'agnes-image-2.5-flash' &&
    card.text_model === 'agnes-2.5-flash' &&
    card.image_url === `/api/assets/${card.id}.png` &&
    ['static', 'h5'].includes(card.mode) &&
    ['paper', 'ink', 'accent'].every((key) =>
      /^#[0-9a-fA-F]{6}$/.test(card.visual?.[key as 'paper'] ?? ''),
    ) &&
    ['left', 'center'].includes(card.visual?.alignment) &&
    (card.animation == null || isAnimationPlan(card.animation)) &&
    typeof card.created_at === 'string' &&
    Number.isFinite(Date.parse(card.created_at))
  )
}
export function generationJob(value: unknown): GenerationJob {
  const job = value as GenerationJob
  if (
    !job ||
    typeof job.id !== 'string' ||
    !/^[A-Za-z0-9_-]{20,64}$/.test(job.id) ||
    !['queued', 'running', 'complete', 'failed'].includes(job.status) ||
    !Array.isArray(job.events) ||
    job.events.some(
      (event) =>
        !agentRoles.includes(event.agent) || !['running', 'complete'].includes(event.status),
    ) ||
    (job.card !== null && !isComposition(job.card)) ||
    (job.status === 'complete' && !job.card)
  )
    throw new ApiError('invalid_response')
  return job
}
export async function startGeneration(session: GenerationSession, signal: AbortSignal) {
  const value = await responseJson(
    await fetch('/api/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...session.draft,
        ...session.context,
        request_id: session.composition_request_id,
      }),
      signal,
    }),
  )
  const job = generationJob(value)
  if (job.status === 'complete') invalidateSavedCards()
  return job
}
export async function fetchGeneration(id: string, signal: AbortSignal) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id)) throw new ApiError('card_not_found', 404)
  const job = generationJob(await responseJson(await fetch(`/api/generations/${id}`, { signal })))
  if (job.status === 'complete') invalidateSavedCards()
  return job
}
export async function fetchComposition(id: string, signal: AbortSignal): Promise<Composition> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id)) throw new ApiError('card_not_found', 404)
  const value = await responseJson(await fetch(`/api/cards/${id}`, { signal }))
  if (!isComposition(value)) throw new ApiError('invalid_response')
  return value
}
export interface SavedCardsPage {
  items: Composition[]
  total: number
  page: number
  page_size: number
}
// Keep only recent list responses in memory; never persist cards or drafts in browser storage.
const savedPages = new Map<number, SavedCardsPage>()
let savedPagesVersion = 0
export function cachedSavedCards(page: number) {
  return savedPages.get(page)
}
export function invalidateSavedCards() {
  savedPages.clear()
  savedPagesVersion += 1
}
export function savedCardsPage(value: unknown): SavedCardsPage {
  const result = value as SavedCardsPage
  if (
    !result ||
    !Array.isArray(result.items) ||
    !result.items.every(isComposition) ||
    !Number.isSafeInteger(result.total) ||
    result.total < result.items.length ||
    !Number.isSafeInteger(result.page) ||
    result.page < 1 ||
    !Number.isSafeInteger(result.page_size) ||
    result.page_size < 1 ||
    result.page_size > 50 ||
    result.items.length > result.page_size ||
    new Set(result.items.map((card) => card.id)).size !== result.items.length
  )
    throw new ApiError('invalid_response')
  return result
}
export async function fetchSavedCards(page: number, signal: AbortSignal) {
  const version = savedPagesVersion
  const result = savedCardsPage(
    await responseJson(await fetch(`/api/cards?page=${page}&page_size=12`, { signal })),
  )
  if (result.page !== page) throw new ApiError('invalid_response')
  if (!signal.aborted && version === savedPagesVersion) {
    savedPages.delete(page)
    savedPages.set(page, result)
    if (savedPages.size > 5) savedPages.delete(savedPages.keys().next().value!)
  }
  return result
}
export async function deleteSavedCard(id: string, signal: AbortSignal) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id)) throw new ApiError('card_not_found', 404)
  const response = await fetch(`/api/cards/${id}`, { method: 'DELETE', signal })
  if (response.ok || response.status === 404) invalidateSavedCards()
  if (!response.ok) await responseJson(response)
}
export async function deleteSavedCards(ids: string[], signal: AbortSignal) {
  if (
    ids.length === 0 ||
    ids.length > 100 ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !/^[A-Za-z0-9_-]{20,64}$/.test(id))
  )
    throw new ApiError('validation_error')
  const response = await fetch('/api/cards/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
    signal,
  })
  if (!response.ok) await responseJson(response)
  invalidateSavedCards()
}
