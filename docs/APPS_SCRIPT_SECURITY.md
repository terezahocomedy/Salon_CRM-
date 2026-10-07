# Protecting the Google Apps Script (GAS) backend

The frontend is hosted on public GitHub Pages, so everything shipped in it (including any URL or token) is visible to users. The GAS web app URL is entered in the app's Data Hub settings and stored only in that device's `localStorage`. Real protection must be enforced inside Apps Script.

## 1. Redeploy with a NEW URL
Earlier web app URLs were committed to git history. Treat them as public/compromised.
1. Apps Script editor → **Deploy → New deployment → Web app**.
2. Choose the most restrictive access that still works (e.g. "Anyone with Google account" or only yourself, instead of "Anyone").
3. Copy the new `/exec` URL and paste it into the app's Data Hub settings (both Sheet and Calendar fields).
4. **Deploy → Manage deployments**, then archive/disable the OLD deployments.

## 2. Store a shared token in Script Properties
Project Settings → Script Properties → add `API_TOKEN` with a long random value. Never hardcode it in the script or the repo.

```javascript
function isAuthorized_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  return !!expected && token === expected;
}

function unauthorized_() {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (!isAuthorized_(e.parameter.token)) return unauthorized_();
  // ...handle allowed read actions
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents || '{}'); } catch (err) { data = {}; }
  if (!isAuthorized_(e.parameter.token || data.token)) return unauthorized_();
  // ...handle allowed write actions
}
```

## 3. Whitelist actions and validate input
```javascript
const READ_ACTIONS = ['get_all', 'get_events'];
const WRITE_ACTIONS = ['append', 'sync_all', 'create_event', 'delete_event'];

function validate_(action, data) {
  if (READ_ACTIONS.indexOf(action) === -1 && WRITE_ACTIONS.indexOf(action) === -1) return false;
  if (action === 'append' && (typeof data.record !== 'object' || data.record === null)) return false;
  if (action === 'sync_all' && !Array.isArray(data.records)) return false;
  if (action === 'delete_event' && typeof data.eventId !== 'string') return false;
  return true;
}
```
Reject anything else with an error JSON response. Also cap payload sizes and string lengths.

## 4. Use LockService around writes
```javascript
const lock = LockService.getScriptLock();
lock.waitLock(30000);
try {
  // write to the Sheet / Calendar
} finally {
  lock.releaseLock();
}
```

## 5. Limitations
Any token sent from a static GitHub Pages frontend can be read by users (DevTools, network tab), so it is only a basic barrier. For stronger protection put a serverless proxy (Cloud Run/Functions, Netlify, Vercel, Cloudflare Workers) in front of Apps Script; the proxy keeps the secret server-side and authenticates users.

## 中文摘要
- 前端為公開網站，網址與 token 都可被看見；網址只輸入於設定頁，不再寫死於程式碼。
- 重新部署 GAS 取得**新網址**，停用舊部署（舊網址已在 git 歷史中，視為外洩）。
- 在 Script Properties 設定 `API_TOKEN`，於 `doGet`/`doPost` 驗證，失敗回傳 Unauthorized。
- 只允許白名單 `action` 並驗證輸入；寫入時使用 `LockService`。
- 部署權限盡量收緊。前端 token 只是基本屏障，更安全的做法是使用無伺服器代理。
