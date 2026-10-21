export const cardsPerPage = 12

export function libraryPage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 && page <= Number.MAX_SAFE_INTEGER / cardsPerPage
    ? page
    : 1
}

export function lastLibraryPage(total: number): number {
  return Math.max(1, Math.ceil(total / cardsPerPage))
}

export function libraryPageNumbers(page: number, last: number): (number | 'gap')[] {
  const visible = [...new Set([1, page - 1, page, page + 1, last])]
    .filter((value) => value >= 1 && value <= last)
    .sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  visible.forEach((value, index) => {
    if (index && value - visible[index - 1] > 1) result.push('gap')
    result.push(value)
  })
  return result
}
