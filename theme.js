/* Theme: washi (light) by day, yoru (dark) after sunset. Runs in <head> so the first paint is already right. */
(function () {
  const KEY = 'selfos:theme', LOC = 'selfos:coords';
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const rad = Math.PI / 180;

  // Approximate sunrise/sunset (±2 min) from the solar declination + equation of time.
  function sunTimes(date, lat, lng) {
    const start = Date.UTC(date.getFullYear(), 0, 0);
    const n = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 864e5);
    const decl = 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365);
    const B = 2 * Math.PI * (n - 81) / 364;
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl * rad)) / (Math.cos(lat * rad) * Math.cos(decl * rad));
    const noonUTC = 720 - 4 * lng - eot; // minutes after UTC midnight
    const midnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    if (cosH > 1) return { rise: null, set: null, polar: 'night' };
    if (cosH < -1) return { rise: null, set: null, polar: 'day' };
    const H = Math.acos(cosH) / rad;
    return { rise: new Date(midnight + (noonUTC - 4 * H) * 6e4), set: new Date(midnight + (noonUTC + 4 * H) * 6e4) };
  }
  function coords() {
    const c = get(LOC, null);
    if (c) return { ...c, guessed: false };
    // No permission asked yet: estimate longitude from the timezone, assume a mid-latitude.
    const jan = new Date(new Date().getFullYear(), 0, 1).getTimezoneOffset();
    return { lat: 45, lng: -jan / 4, guessed: true };
  }
  function isNight(now = new Date()) {
    const { lat, lng } = coords(), t = sunTimes(now, lat, lng);
    if (t.polar) return t.polar === 'night';
    return now < t.rise || now >= t.set;
  }
  function apply(animate) {
    const mode = get(KEY, 'auto');
    const dark = mode === 'dark' || (mode === 'auto' && isNight());
    const root = document.documentElement;
    if (animate) { root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 700); }
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.mode = mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#121316' : '#F1ECE2';
    window.dispatchEvent(new CustomEvent('themechange', { detail: { dark, mode } }));
  }
  const fmt = d => d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';
  window.SelfTheme = {
    set(mode) { put(KEY, mode); apply(true); },
    mode: () => get(KEY, 'auto'),
    info() { const c = coords(), t = sunTimes(new Date(), c.lat, c.lng); return { set: fmt(t.set), rise: fmt(t.rise), guessed: c.guessed }; },
    locate() {
      return new Promise((res, rej) => {
        if (!navigator.geolocation) return rej(new Error('unsupported'));
        navigator.geolocation.getCurrentPosition(p => {
          put(LOC, { lat: +p.coords.latitude.toFixed(2), lng: +p.coords.longitude.toFixed(2) }); apply(true); res();
        }, rej, { maximumAge: 864e5, timeout: 10000 });
      });
    }
  };
  apply(false);
  setInterval(() => { if (get(KEY, 'auto') === 'auto') { const was = document.documentElement.dataset.theme; apply(false); if (was !== document.documentElement.dataset.theme) apply(true); } }, 60000);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && apply(false));
})();
