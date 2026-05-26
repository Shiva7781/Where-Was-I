import React, { useState } from 'react';
import Header from './components/Header';
import WorldMap from './components/WorldMap';
import HeatMap from './components/HeatMap';
import TimeTravelSlider from './components/TimeTravelSlider';
import StatsPanel from './components/StatsPanel';
import { useVisits } from './hooks/useVisits';

export default function App() {
  const [activeView, setActiveView] = useState('dots');

  const {
    allVisits, visibleVisits, stats, heatmapData,
    loading, error, isOnline,
    selectedDate, setSelectedDate,
    timePosition, setTimePosition,
    isPlaying, setIsPlaying,
  } = useVisits();

  return (
    <div style={styles.root}>
      <Header activeView={activeView} onViewChange={setActiveView} isOnline={isOnline} />

      <div style={styles.mapArea}>
        {error && <div style={styles.errorBanner}>⚠ {error}</div>}

        {loading && allVisits.length === 0 && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
            <span style={styles.loadingText}>Loading…</span>
          </div>
        )}

        {!loading && allVisits.length === 0 && !error && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🌍</div>
            <div style={styles.emptyTitle}>No visits tracked yet</div>
            <div style={styles.emptyDesc}>
              Install the Chrome extension and start browsing.<br />
              Visits appear on the map in real time.
            </div>
          </div>
        )}

        {activeView === 'dots' && (
          <div style={styles.mapContainer}>
            <WorldMap visits={visibleVisits} />
          </div>
        )}

        {activeView === 'heatmap' && (
          <div style={styles.mapContainer}>
            <HeatMap heatmapData={heatmapData} />
          </div>
        )}

        <StatsPanel stats={stats} isOnline={isOnline} loading={loading} />
      </div>

      <div style={styles.sliderBar}>
        <TimeTravelSlider
          selectedDate={selectedDate}
          onDateChange={(d) => { setSelectedDate(d); setTimePosition(1440); setIsPlaying(false); }}
          timePosition={timePosition}
          onTimeChange={setTimePosition}
          isPlaying={isPlaying}
          onPlayToggle={() => { if (timePosition >= 1440) setTimePosition(0); setIsPlaying((p) => !p); }}
          totalForDay={allVisits.length}
          visibleCount={visibleVisits.length}
        />
      </div>
    </div>
  );
}

const styles = {
  root:           { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' },
  mapArea:        { flex: 1, position: 'relative', overflow: 'hidden' },
  mapContainer:   { position: 'absolute', inset: 0 },
  sliderBar:      { height: 64, flexShrink: 0 },
  errorBanner:    { position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#450a0a', color: '#fca5a5', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, pointerEvents: 'none', whiteSpace: 'nowrap' },
  loadingOverlay: { position: 'absolute', inset: 0, zIndex: 1500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,14,26,.8)', gap: 12 },
  spinner:        { width: 36, height: 36, border: '3px solid #1e293b', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText:    { color: '#64748b', fontSize: 14 },
  emptyState:     { position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: 8 },
  emptyIcon:      { fontSize: 56, marginBottom: 8, opacity: 0.4 },
  emptyTitle:     { fontSize: 18, fontWeight: 700, color: '#334155' },
  emptyDesc:      { fontSize: 13, color: '#1e293b', textAlign: 'center', lineHeight: 1.7 },
};
