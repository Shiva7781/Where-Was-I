import React, { useCallback } from 'react';
import { format } from 'date-fns';

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function TimeTravelSlider({
  selectedDate,
  onDateChange,
  timePosition,
  onTimeChange,
  isPlaying,
  onPlayToggle,
  totalForDay,
  visibleCount,
}) {
  const handleSlider = useCallback(
    (e) => onTimeChange(parseInt(e.target.value, 10)),
    [onTimeChange]
  );

  const handleRewind = () => onTimeChange(0);
  const handleEnd    = () => onTimeChange(1440);

  const percent = (timePosition / 1440) * 100;
  const timeLabel = timePosition >= 1440 ? '24:00' : minutesToTime(timePosition);

  return (
    <div style={styles.container}>
      {/* Date picker */}
      <div style={styles.dateSection}>
        <span style={styles.label}>📅 Date</span>
        <input
          type="date"
          value={selectedDate}
          max={format(new Date(), 'yyyy-MM-dd')}
          onChange={(e) => onDateChange(e.target.value)}
          style={styles.dateInput}
        />
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Playback controls */}
      <div style={styles.playSection}>
        <button onClick={handleRewind} style={styles.iconBtn} title="Rewind to start">⏮</button>
        <button
          onClick={onPlayToggle}
          style={{ ...styles.iconBtn, ...styles.playBtn }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={handleEnd} style={styles.iconBtn} title="Jump to end">⏭</button>
      </div>

      {/* Slider */}
      <div style={styles.sliderSection}>
        <div style={styles.sliderWrap}>
          {/* Filled track */}
          <div style={{ ...styles.track }}>
            <div style={{ ...styles.trackFill, width: `${percent}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={1440}
            step={1}
            value={timePosition}
            onChange={handleSlider}
            style={styles.range}
          />
        </div>
        <span style={styles.timeLabel}>{timeLabel}</span>
      </div>

      {/* Visit counter */}
      <div style={styles.counterSection}>
        <span style={styles.counter}>
          <span style={styles.counterValue}>{visibleCount}</span>
          <span style={styles.counterOf}> / {totalForDay}</span>
          <span style={styles.counterLabel}> visits</span>
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 20px',
    height: '100%',
    background: 'rgba(15,23,42,0.95)',
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid #1e293b',
    userSelect: 'none',
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '.5px',
    whiteSpace: 'nowrap',
  },
  dateSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  dateInput: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 13,
    padding: '4px 8px',
    outline: 'none',
    cursor: 'pointer',
    colorScheme: 'dark',
  },
  divider: {
    width: 1,
    height: 28,
    background: '#1e293b',
    flexShrink: 0,
  },
  playSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  iconBtn: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#94a3b8',
    fontSize: 14,
    width: 30,
    height: 30,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'background .15s, color .15s',
  },
  playBtn: {
    background: '#1d4ed8',
    color: '#fff',
    borderColor: '#1d4ed8',
    width: 36,
    height: 36,
  },
  sliderSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  sliderWrap: {
    flex: 1,
    position: 'relative',
    height: 20,
    display: 'flex',
    alignItems: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    background: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  trackFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
    borderRadius: 2,
    transition: 'width .02s',
  },
  range: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    appearance: 'none',
    background: 'transparent',
    cursor: 'pointer',
    margin: 0,
    padding: 0,
    height: 20,
    // Thumb styling via CSS-in-JS is limited; see index.css for ::-webkit-slider-thumb
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#60a5fa',
    fontVariantNumeric: 'tabular-nums',
    minWidth: 44,
    textAlign: 'right',
    flexShrink: 0,
  },
  counterSection: {
    flexShrink: 0,
    textAlign: 'right',
  },
  counter: {
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  counterValue: {
    color: '#3b82f6',
    fontWeight: 700,
  },
  counterOf: {
    color: '#475569',
  },
  counterLabel: {
    color: '#64748b',
    fontSize: 11,
  },
};
