import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, saveProfile } from '../store'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', gender: 'MALE', age: '', mobile: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const p = await getProfile()
      if (p) { setForm(p); setSaved(true) }
    }
    load()
  }, [])

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const setGender = (g) => setForm(f => ({ ...f, gender: g }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.mobile) {
      window.__showToast?.('Please fill Name and Mobile')
      return
    }
    try {
      await saveProfile(form)
      setSaved(true)
      window.__showToast?.('✅ Profile saved!')
      setTimeout(() => navigate('/search'), 800)
    } catch (err) {
      window.__showToast?.('❌ Error saving profile')
      console.error(err)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Personal <span>Details</span></h1>
        <p className="page-subtitle">Set up your profile to start sharing rides</p>
      </div>

      <div className="section">
        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), #00bfa5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 800, color: '#0a0f0d',
            margin: '0 auto 10px',
            boxShadow: '0 0 30px rgba(0,230,118,0.3)',
          }}>
            {form.name ? form.name[0].toUpperCase() : '?'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {saved ? '✅ Profile active' : 'Complete your profile'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="animate-in">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="profile-name"
              name="name"
              className="form-input"
              placeholder="e.g. Sherlock Holmes"
              value={form.name}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <div className="radio-group">
              {['MALE', 'FEMALE', 'OTHER'].map(g => (
                <label
                  key={g}
                  className={`radio-option${form.gender === g ? ' selected' : ''}`}
                  onClick={() => setGender(g)}
                >
                  <input type="radio" name="gender" value={g} readOnly />
                  <span>{g === 'MALE' ? '♂' : g === 'FEMALE' ? '♀' : '⚧'}</span>
                  <span style={{ fontSize: 12 }}>{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Age</label>
            <input
              id="profile-age"
              name="age"
              type="number"
              className="form-input"
              placeholder="e.g. 21"
              value={form.age}
              onChange={handleChange}
              min="16" max="60"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              id="profile-mobile"
              name="mobile"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={form.mobile}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>

          <button id="profile-save-btn" type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
            {saved ? '💾 Update Profile' : '🚀 Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
