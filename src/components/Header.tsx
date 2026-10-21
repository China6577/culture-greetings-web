import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Mail, Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CountrySwitcher } from './CountrySwitcher'
export function Header() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label={t('brandName')}>
          <span className="brand-mark">
            <Mail size={23} strokeWidth={1.4} />
          </span>
          <span className="brand-name">
            {t('brandName')}
            <span>{t('brandTagline')}</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label={t('navHome')}>
          <NavLink to="/" end>
            {t('navHome')}
          </NavLink>
          <NavLink to="/create">{t('navCreate')}</NavLink>
          <NavLink to="/cards">{t('navCards')}</NavLink>
        </nav>
        <div className="header-actions">
          <CountrySwitcher />
          <button
            className="icon-button menu-button"
            aria-label={t(open ? 'menuClose' : 'menuOpen')}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav" onClick={() => setOpen(false)}>
          {[
            ['/', 'navHome'],
            ['/create', 'navCreate'],
            ['/cards', 'navCards'],
          ].map(([path, label]) => (
            <NavLink key={path} to={path} end={path === '/'}>
              {t(label)}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
