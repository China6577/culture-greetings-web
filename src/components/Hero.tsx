import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Globe2, Heart, Languages, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { useCulture } from './ThemeProvider'
import { AnimatedBackground } from './AnimatedBackground'
export function Hero() {
  const { t } = useTranslation()
  const { currentTheme: theme, country, motion } = useCulture()
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
  return (
    <section className="hero container" ref={root}>
      <div className="hero-copy">
        <div className="hero-eyebrow hero-reveal">
          <Mail size={16} strokeWidth={1.5} />
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
            <span className="hero-button-arrow">
              <ArrowRight size={20} />
            </span>
          </Link>
        </div>
        <p className="hero-start-note hero-reveal">{t('home.startNote')}</p>
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
        <div className="hero-gallery-head">
          <span>{t('home.inspiration')}</span>
          <span className="hero-edition">{theme.country}</span>
        </div>
        <div className="postcard-stage">
          <div className="postcard-paper">
            <div className="postcard-top">
              <span>{t('brandName')}</span>
              <Mail size={17} strokeWidth={1.25} />
            </div>
            <div className="postcard-art">
              <img
                src={theme.assets.background}
                alt={t(`theme.${theme.country}`)}
                width="800"
                height="500"
              />
              <AnimatedBackground />
              <span className="postage-stamp">
                <Globe2 size={22} />
                <span>{t('withLove')}</span>
              </span>
            </div>
            <div className="postcard-greeting">
              <span className="postcard-salutation">{t('home.forSomeone')}</span>
              <span>{theme.greeting}</span>
              <div className="postcard-signature">
                <span />
                <Heart size={15} strokeWidth={1.2} />
              </div>
            </div>
          </div>
        </div>
        <div className="hero-gallery-caption">
          <span>
            <Globe2 size={15} strokeWidth={1.4} />
            {t(`country.${country}`)}
          </span>
          <span>{t(`theme.${country}`)}</span>
        </div>
      </div>
    </section>
  )
}
