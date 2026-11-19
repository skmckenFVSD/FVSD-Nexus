import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { DesignSystemExamples } from './design-system/DesignSystemExamples'
import './styles/tokens.css'
import './styles/responsive.css'
import './styles/ui.css'
import './styles/layout.css'
import './index.css'

const query = new URLSearchParams(window.location.search)
const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
const showDesignSystemExamples = isLocalHost && query.has('design-system')
const showShellPreview = isLocalHost
  && (window.location.pathname === '/shell-preview' || query.has('shell-preview'))
const HighDensityShellPreview = lazy(() => import('./design-system/HighDensityShellPreview')
  .then((module) => ({ default: module.HighDensityShellPreview })))

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    {showShellPreview ? (
      <Suspense fallback={<div role="status">Loading shell preview…</div>}>
        <HighDensityShellPreview />
      </Suspense>
    ) : showDesignSystemExamples ? <DesignSystemExamples /> : <App />}
  </StrictMode>,
)
