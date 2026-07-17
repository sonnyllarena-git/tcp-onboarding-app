import { useState } from 'react'
import LoginPage from './components/LoginPage'

/**
 * Main App Component
 *
 * Routes between different pages of the TCP Onboarding Portal
 * Currently shows LoginPage as entry point
 *
 * @component
 * @returns {React.ReactElement} App component
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    console.log('User authenticated successfully')
    // TODO: Navigate to Dashboard after login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tcp-navy to-blue-900">
      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to TCP Onboarding Portal
            </h1>
            <p className="text-tcp-gold text-lg">
              Dashboard coming next...
            </p>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="mt-8 btn-primary"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
