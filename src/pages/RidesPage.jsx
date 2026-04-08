import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getRooms, timeLeft, isUrgent, getProfile, joinRoom } from '../store'
import MapView from '../components/MapView'

export default function RidesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const filter = location.state?.filter || null

  const [tab, setTab] = useState('all')
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
      setTimeout(() => navigate('/profile'), 800)
      return
    }
    const already = room.passengers.some(pass => pass.id === p.id)
    if (already) {
      navigate(`/room/${room.id}`)
      return
    }
    try {
      await joinRoom(room.id)
      window.__showToast?.('🎉 Joined room!')
      setTimeout(() => navigate(`/room/${room.id}`), 600)
    } catch (err) {
      window.__showToast?.('❌ Error joining room')
      console.error(err)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          🚗 <span>Rides</span>
          <button
            id="refresh-rides"
            onClick={() => setRooms(getRooms())}
            style={{
              marginLeft: 12, background: 'none', border: 'none',
              color: 'var(--primary)', cursor: 'pointer', fontSize: 20,
              padding: 4, borderRadius: 8,
            }}
            title="Refresh"
          >⟳</button>
        </h1>
        <p className="page-subtitle">
          {filter ? `Showing rides from ${filter.from || 'anywhere'} → ${filter.to || 'anywhere'}` : 'All available cab rooms'}
        </p>
      </div>

      {filter && (
        <div style={{ padding: '0 20px 16px' }}>
          <MapView from={filter.from} to={filter.to} height="120px" />
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          id="tab-all-rooms"
          className={`tab-btn${tab === 'all' ? ' active' : ''}`}
          onClick={() => setTab('all')}
        >All Rooms ({filteredRooms.length})</button>
        <button
          id="tab-your-rooms"
          className={`tab-btn${tab === 'mine' ? ' active' : ''}`}
          onClick={() => setTab('mine')}
        >Your Rooms ({myRooms.length})</button>
      </div>

      <div className="section">
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 100, color: 'var(--text-muted)' }}>
            <div className="animate-pulse" style={{ fontSize: 40, marginBottom: 12 }}>🚕</div>
            <div>Loading rides from database...</div>
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state animate-in">
            <div className="empty-icon">🚕</div>
            <div className="empty-title">No rooms found</div>
            <div className="empty-desc">
              {tab === 'mine'
                ? 'You have not joined any rooms yet'
                : 'No rides match your search. Try creating one!'}
            </div>
            <button
              className="btn btn-outline"
              style={{ marginTop: 20, width: 'auto', padding: '12px 28px' }}
              onClick={() => navigate('/search')}
            >➕ Create Room</button>
          </div>
        ) : (
          displayed.map((room, i) => {
            const tl = timeLeft(room)
            const urgent = isUrgent(room)
            const isMember = room.passengers.some(p => p.mobile === profile?.mobile)
            const isFull = room.passengers.length >= room.seats

            return (
              <div
                key={room.id}
                className="ride-card animate-in"
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => navigate(`/room/${room.id}`)}
              >
                {/* Owner */}
                <div className="owner-badge">
                  <div className="owner-avatar">{room.owner[0]}</div>
                  <span>{room.owner}</span>
                  {isMember && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 6,
                      background: 'var(--primary-glow)', color: 'var(--primary)',
                      border: '1px solid rgba(0,230,118,0.3)',
                    }}>Joined</span>
                  )}
                </div>

                {/* Route */}
                <div className="ride-route">
                  <div className="route-dot from" />
                  <span className="route-name">{room.from}</span>
                  <div style={{ flex: 1, borderTop: '1px dashed var(--border)', margin: '0 4px' }} />
                  <span className="route-arrow">→</span>
                  <div style={{ flex: 1, borderTop: '1px dashed var(--border)', margin: '0 4px' }} />
                  <div className="route-dot to" />
                  <span className="route-name">{room.to}</span>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div className="ride-meta">
                    <span className="ride-meta-item">⏰ {room.time}</span>
                    <span className="ride-meta-item">👥 {room.passengers.length}/{room.seats}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`time-badge${urgent ? ' urgent' : ''}`}>{tl}</span>
                  </div>
                </div>



                {/* Action */}
                <button
                  id={`join-btn-${room.id}`}
                  className={`btn ${isMember ? 'btn-secondary' : isFull ? 'btn-danger' : 'btn-primary'}`}
                  style={{ marginTop: 14 }}
                  onClick={(e) => !isFull ? handleJoin(e, room) : e.stopPropagation()}
                  disabled={isFull && !isMember}
                >
                  {isMember ? '💬 Open Room' : isFull ? '🚫 Room Full' : '🚗 Join Room'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
