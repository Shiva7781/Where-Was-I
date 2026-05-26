import axios from 'axios';

const BASE = '/api';

const http = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

/**
 * Fetch all visits for a given date (YYYY-MM-DD).
 * Paginates internally and returns all records.
 */
export async function fetchVisits(date) {
  const limit = 500;
  let page = 1;
  let all = [];

  while (true) {
    const { data } = await http.get('/visits', {
      params: { date, page, limit },
    });
    all = all.concat(data.data || []);
    if (all.length >= data.total || (data.data || []).length < limit) break;
    page++;
  }

  return all;
}

/** Aggregate stats for a given date */
export async function fetchStats(date) {
  const { data } = await http.get('/visits/stats', { params: { date } });
  return data.data;
}

/** Heatmap data (country → count) */
export async function fetchHeatmap(date) {
  const { data } = await http.get('/visits/heatmap', { params: { date } });
  return data.data;
}

/** Health check */
export async function fetchHealth() {
  const { data } = await http.get('/health');
  return data;
}
