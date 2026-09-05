import { Link, Outlet, useNavigate } from 'react-router-dom'
import { getAuthToken, setAuthToken } from '../api/client'

function Layout() {
  const navigate = useNavigate()
  const isAuthed = Boolean(getAuthToken())

  function handleLogout() {
    setAuthToken(null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand">Moveo</Link>
        <nav>
          {isAuthed ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <button type="button" className="link-button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup" className="nav-cta">Sign up</Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
