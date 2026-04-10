import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LOCATIONS, getProfile, createRoom, getRooms } from '../store'
import MapView from '../components/MapView'

export default function SearchPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ from: '', to: '', time: '', seats: '4' })
  const [mode, setMode] = useState('search') // 'search' | 'create'
  const [roomName, setRoomName] = useState('')

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))



  const handleSearch = (e) => {
    e.preventDefault()
    if (!form.from || !form.to) {
      window.__showToast?.('Please select From and To locations')
      return
    }
    if (form.from === form.to) {
      window.__showToast?.('From and To cannot be the same!')
      return
    }
    navigate('/app/rides', { state: { filter: { from: form.from, to: form.to } } })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const profile = await getProfile()
    if (!profile) {
      window.__showToast?.('💡 Set up your profile first!')
      setTimeout(() => navigate('/app/profile'), 800)
      return
    }
    if (!form.from || !form.to || !form.time) {
      window.__showToast?.('Please fill all fields')
      return
    }
    if (form.from === form.to) {
      window.__showToast?.('From and To cannot be the same!')
      return
    }
    try {
      const room = await createRoom({
        from: form.from,
        to: form.to,
        time: form.time,
        seats: parseInt(form.seats),
      })
      window.__showToast?.('🎉 Room created!')
      setTimeout(() => navigate(`/app/room/${room.id}`), 600)
    } catch (err) {
      window.__showToast?.('❌ Error creating room')
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
          {mode === 'search' ? <>Search <span>Ride</span></> : <>Create <span>Room</span></>}
        </h1>
        <p className="page-subtitle">
          {mode === 'search' ? 'Find available cab rides near you' : 'Create a new cab sharing room'}
        </p>
      </div>

      <div className="profile-grid">
        {/* Top Toggle (Full Width) */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div className="widget-tabs" style={{ maxWidth: '400px' }}>
            <button className={mode === 'search' ? 'active' : ''} onClick={() => setMode('search')}>Search</button>
            <button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>Create</button>
          </div>
        </div>

        {/* Left Column: Input Form */}
        <div className="animate-in">
          <form className="widget-form" onSubmit={mode === 'search' ? handleSearch : handleCreate}>
            <div className="widget-input-group">
              <label>Pickup From</label>
              <select name="from" className="widget-select" value={form.from} onChange={handleChange}>
                <option value="">Select pickup location</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="widget-input-group">
              <label>Drop To</label>
              <select name="to" className="widget-select" value={form.to} onChange={handleChange}>
                <option value="">Select drop location</option>
                {LOCATIONS.filter(l => l !== form.from).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="widget-input-group">
              <label>Departure Time</label>
              <input name="time" type="time" className="widget-input" value={form.time} onChange={handleChange} />
            </div>

            {mode === 'create' && (
              <div className="widget-input-group animate-in">
                <label>Available Seats</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[2, 3, 4, 6].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, seats: String(s) }))}
                      style={{
                        flex: 1, height: '48px', borderRadius: '12px',
                        border: `1px solid ${form.seats === String(s) ? 'var(--primary)' : '#EEE'}`,
                        background: form.seats === String(s) ? 'var(--primary-glow)' : '#FAFAFA',
                        color: form.seats === String(s) ? 'var(--primary)' : '#888',
                        fontWeight: 700, cursor: 'pointer'
                      }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="widget-main-btn" style={{ width: '100%', marginTop: 24, fontSize: '18px' }}>
              {mode === 'search' ? 'Search Rides ➔' : 'Create Room 🚀'}
            </button>
          </form>
        </div>

        {/* Right Column: Map Preview */}
        <div className="animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%', border: '4px solid #FFF', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <MapView from={form.from} to={form.to} height="100%" minHeight="400px" />
          </div>
        </div>
      </div>
    </div>
  )
}
