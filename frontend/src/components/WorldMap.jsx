import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_URL  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>';

function freqClass(count) {
  if (count >= 20) return 'freq-4';
  if (count >= 6)  return 'freq-3';
  if (count >= 2)  return 'freq-2';
  return 'freq-1';
}

function dotSize(count) {
  // log scale: 1 visit → 12px, 20+ → 28px
  return Math.round(Math.max(12, Math.min(28, 12 + Math.log2(count + 1) * 4)));
}

// DivIcon so the .marker-dot CSS (glow + pulse-ring keyframe) actually applies
function createIcon(count) {
  const size = dotSize(count);
  return L.divIcon({
    className: '',
    html: `<div class="marker-dot ${freqClass(count)}" style="width:${size}px;height:${size}px;"></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor:[0, -(size / 2 + 4)],
  });
}

// Cluster visits at the same physical server (3 decimal ≈ 111m precision)
function groupByLocation(visits) {
  const map = new Map();
  for (const v of visits) {
    if (v.lat == null || v.lng == null) continue;
    const key = `${v.lat.toFixed(3)},${v.lng.toFixed(3)}`;
    if (!map.has(key)) {
      map.set(key, {
        lat: v.lat, lng: v.lng,
        city: v.city, region: v.region, country: v.country, countryCode: v.countryCode,
        ip: v.ip, domains: {}, totalVisits: 0,
      });
    }
    const loc = map.get(key);
    loc.domains[v.domain] = (loc.domains[v.domain] || 0) + 1;
    loc.totalVisits++;
  }
  return Array.from(map.values());
}

function FitBounds({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (!locations.length) return;
    map.fitBounds(L.latLngBounds(locations.map((l) => [l.lat, l.lng])), { padding: [60, 60], maxZoom: 5 });
  }, [locations, map]);
  return null;
}

function MarkerPopup({ loc }) {
  const sortedDomains = Object.entries(loc.domains).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const location = [loc.city, loc.region, loc.country].filter(Boolean).join(', ');

  return (
    <div className="popup-content">
      <h4>{loc.countryCode ? `${loc.countryCode} · ` : ''}{location || 'Unknown location'}</h4>
      <div className="popup-meta">
        {loc.ip && <span>IP: {loc.ip}<br /></span>}
        <span>{loc.totalVisits} visit{loc.totalVisits !== 1 ? 's' : ''}</span>
      </div>
      <ul className="popup-domains">
        {sortedDomains.map(([domain, count]) => (
          <li key={domain}>
            <span>{domain}</span>
            <span className="domain-count">×{count}</span>
          </li>
        ))}
        {Object.keys(loc.domains).length > 8 && (
          <li style={{ color: 'var(--text-muted)' }}>
            <span>+{Object.keys(loc.domains).length - 8} more</span>
          </li>
        )}
      </ul>
    </div>
  );
}

export default function WorldMap({ visits }) {
  const locations = useMemo(() => groupByLocation(visits), [visits]);

  return (
    <MapContainer center={[20, 0]} zoom={2} minZoom={2} maxZoom={12} style={{ width: '100%', height: '100%' }} worldCopyJump>
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} subdomains="abcd" />
      <FitBounds locations={locations} />
      {locations.map((loc, i) => (
        <Marker key={i} position={[loc.lat, loc.lng]} icon={createIcon(loc.totalVisits)}>
          <Popup minWidth={220} maxWidth={320}>
            <MarkerPopup loc={loc} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
