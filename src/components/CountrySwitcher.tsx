import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCulture } from './ThemeProvider'
import { cultureThemes } from '../themes'

export function CountrySwitcher() {
  const { t } = useTranslation()
  const { country, setCountry } = useCulture()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()
  const selected = cultureThemes.findIndex((theme) => theme.country === country)

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLButtonElement>(`[data-index="${active}"]`)?.focus()
  }, [open, active])

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setActive(selected)
        setOpen(true)
      } else
        setActive(
          (index) =>
            (index + (event.key === 'ArrowDown' ? 1 : -1) + cultureThemes.length) %
            cultureThemes.length,
        )
    }
    if (open && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault()
      setActive(event.key === 'Home' ? 0 : cultureThemes.length - 1)
    }
  }

  return (
    <div
      className="country-picker"
      ref={root}
      onKeyDown={handleKey}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="country-trigger"
        id={`${id}-trigger`}
        aria-label={t('detectedCulture')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-options` : undefined}
        onClick={() => {
          setActive(selected)
          setOpen((value) => !value)
        }}
      >
        <Globe2 size={16} aria-hidden="true" />
        <span>{t(`country.${country}`)}</span>
        <ChevronDown size={14} className="country-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div
          className="country-dropdown"
          role="listbox"
          aria-labelledby={`${id}-trigger`}
          id={`${id}-options`}
          ref={menu}
        >
          <p className="country-menu-label" aria-hidden="true">
            {t('detectedCulture')}
          </p>
          {cultureThemes.map((theme, index) => (
            <button
              type="button"
              role="option"
              key={theme.country}
              data-index={index}
              tabIndex={-1}
              aria-selected={country === theme.country}
              className="country-option"
              onFocus={() => setActive(index)}
              onClick={() => {
                setCountry(theme.country)
                setOpen(false)
                trigger.current?.focus()
              }}
            >
              <span
                className="country-option-symbol"
                style={{
                  background: theme.colors.background,
                  color: theme.colors.accent,
                  borderColor: `${theme.colors.accent}25`,
                }}
                aria-hidden="true"
              >
                {theme.country === 'GLOBAL' ? <Globe2 size={17} /> : theme.country}
              </span>
              <span className="country-option-copy">
                <strong>{t(`country.${theme.country}`)}</strong>
                <small>{t(`locale.${theme.language}`)}</small>
              </span>
              {country === theme.country && (
                <Check size={16} className="country-option-check" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
