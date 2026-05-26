const BACKEND_URL = 'http://localhost:5000/api/visits';
const DEBOUNCE_MS = 5000;

const lastSent = new Map();

chrome.webNavigation.onCompleted.addListener(
  async (details) => {
    if (details.frameId !== 0) return;

    const { url } = details;
    if (!url.startsWith('http://') && !url.startsWith('https://')) return;
    if (url.includes('chrome.google.com/webstore')) return;

    const { enabled = true, apiKey = '' } = await chrome.storage.sync.get(['enabled', 'apiKey']);
    if (!enabled) return;
    if (!apiKey) {
      console.warn('[where-was-i] API key not set');
      return;
    }

    let hostname;
    try {
      hostname = new URL(url).hostname;
    } catch {
      return;
    }

    const now = Date.now();
    if (now - (lastSent.get(hostname) || 0) < DEBOUNCE_MS) return;
    lastSent.set(hostname, now);

    await sendVisit(url, details.timeStamp, apiKey);
  },
  { url: [{ schemes: ['http', 'https'] }] }
);

async function sendVisit(url, timeStamp, apiKey, attempt = 1) {
  const MAX_ATTEMPTS = 3;

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ url, timestamp: new Date(timeStamp).toISOString() }),
    });

    if (res.ok) {
      updateBadge();
      return;
    }

    // 4xx means bad request or bad key — retrying won't help
    if (res.status >= 400 && res.status < 500) {
      const body = await res.json().catch(() => ({}));
      console.error(`[where-was-i] ${res.status}: ${body.error || res.statusText}`);
      return;
    }

    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      await sleep(1000 * 2 ** (attempt - 1));
      return sendVisit(url, timeStamp, apiKey, attempt + 1);
    }
    console.error(`[where-was-i] gave up after ${MAX_ATTEMPTS} attempts:`, err.message);
  }
}

async function updateBadge() {
  const { visitCount = 0 } = await chrome.storage.local.get('visitCount');
  const next = visitCount + 1;
  await chrome.storage.local.set({ visitCount: next });
  chrome.action.setBadgeText({ text: next > 999 ? '999+' : String(next) });
  chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
}

chrome.alarms.create('daily-reset', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'daily-reset') return;
  const { lastResetDay } = await chrome.storage.local.get('lastResetDay');
  const today = new Date().toDateString();
  if (lastResetDay !== today) {
    await chrome.storage.local.set({ visitCount: 0, lastResetDay: today });
    chrome.action.setBadgeText({ text: '' });
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
