import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Check, Copy, LoaderCircle, Mail, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GeneratedCard } from '../components/GeneratedCard'
import { fetchComposition, isComposition, ApiError } from '../services/cardApi'
import type { CardMode, Composition } from '../types/card'
export default function CardViewer() {
  const { id = '' } = useParams()
  const location = useLocation()
  const { t } = useTranslation()
  const [card, setCard] = useState<Composition | null>(() =>
    isComposition(location.state?.composition) && location.state.composition.id === id
      ? location.state.composition
      : null,
  )
  const [loading, setLoading] = useState(!card)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [mode, setMode] = useState<CardMode>('static')
  const [notice, setNotice] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    setLoading(true)
    void fetchComposition(id, controller.signal)
      .then((value) => {
        setCard(value)
        setMode('static')
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setCard(null)
          setError(failure instanceof ApiError ? failure.code : 'network_error')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [id, attempt])
  async function share() {
    if (!card) return
    const url = `${window.location.origin}/card/${card.id}`
    setShareUrl(url)
    try {
      if (navigator.share) await navigator.share({ title: t('shareTitle'), url })
      else {
        await navigator.clipboard.writeText(url)
        setNotice('copied')
      }
    } catch (failure) {
      if (!(failure instanceof DOMException && failure.name === 'AbortError'))
        setNotice('shareError')
    }
  }
  if (loading)
    return (
      <div className="page-loading" role="status">
        <LoaderCircle className="spinner" />
        {t('p2.loadingCard')}
      </div>
    )
  if (!card)
    return (
      <div className="container empty-page">
        <Mail size={48} strokeWidth={1} />
        <h1>{t('missingTitle')}</h1>
        <p>
          {error === 'card_not_found'
            ? t('missingBody')
            : t(`ai.error.${error}`, { defaultValue: t('ai.error.generation_failed') })}
        </p>
        {error !== 'card_not_found' && (
          <button className="button button-outline" onClick={() => setAttempt((v) => v + 1)}>
            {t('p2.retry')}
          </button>
        )}
        <Link to="/create" className="button">
          {t('create')}
        </Link>
      </div>
    )
  return (
    <div className="container viewer-page">
      <div className="viewer-layout">
        <div className="viewer-stage">
          <GeneratedCard card={card} mode={mode} />
        </div>
        <div className="viewer-controls">
          <div className="viewer-mode-tabs">
            {(['static', 'h5'] as const).map((value) => (
              <button
                key={value}
                className={mode === value ? 'active' : ''}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {t(`p2.mode.${value}`)}
              </button>
            ))}
          </div>
          <div className="viewer-actions">
            <button className="button" onClick={share}>
              <Share2 size={17} />
              {t('share')}
            </button>
          </div>
          {notice && (
            <p className="notice" role="status">
              {notice === 'copied' ? <Check size={16} /> : <Copy size={16} />} {t(notice)}
            </p>
          )}
          {shareUrl && (
            <label className="field">
              {t('shareFallback')}
              <textarea
                readOnly
                value={shareUrl}
                onFocus={(event) => event.target.select()}
                rows={2}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  )
}
