import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from '@/pages/Login/Login'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Estoque from '@/pages/Estoque/Estoque'
import Movimentacao from '@/pages/Movimentacao/Movimentacao'
import Relatorios from '@/pages/Relatorios/Relatorios'
import Configuracoes from '@/pages/Configuracoes/Configuracoes'
import Sidebar from '@/components/Sidebar/Sidebar'

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [key, val] = cookie.trim().split('=')
    if (key === name) return val ? decodeURIComponent(val) : null
  }
  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = getCookie('session')
  if (!session) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: '#1e1e1e',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      <Sidebar />
      <main style={{
        flex: 1,
        minWidth: 0,          /* impede que flex item estoure o pai */
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}>
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      } />
      <Route path="/estoque" element={
        <ProtectedRoute><AppLayout><Estoque /></AppLayout></ProtectedRoute>
      } />
      <Route path="/movimentacao" element={
        <ProtectedRoute><AppLayout><Movimentacao /></AppLayout></ProtectedRoute>
      } />
      <Route path="/relatorios" element={
        <ProtectedRoute><AppLayout><Relatorios /></AppLayout></ProtectedRoute>
      } />
      <Route path="/config" element={
        <ProtectedRoute><AppLayout><Configuracoes /></AppLayout></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App