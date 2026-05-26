import React, { useState } from 'react';

function BarChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div style={barStyles.container}>
      {data.map((d) => (
        <div key={d.hour} style={barStyles.barWrap} title={`${d.hour}:00 — ${d.count} visits`}>
          <div
            style={{
              ...barStyles.bar,
              height: `${Math.max(2, (d.count / max) * 100)}%`,
              background: d.count > 0 ? '#3b82f6' : '#1e293b',
            }}
          />
          {d.hour % 6 === 0 && (
            <span style={barStyles.tick}>{d.hour}</span>
          )}
        </div>
      ))}
    </div>
  );
}

const barStyles = {
  container: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 2,
    height: 50,
    marginTop: 8,
  },
  barWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    position: 'relative',
    cursor: 'default',
  },
  bar: {
    width: '100%',
    borderRadius: '2px 2px 0 0',
    transition: 'height .3s',
    minHeight: 2,
  },
  tick: {
    position: 'absolute',
    bottom: -14,
    fontSize: 9,
    color: '#475569',
    whiteSpace: 'nowrap',
  },
};

// ── Main StatsPanel ───────────────────────────────────────────────
export default function StatsPanel({ stats, isOnline, loading }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={styles.panel}>
      {/* Panel header */}
      <div style={styles.header} onClick={() => setExpanded((e) => !e)}>
        <span style={styles.headerTitle}>📊 Stats</span>
        <span
          style={{
            ...styles.dot,
            background: isOnline ? '#22c55e' : '#ef4444',
            boxShadow: `0 0 6px ${isOnline ? '#22c55e' : '#ef4444'}`,
          }}
          title={isOnline ? 'Live' : 'Offline'}
        />
        <span style={styles.chevron}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={styles.body}>
          {loading ? (
            <div style={styles.loading}>Loading…</div>
          ) : stats ? (
            <>
              {/* Summary row */}
              <div style={styles.summaryRow}>
                <StatCard value={stats.totalVisits} label="Visits" color="#3b82f6" />
                <StatCard value={stats.uniqueDomains} label="Domains" color="#22c55e" />
              </div>

              {/* Hourly chart */}
              {stats.hourlyBreakdown && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Visits by hour</div>
                  <BarChart data={stats.hourlyBreakdown} />
                  <div style={{ height: 16 }} />
                </div>
              )}

              {/* Top countries */}
              {stats.topCountries && stats.topCountries.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Top countries</div>
                  {stats.topCountries.map((c, i) => (
                    <CountryRow key={c.code} rank={i + 1} country={c} max={stats.topCountries[0].count} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={styles.empty}>No data for selected day</div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color }}>{value ?? '—'}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function CountryRow({ rank, country, max }) {
  const pct = max > 0 ? (country.count / max) * 100 : 0;
  return (
    <div style={styles.countryRow}>
      <span style={styles.countryRank}>#{rank}</span>
      <span style={styles.countryCode}>{country.code}</span>
      <div style={styles.countryBar}>
        <div style={{ ...styles.countryFill, width: `${pct}%` }} />
      </div>
      <span style={styles.countryCount}>{country.count}</span>
    </div>
  );
}

const styles = {
  panel: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 220,
    background: 'rgba(15,23,42,.95)',
    border: '1px solid #1e293b',
    borderRadius: 12,
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,.6)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid #1e293b',
    userSelect: 'none',
  },
  headerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: 700,
    color: '#e2e8f0',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  chevron: {
    fontSize: 10,
    color: '#475569',
  },
  body: {
    padding: '12px 14px',
  },
  loading: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    padding: '8px 0',
  },
  empty: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    padding: '8px 0',
  },
  summaryRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: 8,
    padding: '8px 10px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '.5px',
    marginTop: 4,
  },
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '.5px',
    marginBottom: 6,
  },
  countryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
    fontSize: 11,
  },
  countryRank: {
    color: '#475569',
    width: 18,
    textAlign: 'right',
    flexShrink: 0,
  },
  countryCode: {
    color: '#94a3b8',
    width: 22,
    fontWeight: 600,
    flexShrink: 0,
  },
  countryBar: {
    flex: 1,
    height: 6,
    background: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  countryFill: {
    height: '100%',
    background: 'linear-gradient(90deg,#1d4ed8,#3b82f6)',
    borderRadius: 3,
    transition: 'width .4s',
  },
  countryCount: {
    color: '#3b82f6',
    fontWeight: 700,
    width: 28,
    textAlign: 'right',
    flexShrink: 0,
  },
};
