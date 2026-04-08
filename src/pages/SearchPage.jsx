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
    navigate('/rides', { state: { filter: { from: form.from, to: form.to } } })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const profile = await getProfile()
    if (!profile) {
      window.__showToast?.('💡 Set up your profile first!')
      setTimeout(() => navigate('/profile'), 800)
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
      setTimeout(() => navigate(`/room/${room.id}`), 600)
    } catch (err) {
      window.__showToast?.('❌ Error creating room')
      console.error(err)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          {mode === 'search' ? <>🔍 Search <span>Ride</span></> : <>➕ Create <span>Room</span></>}
        </h1>
        <p className="page-subtitle">
          {mode === 'search' ? 'Find available cab rides near you' : 'Create a new cab sharing room'}
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{ padding: '4px 20px 0' }}>
        <div className="tabs" style={{ margin: 0 }}>
          <button
            id="mode-search"
            className={`tab-btn${mode === 'search' ? ' active' : ''}`}
            onClick={() => setMode('search')}
          >🔍 Search</button>
          <button
            id="mode-create"
            className={`tab-btn${mode === 'create' ? ' active' : ''}`}
            onClick={() => setMode('create')}
          >➕ Create Room</button>
        </div>
      </div>

      <div className="section">
        <form onSubmit={mode === 'search' ? handleSearch : handleCreate}>

          {/* Route Picker */}
          <div className="card animate-in" style={{ marginBottom: 16, padding: '20px' }}>
            {/* From */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)'
                }} />
                <div style={{ width: 2, height: 26, background: 'var(--border)', borderRadius: 2 }} />
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'var(--danger)', boxShadow: '0 0 8px var(--danger)'
                }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: 4 }}>From</label>
                  <select id="from-select" name="from" className="form-select" value={form.from} onChange={handleChange}>
                    <option value="">Select pickup location</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: 4 }}>To</label>
                  <select id="to-select" name="to" className="form-select" value={form.to} onChange={handleChange}>
                    <option value="">Select drop location</option>
                    {LOCATIONS.filter(l => l !== form.from).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Map Preview */}
            {(form.from && form.to) && (
              <div className="animate-in" style={{ marginBottom: 16 }}>
                <MapView from={form.from} to={form.to} height="160px" />
              </div>
            )}

            {/* Time (for both modes) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Departure Time</label>
              <input
                id="time-input"
                name="time"
                type="time"
                className="form-input"
                value={form.time}
                onChange={handleChange}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Seats — only for create */}
          {mode === 'create' && (
            <div className="form-group animate-in">
              <label className="form-label">Available Seats</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[2, 3, 4, 6].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, seats: String(s) }))}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      border: `1px solid ${form.seats === String(s) ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: form.seats === String(s) ? 'var(--primary-glow)' : 'var(--bg-input)',
                      color: form.seats === String(s) ? 'var(--primary)' : 'var(--text-muted)',
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}



          <button
            id={mode === 'search' ? 'search-btn' : 'create-room-btn'}
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: 4 }}
          >
            {mode === 'search' ? '🚗 Search Rides' : '🚀 Create Room'}
          </button>
        </form>
      </div>
    </div>
  )
}
