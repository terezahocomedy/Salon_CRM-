export const DRIVE_KEY = 'headline_drive_api_v13_9';
export const CALENDAR_KEY = 'headline_calendar_api_v13_9';

// Only plain https Google Apps Script web app URLs are accepted.
export const isValidEndpoint = (value: string | null | undefined): value is string => {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname === 'script.google.com';
  } catch (e) { return false; }
};

export const buildSetupLink = (driveUrl: string, calendarUrl: string): string => {
  const params = new URLSearchParams();
  if (isValidEndpoint(driveUrl)) params.set('setup', driveUrl);
  if (isValidEndpoint(calendarUrl)) params.set('calendar', calendarUrl);
  if (![...params.keys()].length) return '';
  return `${window.location.origin}${window.location.pathname}#${params.toString()}`;
};

// Reads #setup=/?setup= (and optional calendar=), saves to localStorage, then cleans the address bar.
export const consumeSetupParams = (): boolean => {
  try {
    const loc = window.location;
    const hash = new URLSearchParams(loc.hash.replace(/^#/, ''));
    const query = new URLSearchParams(loc.search);
    const pick = (k: string) => hash.get(k) ?? query.get(k);
    const hasParam = ['setup', 'calendar'].some(k => hash.has(k) || query.has(k));
    if (!hasParam) return false;
    const drive = pick('setup');
    const calendar = pick('calendar');
    let saved = false;
    if (isValidEndpoint(drive)) { localStorage.setItem(DRIVE_KEY, drive); saved = true; }
    if (isValidEndpoint(calendar)) { localStorage.setItem(CALENDAR_KEY, calendar); saved = true; }
    ['setup', 'calendar'].forEach(k => { hash.delete(k); query.delete(k); });
    const qs = query.toString();
    const h = hash.toString();
    window.history.replaceState(null, '', loc.pathname + (qs ? `?${qs}` : '') + (h ? `#${h}` : ''));
    return saved;
  } catch (e) { return false; }
};
