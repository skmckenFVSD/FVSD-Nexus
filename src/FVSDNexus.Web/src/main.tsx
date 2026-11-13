import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { DesignSystemExamples } from './design-system/DesignSystemExamples'
import './styles/tokens.css'
import './styles/responsive.css'
import './styles/ui.css'
import './styles/layout.css'
import './index.css'

const showDesignSystemExamples = import.meta.env.DEV
  && new URLSearchParams(window.location.search).has('design-system')
const showShellPreview = import.meta.env.DEV
  && new URLSearchParams(window.location.search).has('shell-preview')
const HighDensityShellPreview = import.meta.env.DEV
  ? lazy(() => import('./design-system/HighDensityShellPreview').then((module) => ({ default: module.HighDensityShellPreview })))
  : null

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    {showShellPreview && HighDensityShellPreview ? (
      <Suspense fallback={<div role="status">Loading shell preview…</div>}>
        <HighDensityShellPreview />
      </Suspense>
    ) : showDesignSystemExamples ? <DesignSystemExamples /> : <App />}
  </StrictMode>,
)
