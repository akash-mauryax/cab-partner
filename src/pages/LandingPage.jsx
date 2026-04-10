import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOCATIONS, createRoom, getProfile, getRooms, timeLeft, isUrgent, joinRoom } from '../store';
import '../styles/landing.css';
import heroImage from '../assets/hero-main.png.jpeg';

const Navbar = () => (
  <nav className="landing-nav">
    <a href="/" className="landing-logo">
      <span>CAB</span> PARTNER
    </a>
    <ul className="nav-links">
      <li><a href="#services">Services</a></li>
      <li><a href="#rides">Browse Rides</a></li>
      <li><a href="#about">About</a></li>
    </ul>
    <div style={{ display: 'flex', gap: '12px' }}>
      <a href="#/app/profile" className="nav-cta" style={{ background: '#FFF', border: '2px solid var(--brand-yellow)' }}>Login</a>
      <a href="#/app/search" className="nav-cta">Get Started</a>
    </div>
  </nav>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const ridesRef = useRef(null);
  
  const [mode, setMode] = useState('search'); // 'search' | 'create'
  const [form, setForm] = useState({ from: '', to: '', time: '', seats: '4' });
  const [toast, setToast] = useState({ show: false, msg: '' });
  
  const [tab, setTab] = useState('all'); // 'all' | 'mine'
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Expose toast logic
  useEffect(() => {
    window.__showToast = (msg) => {
      setToast({ show: true, msg });
      setTimeout(() => setToast({ show: false, msg: '' }), 2500);
    };
  }, []);

  // Fetch Rooms & Profile
  const loadData = async () => {
    const p = await getProfile();
    setProfile(p);
    const data = await getRooms();
    setRooms(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const scrollToRides = (newTab) => {
    setTab(newTab || 'all');
    ridesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!form.from || !form.to) {
      window.__showToast?.('Please select From and To locations');
      return;
    }
    setTab('all');
    ridesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const p = await getProfile();
    if (!p) {
      window.__showToast?.('💡 Set up your profile first!');
      setTimeout(() => navigate('/app/profile'), 800);
      return;
    }
    if (!form.from || !form.to || !form.time) {
      window.__showToast?.('Please fill all fields');
      return;
    }
    try {
      const room = await createRoom({
        from: form.from,
        to: form.to,
        time: form.time,
        seats: parseInt(form.seats),
      });
      window.__showToast?.('🎉 Room created!');
      setTimeout(() => navigate(`/app/room/${room.id}`), 600);
    } catch (err) {
      window.__showToast?.('❌ Error creating room');
    }
  };

  const handleJoin = async (e, room) => {
    e.stopPropagation();
    const p = await getProfile();
    if (!p) {
      window.__showToast?.('💡 Set up your profile first!');
      setTimeout(() => navigate('/app/profile'), 800);
      return;
    }
    const already = room.passengers.some(pass => pass.id === p.id);
    if (already) {
      navigate(`/app/room/${room.id}`);
      return;
    }
    try {
      await joinRoom(room.id);
      window.__showToast?.('🎉 Joined room!');
      setTimeout(() => navigate(`/app/room/${room.id}`), 600);
    } catch (err) {
      window.__showToast?.('❌ Error joining room');
    }
  };

  const myRooms = rooms.filter(r => r.passengers.some(p => p.id === profile?.id));
  const filteredRooms = rooms.filter(r => {
    const matchRoute = (!form.from || r.from === form.from) && (!form.to || r.to === form.to);
    return matchRoute;
  });
  const displayed = tab === 'all' ? filteredRooms : myRooms;

  return (
    <div className="landing-container">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Bharat Moves On Cab Partner!</h1>
          <p>The fastest and most affordable way for your daily travel. Shared rides made easy.</p>
          
          <div className="booking-widget">
            <div className="widget-tabs">
              <button className={mode === 'search' ? 'active' : ''} onClick={() => setMode('search')}>Search</button>
              <button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>Create</button>
              <button className="nav-only" onClick={() => scrollToRides('all')}>All Rooms</button>
              <button className="nav-only" onClick={() => scrollToRides('mine')}>Your Rooms</button>
            </div>

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

              <div className="widget-btn-row">
                <button type="submit" className="widget-main-btn">
                  {mode === 'search' ? 'Search Rides ➔' : 'Create Room 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="hero-image">
          <img src={heroImage} alt="Cab Partner Hero" />
        </div>
      </section>

      {/* Rides Section */}
      <section id="rides" className="l-rides-section" ref={ridesRef}>
        <div className="l-rides-header">
          <h2>Available Rides</h2>
          <div className="widget-tabs" style={{ maxWidth: '400px', margin: '20px auto 0' }}>
            <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>All Rooms</button>
            <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>Your Rooms</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading live rides...</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
            {tab === 'mine' ? 'You have not joined any rooms yet.' : 'No rides found. Try changing your search or creating a room!'}
          </div>
        ) : (
          <div className="l-rides-grid">
            {displayed.map((room) => {
              const tl = timeLeft(room);
              const urgent = isUrgent(room);
              const isFull = room.passengers.length >= room.seats;
              const isMember = room.passengers.some(p => p.id === profile?.id);

              return (
                <div key={room.id} className="l-ride-card" onClick={() => navigate(`/app/room/${room.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="l-ride-badge">{room.owner}</span>
                    <span className={`l-ride-badge ${urgent ? 'urgent' : ''}`}>{tl}</span>
                  </div>
                  
                  <div className="l-ride-route">
                    <span className="l-route-text">{room.from}</span>
                    <div className="l-route-line"></div>
                    <span className="l-route-text">{room.to}</span>
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
                      {isMember ? 'Open Chat' : isFull ? 'Full' : 'Join'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <h2>Our Services</h2>
        <p>Reliable transportation solutions for your daily needs.</p>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">🚲</div>
            <h3>Bike Taxi</h3>
            <p>Skip the traffic and reach your destination faster.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🛺</div>
            <h3>Auto</h3>
            <p>Dependable auto rides for your short commutes.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">📦</div>
            <h3>Parcel</h3>
            <p>Secure and lightning-fast parcel delivery.</p>
          </div>
        </div>
      </section>

      <InfoSection />
      <Footer />
      <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
    </div>
  );
};

const InfoSection = () => (
  <section id="about" className="info-section">
    <div className="info-content">
      <h2>Why move with Cab Partner?</h2>
      <p>We're on a mission to make urban mobility shared, sustainable, and affordable.</p>
      <div className="stats-grid">
        <div className="stat-item"><h3>100K+</h3><p>Active Users</p></div>
        <div className="stat-item"><h3>5M+</h3><p>Rides Provided</p></div>
        <div className="stat-item"><h3>50+</h3><p>Cities</p></div>
        <div className="stat-item"><h3>4.8★</h3><p>Play Store</p></div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer id="contact">
    <div className="footer-grid">
      <div className="footer-col">
        <h4>CAB PARTNER</h4>
        <p>The smartest way to commute. Join the community today.</p>
      </div>
      <div className="footer-col">
        <h4>Services</h4>
        <ul className="footer-links">
          <li><a href="#">Bike Taxi</a></li>
          <li><a href="#">Auto</a></li>
          <li><a href="#">Parcel Express</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h4>Support</h4>
        <ul className="footer-links">
          <li><a href="#">Help Center</a></li>
          <li><a href="#">Safety Guidelines</a></li>
          <li><a href="#">Contact Us</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h4>Legal</h4>
        <ul className="footer-links">
          <li><a href="#">Terms of Service</a></li>
          <li><a href="#">Privacy Policy</a></li>
        </ul>
      </div>
    </div>
    <div style={{ marginTop: '60px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
      © 2026 Cab Partner. All rights reserved.
    </div>
  </footer>
);

export default LandingPage;
