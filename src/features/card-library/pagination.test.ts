import { describe, expect, it } from 'vitest'
import { lastLibraryPage, libraryPage, libraryPageNumbers } from './pagination'

describe('saved card pagination', () => {
  it('accepts bookmarkable pages and normalizes invalid input', () => {
    expect(libraryPage('3')).toBe(3)
    for (const value of [null, '', '-1', '0', '2.5', 'NaN', 'Infinity', '999999999999999999999'])
      expect(libraryPage(value)).toBe(1)
  })
  it('handles empty collections and the last page shrinking after deletion', () => {
    expect(lastLibraryPage(0)).toBe(1)
    expect(lastLibraryPage(12)).toBe(1)
    expect(lastLibraryPage(13)).toBe(2)
    expect(lastLibraryPage(26)).toBe(3)
    expect(lastLibraryPage(24)).toBe(2)
  })
  it('keeps page controls bounded with first, last and current neighbors', () => {
    expect(libraryPageNumbers(2, 3)).toEqual([1, 2, 3])
    expect(libraryPageNumbers(50, 100)).toEqual([1, 'gap', 49, 50, 51, 'gap', 100])
    expect(libraryPageNumbers(1, 1)).toEqual([1])
    expect(libraryPageNumbers(100, 100)).toEqual([1, 'gap', 99, 100])
  })
})
