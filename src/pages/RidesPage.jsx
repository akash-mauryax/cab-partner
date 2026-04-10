import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getRooms, timeLeft, isUrgent, getProfile, joinRoom } from '../store'
import MapView from '../components/MapView'

export default function RidesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const filter = location.state?.filter || null

  const [tab, setTab] = useState(location.state?.tab || 'all')
  const [rooms, setRooms] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const p = await getProfile()
      setProfile(p)
      const data = await getRooms()
      setRooms(data)
      setLoading(false)
    }
    load()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  const myRooms = rooms.filter(r =>
    r.passengers.some(p => p.id === profile?.id)
  )

  const filteredRooms = filter
    ? rooms.filter(r => {
        const matchRoute = (!filter.from || r.from === filter.from)
          && (!filter.to || r.to === filter.to)
        return matchRoute
      })
    : rooms

  const displayed = tab === 'all' ? filteredRooms : myRooms

  const handleJoin = async (e, room) => {
    e.stopPropagation()
    const p = await getProfile()
    if (!p) {
      window.__showToast?.('💡 Set up your profile first!')
      setTimeout(() => navigate('/app/profile'), 800)
      return
    }
    const already = room.passengers.some(pass => pass.id === p.id)
    if (already) {
      navigate(`/app/room/${room.id}`)
      return
    }
    try {
      await joinRoom(room.id)
      window.__showToast?.('🎉 Joined room!')
      setTimeout(() => navigate(`/app/room/${room.id}`), 600)
    } catch (err) {
      window.__showToast?.('❌ Error joining room')
      console.error(err)
    }
  }

  return (
    <div className="profile-immersive">
      {/* Side Decorations */}
      <div className="decoration dec-car-top">🏎️</div>
      <div className="decoration dec-car-bottom">🚕</div>
      <div className="decoration dec-city">🏙️</div>

      <div className="l-rides-header" style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 className="page-title" style={{ fontSize: '42px' }}>
          Available <span>Rides</span>
        </h1>
        <p className="page-subtitle">
          {filter ? `Showing rides from ${filter.from || 'anywhere'} → ${filter.to || 'anywhere'}` : 'Browse all live cab sharing rooms'}
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div className="widget-tabs" style={{ maxWidth: '400px' }}>
            <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>All Rooms</button>
            <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>Your Rooms</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: '#888' }}>
             <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚕</div>
             <p style={{ fontWeight: 500 }}>Fetching live rides...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px', background: '#FFF', borderRadius: '24px', border: '2px dashed #EEE' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🚕</div>
            <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1E1E1E', marginBottom: '12px' }}>No Rides Found</h3>
            <p style={{ color: '#888', marginBottom: '32px' }}>
              {tab === 'mine' ? 'You have not joined any rooms yet.' : 'Try a different route or create your own room!'}
            </p>
            <button className="widget-main-btn" onClick={() => navigate('/app/search')}>➕ Create New Room</button>
          </div>
        ) : (
          <div className="l-rides-grid">
            {displayed.map((room) => {
              const tl = timeLeft(room)
              const urgent = isUrgent(room)
              const isFull = room.passengers.length >= room.seats
              const isMember = room.passengers.some(p => p.id === profile?.id)

              return (
                <div key={room.id} className="l-ride-card" onClick={() => navigate(`/app/room/${room.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="l-ride-badge" style={{ background: '#000', color: '#F9CA1C' }}>{room.owner}</span>
                    <span className={`l-ride-badge ${urgent ? 'urgent' : ''}`} style={{ fontWeight: 800 }}>{tl}</span>
                  </div>
                  
                  <div className="l-ride-route">
                    <span className="l-route-text" style={{ fontSize: '18px' }}>{room.from}</span>
                    <div className="l-route-line"></div>
                    <span className="l-route-text" style={{ fontSize: '18px' }}>{room.to}</span>
                  </div>

                  <div className="l-ride-meta">
                    <div className="l-ride-info">
                      <span>⏰ {room.time}</span>
                      <span>👥 {room.passengers.length}/{room.seats}</span>
                    </div>
                    <button 
                      className="l-ride-join-btn"
                      onClick={(e) => !isFull ? handleJoin(e, room) : e.stopPropagation()}
                      disabled={isFull && !isMember}
                    >
                      {isMember ? 'Open Chat' : isFull ? 'Full' : 'Join Ride'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
