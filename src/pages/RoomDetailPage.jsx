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
      if (!r) { navigate('/rides'); return }
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
      navigate('/profile')
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
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 10, width: 38, height: 38, cursor: 'pointer',
            color: 'var(--text)', fontSize: 18, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >←</button>
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>Room Details</h1>
          <p className="page-subtitle">Cab sharing room by {room.owner}</p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 8 }}>

        {/* Route Visual with Map */}
        <div className="animate-in" style={{ marginBottom: 14 }}>
          <MapView from={room.from} to={room.to} height="220px" />

          {/* Notification Banner */}
          <div style={{
            background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 10
          }}>
            <span>📨</span>
            <span><strong style={{ color: 'var(--text)' }}>Member Added</strong> — {room.passengers[room.passengers.length - 1]?.name} is in the room</span>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid animate-in">
          <div className="stat-box">
            <div className="stat-icon">📍</div>
            <div className="stat-value">{estimate.dist}</div>
            <div className="stat-label">Distance</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{estimate.time}</div>
            <div className="stat-label">Est. Time</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">💰</div>
            <div className="stat-value">₹{farePerHead}</div>
            <div className="stat-label">Per Head</div>
          </div>
        </div>

        {/* Passengers */}
        <div className="animate-in" style={{ marginBottom: 16 }}>
          <div className="section-title">Sharing Cab With</div>
          <div className="passenger-list">
            {room.passengers.map((p, i) => (
              <div key={i} className="passenger-item">
                <div className="passenger-avatar">{p.name[0]}</div>
                <div className="passenger-info">
                  <div className="passenger-name">{p.name}</div>
                  <div className="passenger-mobile">{p.mobile}</div>
                </div>
                {p.isOwner && <span className="owner-chip">OWNER</span>}
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, room.seats - room.passengers.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="passenger-item" style={{ opacity: 0.4 }}>
                <div className="passenger-avatar" style={{ background: 'var(--bg-input)', border: '1px dashed var(--border)', fontSize: 18 }}>+</div>
                <div className="passenger-info">
                  <div className="passenger-name" style={{ color: 'var(--text-dim)' }}>Empty slot</div>
                  <div className="passenger-mobile">Available</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Join button if not member */}
        {!isMember && room.passengers.length < room.seats && (
          <button id="join-room-btn" className="btn btn-primary" style={{ marginBottom: 16 }} onClick={handleJoin}>
            🚗 Join This Room
          </button>
        )}

        {/* Chat */}
        <div className="animate-in">
          <div className="section-title" style={{ marginBottom: 8 }}>💬 Chat Room</div>
          <div className="chat-container">
            <div className="chat-messages" ref={chatRef}>
              {room.chat.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, marginTop: 40 }}>
                  No messages yet. Say hi! 👋
                </div>
              )}
              {room.chat.map((m, i) => {
                const mine = m.mine || m.sender === profile?.name
                return (
                  <div key={i} className={`chat-msg ${mine ? 'mine' : 'theirs'}`}>
                    {!mine && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, paddingLeft: 4 }}>
                        {m.sender}
                      </div>
                    )}
                    <div className="chat-bubble">{m.text}</div>
                    <div className="chat-meta">{m.time}</div>
                  </div>
                )
              })}
            </div>

            <div className="chat-input-bar">
              <input
                id="chat-input"
                className="chat-input"
                placeholder={isMember ? 'Type a message...' : 'Join room to chat'}
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isMember}
              />
              <button
                id="chat-send-btn"
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!isMember}
              >➤</button>
            </div>
          </div>
        </div>

        {/* Fare breakdown */}
        <div className="card animate-in" style={{ marginTop: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>💳 Fare Breakdown</div>
          {[['Base Fare', `₹${estimate.fare}`], ['Passengers', `${room.passengers.length}`], ['Per Head', `₹${farePerHead}`]].map(([label, val]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid var(--border)',
              fontSize: 14, color: 'var(--text-muted)'
            }}>
              <span>{label}</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '12px 0 0', fontSize: 16, fontWeight: 700
          }}>
            <span style={{ color: 'var(--text)' }}>You Pay</span>
            <span style={{ color: 'var(--primary)' }}>₹{farePerHead}</span>
          </div>
        </div>

      </div>
    </div>
  )
}
