import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { LOCATION_COORDS } from '../store'
import polyline from '@mapbox/polyline'

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

function ChangeView({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [bounds, map])
  return null
}

export default function MapView({ from, to, height = '200px' }) {
  const [routeCoords, setRouteCoords] = useState([])
  const [loading, setLoading] = useState(false)
  
  const fromCoord = LOCATION_COORDS[from]
  const toCoord = LOCATION_COORDS[to]

  useEffect(() => {
    if (!fromCoord || !toCoord) {
      setRouteCoords([])
      return
    }

    const fetchRoute = async () => {
      setLoading(true)
      try {
        // OSRM expects lon,lat;lon,lat
        const url = `https://router.project-osrm.org/route/v1/driving/${fromCoord[1]},${fromCoord[0]};${toCoord[1]},${toCoord[0]}?overview=full&geometries=polyline`
        const res = await fetch(url)
        const data = await res.json()
        
        if (data.routes && data.routes.length > 0) {
          const points = polyline.decode(data.routes[0].geometry)
          setRouteCoords(points)
        } else {
          // Fallback to straight line if no route found
          setRouteCoords([fromCoord, toCoord])
        }
      } catch (err) {
        console.error('Routing failed:', err)
        setRouteCoords([fromCoord, toCoord]) // Fallback
      } finally {
        setLoading(false)
      }
    }

    fetchRoute()
  }, [fromCoord, toCoord])

  if (!fromCoord || !toCoord) {
    return (
      <div style={{ 
        height, 
        background: 'var(--bg-input)', 
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-dim)',
        fontSize: '14px',
        border: '1px solid var(--border)'
      }}>
        Select locations to view map
      </div>
    )
  }

  // Calculate bounds based on route if available, otherwise just points
  const pointsForBounds = routeCoords.length > 0 ? routeCoords : [fromCoord, toCoord]
  const bounds = L.latLngBounds(pointsForBounds)

  return (
    <div style={{ height, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
      <MapContainer 
        bounds={bounds} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={fromCoord}>
          <Popup>Pickup: {from}</Popup>
        </Marker>
        <Marker position={toCoord}>
          <Popup>Drop: {to}</Popup>
        </Marker>
        
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="var(--primary)" weight={5} opacity={0.7} />
        )}

        <ChangeView bounds={bounds} />
      </MapContainer>

      {loading && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', padding: '5px 12px', 
          borderRadius: 20, fontSize: 11, color: 'white',
          backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          🛰️ Recalculating route...
        </div>
      )}
    </div>
  )
}
