import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useUserStore } from './store/userStore.js'
import NovaDialog from './components/NovaDialog.jsx'

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const StarMapPage = lazy(() => import('./pages/StarMapPage.jsx'))
const LevelPage = lazy(() => import('./pages/LevelPage.jsx'))
const HallPage = lazy(() => import('./pages/HallPage.jsx'))
const ScientistDetailPage = lazy(() => import('./pages/ScientistDetailPage.jsx'))
const AchievementPage = lazy(() => import('./pages/AchievementPage.jsx'))
const CertificatePage = lazy(() => import('./pages/CertificatePage.jsx'))

function ProtectedRoute({ children }) {
  const user = useUserStore((state) => state.user)
  const location = useLocation()

  if (!user || !user.name) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return (
    <>
      {children}
      <NovaDialog />
    </>
  )
}

function RootRedirect() {
  const user = useUserStore((state) => state.user)
  if (user && user.name) {
    return <Navigate to="/map" replace />
  }
  return <LoginPage />
}

function LoadingFallback() {
  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="float-animation" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌌</div>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-english)' }}>LOADING...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <StarMapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/level/:levelId"
            element={
              <ProtectedRoute>
                <LevelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hall"
            element={
              <ProtectedRoute>
                <HallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scientist/:id"
            element={
              <ProtectedRoute>
                <ScientistDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievement"
            element={
              <ProtectedRoute>
                <AchievementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificate"
            element={
              <ProtectedRoute>
                <CertificatePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
