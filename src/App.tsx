import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ThemeProvider, useCulture } from './components/ThemeProvider'
import { Header } from './components/Header'
import Home from './pages/Home'
import MyCards from './pages/MyCards'
import { clearLegacyDrafts } from './features/card-generation/session'
const CreateCard = lazy(() => import('./pages/CreateCard'))
const Generate = lazy(() => import('./pages/Generate'))
const CardViewer = lazy(() => import('./pages/CardViewer'))
function Layout() {
  const location = useLocation()
  const { t } = useTranslation()
  const { motion: motionEnabled } = useCulture()
  const reduced = useReducedMotion()
  useEffect(() => {
    clearLegacyDrafts()
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  useEffect(() => {
    const pageTitles: Record<string, string> = {
      '/': 'navHome',
      '/create': 'navCreate',
      '/generate': 'generatePageTitle',
      '/cards': 'navCards',
    }
    const titleKey = location.pathname.startsWith('/card/')
      ? 'cardPageTitle'
      : (pageTitles[location.pathname] ?? 'notFound')
    document.title = `${t('brandName')} · ${t(titleKey)}`
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t('heroDescription'))
  }, [location.pathname, t])
  return (
    <MotionConfig reducedMotion={motionEnabled ? 'user' : 'always'}>
      <a className="skip-link" href="#main">
        {t('skipMain')}
      </a>
      <Header />
      <motion.main
        id="main"
        key={location.pathname}
        initial={!motionEnabled || reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              <LoaderCircle className="spinner" /> {t('loadingPage')}
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateCard />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/card/:id" element={<CardViewer />} />
            <Route path="/cards" element={<MyCards />} />
            <Route path="/culture" element={<Navigate to="/" replace />} />
            <Route path="/settings" element={<Navigate to="/" replace />} />
            <Route
              path="*"
              element={
                <div className="empty-page">
                  <h1>{t('notFound')}</h1>
                  <Link to="/">{t('backHome')}</Link>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </motion.main>
      <footer className="container site-footer">
        <Link to="/" className="footer-brand">
          {t('brandName')} <span>{t('brandTagline')}</span>
        </Link>
        <p>{t('footer')}</p>
      </footer>
    </MotionConfig>
  )
}
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Layout />
      </ThemeProvider>
    </BrowserRouter>
  )
}
