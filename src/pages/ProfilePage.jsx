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
      setTimeout(() => navigate('/app/search'), 800)
    } catch (err) {
      window.__showToast?.('❌ Error saving profile')
      console.error(err)
    }
  }

  return (
    <div className="profile-immersive">
      {/* Side Decorations */}
      <div className="decoration dec-car-top">🏎️</div>
      <div className="decoration dec-car-bottom">🚕</div>
      <div className="decoration dec-city">🏙️</div>

      <div className="l-rides-header" style={{ marginBottom: 40 }}>
        <h1 className="page-title" style={{ fontSize: '42px', textAlign: 'center' }}>Personal <span>Details</span></h1>
        <p className="page-subtitle" style={{ textAlign: 'center' }}>Complete your profile to start sharing rides</p>
      </div>

      <div className="profile-grid">
        {/* Header/Avatar Area (Full Width in Grid row) */}
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48, fontWeight: 800, color: '#1E1E1E',
            margin: '0 auto 16px',
            boxShadow: 'var(--shadow-glow)',
            border: '8px solid #FFF'
          }}>
            {form.name ? form.name[0].toUpperCase() : '?'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)' }}>
            {saved ? '✅ Profile active' : 'Complete your profile'}
          </div>
        </div>

        {/* Input Form Column 1 */}
        <div className="widget-form animate-in">
          <div className="widget-input-group">
            <label>Full Name</label>
            <input
              name="name"
              className="widget-input"
              placeholder="e.g. Sherlock Holmes"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="widget-input-group">
            <label>Age</label>
            <input
              name="age"
              type="number"
              className="widget-input"
              placeholder="e.g. 21"
              value={form.age}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Input Form Column 2 */}
        <div className="widget-form animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="widget-input-group">
            <label>Gender</label>
            <div className="widget-tabs" style={{ background: 'transparent', padding: 0 }}>
              {['MALE', 'FEMALE', 'OTHER'].map(g => (
                <button
                  key={g}
                  type="button"
                  className={form.gender === g ? 'active' : ''}
                  style={{ border: '1px solid #EEE', borderRadius: '8px', fontSize: '13px' }}
                  onClick={() => setGender(g)}
                >
                  {g === 'MALE' ? '♂ ' : g === 'FEMALE' ? '♀ ' : '⚧ '} {g}
                </button>
              ))}
            </div>
          </div>

          <div className="widget-input-group">
            <label>Mobile Number</label>
            <input
              name="mobile"
              className="widget-input"
              placeholder="e.g. 9876543210"
              value={form.mobile}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Bottom Button (Full Width) */}
        <div style={{ gridColumn: '1 / -1', marginTop: 20 }}>
          <form onSubmit={handleSubmit}>
            <button type="submit" className="widget-main-btn" style={{ width: '100%', fontSize: '18px' }}>
              {saved ? '💾 Update Profile' : '🚀 Save & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
