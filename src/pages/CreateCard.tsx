import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Globe2,
  Languages,
  Palette,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCulture } from '../components/ThemeProvider'
import { CardExperience } from '../components/CardExperience'
import { createPreview, loadDraft, occasions, type Draft } from '../services/cardService'
import { writeStorage } from '../utils/storage'
export default function CreateCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentTheme, country, language } = useCulture()
  const [draft, setDraft] = useState<Draft>(loadDraft)
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, boolean>>>({})
  const [saved, setSaved] = useState(true)
  useEffect(() => {
    setSaved(writeStorage('kinship:draft', draft))
  }, [draft])
  const update = (key: keyof Draft, value: string) => {
    setDraft((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: false }))
  }
  function submit(e: FormEvent) {
    e.preventDefault()
    const invalid = Object.fromEntries(
      ['recipient', 'sender', 'message'].map((key) => [key, !draft[key as keyof Draft].trim()]),
    )
    setErrors(invalid)
    if (Object.values(invalid).some(Boolean)) {
      document
        .querySelector<HTMLElement>(`[name="${Object.keys(invalid).find((k) => invalid[k])}"]`)
        ?.focus()
      return
    }
    const pending = createPreview(draft, currentTheme.country)
    writeStorage('kinship:pending', pending)
    navigate('/generate', { state: { card: pending } })
  }
  return (
    <div className="container page-content">
      <div className="page-heading">
        <p className="eyebrow">{t('createEyebrow')}</p>
        <h1>{t('createTitle')}</h1>
        <p>{t('createDescription')}</p>
      </div>
      <div className="editor-grid">
        <div>
          <div className="context-strip">
            {[
              [Globe2, t('detectedCulture'), t(`country.${country}`)],
              [Languages, t('language'), t(`locale.${language}`)],
              [Palette, t('theme'), t(`theme.${currentTheme.country}`)],
            ].map(([Icon, label, value], i) => {
              const Symbol = Icon as typeof Globe2
              return (
                <div key={i}>
                  <Symbol size={17} />
                  <span>
                    {String(label)}
                    <strong>{String(value)}</strong>
                  </span>
                </div>
              )
            })}
            <button
              onClick={() => navigate('/settings')}
              className="icon-button"
              aria-label={t('change')}
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <form className="editor-form panel" onSubmit={submit} noValidate>
            <fieldset>
              <legend>{t('occasion')}</legend>
              <div className="occasion-options">
                {occasions.map((occasion) => (
                  <button
                    key={occasion}
                    type="button"
                    className={draft.occasion === occasion ? 'occasion active' : 'occasion'}
                    aria-pressed={draft.occasion === occasion}
                    onClick={() => update('occasion', occasion)}
                  >
                    {draft.occasion === occasion && <Check size={14} />} {t(occasion)}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="name-fields">
              {(['recipient', 'sender'] as const).map((key) => (
                <div className="field" key={key}>
                  <label htmlFor={key}>
                    {t(key)} <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id={key}
                    name={key}
                    value={draft[key]}
                    maxLength={60}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={t(`${key}Placeholder`)}
                    autoComplete="off"
                    required
                    aria-invalid={!!errors[key]}
                    aria-describedby={errors[key] ? `${key}-error` : undefined}
                  />
                  {errors[key] && (
                    <small id={`${key}-error`} className="error">
                      {t('required')}
                    </small>
                  )}
                </div>
              ))}
            </div>
            <div className="field">
              <label htmlFor="message">
                {t('message')} <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                value={draft.message}
                maxLength={500}
                onChange={(e) => update('message', e.target.value)}
                placeholder={t('messagePlaceholder')}
                required
                aria-invalid={!!errors.message}
                aria-describedby="message-hint message-count"
              />
              {errors.message && (
                <small className="error" role="alert">
                  {t('required')}
                </small>
              )}
              <div className="field-meta">
                <small id="message-hint">{t('messageHint')}</small>
                <small id="message-count">{draft.message.length}/500</small>
              </div>
            </div>
            <div className="form-bottom">
              <span className="saved-status">
                <Check size={14} />
                {t(saved ? 'saved' : 'unsaved')}
              </span>
              <button className="button" type="submit">
                {t('continue')}
                <ArrowUpRight size={17} />
              </button>
            </div>
          </form>
        </div>
        <aside className="preview-column">
          <div className="preview-label">
            <span className="live-dot" />
            {t('preview')}
            <span>H5 · 9:16</span>
          </div>
          <CardExperience card={draft} country={currentTheme.country} placeholder />
          <p className="demo-note">
            <CircleHelp size={14} />
            {t('demo')}
          </p>
        </aside>
      </div>
    </div>
  )
}
