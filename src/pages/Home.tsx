import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Hero } from '../components/Hero'

export default function Home() {
  const { t } = useTranslation()
  return (
    <>
      <Hero />
      <section className="closing-cta container">
        <div>
          <p className="eyebrow">{t('ctaEyebrow')}</p>
          <h2>{t('ctaTitle')}</h2>
          <p>{t('ctaBody')}</p>
        </div>
        <Link to="/create" className="button">
          {t('create')}
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  )
}
