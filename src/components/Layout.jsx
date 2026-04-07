import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const tabs = [
  { path: '/search', icon: '🔍', label: 'Search' },
  { path: '/rides', icon: '🚗', label: 'Rides' },
  { path: '/profile', icon: '👤', label: 'Profile' },
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
    '/search': 'Search Ride',
    '/rides': 'Rides',
    '/profile': 'Profile',
  }[location.pathname] || 'Scab'

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/search')} style={{ cursor: 'pointer' }}>
          <div className="navbar-logo">S</div>
          <span className="navbar-title">Scab</span>
        </div>
        <div className="navbar-actions">
          <button title="Notifications" aria-label="Notifications">🔔</button>
        </div>
      </nav>

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
