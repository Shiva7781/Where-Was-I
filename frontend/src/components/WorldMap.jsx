import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_URL  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>';

function markerColor(count) {
  if (count >= 20) return '#ef4444';
  if (count >= 6)  return '#f59e0b';
  if (count >= 2)  return '#22c55e';
  return '#3b82f6';
}

function markerRadius(count) {
  return Math.max(5, Math.min(18, 5 + Math.log2(count + 1) * 3));
}

// Cluster visits at the same physical server (3 decimal ≈ 111m precision)
function groupByLocation(visits) {
  const map = new Map();
  for (const v of visits) {
    if (v.lat == null || v.lng == null) continue;
    const key = `${v.lat.toFixed(3)},${v.lng.toFixed(3)}`;
    if (!map.has(key)) {
      map.set(key, { lat: v.lat, lng: v.lng, city: v.city, region: v.region, country: v.country, countryCode: v.countryCode, ip: v.ip, domains: {}, totalVisits: 0 });
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
      {locations.map((loc, i) => {
        const color  = markerColor(loc.totalVisits);
        const radius = markerRadius(loc.totalVisits);
        return (
          <CircleMarker
            key={i}
            center={[loc.lat, loc.lng]}
            radius={radius}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2, opacity: 0.9 }}
            eventHandlers={{
              mouseover: (e) => e.target.setStyle({ fillOpacity: 1, weight: 3 }),
              mouseout:  (e) => e.target.setStyle({ fillOpacity: 0.85, weight: 2 }),
            }}
          >
            <Popup minWidth={220} maxWidth={320}>
              <MarkerPopup loc={loc} />
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
