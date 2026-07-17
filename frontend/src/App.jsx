import { useState } from 'react'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'

/**
 * Main App Component
 *
 * Routes between different pages of the TCP Onboarding Portal.
 * Shows LoginPage until authentication succeeds, then Dashboard.
 *
 * @component
 * @returns {React.ReactElement} App component
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState('User')

  const handleLoginSuccess = (user) => {
    setUserName(user?.name || 'User')
    setIsAuthenticated(true)
  }

  return (
    <>
      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard userName={userName} />
      )}
    </>
  )
}

export default App
