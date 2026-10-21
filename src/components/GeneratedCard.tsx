import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'framer-motion'
import { useCulture } from './ThemeProvider'
import { themes } from '../themes'
import type { Composition, CardMode } from '../types/card'
import '../generated-card.css'
import { CardAnimation } from './CardAnimation'
export function GeneratedCard({
  card,
  mode = 'static',
  mini = false,
  imageLoading,
}: {
  card: Composition
  mode?: CardMode
  mini?: boolean
  imageLoading?: 'eager' | 'lazy'
}) {
  const { t } = useTranslation()
  const { motion } = useCulture()
  const reduced = useReducedMotion()
  const [failed, setFailed] = useState(false)
  const living = mode === 'h5' && motion && !reduced && !mini && !failed
  return (
    <article
      className={`generated-card ${mini ? 'generated-card-mini' : ''} ${living ? 'generated-card-living' : ''}`}
      data-image-motion={card.animation?.image_motion ?? 'drift'}
      lang={card.locale}
      style={
        {
          '--generated-paper': card.visual.paper,
          '--generated-ink': card.visual.ink,
          '--generated-accent': card.visual.accent,
          '--image-cycle': `${card.animation?.duration_seconds ?? 10}s`,
          fontFamily: themes[card.country_code].typography.heading,
          textAlign: card.visual.alignment,
        } as CSSProperties
      }
    >
      <img
        className="generated-card-image"
        src={card.image_url}
        alt={t('ai.imageAlt', { lng: card.locale, recipient: card.recipient })}
        loading={imageLoading ?? (mini ? 'lazy' : 'eager')}
        onError={() => setFailed(true)}
      />
      {living && card.animation && <CardAnimation plan={card.animation} cardId={card.id} />}
      {failed && (
        <p className="generated-image-error" role="status">
          {t('ai.imageUnavailable')}
        </p>
      )}
      <div className="generated-card-content">
        <span className="generated-card-title">{card.title}</span>
        <h2>
          {t('dear', { lng: card.locale })} {card.recipient}
        </h2>
        <p className="generated-card-message">{card.custom_message}</p>
        <p className="generated-card-sender">
          {t('from', { lng: card.locale })} {card.sender}
        </p>
        {!mini && (
          <p className="generated-card-seal">
            {t('brandName', { lng: card.locale })} · {t('withLove', { lng: card.locale })}
          </p>
        )}
      </div>
    </article>
  )
}
