// Central localStorage helper

const KEYS = {
  PROFILE: 'scab_profile',
  ROOMS: 'scab_rooms',
}

// --- Profile ---
export function getProfile() {
  try { return JSON.parse(localStorage.getItem(KEYS.PROFILE)) || null }
  catch { return null }
}

export function saveProfile(data) {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(data))
}

// --- Ghaziabad Locations with Coordinates ---
export const LOCATION_COORDS = {
  'Vaishali Metro':        [28.6455, 77.3403],
  'Kaushambi':             [28.6390, 77.3248],
  'Indirapuram':           [28.6449, 77.3680],
  'Raj Nagar Extension':   [28.6897, 77.4069],
  'Crossings Republik':    [28.6337, 77.4414],
  'Hindon Airport':        [28.6957, 77.4302],
  'Ghaziabad Railway Stn': [28.6519, 77.4229],
  'Hapur Chungi':          [28.6666, 77.4595],
  'Mohan Nagar':           [28.6809, 77.4060],
  'Wave City':             [28.7062, 77.5023],
  'Lohia Nagar':           [28.6573, 77.4115],
  'Govindpuram':           [28.6799, 77.4329],
  'Vijay Nagar':           [28.6695, 77.4163],
  'Shastri Nagar':         [28.6743, 77.4207],
  'Dasna':                 [28.6765, 77.5106],
  'Noida Sector 62':       [28.6271, 77.3779],
  'Sahibabad':             [28.6696, 77.3564],
  'Arthala':               [28.6914, 77.3721],
  'ALT Centre':            [28.6978, 77.4426],
  'Vasundhara':            [28.6601, 77.3468],
  'Pratap Vihar':          [28.6473, 77.4347],
  'Kavi Nagar':            [28.6675, 77.4339],
  'Sanjay Nagar':          [28.6833, 77.4497],
}

// --- Rooms ---
const defaultRooms = [
  {
    id: 'r1',
    owner: 'Rahul Sharma',
    ownerMobile: '9876543210',
    from: 'Vaishali Metro',
    to: 'Ghaziabad Railway Stn',
    time: '16:30',
    tags: ['Office Goers', 'Daily Commute'],
    seats: 4,
    passengers: [{ name: 'Rahul Sharma', mobile: '9876543210', isOwner: true }],
    chat: [
      { sender: 'Rahul Sharma', text: 'Cab booked! Meeting at Vaishali Gate 1.', time: '14:02', mine: false },
    ],
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: 'r2',
    owner: 'Priya Gupta',
    ownerMobile: '9876543211',
    from: 'Indirapuram',
    to: 'Noida Sector 62',
    time: '18:00',
    tags: ['IT Professionals', 'Students'],
    seats: 3,
    passengers: [
      { name: 'Priya Gupta', mobile: '9876543211', isOwner: true },
      { name: 'Amit Kumar', mobile: '9876543212', isOwner: false },
    ],
    chat: [
      { sender: 'Priya Gupta', text: 'Anyone near Shipra Mall?', time: '16:45', mine: false },
      { sender: 'Amit Kumar', text: 'Yes, coming in 5 mins!', time: '16:46', mine: false },
    ],
    createdAt: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'r3',
    owner: 'Vikash Singh',
    ownerMobile: '9876543213',
    from: 'Raj Nagar Extension',
    to: 'Mohan Nagar',
    time: '17:15',
    tags: ['Students', 'Evening Commute'],
    seats: 4,
    passengers: [{ name: 'Vikash Singh', mobile: '9876543213', isOwner: true }],
    chat: [],
    createdAt: Date.now() - 1000 * 60 * 10,
  },
  {
    id: 'r4',
    owner: 'Sneha Tripathi',
    ownerMobile: '9876543214',
    from: 'Kaushambi',
    to: 'Crossings Republik',
    time: '09:00',
    tags: ['Morning Commute', 'Office Goers'],
    seats: 4,
    passengers: [{ name: 'Sneha Tripathi', mobile: '9876543214', isOwner: true }],
    chat: [
      { sender: 'Sneha Tripathi', text: 'Good morning! Cab departs sharp at 9.', time: '08:30', mine: false },
    ],
    createdAt: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 'r5',
    owner: 'Ankit Verma',
    ownerMobile: '9876543215',
    from: 'ALT Centre',
    to: 'Vaishali Metro',
    time: '10:30',
    tags: ['Students', 'Daily Commute'],
    seats: 4,
    passengers: [{ name: 'Ankit Verma', mobile: '9876543215', isOwner: true }],
    chat: [],
    createdAt: Date.now() - 1000 * 60 * 20,
  },
  {
    id: 'r6',
    owner: 'Megha Sahni',
    ownerMobile: '9876543216',
    from: 'Vasundhara',
    to: 'Indirapuram',
    time: '19:45',
    tags: ['Evening Commute', 'IT Professionals'],
    seats: 3,
    passengers: [{ name: 'Megha Sahni', mobile: '9876543216', isOwner: true }],
    chat: [],
    createdAt: Date.now() - 1000 * 60 * 15,
  },
]

export function getRooms() {
  try {
    const stored = localStorage.getItem(KEYS.ROOMS)
    return stored ? JSON.parse(stored) : defaultRooms
  } catch { return defaultRooms }
}

export function saveRooms(rooms) {
  localStorage.setItem(KEYS.ROOMS, JSON.stringify(rooms))
}

export function getRoomById(id) {
  return getRooms().find(r => r.id === id) || null
}

export function createRoom(data) {
  const rooms = getRooms()
  const newRoom = {
    id: 'r' + Date.now(),
    ...data,
    passengers: [{ name: data.ownerName, mobile: data.ownerMobile, isOwner: true }],
    chat: [],
    createdAt: Date.now(),
  }
  saveRooms([newRoom, ...rooms])
  return newRoom
}

export function joinRoom(roomId, passenger) {
  const rooms = getRooms()
  const updated = rooms.map(r => {
    if (r.id !== roomId) return r
    const already = r.passengers.find(p => p.mobile === passenger.mobile)
    if (already) return r
    return { ...r, passengers: [...r.passengers, passenger] }
  })
  saveRooms(updated)
}

export function sendMessage(roomId, message) {
  const rooms = getRooms()
  const updated = rooms.map(r => {
    if (r.id !== roomId) return r
    return { ...r, chat: [...r.chat, message] }
  })
  saveRooms(updated)
}

// -- Utils --
export const LOCATIONS = Object.keys(LOCATION_COORDS)

export const TAGS = [
  'Office Goers',
  'Students',
  'IT Professionals',
  'Daily Commute',
  'Morning Commute',
  'Evening Commute',
  'Weekend Trip',
  'Airport Transfer',
]

export function timeLeft(room) {
  const [h, m] = room.time.split(':').map(Number)
  const target = new Date()
  target.setHours(h, m, 0, 0)
  const diff = target - Date.now()
  if (diff < 0) return 'Departed'
  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hrs > 0) return `${hrs}h ${mins}m left`
  return `${mins}m left`
}

export function isUrgent(room) {
  const [h, m] = room.time.split(':').map(Number)
  const target = new Date()
  target.setHours(h, m, 0, 0)
  return (target - Date.now()) < 30 * 60 * 1000
}

export function estimateFare(from, to) {
  const base = 40
  const perKm = 12
  const dist = Math.floor(Math.random() * 15) + 5
  return { dist, fare: base + dist * perKm }
}

export function now() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
