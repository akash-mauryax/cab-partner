import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import RidesPage from './pages/RidesPage'
import RoomDetailPage from './pages/RoomDetailPage'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<Layout />}>
        <Route index element={<Navigate to="/app/search" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="rides" element={<RidesPage />} />
        <Route path="room/:id" element={<RoomDetailPage />} />
      </Route>
      {/* Fallback to landing if route not found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
