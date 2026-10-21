import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  ApiError,
  cachedSavedCards,
  deleteSavedCard,
  deleteSavedCards,
  fetchSavedCards,
} from '../services/cardApi'
import {
  lastLibraryPage,
  libraryPage,
  libraryPageNumbers,
} from '../features/card-library/pagination'
import type { Composition } from '../types/card'
import { GeneratedCard } from '../components/GeneratedCard'
import '../library.css'

export default function MyCards() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useSearchParams()
  const page = libraryPage(params.get('page'))
  const [initialPage] = useState(() => cachedSavedCards(page))
  const [cards, setCards] = useState<Composition[]>(initialPage?.items ?? [])
  const [total, setTotal] = useState(initialPage?.total ?? 0)
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(!initialPage)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Composition | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [batchTargets, setBatchTargets] = useState<Composition[]>([])
  const allCheckbox = useRef<HTMLInputElement>(null)
  const allChecked = cards.length > 0 && cards.every((card) => checked.has(card.id))
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleted, setDeleted] = useState(false)
  const [deletedInBulk, setDeletedInBulk] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const deletion = useRef<AbortController | null>(null)
  const last = lastLibraryPage(total)

  useEffect(() => {
    const controller = new AbortController()
    const cached = cachedSavedCards(page)
    setLoading(!cached)
    if (cached) {
      setCards(cached.items)
      setTotal(cached.total)
    }
    setError('')
    setChecked(new Set())
    void fetchSavedCards(page, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setTotal(result.total)
        const finalPage = lastLibraryPage(result.total)
        if (page > finalPage) {
          setParams(finalPage === 1 ? {} : { page: String(finalPage) }, { replace: true })
          return
        }
        setCards(result.items)
        setChecked(
          (previous) =>
            new Set([...previous].filter((id) => result.items.some((card) => card.id === id))),
        )
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setError(failure instanceof ApiError ? failure.code : 'network_error')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page, attempt, setParams])
  useEffect(() => {
    const hasTargets = selected !== null || batchTargets.length > 0
    if (hasTargets && !dialog.current?.open) dialog.current?.showModal()
    if (!hasTargets && dialog.current?.open) dialog.current.close()
  }, [selected, batchTargets])
  useEffect(() => {
    if (allCheckbox.current) allCheckbox.current.indeterminate = checked.size > 0 && !allChecked
  }, [checked, allChecked, bulkMode])
  useEffect(() => () => deletion.current?.abort(), [])

  function closeDeleteDialog() {
    setSelected(null)
    setBatchTargets([])
  }
  function toggleCard(id: string) {
    setChecked((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function changePage(next: number) {
    if (loading || deleting || next === page || next < 1 || next > last) return
    const cached = cachedSavedCards(next)
    setCards(cached?.items ?? [])
    setTotal(cached?.total ?? total)
    setLoading(!cached)
    setDeleted(false)
    setChecked(new Set())
    setParams(next === 1 ? {} : { page: String(next) })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  async function confirmDelete() {
    if ((!selected && batchTargets.length === 0) || deleting) return
    const targets = selected ? [selected] : batchTargets
    const isBulk = !selected
    const controller = new AbortController()
    deletion.current = controller
    setDeleting(true)
    setDeleteError('')
    try {
      try {
        if (isBulk)
          await deleteSavedCards(
            targets.map((card) => card.id),
            controller.signal,
          )
        else await deleteSavedCard(targets[0].id, controller.signal)
      } catch (failure) {
        if (isBulk || !(failure instanceof ApiError && failure.status === 404)) throw failure
      }
      if (!controller.signal.aborted) {
        closeDeleteDialog()
        setChecked(new Set())
        setBulkMode(false)
        setDeletedInBulk(isBulk)
        setDeleted(true)
        const removed = new Set(targets.map((card) => card.id))
        setCards((previous) => previous.filter((card) => !removed.has(card.id)))
        setTotal((previous) => Math.max(0, previous - targets.length))
        setAttempt((value) => value + 1)
      }
    } catch (failure) {
      if (!controller.signal.aborted)
        setDeleteError(failure instanceof ApiError ? failure.code : 'network_error')
    } finally {
      if (!controller.signal.aborted) setDeleting(false)
    }
  }
  const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return (
    <div className="container library-page">
      <header className="library-heading single-title-heading">
        <h1 className="page-title">{t('navCards')}</h1>
        <div className="library-heading-actions">
          <button
            className="button button-outline button-small"
            disabled={loading || deleting || total === 0}
            onClick={() => {
              setBulkMode((value) => !value)
              setChecked(new Set())
              setDeleted(false)
            }}
          >
            {t(bulkMode ? 'library.cancelSelection' : 'library.bulkDelete')}
          </button>
          <Link to="/create" className="button button-small">
            <Plus size={17} />
            {t('navCreate')}
          </Link>
        </div>
      </header>
      {bulkMode && total > 0 && (
        <div className="library-bulk-toolbar" role="group" aria-label={t('library.bulkDelete')}>
          <label className="library-select-all">
            <input
              type="checkbox"
              ref={allCheckbox}
              checked={allChecked}
              disabled={loading || deleting || cards.length === 0}
              onChange={() =>
                setChecked(allChecked ? new Set() : new Set(cards.map((card) => card.id)))
              }
            />
            {t('library.selectPage')}
          </label>
          <span className="library-selection-count" role="status">
            {t('library.selectedCount', { count: checked.size })}
          </span>
          <button
            className="button button-small"
            disabled={loading || deleting || checked.size === 0}
            onClick={() => {
              setDeleteError('')
              setBatchTargets(cards.filter((card) => checked.has(card.id)))
            }}
          >
            <Trash2 size={16} />
            {t('library.delete')}
          </button>
        </div>
      )}
      {deleted && (
        <p className="library-feedback" role="status">
          {t(deletedInBulk ? 'library.bulkDeleted' : 'library.deleted')}
        </p>
      )}
      {!loading && !error && total === 0 ? (
        <div className="library-empty panel">
          <Mail size={40} strokeWidth={1.2} />
          <h2>{t('library.emptyTitle')}</h2>
          <p className="muted">{t('library.emptyBody')}</p>
          <Link to="/create" className="button">
            {t('create')}
          </Link>
        </div>
      ) : (
        <>
          {(total > 0 || loading) && (
            <p
              className={`library-count ${total === 0 ? 'library-count-placeholder' : ''}`}
              aria-hidden={total === 0 ? true : undefined}
            >
              {t('library.count', { count: total })}
              <span>{t('library.pageInfo', { page, pages: last })}</span>
            </p>
          )}
          <div className="library-grid" aria-busy={loading}>
            {loading &&
              cards.length === 0 &&
              Array.from({ length: 4 }, (_, index) => (
                <div
                  className="library-card library-card-skeleton panel"
                  key={`loading-${index}`}
                  aria-hidden="true"
                >
                  <div className="library-preview skeleton-block" />
                  <div className="library-card-details">
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line skeleton-line-title" />
                    <div className="skeleton-line" />
                  </div>
                  <div className="library-card-footer">
                    <div className="skeleton-line skeleton-line-short" />
                  </div>
                </div>
              ))}
            {cards.map((card, index) => {
              const content = (
                <>
                  <div className="library-preview" aria-hidden="true">
                    <GeneratedCard card={card} mini imageLoading={index < 4 ? 'eager' : 'lazy'} />
                  </div>
                  <div className="library-card-details">
                    <span className="library-country">{t(`country.${card.country_code}`)}</span>
                    <h2>{t('library.cardTitle', { recipient: card.recipient })}</h2>
                    <p className="library-message" lang={card.locale}>
                      {card.custom_message}
                    </p>
                  </div>
                </>
              )
              return (
                <article
                  className={`library-card panel ${bulkMode ? 'is-selectable' : ''} ${bulkMode && checked.has(card.id) ? 'is-selected' : ''}`}
                  key={card.id}
                  onClick={
                    bulkMode
                      ? () => {
                          if (!loading && !deleting) toggleCard(card.id)
                        }
                      : undefined
                  }
                >
                  {bulkMode ? (
                    <div className="library-card-open">{content}</div>
                  ) : (
                    <Link className="library-card-open" to={`/card/${card.id}`}>
                      {content}
                    </Link>
                  )}
                  <div className="library-card-footer">
                    <time dateTime={card.created_at}>
                      {Number.isFinite(Date.parse(card.created_at))
                        ? dateFormat.format(new Date(card.created_at))
                        : ''}
                    </time>
                    {bulkMode ? (
                      <label
                        className="library-card-select"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={checked.has(card.id)}
                          disabled={loading || deleting}
                          aria-label={t('library.selectCard', { recipient: card.recipient })}
                          onChange={() => toggleCard(card.id)}
                        />
                      </label>
                    ) : (
                      <button
                        className="library-delete"
                        aria-label={t('library.deleteLabel', { recipient: card.recipient })}
                        disabled={deleting || loading}
                        onClick={() => {
                          setDeleteError('')
                          setSelected(card)
                        }}
                      >
                        <Trash2 size={15} />
                        {t('library.delete')}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
      {loading && (
        <p className="library-status" role="status">
          <LoaderCircle className="spinner" size={20} />
          {t('library.loading')}
        </p>
      )}
      {error && (
        <div className="request-error" role="alert">
          <p>{t(`p2.error.${error}`, { defaultValue: t('p2.error.request_failed') })}</p>
          <button
            className="button button-outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            <RefreshCw size={16} />
            {t('p2.retry')}
          </button>
        </div>
      )}
      {total > 0 && (
        <nav className="library-pagination" aria-label={t('library.pagination')}>
          <button
            aria-label={t('library.previous')}
            disabled={loading || deleting || page <= 1}
            onClick={() => changePage(page - 1)}
          >
            <ChevronLeft size={16} />
            <span>{t('library.previous')}</span>
          </button>
          {libraryPageNumbers(page, last).map((number, index) =>
            number === 'gap' ? (
              <span className="pagination-gap" key={`gap-${index}`} aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={number}
                aria-label={t('library.goToPage', { page: number })}
                aria-current={number === page ? 'page' : undefined}
                disabled={loading || deleting}
                onClick={() => changePage(number)}
              >
                {number}
              </button>
            ),
          )}
          <button
            aria-label={t('library.next')}
            disabled={loading || deleting || page >= last}
            onClick={() => changePage(page + 1)}
          >
            <span>{t('library.next')}</span>
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
      <dialog
        className="library-delete-dialog"
        ref={dialog}
        aria-labelledby="delete-card-title"
        aria-describedby="delete-card-description"
        onCancel={(event) => {
          if (deleting) event.preventDefault()
          else closeDeleteDialog()
        }}
        onClose={closeDeleteDialog}
      >
        <h2 id="delete-card-title">
          {t(batchTargets.length > 0 ? 'library.batchDeleteTitle' : 'library.deleteTitle', {
            count: batchTargets.length,
          })}
        </h2>
        <p className="library-delete-recipient">
          {selected && t('library.cardTitle', { recipient: selected.recipient })}
        </p>
        {selected && (
          <p className="library-delete-summary">
            {t(`country.${selected.country_code}`)} ·{' '}
            {Number.isFinite(Date.parse(selected.created_at))
              ? dateFormat.format(new Date(selected.created_at))
              : ''}
          </p>
        )}
        {batchTargets.length > 0 && (
          <ul className="library-delete-list">
            {batchTargets.map((card) => (
              <li key={card.id}>{t('library.cardTitle', { recipient: card.recipient })}</li>
            ))}
          </ul>
        )}
        <p id="delete-card-description">
          {t(
            batchTargets.length > 0
              ? 'library.batchDeleteDescription'
              : 'library.deleteDescription',
          )}
        </p>
        {deleteError && (
          <p className="request-error" role="alert">
            {t(`p2.error.${deleteError}`, { defaultValue: t('p2.error.request_failed') })}
          </p>
        )}
        <div className="library-dialog-actions">
          <button
            className="button button-outline"
            autoFocus
            disabled={deleting}
            onClick={closeDeleteDialog}
          >
            {t('library.cancelDelete')}
          </button>
          <button className="button" disabled={deleting} onClick={() => void confirmDelete()}>
            {deleting ? <LoaderCircle size={16} className="spinner" /> : <Trash2 size={16} />}
            {t(deleting ? 'library.deleting' : 'library.confirmDelete')}
          </button>
        </div>
      </dialog>
    </div>
  )
}
