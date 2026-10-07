# Apps Script security & device onboarding

## Frontend holds no secrets
This app is a static site. Anything in the code or in `localStorage` can be read by any visitor.
The Google Apps Script (GAS) web app URL is therefore treated as a **public endpoint address**, not a secret.
No API keys, tokens or passwords are stored in the source code or `localStorage`.

## Onboarding a new device (primary path)
1. Manager opens **Data Hub → API 雲端串接設定** and enters the GAS URL(s).
2. Click **複製設定連結** (copy setup link). The link looks like
   `https://<site>/#setup=<encoded drive URL>&calendar=<encoded calendar URL>`.
3. Send the link (or turn it into a QR code with any offline/trusted QR generator) to the stylist.
4. Opening it once saves the URL(s) into that browser's `localStorage`
   (`headline_drive_api_v13_9` / `headline_calendar_api_v13_9`) and removes the parameters from the address bar.
   Only `https://script.google.com/...` URLs are accepted. `?setup=` works too.

Manual pasting in the settings fields still works. If no URL is configured, the app makes no cloud requests.
To change the URL later, share a new setup link.

## The setup link is NOT security
It only distributes the public URL. Real protection must be enforced in Apps Script:

- Deploy with the narrowest access possible ("Anyone with Google account" or domain-restricted, if feasible).
- Require a credential on every request and verify it server-side. Store secrets only in
  **Project Settings → Script Properties** (`PropertiesService.getScriptProperties()`), never in the frontend.
- Prefer per-stylist PINs kept in Script Properties so one person can be revoked individually.
- Validate `action` against an allow-list and validate payload shape/size.
- Use `LockService` for writes; keep backups/version history of the Sheet.
- If the URL leaks, redeploy a new version/URL and issue a new setup link.

```javascript
function doPost(e) {
  const expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  const body = JSON.parse(e.postData.contents || '{}');
  if (!expected || body.token !== expected) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  // ...handle allowed actions
}
```
Note: a token typed in by the user at runtime is still only a deterrent; do not hardcode it in the repo.
