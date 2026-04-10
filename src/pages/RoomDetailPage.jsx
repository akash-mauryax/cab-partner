import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoomById, sendMessage, getProfile, now, joinRoom, getRooms } from '../store'
import { supabase } from '../lib/supabase'
import MapView from '../components/MapView'

const FARE_TABLE = {
  'IIIT-A|Airport': { dist: '18 km', time: '35 min', fare: 260 },
  'Sangam|Airport': { dist: '12 km', time: '25 min', fare: 180 },
  'MNNIT|Railway Junc.': { dist: '9 km', time: '20 min', fare: 148 },
  'Civil Lines|Sangam': { dist: '7 km', time: '18 min', fare: 124 },
}

function getEstimate(from, to) {
  const key = `${from}|${to}`
  const rev = `${to}|${from}`
  return FARE_TABLE[key] || FARE_TABLE[rev] || {
    dist: `${Math.floor(Math.random() * 15) + 5} km`,
    time: `${Math.floor(Math.random() * 30) + 10} min`,
    fare: Math.floor(Math.random() * 200) + 80,
  }
}

export default function RoomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [msg, setMsg] = useState('')
  const [profile, setProfile] = useState(null)
  const chatRef = useRef(null)

  useEffect(() => {
    async function load() {
      const p = await getProfile()
      setProfile(p)
      const r = await getRoomById(id)
      if (!r) { navigate('/app/rides'); return }
      setRoom(r)
    }
    load()

    // Real-time subscription for messages and room updates
    const channel = supabase
      .channel(`room:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${id}` }, () => {
        load()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_passengers', filter: `room_id=eq.${id}` }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [room?.chat?.length])

  if (!room) return null

  const estimate = getEstimate(room.from, room.to)
  const isMember = room.passengers.some(p => p.id === profile?.id)
  const farePerHead = room.passengers.length > 0
    ? Math.round(estimate.fare / room.passengers.length)
    : estimate.fare

  const handleSend = async () => {
    if (!msg.trim()) return
    const p = await getProfile()
    if (!p) {
      window.__showToast?.('Set up your profile to chat!')
      return
    }
    try {
      await sendMessage(id, msg.trim())
      setMsg('')
      // Room will update via real-time subscription
    } catch (err) {
      window.__showToast?.('❌ Error sending message')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleJoin = async () => {
    const p = await getProfile()
    if (!p) {
      window.__showToast?.('Set up your profile first!')
      navigate('/app/profile')
      return
    }
    try {
      await joinRoom(id)
      window.__showToast?.('🎉 You joined the room!')
      // Room will update via real-time subscription
    } catch (err) {
      window.__showToast?.('❌ Error joining room')
    }
  }

  return (
    <div className="profile-immersive" style={{ paddingBottom: '100px' }}>
      {/* Side Decorations */}
      <div className="decoration dec-car-top">🏎️</div>
      <div className="decoration dec-car-bottom">🚕</div>
      <div className="decoration dec-city">🏙️</div>

      {/* Header Area */}
      <div className="l-rides-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 40, position: 'relative', zIndex: 2 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#FFF', border: '1px solid #EEE',
            borderRadius: 12, width: 44, height: 44, cursor: 'pointer',
            color: '#1E1E1E', fontSize: 20, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            position: 'absolute', left: '10%'
          }}
        >←</button>
        <div style={{ textAlign: 'center' }}>
          <h1 className="page-title" style={{ fontSize: '32px' }}>Room <span>Details</span></h1>
          <p className="page-subtitle">Hosted by {room.owner}</p>
        </div>
      </div>

      <div className="profile-grid" style={{ alignItems: 'start' }}>
        
        {/* Left Column: Ride Info */}
        <div className="animate-in">
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            <MapView from={room.from} to={room.to} height="240px" />
            <div style={{
              padding: '12px 20px', background: 'rgba(249, 202, 28, 0.1)', 
              fontSize: 13, color: '#666', borderTop: '1px solid #EEE',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <span><strong>Route:</strong> {room.from} ➔ {room.to}</span>
            </div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-box">
              <div className="stat-icon" style={{ fontSize: 24 }}>📏</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{estimate.dist}</div>
              <div className="stat-label">Distance</div>
            </div>
            <div className="stat-box">
              <div className="stat-icon" style={{ fontSize: 24 }}>⏳</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{estimate.time}</div>
              <div className="stat-label">Est. Time</div>
            </div>
            <div className="stat-box">
              <div className="stat-icon" style={{ fontSize: 24 }}>💵</div>
              <div className="stat-value" style={{ fontSize: 20, color: 'var(--brand-dark)' }}>₹{farePerHead}</div>
              <div className="stat-label">Per Head</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-title" style={{ color: '#1E1E1E', marginBottom: 16 }}>👥 Sharing With</div>
            <div className="passenger-list">
              {room.passengers.map((p, i) => (
                <div key={i} className="passenger-item" style={{ background: '#F9F9F9' }}>
                  <div className="passenger-avatar" style={{ background: 'var(--primary)', color: '#1E1E1E' }}>{p.name[0]}</div>
                  <div className="passenger-info">
                    <div className="passenger-name" style={{ fontWeight: 700 }}>{p.name}</div>
                    <div className="passenger-mobile" style={{ fontSize: 12 }}>{p.mobile}</div>
                  </div>
                  {p.isOwner && <span className="owner-chip" style={{ background: '#000', color: '#F9CA1C' }}>OWNER</span>}
                </div>
              ))}
            </div>
            {!isMember && room.passengers.length < room.seats && (
              <button className="widget-main-btn" style={{ width: '100%', marginTop: 20 }} onClick={handleJoin}>
                🚗 Join This Ride
              </button>
            )}
          </div>

          <div className="card">
            <div className="section-title" style={{ color: '#1E1E1E', marginBottom: 12 }}>💳 Payment Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F5F5', fontSize: 15 }}>
              <span style={{ color: '#888' }}>Base Fare</span>
              <span style={{ fontWeight: 600 }}>₹{estimate.fare}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F5F5', fontSize: 15 }}>
              <span style={{ color: '#888' }}>Split Between</span>
              <span style={{ fontWeight: 600 }}>{room.passengers.length} Persons</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontSize: 18, fontWeight: 800 }}>
              <span>Total Per Person</span>
              <span style={{ color: 'var(--brand-dark)' }}>₹{farePerHead}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Room */}
        <div className="animate-in" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="section-title" style={{ color: '#1E1E1E', padding: '0 4px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
             <span>💬</span> Live Chat Room
          </div>
          <div className="chat-container" style={{ flex: 1, minHeight: '500px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <div className="chat-messages" ref={chatRef} style={{ flex: 1, padding: '20px' }}>
              {room.chat.length === 0 && (
                <div style={{ textAlign: 'center', color: '#AAA', marginTop: 100 }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
                  No messages yet. Be the first to say hi!
                </div>
              )}
              {room.chat.map((m, i) => {
                const mine = m.mine || m.sender === profile?.name
                return (
                  <div key={i} className={`chat-msg ${mine ? 'mine' : 'theirs'}`}>
                    {!mine && <div style={{ fontSize: 11, color: '#888', marginBottom: 4, paddingLeft: 4 }}>{m.sender}</div>}
                    <div className="chat-bubble" style={{ borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '12px 16px' }}>
                      {m.text}
                    </div>
                    <div className="chat-meta" style={{ fontSize: 10, marginTop: 4 }}>{m.time}</div>
                  </div>
                )
              })}
            </div>

            <div className="chat-input-bar" style={{ padding: '16px', borderTop: '1px solid #EEE' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="widget-input"
                  style={{ borderRadius: '12px', background: '#F5F5F5' }}
                  placeholder={isMember ? 'Write something...' : 'Join ride to chat'}
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!isMember}
                />
                <button
                  className="widget-main-btn"
                  style={{ width: '54px', height: '54px', borderRadius: '12px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={handleSend}
                  disabled={!isMember}
                >➤</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
