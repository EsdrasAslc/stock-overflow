import { Routes, Route } from 'react-router-dom'
import './App.css'
import Login from '@/pages/Login/Login'
import Dashboard from '@/pages/Dashboard/Dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<> <p> to do </p> </>} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App
