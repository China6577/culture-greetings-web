import { Globe2, Languages, Palette, RotateCcw, Wind } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCulture } from '../components/ThemeProvider'
import { cultureThemes } from '../themes'
import type { CountryCode } from '../themes/types'

export default function Settings() {
  const { t } = useTranslation()
  const { country, language, motion, setCountry, setMotion, detect, loading } = useCulture()
  return (
    <div className="container page-content settings-page">
      <div className="page-heading">
        <p className="eyebrow">{t('settingsEyebrow')}</p>
        <h1>{t('settingsTitle')}</h1>
        <p>{t('settingsDescription')}</p>
      </div>
      <div className="settings-panel panel">
        <div className="setting-row">
          <Globe2 />
          <div>
            <label htmlFor="country">{t('detectedCulture')}</label>
            <p>{t('countryHelp')}</p>
          </div>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
          >
            {cultureThemes.map((theme) => (
              <option key={theme.country} value={theme.country}>
                {t(`country.${theme.country}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-row">
          <Languages />
          <div>
            <span className="setting-label">{t('language')}</span>
            <p>{t('languageHelp')}</p>
          </div>
          <output className="setting-value">{t(`locale.${language}`)}</output>
        </div>
        <div className="setting-row">
          <Palette />
          <div>
            <span className="setting-label">{t('theme')}</span>
            <p>{t('themeHelp')}</p>
          </div>
          <output className="setting-value">{t(`theme.${country}`)}</output>
        </div>
        <div className="setting-row">
          <Wind />
          <div>
            <label htmlFor="motion">{t('motion')}</label>
            <p>{t('motionHelp')}</p>
          </div>
          <button
            id="motion"
            className={`toggle ${motion ? 'on' : ''}`}
            role="switch"
            aria-checked={motion}
            aria-label={t('motion')}
            onClick={() => setMotion(!motion)}
          >
            <span />
            {t(motion ? 'motionOn' : 'motionOff')}
          </button>
        </div>
        <div className="setting-reset">
          <p>{t('resetHelp')}</p>
          <button
            className="button button-outline"
            disabled={loading}
            onClick={() => void detect()}
          >
            <RotateCcw size={16} />
            {t(loading ? 'locating' : 'reset')}
          </button>
        </div>
      </div>
    </div>
  )
}
