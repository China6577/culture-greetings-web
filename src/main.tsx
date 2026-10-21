import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './styles.css'
import './studio.css'
import './generated-card.css'
import './hero.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
