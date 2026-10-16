import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, Circle, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'framer-motion'
import Lottie from 'lottie-react'
import loadingAnimation from '../animations/loading'
import { isCard, saveCard } from '../services/cardService'
import { readStorage } from '../utils/storage'
import { useCulture } from '../components/ThemeProvider'
export default function Generate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { motion } = useCulture()
  const reduced = useReducedMotion()
  const [card] = useState<unknown>(
    () => location.state?.card ?? readStorage('kinship:pending', null),
  )
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!isCard(card)) {
      navigate('/create', { replace: true })
      return
    }
    const timers = [
      setTimeout(() => setStep(1), 1100),
      setTimeout(() => setStep(2), 2300),
      setTimeout(() => {
        saveCard(card)
        navigate(`/card/${card.id}`, { replace: true, state: { card } })
      }, 3600),
    ]
    return () => timers.forEach(clearTimeout)
  }, [card, navigate])
  return (
    <div className="container generation-page">
      <div className="generation-shell panel">
        <p className="eyebrow">{t('studioLabel')}</p>
        {!reduced && motion ? (
          <Lottie className="lottie-loader" animationData={loadingAnimation} loop />
        ) : (
          <div className="static-loader">•••</div>
        )}
        <h1>{t('generateTitle')}</h1>
        <p className="muted">{t('generateBody')}</p>
        <ol className="generation-steps" aria-live="polite">
          {['understand', 'prepare', 'creating'].map((key, i) => (
            <li key={key} className={i <= step ? 'active' : ''}>
              {i < step ? (
                <Check size={21} />
              ) : i === step ? (
                <LoaderCircle className="spinner" size={21} />
              ) : (
                <Circle size={21} />
              )}
              <span>{t(key)}</span>
              {i < step && <span className="step-done">✓</span>}
            </li>
          ))}
        </ol>
        <p className="demo-note">{t('generateNote')}</p>
        <Link to="/create" className="text-link">
          {t('cancel')}
        </Link>
      </div>
    </div>
  )
}
