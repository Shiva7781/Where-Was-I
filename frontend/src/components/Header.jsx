import React from 'react';

export default function Header({ activeView, onViewChange, isOnline }) {
  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <span style={styles.logo}>🌍</span>
        <div>
          <div style={styles.title}>Where Was I?</div>
          <div style={styles.subtitle}>Browser History World Map</div>
        </div>
      </div>

      <div style={styles.tabs}>
        <TabBtn label="🗺 Dot Map"  active={activeView === 'dots'}    onClick={() => onViewChange('dots')} />
        <TabBtn label="🌡 Heatmap"  active={activeView === 'heatmap'} onClick={() => onViewChange('heatmap')} />
      </div>

      <div style={styles.status}>
        <div style={{ ...styles.dot, background: isOnline ? '#22c55e' : '#ef4444', boxShadow: `0 0 8px ${isOnline ? '#22c55e88' : '#ef444488'}` }} />
        <span style={styles.statusText}>{isOnline ? 'Live' : 'Offline'}</span>
      </div>
    </header>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}>
      {label}
    </button>
  );
}

const styles = {
  header:     { height: 'var(--header-h)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', background: 'rgba(15,23,42,.98)', borderBottom: '1px solid #1e293b', backdropFilter: 'blur(8px)', zIndex: 100, flexShrink: 0 },
  brand:      { display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' },
  logo:       { fontSize: 26, lineHeight: 1 },
  title:      { fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.3px' },
  subtitle:   { fontSize: 11, color: '#475569', marginTop: 1 },
  tabs:       { display: 'flex', gap: 4, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 3 },
  tab:        { background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 6, cursor: 'pointer', transition: 'background .15s, color .15s', whiteSpace: 'nowrap' },
  tabActive:  { background: '#1d4ed8', color: '#fff' },
  status:     { display: 'flex', alignItems: 'center', gap: 6 },
  dot:        { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, transition: 'background .3s' },
  statusText: { fontSize: 12, color: '#64748b' },
};
