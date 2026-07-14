import React from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { NomiLoadingMark } from './design'
import { buildStudioUrl } from './utils/appRoutes'
import { getAppRoutePath } from './utils/routes'
import { lazyWithChunkBoundary } from './ui/chunkBoundary'
import { useI18n } from './i18n/i18nContext'

const NomiStudioApp = lazyWithChunkBoundary('Main interface', () => import('./workbench/NomiStudioApp'))

function RedirectToStudio(): JSX.Element {
  const location = useLocation()
  return <Navigate to={`${buildStudioUrl()}${location.search || ''}`} replace />
}

function RouteLoading(): JSX.Element {
  const { t } = useI18n()
  const label = t('app.loading')

  return (
    <div
      className="grid h-screen w-screen place-items-center bg-nomi-bg text-nomi-ink font-nomi-sans"
      aria-label={label}
    >
      {/* pending 规范 #1:统一品牌 spinner,杀自写 CSS 圆环 */}
      <NomiLoadingMark size={28} label={label} />
    </div>
  )
}

export default function NomiRouterApp(): JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route
          path={getAppRoutePath('NomiStudioApp')}
          element={(
            <React.Suspense fallback={<RouteLoading />}>
              <NomiStudioApp />
            </React.Suspense>
          )}
        />
        <Route path={getAppRoutePath('RedirectToStudio', '/')} element={<RedirectToStudio />} />
        <Route path={getAppRoutePath('RedirectToStudio', '/workspace/*')} element={<RedirectToStudio />} />
        <Route path={getAppRoutePath('RedirectToStudio', '*')} element={<RedirectToStudio />} />
      </Routes>
    </HashRouter>
  )
}
