import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Globe2, Heart, Languages, MapPin, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { useCulture } from './ThemeProvider'
import { AnimatedBackground } from './AnimatedBackground'
export function Hero() {
  const { t } = useTranslation()
  const { currentTheme: theme, country, source, loading, motion } = useCulture()
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced || !motion) return
    const entrances: Record<string, gsap.TweenVars> = {
      ink: { opacity: 0, scale: 0.96, filter: 'blur(4px)' },
      unfold: { opacity: 0, rotateX: 12, y: 18 },
      celebrate: { opacity: 0, scale: 0.92, rotate: -2 },
      letter: { opacity: 0, rotate: -4, y: 25 },
      draw: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
      fade: { opacity: 0, y: 18 },
    }
    const context = gsap.context(() => {
      gsap.from('.hero-reveal', {
        y: 20,
        opacity: 0,
        stagger: 0.11,
        duration: 0.75,
        ease: 'power2.out',
        clearProps: 'all',
      })
      gsap.from('.postcard-stage', {
        ...entrances[theme.animation.entrance],
        duration: 1,
        ease: 'power2.out',
        clearProps: 'all',
      })
    }, root)
    return () => context.revert()
  }, [motion, reduced, theme.animation.entrance])
  const sourceKeys: Record<string, string> = {
    mock: 'locationMock',
    remote: 'locationRemote',
    fallback: 'locationFallback',
    manual: 'locationManual',
  }
  return (
    <section className="hero container" ref={root}>
      <div className="hero-copy">
        <div className="hero-eyebrow hero-reveal">
          <span className="tiny-spark">✳</span>
          {t('homeEyebrow')}
        </div>
        <h1 className="hero-reveal">
          {t('heroTitle')}
          <br />
          <em>{t('heroAccent')}</em>
        </h1>
        <p className="hero-description hero-reveal">{t('heroDescription')}</p>
        <div className="hero-buttons hero-reveal">
          <Link to="/create" className="button">
            {t('create')}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="hero-proof hero-reveal">
          <span>
            <Globe2 />
            {t('featureCulture')}
          </span>
          <span>
            <Languages />
            {t('featureLanguage')}
          </span>
          <span>
            <Heart />
            {t('featurePersonal')}
          </span>
        </div>
      </div>
      <div className="hero-visual">
        <div className="orbit-text">{t('connectionNote')}</div>
        <div className="postcard-stage">
          <div className="postcard-paper">
            <div className="postcard-top">
              <span>{t('postalClub')}</span>
              <span>{theme.country} — 001</span>
            </div>
            <div className="postcard-art">
              <img
                src={theme.assets.background}
                alt={t(`theme.${theme.country}`)}
                width="800"
                height="500"
              />
              <AnimatedBackground />
              <div className="art-caption">
                <span>{t(`country.${country}`)}</span>
                <small>{t(`theme.${country}`)}</small>
              </div>
              <span className="postage-stamp">
                <Globe2 size={24} />
                <span>{t('withLove')}</span>
              </span>
            </div>
            <div className="postcard-greeting">
              <span>{theme.greeting}</span>
              <Heart size={16} />
            </div>
          </div>
          <div className="postcard-shadow" />
        </div>
        <div className="location-float">
          <span className="location-icon">
            <MapPin size={19} />
          </span>
          <div>
            <span className="location-label">
              {loading ? t('locating') : t(sourceKeys[source] ?? 'locationMock')}
            </span>
            <strong>
              {t(`country.${country}`)}
              <span className="live-dot" />
            </strong>
          </div>
          <Link to="/settings" aria-label={t('change')}>
            <ArrowUpRight size={19} />
          </Link>
        </div>
        <div className="made-for-you">
          <Sparkles size={15} />
          {t('cultureMatch')}
        </div>
      </div>
    </section>
  )
}
