import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import { themes } from '../themes'
import type { Card, Draft } from '../services/cardService'
import type { CountryCode } from '../themes/types'
import { AnimatedBackground } from './AnimatedBackground'
export function CardExperience({
  card,
  country,
  placeholder = false,
}: {
  card: Draft | Card
  country: CountryCode
  placeholder?: boolean
}) {
  const { t } = useTranslation()
  const theme = themes[country]
  const language = theme.language
  return (
    <article
      className="greeting-card"
      lang={language}
      style={{
        background: theme.colors.surface,
        color: theme.colors.ink,
        fontFamily: theme.typography.heading,
      }}
    >
      <div className="greeting-art">
        <img src={theme.assets.background} alt={t(`theme.${country}`)} width="800" height="500" />
        <AnimatedBackground kind={theme.animation.ambient} />
        <span className="greeting-country">{t(`country.${country}`, { lng: language })}</span>
      </div>
      <div className="greeting-content">
        <span className="greeting-occasion" style={{ color: theme.colors.accent }}>
          {t(card.occasion, { lng: language })}
        </span>
        <h2>
          {t('dear', { lng: language })}{' '}
          {card.recipient || (placeholder ? t('recipientPlaceholder') : '')}
        </h2>
        <p className={`personal-message ${!card.message ? 'placeholder' : ''}`}>
          {card.message || (placeholder ? theme.greeting : '')}
        </p>
        <div className="greeting-signature">
          <Heart size={14} style={{ color: theme.colors.accent }} />
          <span>
            {t('from', { lng: language })}{' '}
            {card.sender || (placeholder ? t('senderPlaceholder') : '')}
          </span>
        </div>
      </div>
      <div className="greeting-foot">
        {t('brandName', { lng: language })} · {theme.country} · {t('withLove', { lng: language })}
      </div>
    </article>
  )
}
