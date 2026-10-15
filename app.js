const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('selfos:' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('selfos:' + k, JSON.stringify(v)); } catch {} }
};
const G = window.gsap;
if (G && matchMedia('(prefers-reduced-motion: reduce)').matches) G.globalTimeline.timeScale(20);
let lastFocus = null;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const buzz = () => { if (prefs.haptic && navigator.vibrate) navigator.vibrate(8); };

/* ---------- prefs ---------- */
let prefs = store.get('prefs', { morning: true, evening: true, breaks: false, haptic: true });
$$('[data-pref]').forEach(i => {
  i.checked = !!prefs[i.dataset.pref];
  i.addEventListener('change', () => { prefs[i.dataset.pref] = i.checked; store.set('prefs', prefs); buzz(); toast(`${i.closest('.row').firstChild.textContent.trim()} ${i.checked ? 'on' : 'off'}`); });
});

/* ---------- toast ---------- */
let toastT;
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${action.label}</button>` : ''}`;
  if (action) $('button', t).onclick = () => { action.fn(); t.classList.remove('on'); };
  t.classList.add('on'); clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), action ? 4500 : 2400);
}

/* ---------- sheet ---------- */
function openSheet(html, onMount) {
  lastFocus = document.activeElement;
  $('#sheetBody').innerHTML = html;
  $('#sheet').classList.add('on'); $('#sheet').setAttribute('aria-hidden', 'false');
  $('#scrim').classList.add('on'); $('#back').classList.add('hide');
  onMount?.($('#sheetBody'));
  setTimeout(() => $('#sheetBody input')?.focus({ preventScroll: true }), 450);
}
function closeSheet() {
  $('#sheet').classList.remove('on'); $('#sheet').setAttribute('aria-hidden', 'true');
  $('#scrim').classList.remove('on'); $('#back').classList.remove('hide');
  if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true }); lastFocus = null;
}
$('#scrim').addEventListener('click', closeSheet);
document.addEventListener('keydown', e => e.key === 'Escape' && closeSheet());
(() => { // drag sheet down to close
  let y0 = null; const sh = $('#sheet');
  sh.addEventListener('touchstart', e => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  sh.addEventListener('touchmove', e => { if (y0 == null) return; const d = Math.max(0, e.touches[0].clientY - y0); sh.style.transition = 'none'; sh.style.transform = `translateY(${d}px)`; }, { passive: true });
  sh.addEventListener('touchend', e => { if (y0 == null) return; const d = e.changedTouches[0].clientY - y0; sh.style.transition = ''; sh.style.transform = ''; y0 = null; if (d > 90) closeSheet(); });
})();

/* ---------- navigation ---------- */
const stack = ['home'];
function show(name, dir = 1) {
  const cur = $('.screen.is-active'), next = $(`[data-screen="${name}"]`);
  if (!next || cur === next) return;
  closeSheet();
  cur.classList.remove('is-active');
  next.classList.add('is-active');
  next.scrollTop = 0;
  $('#back').classList.toggle('home', name === 'home');
  if (G) {
    const kids = $$(':scope > *:not(.ghost)', next);
    G.fromTo(kids, { x: 14 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: .45, ease: 'power3.out', stagger: .035, clearProps: 'transform' });
    G.fromTo($('.ghost', next), { opacity: 0 }, { opacity: 1, duration: .8, ease: 'power2.out' });
  }
  onEnter[name]?.();
}
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { stack.push(go.dataset.go); show(go.dataset.go, 1); buzz(); }
  const sh = e.target.closest('[data-sheet]');
  if (sh) sheets[sh.dataset.sheet]();
});
$('#back').addEventListener('click', () => {
  if (stack.length > 1) { stack.pop(); show(stack.at(-1), -1); buzz(); }
  else G?.fromTo('#back', { rotate: -8 }, { rotate: 0, duration: .5, ease: 'elastic.out(1,.4)' });
});

/* ---------- habits ---------- */
const ICONS = [['i-pen', 'Write'], ['i-drop', 'Water'], ['i-step', 'Move'], ['i-moon', 'Rest']];
const DEFAULT_HABITS = [
  { n: 'Morning pages', ic: 'i-pen', m: '07:00', d: 1 }, { n: 'Drink 2L water', ic: 'i-drop', m: 'all day', d: 1 },
  { n: '10k steps', ic: 'i-step', m: '8.2k', d: 0 }, { n: 'Read 20 pages', ic: 'i-pen', m: 'p. 214', d: 1 },
  { n: 'No screens after 22', ic: 'i-moon', m: '22:00', d: 1 }, { n: 'Stretch', ic: 'i-step', m: '10 min', d: 0 }
];
let habits = store.get('habits2', DEFAULT_HABITS);
const saveH = () => store.set('habits2', habits);
function renderHabits() {
  const list = $('#habitList');
  if (!habits.length) {
    list.innerHTML = `<li class="empty-state"><div class="ring-o"><svg width="20" height="20"><use href="#i-plus"/></svg></div>No rituals yet.<br>Start with one small thing.</li>`;
  } else {
    list.innerHTML = habits.map((h, i) =>
      `<li class="habit ${h.d ? 'done' : ''}" data-i="${i}" role="checkbox" aria-checked="${!!h.d}" tabindex="0"><span class="check"></span><span class="h-name">${esc(h.n)}</span><span class="meta">${esc(h.m)}</span><svg><use href="#${h.ic}"/></svg><button class="del" aria-label="Remove ${esc(h.n)}"><svg><use href="#i-x"/></svg></button></li>`).join('');
  }
  const done = habits.filter(h => h.d).length;
  $('[data-screen="habits"] .cap-sub').textContent = habits.length && done === habits.length ? 'All done today · well held' : `${done} of ${habits.length} today · 12-day streak`;
  $('[data-go="habits"] em').textContent = `${done} of ${habits.length}`;
}
$('#habitList').addEventListener('click', e => {
  const li = e.target.closest('.habit'); if (!li) return;
  const i = +li.dataset.i;
  if (e.target.closest('.del')) {
    const [gone] = habits.splice(i, 1); li.classList.add('removing');
    setTimeout(() => { saveH(); renderHabits(); updateHome(); }, 350);
    toast(`Removed “${gone.n}”`, { label: 'Undo', fn: () => { habits.splice(i, 0, gone); saveH(); renderHabits(); updateHome(); } });
    return;
  }
  habits[i].d = habits[i].d ? 0 : 1; saveH(); buzz();
  li.classList.toggle('done'); li.setAttribute('aria-checked', !!habits[i].d);
  G?.fromTo($('.check', li), { scale: .6 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
  renderHabitsMeta(); updateHome();
  if (habits.every(h => h.d)) toast('Every ritual held today ✦');
});
$('#habitList').addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && e.target.classList.contains('habit')) { e.preventDefault(); e.target.click(); } });
function renderHabitsMeta() {
  const done = habits.filter(h => h.d).length;
  $('[data-screen="habits"] .cap-sub').textContent = done === habits.length ? 'All done today · well held' : `${done} of ${habits.length} today · 12-day streak`;
  $('[data-go="habits"] em').textContent = `${done} of ${habits.length}`;
}

function eq(el, cols, rows, seed) {
  let s = seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  el.innerHTML = Array.from({ length: cols }, () => {
    const h = 2 + Math.floor(rnd() * (rows - 1));
    return `<i>${Array.from({ length: rows }, (_, r) => `<b class="${r < h ? '' : 'e'}"></b>`).join('')}</i>`;
  }).join('');
}
eq($('#eq'), 21, 8, 7); eq($('#eq2'), 16, 7, 3);

/* ---------- home ---------- */
let name = store.get('name', 'Max');
function greet() {
  const h = new Date().getHours();
  const part = h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('[data-screen="home"] .cap-title').textContent = `${part}, ${name}`;
  $('[data-screen="home"] .cap-sub').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }).replace(',', ' ·');
  $('#pName').textContent = name;
}
function updateHome() {
  const r = habits.length ? habits.filter(h => h.d).length / habits.length : 0;
  const pct = Math.round((r * .7 + (mood / 100) * .3) * 100);
  const off = 540 - 540 * pct / 100;
  if (G) {
    G.to('#dayRing', { strokeDashoffset: off, duration: 1.2, ease: 'power3.out' });
    const o = { v: +$('#dayPct').textContent };
    G.to(o, { v: pct, duration: 1.2, ease: 'power3.out', onUpdate: () => $('#dayPct').textContent = Math.round(o.v) });
  } else { $('#dayRing').style.strokeDashoffset = off; $('#dayPct').textContent = pct; }
}
const syncOnline = () => $('#offline').classList.toggle('on', !navigator.onLine);
addEventListener('online', () => { syncOnline(); toast('Back online · synced'); });
addEventListener('offline', syncOnline);
$$('img').forEach(img => { if (!img.complete) { img.classList.add('loading'); img.addEventListener('load', () => img.classList.remove('loading')); img.addEventListener('error', () => { img.classList.remove('loading'); img.style.visibility = 'hidden'; }); } });

/* ---------- today mood dial ---------- */
let mood = store.get('mood', 72);
const WORDS = [[20, 'HEAVY'], [40, 'CLOUDED'], [60, 'STEADY'], [80, 'BRIGHT'], [101, 'RADIANT']];
const ticks = $('#ticks');
ticks.innerHTML = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * Math.PI * 2 - Math.PI / 2, r1 = 88, r2 = i % 4 ? 84 : 80;
  return `<line x1="${100 + r1 * Math.cos(a)}" y1="${100 + r1 * Math.sin(a)}" x2="${100 + r2 * Math.cos(a)}" y2="${100 + r2 * Math.sin(a)}" stroke-width="1.5" stroke-linecap="round"/>`;
}).join('');
function setMood(v) {
  mood = Math.max(0, Math.min(100, Math.round(v)));
  $('#moodVal').innerHTML = `${mood}<small>°</small>`;
  $('#moodMini').textContent = mood + '°';
  $('#moodWord').textContent = WORDS.find(([t]) => mood < t)[1];
  const lit = Math.round(mood / 100 * 48);
  $$('line', ticks).forEach((l, i) => l.setAttribute('stroke', i < lit ? '#F26B2A' : '#444'));
  $('#moodSphere').style.transform = `rotate(${mood * 3.6}deg)`;
  $('#moodSphere').style.filter = `saturate(${.5 + mood / 100}) brightness(${.85 + mood / 500})`;
  $('#moodDisc').setAttribute('aria-valuenow', mood);
}
const disc = $('#moodDisc');
disc.setAttribute('role', 'slider'); disc.setAttribute('aria-label', 'Mood'); disc.setAttribute('aria-valuemin', 0); disc.setAttribute('aria-valuemax', 100); disc.tabIndex = 0;
setMood(mood);
(() => {
  let drag = false;
  const at = e => {
    const r = disc.getBoundingClientRect();
    let a = Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) + Math.PI / 2;
    if (a < 0) a += Math.PI * 2;
    setMood(a / (Math.PI * 2) * 100);
  };
  disc.addEventListener('pointerdown', e => { drag = true; disc.setPointerCapture(e.pointerId); at(e); G?.to('#moodSphere', { scale: .94, duration: .2 }); });
  disc.addEventListener('pointermove', e => drag && at(e));
  disc.addEventListener('pointerup', () => { drag = false; store.set('mood', mood); G?.to('#moodSphere', { scale: 1, duration: .5, ease: 'back.out(3)' }); updateHome(); toast(`Mood logged · ${$('#moodWord').textContent.toLowerCase()}`); });
  disc.addEventListener('keydown', e => { const d = { ArrowUp: 2, ArrowRight: 2, ArrowDown: -2, ArrowLeft: -2 }[e.key]; if (d) { e.preventDefault(); setMood(mood + d); store.set('mood', mood); updateHome(); } });
})();

/* ---------- focus timer ---------- */
const TOTAL = 25 * 60; let left = TOTAL, timer = null, spin = null, sessions = store.get('sessions', 5);
const TASKS = ['Write chapter outline (every scene)', 'Inbox zero, then nothing', 'Plan Q4 savings budget'];
let task = 0;
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
function drawTimer() {
  const p = (TOTAL - left) / TOTAL;
  $('#tTime').textContent = `${fmt(TOTAL - left)} · ${fmt(TOTAL)}`;
  $('#tFill').style.width = p * 100 + '%'; $('#tKnob').style.left = p * 100 + '%';
  const m = sessions * 25; $('[data-go="focus"] em').textContent = `${Math.floor(m / 60)}h ${m % 60}m`;
}
function play(on) {
  $('#tPlay').classList.toggle('on', on);
  $('#tPlay').setAttribute('aria-label', on ? 'Pause' : 'Play');
  $('#tPlay use').setAttribute('href', on ? '#i-pause' : '#i-play');
  clearInterval(timer); timer = null;
  if (G) { spin ??= G.to('#vinyl', { rotate: 360, repeat: -1, duration: 4, ease: 'none', paused: true }); on ? spin.play() : spin.pause(); }
  if (on) timer = setInterval(() => { left = Math.max(0, left - 1); drawTimer(); if (!left) finish(); }, 1000);
  G?.to('#vinyl', { x: on ? 26 : 0, duration: .8, ease: 'power3.out' });
}
function finish() {
  play(false); sessions++; store.set('sessions', sessions); left = TOTAL; drawTimer(); buzz();
  sheets.focusDone();
}
$('#tPlay').addEventListener('click', () => play(!timer));
$('#tReset').addEventListener('click', () => { left = TOTAL; drawTimer(); });
$('#tSkip').addEventListener('click', () => { task = (task + 1) % TASKS.length; $('#focusTask').textContent = TASKS[task]; left = TOTAL; drawTimer(); });
$('#tTime').addEventListener('dblclick', () => { left = 3; drawTimer(); }); // demo shortcut: double-tap time to jump to the end
$('#focusTask').textContent = TASKS[0]; drawTimer();

/* ---------- plan: task manager ---------- */
const DOW = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'];
const TODAY = new Date(2026, 9, 14);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dayDiff = s => Math.round((parse(s) - TODAY) / 864e5);
const shortDate = s => { const n = dayDiff(s); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n > 1 && n < 7 ? DOW[parse(s).getDay()].replace('.', '') : parse(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
const TAGS = [['Health', '#2E8BA6'], ['Work', '#262626'], ['Home', '#F26B2A'], ['Social', '#E63B2E']];
const tagColor = t => (TAGS.find(x => x[0] === t) || [, '#6B6B6B'])[1];
const PRI = ['Low', 'Normal', 'High'];
let uid = Date.now();
let tasks = store.get('tasks', [
  { id: 1, t: 'Run with Ana', notes: 'Easy pace, 6k. Bring the spare key.', plan: '2026-10-14', due: null, time: '07:30', where: 'Herăstrău loop', pri: 1, tag: 'Health', done: 0, subs: [] },
  { id: 2, t: 'Dentist', notes: 'Ask about the night guard.', plan: '2026-10-14', due: '2026-10-14', time: '16:00', where: 'Dr. Ionescu', pri: 2, tag: 'Health', done: 0, subs: [] },
  { id: 3, t: 'Send Q4 proposal draft', notes: '', plan: '2026-10-14', due: '2026-10-16', time: '', where: '', pri: 2, tag: 'Work', done: 0, subs: [{ t: 'Outline scope', d: 1 }, { t: 'Pricing table', d: 0 }, { t: 'Proofread', d: 0 }] },
  { id: 4, t: 'Therapy session', notes: '', plan: '2026-10-13', due: null, time: '18:00', where: 'Studio 4', pri: 1, tag: 'Health', done: 1, subs: [] },
  { id: 5, t: 'Renew ID card', notes: 'Book online first. Photo + old ID.', plan: '2026-10-12', due: '2026-10-20', time: '', where: 'City hall', pri: 1, tag: 'Home', done: 0, subs: [] },
  { id: 6, t: 'Pay rent', notes: '', plan: '2026-10-16', due: '2026-10-16', time: '09:00', where: 'Auto-transfer', pri: 2, tag: 'Home', done: 0, subs: [] },
  { id: 7, t: 'Pottery class', notes: '', plan: '2026-10-17', due: null, time: '11:00', where: 'Atelier', pri: 0, tag: 'Social', done: 0, subs: [] },
  { id: 8, t: 'Book Lisbon flights', notes: 'Watch for fares under €120.', plan: null, due: '2026-11-01', time: '', where: '', pri: 1, tag: 'Social', done: 0, subs: [] },
  { id: 9, t: 'Fix the balcony light', notes: '', plan: null, due: null, time: '', where: '', pri: 0, tag: 'Home', done: 0, subs: [] }
]);
const saveT = () => store.set('tasks', tasks);
let sel = 14, view = 'day';

function dueChip(t) {
  if (!t.due || t.done) return '';
  const n = dayDiff(t.due);
  const cls = n < 0 ? 'late' : n === 0 ? 'today' : n <= 2 ? 'soon' : '';
  const txt = n < 0 ? `Overdue ${-n}d` : n === 0 ? 'Due today' : `Due ${shortDate(t.due)}`;
  return `<span class="due ${cls}">${txt}</span>`;
}
function taskCard(t, opts = {}) {
  const sd = t.subs.filter(s => s.d).length;
  const meta = [opts.showDate && t.plan ? shortDate(t.plan) : '', t.time, t.where].filter(Boolean).map(esc).join(' · ');
  return `<li class="task ${t.done ? 'done' : ''} pri-${t.pri}" data-id="${t.id}">
    <button class="tcheck" aria-label="${t.done ? 'Mark not done' : 'Complete'} ${esc(t.t)}"></button>
    <div class="tbody">
      <span class="tt">${esc(t.t)}</span>
      <span class="tmeta"><i class="tag" style="background:${tagColor(t.tag)}"></i>${meta || esc(t.tag)}</span>
      <span class="tchips">${dueChip(t)}${t.subs.length ? `<span class="subc">${sd}/${t.subs.length}</span>` : ''}${t.notes ? '<span class="has-note" aria-label="Has notes">¶</span>' : ''}</span>
    </div>
    ${t.pri === 2 && !t.done ? '<i class="flag" aria-label="High priority"></i>' : ''}
    <svg class="chev"><use href="#i-chev"/></svg>
  </li>`;
}
const byTime = (a, b) => a.done - b.done || (a.time || '99').localeCompare(b.time || '99') || b.pri - a.pri;
const empty = (msg) => `<li class="empty-state"><div class="ring-o"><i class="dot sm"></i></div>${msg}</li>`;

function renderWheel() {
  $('#wheel').style.display = view === 'day' ? '' : 'none';
  $('#wheel').innerHTML = Array.from({ length: 7 }, (_, k) => {
    const dt = new Date(2026, 9, sel - 3 + k), dist = Math.abs(k - 3), key = iso(dt);
    const size = [30, 20, 15, 11][dist];
    const n = tasks.filter(t => t.plan === key && !t.done).length;
    return `<button class="wd ${dist ? '' : 'sel'}" data-d="${sel - 3 + k}" style="opacity:${1 - dist * .2};font-size:${size}px" aria-label="${dt.toDateString()}, ${n} open"><b>${dt.getDate()}</b><em>${DOW[dt.getDay()]}${n ? ` <span class="wcount">${n}</span>` : ''}</em></button>`;
  }).join('');
  $$('.wd').forEach(w => w.addEventListener('click', () => { sel = +w.dataset.d; renderWheel(); }));

  const key = iso(new Date(2026, 9, sel)), list = $('#events');
  let html = '';
  if (view === 'day') {
    const overdue = sel === 14 ? tasks.filter(t => !t.done && t.plan && dayDiff(t.plan) < 0) : [];
    if (overdue.length) html += `<li class="t-head late-h">Carried over · ${overdue.length}</li>` + overdue.map(t => taskCard(t, { showDate: true })).join('');
    const day = tasks.filter(t => t.plan === key).sort(byTime);
    if (overdue.length && day.length) html += `<li class="t-head">${shortDate(key)}</li>`;
    html += day.length ? day.map(t => taskCard(t)).join('') : overdue.length ? '' : empty('A clear day. Protect it.');
    $('#addLabel').textContent = 'Add to this day';
  } else if (view === 'upcoming') {
    const up = tasks.filter(t => !t.done && (t.plan || t.due) && dayDiff(t.plan || t.due) >= 0)
      .sort((a, b) => (a.plan || a.due).localeCompare(b.plan || b.due) || byTime(a, b));
    let last = '';
    up.forEach(t => { const k = t.plan || t.due; if (k !== last) { const full = parse(k).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), sd = shortDate(k); html += `<li class="t-head">${sd}${sd !== full ? ` <em>${full}</em>` : ''}</li>`; last = k; } html += taskCard(t); });
    if (!up.length) html = empty('Nothing ahead. Enjoy the quiet.');
    $('#addLabel').textContent = 'New task';
  } else {
    const sd = tasks.filter(t => !t.plan && !t.done).sort((a, b) => b.pri - a.pri);
    html = sd.length ? sd.map(t => taskCard(t)).join('') : empty('Someday is empty. Ideas go here.');
    $('#addLabel').textContent = 'Capture an idea';
  }
  list.innerHTML = html;
  G?.from('#events > li', { y: 6, opacity: 0, duration: .35, stagger: .03, ease: 'power3.out', clearProps: 'transform' });

  const todayOpen = tasks.filter(t => t.plan === iso(TODAY) && !t.done).length;
  $('[data-go="plan"] em').textContent = `${todayOpen} open today`;
  const late = tasks.filter(t => !t.done && t.due && dayDiff(t.due) < 0).length;
  $$('#planSeg button').forEach(b => {
    const c = { day: tasks.filter(t => t.plan === key && !t.done).length, upcoming: tasks.filter(t => !t.done && (t.plan || t.due) && dayDiff(t.plan || t.due) >= 0).length, someday: tasks.filter(t => !t.plan && !t.done).length }[b.dataset.v];
    b.querySelector('i').textContent = c || '';
  });
  $('#planSub').textContent = late ? `${late} past deadline` : `${tasks.filter(t => !t.done).length} open · ${tasks.filter(t => t.done).length} done`;
}
$('#planSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; view = b.dataset.v; $$('#planSeg button').forEach(x => x.classList.toggle('on', x === b)); renderWheel(); });
$('#events').addEventListener('click', e => {
  const li = e.target.closest('.task'); if (!li) return;
  const t = tasks.find(x => x.id === +li.dataset.id);
  if (e.target.closest('.tcheck')) {
    t.done = t.done ? 0 : 1; if (t.done) t.subs.forEach(s => s.d = 1); saveT(); buzz();
    li.classList.toggle('done', !!t.done);
    G?.fromTo($('.tcheck', li), { scale: .6 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
    setTimeout(renderWheel, 450);
    if (t.done) toast(`“${t.t}” done`, { label: 'Undo', fn: () => { t.done = 0; saveT(); renderWheel(); } });
    return;
  }
  sheets.task(t);
});
renderWheel();
let wy = null;
$('#wheel').addEventListener('wheel', e => { e.preventDefault(); sel += Math.sign(e.deltaY); renderWheel(); }, { passive: false });
$('#wheel').addEventListener('touchstart', e => wy = e.touches[0].clientY, { passive: true });
$('#wheel').addEventListener('touchend', e => { const d = e.changedTouches[0].clientY - wy; if (Math.abs(d) > 20) { sel += d < 0 ? 1 : -1; renderWheel(); } });

/* ---------- journal ---------- */
let entries = store.get('journal', [
  { d: 13, w: 'Tue', t: 'Long walk without the phone. Felt the city again.' },
  { d: 11, w: 'Sun', t: 'Cooked for friends. Too much salt, nobody cared.' },
  { d: 8, w: 'Thu', t: 'Said no to a project. Relief, then doubt, then relief.' }
]);
function renderJournal() {
  const tl = $('#timeline');
  tl.classList.toggle('is-empty', !entries.length);
  tl.innerHTML = entries.length ? entries.map((e, i) => `<li class="tl"><span class="n">${e.d}</span><div><span class="meta">${e.w}</span><p>${esc(e.t)}</p></div><button class="x" data-i="${i}" aria-label="Delete entry"><svg><use href="#i-trash"/></svg></button></li>`).join('')
    : `<li class="empty-state"><div class="ring-o"><svg width="20" height="20"><use href="#i-pen"/></svg></div>Nothing written yet.<br>One honest line is enough.</li>`;
  $('[data-go="journal"] em').textContent = `${entries.length} entries`;
}
$('#timeline').addEventListener('click', e => {
  const b = e.target.closest('.x'); if (!b) return;
  const i = +b.dataset.i, [gone] = entries.splice(i, 1);
  store.set('journal', entries); renderJournal();
  toast('Entry deleted', { label: 'Undo', fn: () => { entries.splice(i, 0, gone); store.set('journal', entries); renderJournal(); } });
});
$('#jSave').addEventListener('click', () => {
  const v = $('#jInput').value.trim();
  if (!v) { G?.fromTo('.well', { x: -6 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' }); $('#jInput').focus(); return; }
  const now = new Date();
  entries.unshift({ d: now.getDate(), w: now.toLocaleDateString('en-GB', { weekday: 'short' }), t: v }); store.set('journal', entries); $('#jInput').value = '';
  renderJournal(); buzz(); toast('Kept for today');
  G?.from('.tl:first-child', { x: 40, opacity: 0, duration: .7, ease: 'power3.out' });
});

/* ---------- insights ---------- */
const RANGES = {
  w: { mood: [62, 70, 58, 49, 66, 74, 72], sleep: [6.5, 7.4, 6.1, 5.8, 7.2, 8.1, 7.3], k: ['68°', '+6', '9h 40m', '+1h 10m', '74%', '−4%'], x: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] },
  m: { mood: [55, 61, 66, 64, 70, 68], sleep: [6.4, 6.8, 7.1, 6.9, 7.4, 7.2], k: ['64°', '+3', '38h', '+4h', '71%', '+2%'], x: ['W37', '38', '39', '40', '41', '42'] },
  y: { mood: [51, 54, 58, 57, 60, 63, 61, 62, 65, 66], sleep: [6.1, 6.3, 6.6, 6.5, 6.8, 7, 6.9, 7, 7.2, 7.3], k: ['60°', '+11', '412h', '+96h', '69%', '+18%'], x: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O'] }
};
function drawChart(r) {
  const d = RANGES[r], n = d.mood.length, W = 260, H = 120, px = i => 14 + i * (W - 28) / (n - 1);
  const my = v => 96 - (v - 40) / 45 * 80, sy = v => 96 - (v - 5) / 3.5 * 80;
  const line = (arr, f) => arr.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${f(v).toFixed(1)}`).join(' ');
  $('#chart').innerHTML = `
    ${[20, 48, 76].map(y => `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="#E6E6E3" stroke-width="1"/>`).join('')}
    ${d.sleep.map((v, i) => `<rect x="${px(i) - 3}" y="${sy(v)}" width="6" height="${100 - sy(v)}" rx="3" fill="#2E8BA6" opacity=".85"/>`).join('')}
    <path d="${line(d.mood, my)}" fill="none" stroke="#F26B2A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mline"/>
    ${d.mood.map((v, i) => `<circle cx="${px(i)}" cy="${my(v)}" r="${i === n - 1 ? 5 : 2.5}" fill="${i === n - 1 ? '#F26B2A' : '#fff'}" stroke="#F26B2A" stroke-width="1.5"/>`).join('')}
    ${d.x.map((t, i) => `<text x="${px(i)}" y="116" text-anchor="middle" font-size="8" fill="#6B6B6B" font-family="Roboto">${t}</text>`).join('')}`;
  const [a, b, c, e, f, g] = d.k;
  $('#kMood').textContent = a; $('#kMoodD').textContent = b; $('#kFocus').textContent = c; $('#kFocusD').textContent = e; $('#kRit').textContent = f; $('#kRitD').textContent = g;
  $('#kRitD').className = g.startsWith('−') ? 'down' : 'up';
  const p = $('#chart .mline'); if (p && G) { const L = p.getTotalLength(); G.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out' }); }
}
$('#seg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#seg button').forEach(x => x.classList.toggle('on', x === b)); drawChart(b.dataset.r); });

/* ---------- inbox ---------- */
let inbox = store.get('inbox', [
  { ic: 'i-moon', t: 'You slept 7h 20m. Your best night this week.', m: '07:02 · Sleep', u: 1, go: 'today' },
  { ic: 'i-step', t: '1.8k steps to go. A short walk at lunch closes it.', m: '12:30 · Rituals', u: 1, go: 'habits' },
  { ic: 'i-pen', t: 'Weekly report is ready: mood up 6° from last week.', m: 'Mon · Insights', u: 1, go: 'insights' },
  { ic: 'i-drop', t: 'Hydration streak: 9 days. Keep the glass close.', m: 'Sun · Rituals', u: 0, go: 'habits' }
]);
function renderInbox() {
  const n = inbox.filter(m => m.u).length;
  $('#inbox').innerHTML = inbox.length ? inbox.map((m, i) => `<li class="msg ${m.u ? 'unread' : ''}" data-i="${i}" tabindex="0"><span class="ic"><svg><use href="#${m.ic}"/></svg></span><div><p>${esc(m.t)}</p><span class="meta">${m.m}</span></div></li>`).join('')
    : `<li class="empty-state"><div class="ring-o"><svg width="20" height="20"><use href="#i-bell"/></svg></div>All quiet. Nothing needs you.</li>`;
  $('#inboxSub').textContent = n ? `${n} unread` : 'All caught up';
  $('#bellBadge').textContent = n; $('#bellBadge').classList.toggle('zero', !n);
  $('#markAll').style.visibility = n ? 'visible' : 'hidden';
}
$('#inbox').addEventListener('click', e => {
  const li = e.target.closest('.msg'); if (!li) return;
  const m = inbox[+li.dataset.i]; m.u = 0; store.set('inbox', inbox); renderInbox();
  stack.push(m.go); show(m.go, 1);
});
$('#markAll').addEventListener('click', () => { inbox.forEach(m => m.u = 0); store.set('inbox', inbox); renderInbox(); toast('All caught up'); });

/* ---------- profile actions ---------- */
$('#exportBtn').addEventListener('click', () => {
  const data = { name, mood, habits, tasks, journal: entries, sessions, prefs };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'self-os-export.json'; a.click(); URL.revokeObjectURL(a.href);
  toast('Export ready');
});
$('#replayBtn').addEventListener('click', () => startOnboarding());
$('#resetBtn').addEventListener('click', () => sheets.confirmReset());

/* ---------- sheets ---------- */
const sheets = {
  habit() {
    openSheet(`
      <div class="sh-title">New ritual</div>
      <div class="sh-sub">Keep it small enough to do on a bad day.</div>
      <label class="field" id="fName"><span>NAME</span><input id="hName" maxlength="32" placeholder="e.g. Ten slow breaths"><em class="err-msg">Give it a name first.</em></label>
      <label class="field"><span>WHEN</span><input id="hWhen" maxlength="14" placeholder="07:00, all day…"></label>
      <div class="field"><span>ICON</span><div class="chips" id="hIcon">${ICONS.map(([ic, l], i) => `<button class="chip ${i ? '' : 'on'}" data-ic="${ic}"><svg><use href="#${ic}"/></svg>${l}</button>`).join('')}</div></div>
      <div class="sh-actions"><button class="text-btn" data-close>Cancel</button><button class="cap-btn" id="hSave"><i class="dot sm"></i>Add ritual</button></div>`, b => {
      $('#hIcon', b).addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; $$('.chip', b).forEach(x => x.classList.toggle('on', x === c)); });
      $('#hSave', b).addEventListener('click', () => {
        const n = $('#hName').value.trim();
        if (!n) { $('#fName').classList.add('err'); $('#hName').focus(); return; }
        habits.push({ n, m: $('#hWhen').value.trim() || 'daily', ic: $('.chip.on', b).dataset.ic, d: 0 });
        saveH(); renderHabits(); updateHome(); closeSheet(); toast(`“${n}” added`);
      });
      $('#hName', b).addEventListener('input', () => $('#fName').classList.remove('err'));
    });
  },
  event() { sheets.task(null); },
  task(src) {
    const isNew = !src;
    const t = src ? JSON.parse(JSON.stringify(src)) : { id: ++uid, t: '', notes: '', plan: view === 'someday' ? null : iso(new Date(2026, 9, sel)), due: null, time: '', where: '', pri: 1, tag: 'Home', done: 0, subs: [] };
    const subsHtml = () => t.subs.map((s, i) => `<li class="sub ${s.d ? 'done' : ''}" data-i="${i}"><button class="tcheck sm" aria-label="Toggle subtask"></button><span>${esc(s.t)}</span><button class="sx" aria-label="Remove subtask"><svg><use href="#i-x"/></svg></button></li>`).join('');
    openSheet(`
      <div class="sh-top"><span class="sh-micro">${isNew ? 'NEW TASK' : t.done ? 'COMPLETED' : 'TASK'}</span>${isNew ? '' : `<button class="text-btn" id="tDone">${t.done ? 'Reopen' : 'Mark done'}</button>`}</div>
      <label class="field" id="fT"><input id="tT" class="title-in" maxlength="60" placeholder="What needs doing?" value="${esc(t.t)}"><em class="err-msg">Give it a title.</em></label>
      <label class="field"><span>NOTES</span><textarea id="tN" rows="2" placeholder="Details, links, context…">${esc(t.notes)}</textarea></label>
      <div class="f-grid">
        <label class="field"><span>PLANNED FOR</span><input type="date" id="tP" value="${t.plan || ''}"></label>
        <label class="field"><span>TIME</span><input type="time" id="tTm" value="${t.time}"></label>
        <label class="field"><span>DEADLINE</span><input type="date" id="tD" value="${t.due || ''}"></label>
        <label class="field"><span>WHERE</span><input id="tW" maxlength="30" placeholder="Optional" value="${esc(t.where)}"></label>
      </div>
      <div class="quick" id="tQuick"><button data-q="0">Today</button><button data-q="1">Tomorrow</button><button data-q="7">Next week</button><button data-q="none">Someday</button></div>
      <div class="field"><span>PRIORITY</span><div class="chips" id="tPri">${PRI.map((p, i) => `<button class="chip ${i === t.pri ? 'on' : ''}" data-v="${i}">${i === 2 ? '<i class="flag in"></i>' : ''}${p}</button>`).join('')}</div></div>
      <div class="field"><span>AREA</span><div class="chips" id="tTag">${TAGS.map(([n, c]) => `<button class="chip ${n === t.tag ? 'on' : ''}" data-v="${n}"><i class="tag" style="background:${c}"></i>${n}</button>`).join('')}</div></div>
      <div class="field"><span>SUBTASKS</span><ul class="subs" id="tSubs">${subsHtml()}</ul>
        <div class="sub-add"><input id="tSubIn" maxlength="50" placeholder="Add a step and press Enter"><button class="sq-mini" id="tSubBtn" aria-label="Add subtask"><svg><use href="#i-plus"/></svg></button></div></div>
      <div class="sh-actions">${isNew ? '<button class="text-btn" data-close>Cancel</button>' : '<button class="text-btn danger-t" id="tDel">Delete</button>'}<button class="cap-btn" id="tSave"><i class="dot sm"></i>${isNew ? 'Add task' : 'Save'}</button></div>`, b => {
      const pick = (id, key, num) => $(id, b).addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; $$(id + ' .chip', b).forEach(x => x.classList.toggle('on', x === c)); t[key] = num ? +c.dataset.v : c.dataset.v; });
      pick('#tPri', 'pri', 1); pick('#tTag', 'tag', 0);
      $('#tQuick', b).addEventListener('click', e => { const q = e.target.closest('button')?.dataset.q; if (q == null) return; $('#tP').value = q === 'none' ? '' : iso(new Date(TODAY.getTime() + +q * 864e5)); });
      const addSub = () => { const v = $('#tSubIn').value.trim(); if (!v) return; t.subs.push({ t: v, d: 0 }); $('#tSubs').innerHTML = subsHtml(); $('#tSubIn').value = ''; $('#tSubIn').focus(); };
      $('#tSubBtn', b).addEventListener('click', addSub);
      $('#tSubIn', b).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } });
      $('#tSubs', b).addEventListener('click', e => { const li = e.target.closest('.sub'); if (!li) return; const i = +li.dataset.i; if (e.target.closest('.sx')) t.subs.splice(i, 1); else t.subs[i].d = t.subs[i].d ? 0 : 1; $('#tSubs').innerHTML = subsHtml(); });
      $('#tT', b).addEventListener('input', () => $('#fT').classList.remove('err'));
      const collect = () => Object.assign(t, { t: $('#tT').value.trim(), notes: $('#tN').value.trim(), plan: $('#tP').value || null, time: $('#tTm').value, due: $('#tD').value || null, where: $('#tW').value.trim() });
      $('#tSave', b).addEventListener('click', () => {
        collect();
        if (!t.t) { $('#fT').classList.add('err'); $('#tT').focus(); return; }
        if (isNew) tasks.push(t); else Object.assign(src, t);
        saveT();
        if (t.plan && view === 'day') sel = 14 + dayDiff(t.plan);
        renderWheel(); closeSheet();
        toast(isNew ? (t.plan ? `Planned for ${shortDate(t.plan).toLowerCase()}` : 'Saved to Someday') : 'Changes saved');
      });
      $('#tDone', b)?.addEventListener('click', () => { src.done = src.done ? 0 : 1; saveT(); renderWheel(); closeSheet(); toast(src.done ? `“${src.t}” done` : 'Reopened'); });
      $('#tDel', b)?.addEventListener('click', () => {
        const i = tasks.indexOf(src); tasks.splice(i, 1); saveT(); renderWheel(); closeSheet();
        toast(`Deleted “${src.t}”`, { label: 'Undo', fn: () => { tasks.splice(i, 0, src); saveT(); renderWheel(); } });
      });
    });
  },
  focusDone() {
    openSheet(`
      <div class="done-art"><div class="disc"><div class="sphere"><svg><use href="#i-check"/></svg></div></div></div>
      <div class="sh-title center">Side A, complete.</div>
      <div class="sh-sub center">25 minutes on “${esc(TASKS[task])}”. That's ${sessions} sessions logged.</div>
      <div class="sh-actions" style="justify-content:center"><button class="cap-btn ghost-btn" data-close>Take 5</button><button class="cap-btn" id="again"><i class="dot sm"></i>Flip to side B</button></div>`, b => {
      $('#again', b).addEventListener('click', () => { closeSheet(); play(true); });
      G?.from('.done-art .disc', { scale: .6, rotate: -90, duration: .9, ease: 'back.out(1.6)' });
    });
  },
  confirmReset() {
    openSheet(`
      <div class="sh-title">Erase everything?</div>
      <div class="sh-sub">Rituals, plans, journal entries and settings on this device will be removed. This can't be undone.</div>
      <div class="sh-actions"><button class="text-btn" data-close>Keep my data</button><button class="cap-btn" id="doReset" style="background:var(--signal)">Erase</button></div>`, b => {
      $('#doReset', b).addEventListener('click', () => {
        try { Object.keys(localStorage).filter(k => k.startsWith('selfos:')).forEach(k => localStorage.removeItem(k)); } catch {}
        location.reload();
      });
    });
  }
};
$('#sheet').addEventListener('click', e => e.target.closest('[data-close]') && closeSheet());

/* ---------- onboarding ---------- */
let ob = 0;
function obGo(i) {
  ob = i; $('#obSlides').style.transform = `translateX(${-100 * i}%)`;
  $$('#obDots i').forEach((d, k) => d.classList.toggle('on', k === i)); $$('.ob-slide').forEach((d, k) => d.classList.toggle('cur', k === i));
  $('#obNext span').textContent = i === 2 ? 'Begin' : 'Continue';
  $('#obSkip').style.visibility = i === 2 ? 'hidden' : 'visible';
}
function startOnboarding() { $('#obName').value = store.get('name', ''); obGo(0); $('#onboard').classList.add('on'); $('#back').classList.add('hide'); }
function endOnboarding() {
  name = $('#obName').value.trim() || name || 'friend'; store.set('name', name); store.set('onboarded', 1); greet();
  $('#onboard').classList.add('leaving');
  setTimeout(() => $('#onboard').classList.remove('on', 'leaving'), 500);
  $('#back').classList.remove('hide');
  if (stack.at(-1) !== 'home') { stack.length = 1; show('home', -1); }
}
$('#obNext').addEventListener('click', () => ob < 2 ? obGo(ob + 1) : endOnboarding());
$('#obSkip').addEventListener('click', () => obGo(2));
$('#obName').addEventListener('keydown', e => e.key === 'Enter' && endOnboarding());
(() => { let x0 = null; const el = $('#onboard');
  el.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
  el.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - x0; if (d < -50 && ob < 2) obGo(ob + 1); if (d > 50 && ob > 0) obGo(ob - 1); }); })();

/* ---------- enter hooks & boot ---------- */
const onEnter = {
  home: updateHome,
  today: () => G?.fromTo('#moodDisc', { rotate: -40, scale: .9 }, { rotate: 0, scale: 1, duration: 1, ease: 'power3.out' }),
  habits: () => G?.from('#eq b:not(.e)', { scaleY: 0, duration: .4, stagger: .004, ease: 'power2.out' }),
  focus: () => G?.from('#vinyl', { x: -60, duration: 1, ease: 'power3.out' }),
  insights: () => drawChart($('#seg .on').dataset.r)
};
renderHabits(); renderJournal(); renderInbox(); greet(); syncOnline();
$('#back').classList.add('home');
updateHome();
if (!store.get('onboarded', 0)) startOnboarding();
else G?.from('.screen.is-active > *:not(.ghost)', { y: 30, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out', clearProps: 'transform' });
