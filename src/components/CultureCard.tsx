import { ArrowUpRight, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCulture } from './ThemeProvider'
import type { CultureTheme } from '../themes/types'
export function CultureCard({ theme }: { theme: CultureTheme }) {
  const { t } = useTranslation()
  const { theme: active, setCountry } = useCulture()
  return (
    <button
      className={`culture-card ${active === theme.country ? 'selected' : ''}`}
      onClick={() => setCountry(theme.country)}
      aria-pressed={active === theme.country}
      aria-label={`${t('selectCulture')}: ${t(`country.${theme.country}`)}`}
    >
      <div className="culture-image">
        <img src={theme.assets.background} alt="" loading="lazy" width="800" height="500" />
        {active === theme.country && (
          <span className="selected-badge">
            <Check size={12} />
            {t('current')}
          </span>
        )}
        <span className="culture-code">{theme.country}</span>
      </div>
      <div className="culture-card-body">
        <div>
          <h3>{t(`country.${theme.country}`)}</h3>
          <p>{t(`theme.${theme.country}`)}</p>
        </div>
        <span className="culture-arrow">
          <ArrowUpRight size={17} />
        </span>
      </div>
    </button>
  )
}
