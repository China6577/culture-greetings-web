import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowUpRight, Mail, Menu, Settings2, X } from 'lucide-react'
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
        </nav>
        <div className="header-actions">
          <CountrySwitcher />
          <NavLink
            to="/settings"
            end
            className="icon-button settings-link"
            aria-label={t('navSettings')}
            title={t('navSettings')}
          >
            <Settings2 size={18} />
          </NavLink>
          <Link to="/create" className="button button-small header-create">
            {t('create')}
            <ArrowUpRight size={16} />
          </Link>
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
            ['/settings', 'navSettings'],
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
