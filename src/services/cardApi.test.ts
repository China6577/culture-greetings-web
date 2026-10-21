import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isComposition,
  savedCardsPage,
  generationJob,
  deleteSavedCards,
  deleteSavedCard,
  fetchSavedCards,
  cachedSavedCards,
  invalidateSavedCards,
  fetchGeneration,
} from './cardApi'
import { resolveTheme } from '../themes'
import zh from '../locales/zh-CN.json'
import ja from '../locales/ja-JP.json'
import us from '../locales/en-US.json'
import gb from '../locales/en-GB.json'
import fr from '../locales/fr-FR.json'
const card = {
  id: 'generated_card_identifier_1234',
  version: 3,
  country_code: 'CN',
  locale: 'zh-CN',
  occasion: 'birthday',
  recipient: '朋友',
  sender: '我',
  title: '心意',
  custom_message: '你好',
  mode: 'static',
  image_model: 'agnes-image-2.5-flash',
  text_model: 'agnes-2.5-flash',
  image_url: '/api/assets/generated_card_identifier_1234.png',
  visual: { paper: '#fff7e6', ink: '#302d29', accent: '#a2112b', alignment: 'center' },
  created_at: '2026-10-20T01:00:00Z',
}
describe('library navigation cache', () => {
  const result = { items: [card], total: 1, page: 1, page_size: 12 }
  const signal = () => new AbortController().signal
  afterEach(() => {
    invalidateSavedCards()
    vi.unstubAllGlobals()
  })
  it('reuses a page for immediate rendering but still fetches fresh results', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(result))
      .mockResolvedValueOnce(Response.json({ ...result, items: [], total: 0 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(cachedSavedCards(1)).toBeUndefined()
    await fetchSavedCards(1, signal())
    expect(cachedSavedCards(1)?.items).toHaveLength(1)
    await fetchSavedCards(1, signal())
    expect(cachedSavedCards(1)?.items).toHaveLength(0)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('invalidates every cached page after single or batch deletion', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    for (const remove of [
      () => deleteSavedCard(card.id, signal()),
      () => deleteSavedCards([card.id], signal()),
    ]) {
      fetchMock.mockResolvedValueOnce(Response.json(result))
      await fetchSavedCards(1, signal())
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
      await remove()
      expect(cachedSavedCards(1)).toBeUndefined()
    }
  })
  it('does not repopulate the cache from a list request started before deletion', async () => {
    let resolve!: (response: Response) => void
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<Response>((done) => {
              resolve = done
            }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 204 })),
    )
    const pending = fetchSavedCards(1, signal())
    await deleteSavedCard(card.id, signal())
    resolve(Response.json(result))
    await pending
    expect(cachedSavedCards(1)).toBeUndefined()
  })
  it('invalidates lists when a newly generated card completes', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(Response.json(result))
        .mockResolvedValueOnce(
          Response.json({ id: card.id, status: 'complete', events: [], card, error_code: null }),
        ),
    )
    await fetchSavedCards(1, signal())
    await fetchGeneration(card.id, signal())
    expect(cachedSavedCards(1)).toBeUndefined()
  })
  it('ignores aborted responses and limits cached pages to five', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        const page = Number(new URL(url, 'http://localhost').searchParams.get('page'))
        return Response.json({ ...result, items: [], total: 100, page })
      }),
    )
    const aborted = new AbortController()
    aborted.abort()
    await fetchSavedCards(1, aborted.signal)
    expect(cachedSavedCards(1)).toBeUndefined()
    for (let page = 1; page <= 6; page++) await fetchSavedCards(page, signal())
    expect(cachedSavedCards(1)).toBeUndefined()
    expect(cachedSavedCards(6)?.page).toBe(6)
  })
})
describe('generated-card contracts', () => {
  it('submits exactly the confirmed batch and rejects invalid selections before requesting', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const signal = new AbortController().signal
      const ids = [card.id, 'second_generated_identifier_1234']
      await deleteSavedCards(ids, signal)
      expect(fetchMock).toHaveBeenCalledWith('/api/cards/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
        signal,
      })
      fetchMock.mockClear()
      for (const selection of [[], [card.id, card.id], ['../escape']])
        await expect(deleteSavedCards(selection, signal)).rejects.toThrow('validation_error')
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
  it('accepts real generated-card records and rejects old templates and unsafe image paths', () => {
    expect(isComposition(card)).toBe(true)
    for (const invalid of [
      { ...card, version: 2 },
      { ...card, locale: 'ja-JP' },
      { ...card, image_url: 'https://untrusted.test/a.png' },
      { ...card, visual: { ...card.visual, paper: 'url(javascript:alert(1))' } },
      { ...card, animation: { effect: 'execute' } },
    ])
      expect(isComposition(invalid)).toBe(false)
  })
  it('validates page and job outcomes instead of inventing completed cards', () => {
    expect(savedCardsPage({ items: [card], total: 1, page: 1, page_size: 12 }).items).toHaveLength(
      1,
    )
    expect(() =>
      savedCardsPage({ items: [card, card], total: 2, page: 1, page_size: 12 }),
    ).toThrow()
    expect(
      generationJob({ id: card.id, status: 'running', events: [], card: null, error_code: null })
        .status,
    ).toBe('running')
    expect(() =>
      generationJob({ id: card.id, status: 'complete', events: [], card: null, error_code: null }),
    ).toThrow()
  })
  it('keeps the country-language mapping and every UI key consistent', () => {
    expect(resolveTheme('JP').language).toBe('ja-JP')
    for (const locale of [zh, ja, gb, fr]) {
      expect(Object.keys(locale).sort()).toEqual(Object.keys(us).sort())
      expect(Object.values(locale).every((value) => value.trim().length > 0)).toBe(true)
    }
  })
})
