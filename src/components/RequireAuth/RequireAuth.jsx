import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location          = useLocation()

  if (loading) {
    return (
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        height:         '100dvh',
        background:     'var(--bg)',
        flexDirection:  'column',
        gap:            12,
      }}>
        <span
          className="mi"
          style={{ fontSize: '2rem', color: 'var(--accent)', animation: 'spin 1s linear infinite' }}
        >
          autorenew
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Not logged in — redirect to login ─────────────────────
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ── Logged in — render the protected page ─────────────────
  return children
}
