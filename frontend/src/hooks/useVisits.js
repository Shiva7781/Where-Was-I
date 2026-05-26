import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { fetchVisits, fetchStats, fetchHeatmap } from '../services/api';

export function useVisits() {
  const [allVisits, setAllVisits]     = useState([]);
  const [stats, setStats]             = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [isOnline, setIsOnline]       = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timePosition, setTimePosition] = useState(1440);
  const [isPlaying, setIsPlaying]     = useState(false);

  const playTimer = useRef(null);

  const loadData = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const [visits, statsData, heatmap] = await Promise.all([
        fetchVisits(date),
        fetchStats(date),
        fetchHeatmap(date),
      ]);
      setAllVisits(visits);
      setStats(statsData);
      setHeatmapData(heatmap);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(selectedDate); }, [selectedDate, loadData]);

  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'], reconnectionDelay: 1000 });

    socket.on('connect', () => setIsOnline(true));
    socket.on('disconnect', () => setIsOnline(false));

    socket.on('new-visit', (visit) => {
      if (format(new Date(visit.timestamp), 'yyyy-MM-dd') !== selectedDate) return;

      setAllVisits((prev) => {
        // Socket fires after the initial GET; update in-place if we already have it
        // (the second emit carries resolved geo data)
        if (prev.some((v) => v._id === visit._id)) {
          return prev.map((v) => (v._id === visit._id ? visit : v));
        }
        return [...prev, visit];
      });

      setStats((prev) => prev ? { ...prev, totalVisits: prev.totalVisits + 1 } : prev);
    });

    return () => socket.disconnect();
  }, [selectedDate]);

  useEffect(() => {
    if (!isPlaying) { clearInterval(playTimer.current); return; }

    playTimer.current = setInterval(() => {
      setTimePosition((prev) => {
        if (prev >= 1440) { setIsPlaying(false); return 1440; }
        return prev + 5;
      });
    }, 40);

    return () => clearInterval(playTimer.current);
  }, [isPlaying]);

  const visibleVisits = (() => {
    if (timePosition >= 1440) return allVisits;
    const cutoff = new Date(`${selectedDate}T00:00:00.000Z`);
    cutoff.setMinutes(cutoff.getMinutes() + timePosition);
    return allVisits.filter((v) => new Date(v.timestamp) <= cutoff);
  })();

  return {
    allVisits, visibleVisits, stats, heatmapData,
    loading, error, isOnline,
    selectedDate, setSelectedDate,
    timePosition, setTimePosition,
    isPlaying, setIsPlaying,
    reload: () => loadData(selectedDate),
  };
}
