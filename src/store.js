import { supabase } from './lib/supabase'

// --- Profile ---
// We store a profile ID in localStorage to identify the local user
const PROFILE_KEY = 'scab_profile_id'

export async function getProfile() {
  const id = localStorage.getItem(PROFILE_KEY)
  if (!id) return null
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
    
  if (error) return null
  return data
}

export async function saveProfile(profileData) {
  const existingId = localStorage.getItem(PROFILE_KEY)
  
  if (existingId) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ name: profileData.name, mobile: profileData.mobile })
      .eq('id', existingId)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ name: profileData.name, mobile: profileData.mobile }])
      .select()
      .single()
    
    if (error) throw error
    if (data) localStorage.setItem(PROFILE_KEY, data.id)
    return data
  }
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
export async function getRooms() {
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select(`
      *,
      owner:profiles!rooms_owner_id_fkey(name, mobile),
      passengers:room_passengers(
        profile:profiles(id, name, mobile),
        is_owner
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching rooms:', error)
    return []
  }

  // Transform to match previous structure
  return rooms.map(r => ({
    id: r.id,
    owner: r.owner.name,
    ownerMobile: r.owner.mobile,
    from: r.from,
    to: r.to,
    time: r.time.slice(0, 5), // 'HH:mm:ss' to 'HH:mm'
    seats: r.seats,
    passengers: r.passengers.map(p => ({
      id: p.profile.id,
      name: p.profile.name,
      mobile: p.profile.mobile,
      isOwner: p.is_owner
    })),
    createdAt: new Date(r.created_at).getTime()
  }))
}

export async function getRoomById(id) {
  const { data: room, error } = await supabase
    .from('rooms')
    .select(`
      *,
      owner:profiles!rooms_owner_id_fkey(name, mobile),
      passengers:room_passengers(
        profile:profiles(id, name, mobile),
        is_owner
      ),
      chat:messages(
        text,
        created_at,
        sender:profiles(name)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !room) {
    console.error('Error fetching room by ID:', error)
    return null
  }

  return {
    id: room.id,
    owner: room.owner.name,
    ownerMobile: room.owner.mobile,
    from: room.from,
    to: room.to,
    time: room.time.slice(0, 5),
    seats: room.seats,
    passengers: room.passengers.map(p => ({
      id: p.profile.id,
      name: p.profile.name,
      mobile: p.profile.mobile,
      isOwner: p.is_owner
    })),
    chat: room.chat.sort((a,b) => new Date(a.created_at) - new Date(b.created_at)).map(m => ({
      sender: m.sender.name,
      text: m.text,
      time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    })),
    createdAt: new Date(room.created_at).getTime()
  }
}

export async function createRoom(roomData) {
  const profile = await getProfile()
  if (!profile) throw new Error('Profile required')

  // 1. Create the room
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .insert([{
      owner_id: profile.id,
      from: roomData.from,
      to: roomData.to,
      time: roomData.time,
      seats: roomData.seats
    }])
    .select()
    .single()

  if (roomErr) throw roomErr

  // 2. Add owner as first passenger
  const { error: passErr } = await supabase
    .from('room_passengers')
    .insert([{
      room_id: room.id,
      profile_id: profile.id,
      is_owner: true
    }])

  if (passErr) throw passErr

  return room
}

export async function joinRoom(roomId) {
  const profile = await getProfile()
  if (!profile) throw new Error('Profile required')

  const { error } = await supabase
    .from('room_passengers')
    .insert([{
      room_id: roomId,
      profile_id: profile.id,
      is_owner: false
    }])

  if (error) throw error
}

export async function sendMessage(roomId, text) {
  const profile = await getProfile()
  if (!profile) throw new Error('Profile required')

  const { error } = await supabase
    .from('messages')
    .insert([{
      room_id: roomId,
      sender_id: profile.id,
      text: text
    }])

  if (error) throw error
}

// -- Utils --
export const LOCATIONS = Object.keys(LOCATION_COORDS)

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
