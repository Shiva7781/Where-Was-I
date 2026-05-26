const BACKEND_HEALTH_URL = 'http://localhost:5000/api/health';
const MAP_URL = 'http://localhost:5173';

const toggleEnabled = document.getElementById('toggleEnabled');
const statTotal     = document.getElementById('statTotal');
const statSession   = document.getElementById('statSession');
const statStatus    = document.getElementById('statStatus');
const lastVisit     = document.getElementById('lastVisit');
const apiKeyInput   = document.getElementById('apiKeyInput');
const btnSaveKey    = document.getElementById('btnSaveKey');
const btnOpenMap    = document.getElementById('btnOpenMap');
const btnClearStats = document.getElementById('btnClearStats');
const toastEl       = document.getElementById('toast');

(async () => {
  const { enabled = true, apiKey = '', visitCount = 0, lastURL = '' } =
    await chrome.storage.sync.get(['enabled', 'apiKey', 'visitCount', 'lastURL']);
  const { sessionCount = 0 } = await chrome.storage.local.get('sessionCount');

  toggleEnabled.checked = enabled;
  apiKeyInput.value = apiKey;
  statTotal.textContent = visitCount > 999 ? '999+' : visitCount;
  statSession.textContent = sessionCount || visitCount;

  if (lastURL) {
    try {
      lastVisit.innerHTML = `Last: <span>${new URL(lastURL).hostname}</span>`;
    } catch {
      lastVisit.innerHTML = `Last: <span>${lastURL.slice(0, 50)}</span>`;
    }
  }

  checkBackend(apiKey);
})();

toggleEnabled.addEventListener('change', async () => {
  await chrome.storage.sync.set({ enabled: toggleEnabled.checked });
  showToast(toggleEnabled.checked ? 'Tracking enabled' : 'Tracking paused', 'success');
});

btnSaveKey.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) { showToast('API key cannot be empty', 'error'); return; }
  await chrome.storage.sync.set({ apiKey: key });
  showToast('Saved', 'success');
  checkBackend(key);
});

apiKeyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnSaveKey.click(); });

btnOpenMap.addEventListener('click', () => chrome.tabs.create({ url: MAP_URL }));

btnClearStats.addEventListener('click', async () => {
  await Promise.all([
    chrome.storage.local.set({ visitCount: 0, sessionCount: 0 }),
    chrome.storage.sync.set({ visitCount: 0, lastURL: '' }),
  ]);
  chrome.action.setBadgeText({ text: '' });
  statTotal.textContent = '0';
  statSession.textContent = '0';
  lastVisit.textContent = 'No visits tracked yet';
  showToast('Stats cleared', 'success');
});

async function checkBackend(apiKey) {
  statStatus.style.color = '#94a3b8';
  try {
    const res = await fetch(BACKEND_HEALTH_URL, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });
    statStatus.style.color = res.ok ? '#22c55e' : '#ef4444';
    statStatus.title = res.ok ? 'Backend online' : 'Backend error';
  } catch {
    statStatus.style.color = '#ef4444';
    statStatus.title = 'Backend offline';
  }
}

let toastTimer;
function showToast(msg, type = 'success') {
  toastEl.textContent = msg;
  toastEl.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 2500);
}
