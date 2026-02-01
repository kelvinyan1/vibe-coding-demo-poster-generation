import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './components/Login'
import Chat from './components/Chat'
import { getToken } from './utils/auth'

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const token = getToken()
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  // 当路由变化时，重新检查认证状态
  useEffect(() => {
    const token = getToken()
    setIsAuthenticated(!!token)
  }, [location])

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: 'white'
    }}>Loading...</div>
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={<Login onLogin={() => setIsAuthenticated(true)} />} 
      />
      <Route 
        path="/chat" 
        element={
          isAuthenticated ? (
            <Chat onLogout={() => setIsAuthenticated(false)} />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
