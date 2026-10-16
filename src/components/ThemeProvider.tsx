import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { themes, resolveTheme } from '../themes'
import { type CountryCode, type CultureTheme, type Language } from '../themes/types'
import { getLocation } from '../services/locationService'
import { readStorage, writeStorage } from '../utils/storage'
import { restorePreferences, type Preferences } from '../utils/preferences'
interface ContextValue extends Preferences {
  theme: CountryCode
  language: Language
  currentTheme: CultureTheme
  source: string
  loading: boolean
  setCountry: (code: CountryCode) => void
  setMotion: (value: boolean) => void
  detect: () => Promise<void>
}
const ThemeContext = createContext<ContextValue | null>(null)
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [initial] = useState(() => restorePreferences(readStorage('kinship:preferences', null)))
  const validSaved = initial !== null
  const [prefs, setPrefs] = useState<Preferences>(initial ?? { country: 'GLOBAL', motion: true })
  const currentTheme = themes[prefs.country]
  const [source, setSource] = useState(validSaved ? 'manual' : 'loading')
  const [loading, setLoading] = useState(!validSaved)
  const revision = useRef(0)
  const update = (values: Partial<Preferences>) => {
    revision.current++
    setPrefs((p) => ({ ...p, ...values }))
    setSource('manual')
    setLoading(false)
  }
  const detect = async () => {
    const ticket = ++revision.current
    setLoading(true)
    const location = await getLocation()
    if (revision.current !== ticket) return
    const theme = resolveTheme(location.country)
    setPrefs((p) => ({
      ...p,
      country: theme.country,
    }))
    setSource(location.source)
    setLoading(false)
  }
  useEffect(() => {
    if (!validSaved) void detect()
    return () => {
      revision.current++
    }
  }, []) // Initial detection only; manual edits invalidate in-flight requests.
  useEffect(() => {
    void i18n.changeLanguage(currentTheme.language)
    document.documentElement.lang = currentTheme.language
    document.documentElement.dataset.motion = String(prefs.motion)
    document.documentElement.dataset.culture = prefs.country
    const theme = currentTheme
    for (const [key, value] of Object.entries(theme.colors))
      document.documentElement.style.setProperty(`--${key}`, value)
    document.documentElement.style.setProperty('--heading-font', theme.typography.heading)
    document.documentElement.style.setProperty('--body-font', theme.typography.body)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme.colors.background)
    if (!loading) writeStorage('kinship:preferences', prefs)
  }, [prefs, currentTheme, i18n, loading])
  return (
    <ThemeContext.Provider
      value={{
        ...prefs,
        theme: prefs.country,
        language: currentTheme.language,
        currentTheme,
        loading,
        source,
        setCountry: (country) => update({ country }),
        setMotion: (motion) => update({ motion }),
        detect,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
export function useCulture() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('ThemeProvider is required')
  return context
}
