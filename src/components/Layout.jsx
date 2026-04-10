import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const tabs = [
  { path: '/app/search', icon: '🔍', label: 'Search' },
  { path: '/app/rides', icon: '🚗', label: 'Rides' },
  { path: '/app/profile', icon: '👤', label: 'Profile' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [toast, setToast] = useState({ show: false, msg: '' })

  // expose global toast
  useEffect(() => {
    window.__showToast = (msg) => {
      setToast({ show: true, msg })
      setTimeout(() => setToast({ show: false, msg: '' }), 2500)
    }
  }, [])

  const pageTitle = {
    '/app/search': 'Search Ride',
    '/app/rides': 'Rides',
    '/app/profile': 'Profile',
  }[location.pathname] || 'Cab Partner'

  const isImmersive = location.pathname === '/app/profile' || location.pathname.startsWith('/app/room/') || location.pathname === '/app/search' || location.pathname === '/app/rides'

  return (
    <div className={`app-container${isImmersive ? ' light-theme full-width' : ''}`}>
      {/* Navbar - Hidden on Immersive Pages per user request */}
      {!isImmersive && (
        <nav className="navbar">
          <div className="navbar-brand" onClick={() => navigate('/app/search')} style={{ cursor: 'pointer' }}>
            <div className="navbar-logo">C</div>
            <span className="navbar-title">Cab Partner</span>
          </div>
          <div className="navbar-actions">
            <button title="Notifications" aria-label="Notifications">🔔</button>
          </div>
        </nav>
      )}

      {/* Page content */}
      <Outlet />

      {/* Tab Bar */}
      <nav className="tab-bar">
        {tabs.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Toast */}
      <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
    </div>
  )
}
