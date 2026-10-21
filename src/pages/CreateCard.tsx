import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCulture } from '../components/ThemeProvider'
import { themes } from '../themes'
import { defaultGenerationDraft, saveGenerationSession } from '../features/card-generation/session'
import type { GenerationDraft } from '../types/card'

export default function CreateCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { country } = useCulture()
  const [draft, setDraft] = useState<GenerationDraft>(() => ({ ...defaultGenerationDraft }))
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const target = country
  const targetLocale = themes[target].language
  const context = {
    country_code: target,
    locale: targetLocale,
  }
  function update<K extends keyof GenerationDraft>(key: K, value: GenerationDraft[K]) {
    setDraft((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: false }))
  }
  function generate(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    const invalid = {
      recipient: !draft.recipient.trim(),
      sender: !draft.sender.trim(),
      prompt: !draft.prompt.trim(),
    }
    setErrors(invalid)
    const firstInvalid = (['recipient', 'sender', 'prompt'] as const).find((key) => invalid[key])
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }
    setSubmitting(true)
    const next = {
      draft,
      context,
      composition_request_id: crypto.randomUUID(),
    }
    saveGenerationSession(next)
    navigate('/generate')
  }
  return (
    <div className="container page-content studio-page studio-page-single">
      <header className="single-title-heading">
        <h1 className="page-title">{t('navCreate')}</h1>
      </header>
      <form className="editor-form panel" onSubmit={generate} noValidate>
        <div className="name-fields">
          {(['recipient', 'sender'] as const).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{t(key)}</label>
              <input
                id={key}
                name={key}
                value={draft[key]}
                maxLength={60}
                onChange={(e) => update(key, e.target.value)}
                placeholder={t(`${key}Placeholder`)}
                aria-invalid={!!errors[key]}
              />
              {errors[key] && (
                <small className="error" role="alert">
                  {t('required')}
                </small>
              )}
            </div>
          ))}
        </div>
        <div className="field">
          <label htmlFor="message">
            {t('message')} <small className="optional-label">{t('p2.optional')}</small>
          </label>
          <textarea
            id="message"
            rows={4}
            value={draft.custom_message}
            maxLength={500}
            onChange={(e) => update('custom_message', e.target.value)}
            placeholder={t('p2.messagePlaceholder')}
          />
        </div>
        <div className="field prompt-field chat-field">
          <label htmlFor="prompt">
            <MessageCircle size={17} />
            {t('p2.chatLabel')}
          </label>
          <div className={`chat-composer ${errors.prompt ? 'has-error' : ''}`}>
            <textarea
              id="prompt"
              name="prompt"
              rows={4}
              value={draft.prompt}
              maxLength={2000}
              onChange={(e) => update('prompt', e.target.value)}
              placeholder={t('p2.chatPlaceholder')}
              onKeyDown={(event) => {
                if (
                  !event.nativeEvent.isComposing &&
                  (event.ctrlKey || event.metaKey) &&
                  event.key === 'Enter'
                ) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
              aria-invalid={!!errors.prompt}
              required
            />
            <div className="chat-toolbar">
              <span>{t('p2.autoMatch')}</span>
              <span className="chat-count">{draft.prompt.length}/2000</span>
              <button className="button chat-send" type="submit" disabled={submitting}>
                <ArrowUpRight size={15} />
                {t('p2.generateCard')}
              </button>
            </div>
          </div>
          {errors.prompt && (
            <small className="error" role="alert">
              {t('required')}
            </small>
          )}
        </div>
      </form>
    </div>
  )
}
