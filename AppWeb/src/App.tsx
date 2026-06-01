import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from '@/pages/Login/Login'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Estoque from '@/pages/Estoque/Estoque'
import Movimentacao from '@/pages/Movimentacao/Movimentacao'
import Sidebar from '@/components/Sidebar/Sidebar'

// ─── Lê cookie ────────────────────────────────────────────────────────────────
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// ─── Rota protegida ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getCookie('session')) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── Layout com sidebar ───────────────────────────────────────────────────────
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1e1e1e', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/estoque" element={
        <ProtectedRoute>
          <AppLayout><Estoque /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/movimentacao" element={
        <ProtectedRoute>
          <AppLayout><Movimentacao /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App