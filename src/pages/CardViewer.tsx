import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Expand, Mail, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cardLink, decodeCard, isCard, loadCard, type Card } from '../services/cardService'
import { CardExperience } from '../components/CardExperience'
export default function CardViewer() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const location = useLocation()
  const { t } = useTranslation()
  const container = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [full, setFull] = useState(false)
  const passed: unknown = location.state?.card
  const linked = decodeCard(params.get('d'))
  const card: Card | null =
    linked?.id === id ? linked : isCard(passed) && passed.id === id ? passed : loadCard(id)
  useEffect(() => {
    const handle = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handle)
    return () => document.removeEventListener('fullscreenchange', handle)
  }, [])
  if (!card)
    return (
      <div className="container empty-page">
        <Mail size={48} strokeWidth={1} />
        <h1>{t('missingTitle')}</h1>
        <p>{t('missingBody')}</p>
        <Link to="/create" className="button">
          {t('create')}
        </Link>
      </div>
    )
  const share = async () => {
    const url = cardLink(card)
    // Keep a selectable link visible even when native sharing is cancelled or unavailable.
    setShareUrl(url)
    try {
      if (navigator.share) await navigator.share({ title: t('shareTitle'), url })
      else {
        await navigator.clipboard.writeText(url)
        setNotice('copied')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareUrl(url)
      setNotice('shareError')
    }
  }
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (container.current?.requestFullscreen) await container.current.requestFullscreen()
      else setNotice('fullScreenError')
    } catch {
      setNotice('fullScreenError')
    }
  }
  return (
    <div className="container viewer-page">
      <div className="page-heading">
        <p className="eyebrow">{t('viewerEyebrow')}</p>
        <h1>{t('viewerTitle')}</h1>
        <p>{t('viewerBody')}</p>
      </div>
      <div className="viewer-layout">
        <div className="viewer-stage" ref={container}>
          <CardExperience card={card} country={card.country} />
          {full && (
            <button className="button fullscreen-close" onClick={fullscreen}>
              {t('exitFullScreen')}
            </button>
          )}
        </div>
        <aside className="viewer-tools panel">
          <span className="eyebrow">{t('brandName')} · H5</span>
          <h2>{card.recipient}</h2>
          <p className="muted">{t(`theme.${card.country}`)}</p>
          <div className="viewer-actions">
            <button className="button" onClick={share}>
              <Share2 size={17} />
              {t('share')}
            </button>
            <button className="button button-outline" onClick={fullscreen}>
              <Expand size={17} />
              {t(full ? 'exitFullScreen' : 'fullScreen')}
            </button>
            <Link className="text-link" to="/create">
              <ArrowLeft size={16} />
              {t('edit')}
            </Link>
          </div>
          <p className="demo-note">{t('demo')}</p>
          {notice && (
            <p className="notice" role="status">
              {notice === 'copied' ? <Check size={16} /> : <Copy size={16} />} {t(notice)}
            </p>
          )}
          {shareUrl && (
            <label className="field">
              {t('shareFallback')}
              <textarea readOnly value={shareUrl} onFocus={(e) => e.target.select()} rows={3} />
            </label>
          )}
        </aside>
      </div>
    </div>
  )
}
