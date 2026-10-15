/* Body · Money · People — loaded after app.js, shares its globals ($, $$, store, G, esc, toast, openSheet, closeSheet, sheets, onEnter, buzz) */

/* ---------- BODY ---------- */
let water = store.get('water', 1.4);
const SLEEP = { from: 23 + 40 / 60, to: 7 };
function drawSleep() {
  const svg = $('#sleepDial'), R = 82, c = 100;
  const pt = h => { const a = (h / 24) * Math.PI * 2 - Math.PI / 2; return [c + R * Math.cos(a), c + R * Math.sin(a)]; };
  const [x1, y1] = pt(SLEEP.from), [x2, y2] = pt(SLEEP.to + 24);
  const span = (SLEEP.to + 24 - SLEEP.from);
  const ticks = Array.from({ length: 24 }, (_, h) => {
    const a = (h / 24) * Math.PI * 2 - Math.PI / 2, r2 = h % 6 ? 92 : 88;
    return `<line x1="${c + 95 * Math.cos(a)}" y1="${c + 95 * Math.sin(a)}" x2="${c + r2 * Math.cos(a)}" y2="${c + r2 * Math.sin(a)}" stroke="#555" stroke-width="1.2" stroke-linecap="round"/>`;
  }).join('');
  const lbl = [[0, '00'], [6, '06'], [12, '12'], [18, '18']].map(([h, t]) => { const a = (h / 24) * Math.PI * 2 - Math.PI / 2; return `<text x="${c + 70 * Math.cos(a)}" y="${c + 70 * Math.sin(a) + 3}" text-anchor="middle" font-size="8" fill="#777" font-family="Roboto">${t}</text>`; }).join('');
  svg.innerHTML = `${ticks}${lbl}<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="#333" stroke-width="7"/>
    <path id="sleepArc" d="M${x1} ${y1} A${R} ${R} 0 ${span > 12 ? 1 : 0} 1 ${x2} ${y2}" fill="none" stroke="#2E8BA6" stroke-width="7" stroke-linecap="round"/>
    <circle cx="${x1}" cy="${y1}" r="6" fill="#262626" stroke="#2E8BA6" stroke-width="2"/>
    <circle cx="${x2}" cy="${y2}" r="7" fill="url(#ember)"/>`;
  const p = $('#sleepArc'); if (G) { const L = p.getTotalLength(); G.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out' }); }
}
function drawWater() {
  $('#waterV').textContent = water.toFixed(2).replace(/0$/, '');
  const f = $$('.facts li')[1]; if (f) f.lastChild.textContent = ` ${water.toFixed(1)} L Water`;
}
$('.counter[data-k="water"] .pm').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  water = Math.max(0, Math.min(4, +(water + +b.dataset.d).toFixed(2))); store.set('water', water); drawWater(); buzz();
  if (water >= 2 && +b.dataset.d > 0 && water - +b.dataset.d < 2) toast('Water goal reached');
});
let moves = store.get('moves', [32, 45, 18, 60, 25, 0, 0]);
function drawWeek() {
  const D = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], today = 3, max = 70;
  $('#weekBars').innerHTML = moves.map((m, i) => `<div><i class="${i === today ? 'now' : m >= 30 ? 'hit' : ''}" style="height:${Math.max(6, m / max * 100)}%" title="${m} min"></i><span>${D[i]}</span></div>`).join('');
  G?.from('#weekBars i', { scaleY: 0, duration: .6, stagger: .05, ease: 'power3.out' });
}
drawWater(); drawWeek();
$('#stepsBar').style.width = '82%';

/* ---------- MONEY ---------- */
let money = store.get('money', {
  saved: 2180, goal: 3000, budget: 2400,
  cats: [{ n: 'Food', ic: '◐', s: 420, b: 500 }, { n: 'Home', ic: '◻', s: 610, b: 650 }, { n: 'Fun', ic: '✦', s: 130, b: 120 }],
  bills: [{ d: 16, t: 'Rent', m: 'Auto-transfer', a: 650, p: 0 }, { d: 19, t: 'Phone', m: 'Orange', a: 18, p: 0 }, { d: 24, t: 'Gym', m: 'World Class', a: 45, p: 0 }, { d: 9, t: 'Electricity', m: 'Enel', a: 62, p: 1 }]
});
const saveM = () => store.set('money', money);
const eur = n => '€' + Math.round(n).toLocaleString('en-GB');
function drawMoney() {
  const spent = money.cats.reduce((a, c) => a + c.s, 0), left = money.budget - spent;
  $('#mLeft').textContent = `${eur(left)} left`; $('#tMoney').textContent = `${eur(left)} left`;
  const pct = Math.min(1, money.saved / money.goal);
  $('#goalV').textContent = eur(money.saved); $('#goalOf').textContent = `of ${eur(money.goal)} · ${Math.round(pct * 100)}%`;
  const off = 540 - 540 * pct;
  G ? G.to('#goalRing', { strokeDashoffset: off, duration: 1.2, ease: 'power3.out' }) : ($('#goalRing').style.strokeDashoffset = off);
  $('#cats').innerHTML = money.cats.map(c => `<div class="tile cat ${c.s > c.b ? 'over' : ''}"><span class="ic">${c.ic}</span><em>${c.n}</em><b>${eur(c.s)}</b><em>${c.s > c.b ? `${eur(c.s - c.b)} over` : `of ${eur(c.b)}`}</em><div class="bar2"><i style="width:${Math.min(100, c.s / c.b * 100)}%"></i></div></div>`).join('');
  const bills = [...money.bills].sort((a, b) => a.p - b.p || a.d - b.d);
  $('#bills').innerHTML = bills.map(b => `<li class="bill ${b.p ? 'paid' : ''}" data-t="${esc(b.t)}"><span class="n">${b.d}</span><div class="t">${esc(b.t)}<span class="meta">${esc(b.m)}</span></div><span class="amt">${eur(b.a)}</span><button class="pay">${b.p ? 'Paid' : 'Pay'}</button></li>`).join('');
}
$('#bills').addEventListener('click', e => {
  const btn = e.target.closest('.pay'); if (!btn) return;
  const b = money.bills.find(x => x.t === btn.closest('.bill').dataset.t); b.p = b.p ? 0 : 1; saveM(); drawMoney(); buzz();
  if (b.p) toast(`${b.t} marked paid`);
});
$('#addSave').addEventListener('click', () => {
  money.saved = Math.min(money.goal, money.saved + 50); saveM(); drawMoney(); buzz();
  G?.fromTo('.coin', { rotateY: 0 }, { rotateY: 360, duration: .9, ease: 'power2.out' });
  toast(money.saved >= money.goal ? 'Goal reached. Book the flight.' : `${eur(money.goal - money.saved)} to Lisbon`);
});
drawMoney();

/* ---------- PEOPLE ---------- */
const AV = id => `https://images.unsplash.com/${id}?w=120&h=120&fit=crop&crop=faces`;
let people = store.get('people', [
  { n: 'Ana', r: 'Sister', d: 2, img: 'photo-1438761681033-6461ffad8d80' },
  { n: 'Radu', r: 'Best friend', d: 9, img: 'photo-1500648767791-00dcc994a43e' },
  { n: 'Mum', r: 'Family', d: 4, img: 'photo-1554151228-14d9def656e4' },
  { n: 'Ioana', r: 'Old colleague', d: 34, img: 'photo-1534528741775-53994a69daeb' },
  { n: 'Tudor', r: 'Climbing buddy', d: 21, img: 'photo-1506794778202-cad84cf45f1d' }
]);
let pSel = -1;
const ago = d => d === 0 ? 'Today' : d === 1 ? 'Yesterday' : d < 14 ? `${d} days ago` : `${Math.round(d / 7)} weeks ago`;
function drawPeople() {
  const o = $('#orbit');
  people.forEach((p, i) => {
    let el = $(`.orb-p[data-i="${i}"]`, o);
    if (!el) { el = document.createElement('button'); el.className = 'orb-p'; el.dataset.i = i; el.setAttribute('aria-label', p.n); el.innerHTML = `<img src="${AV(p.img)}" alt="">`; o.appendChild(el); }
    const rad = 17 + Math.min(1, p.d / 35) * 33; // % from centre: 17 (inner) → 50 (outer)
    const a = (i / people.length) * Math.PI * 2 - Math.PI / 2;
    el.style.left = 50 + rad * Math.cos(a) + '%'; el.style.top = 50 + rad * Math.sin(a) + '%';
    el.classList.toggle('drift', p.d >= 14); el.classList.toggle('sel', i === pSel);
  });
  const sorted = people.map((p, i) => ({ ...p, i })).sort((a, b) => b.d - a.d);
  $('#ppl').innerHTML = sorted.map(p => `<li class="person ${p.d >= 14 ? 'drift' : ''} ${p.i === pSel ? 'sel' : ''}" data-i="${p.i}"><img src="${AV(p.img)}" alt=""><div class="t">${esc(p.n)} <span class="meta">${p.r} · ${ago(p.d)}</span></div><button class="touch">${p.d === 0 ? 'Done ✓' : 'Reached out'}</button></li>`).join('');
  const n = people.filter(p => p.d >= 14).length;
  $('#pplSub').textContent = n ? `${n} ${n > 1 ? 'people' : 'person'} drifting` : 'Everyone close';
  $('#tPeople').textContent = n ? `${n} to reach` : 'All close';
}
function selectP(i) { pSel = pSel === i ? -1 : i; drawPeople(); }
$('#orbit').addEventListener('click', e => { const b = e.target.closest('.orb-p'); if (b) { selectP(+b.dataset.i); $(`.person[data-i="${b.dataset.i}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } });
$('#ppl').addEventListener('click', e => {
  const li = e.target.closest('.person'); if (!li) return; const i = +li.dataset.i;
  if (e.target.closest('.touch')) {
    const prev = people[i].d; if (!prev) return;
    people[i].d = 0; store.set('people', people); pSel = i; drawPeople(); buzz();
    toast(`${people[i].n} pulled closer`, { label: 'Undo', fn: () => { people[i].d = prev; store.set('people', people); drawPeople(); } });
  } else selectP(i);
});
drawPeople();

/* ---------- sheets ---------- */
sheets.workout = () => openSheet(`
  <div class="sh-title">Log movement</div>
  <div class="sh-sub">Anything that raised your heart counts.</div>
  <div class="field"><span>KIND</span><div class="chips" id="wKind"><button class="chip on">Walk</button><button class="chip">Run</button><button class="chip">Climb</button><button class="chip">Yoga</button></div></div>
  <label class="field" id="fMin"><span>MINUTES</span><input id="wMin" type="number" inputmode="numeric" min="1" max="300" placeholder="30"><em class="err-msg">Between 1 and 300 minutes.</em></label>
  <div class="sh-actions"><button class="text-btn" data-close>Cancel</button><button class="cap-btn" id="wSave"><i class="dot sm"></i>Log it</button></div>`, b => {
  $('#wKind', b).addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) $$('#wKind .chip').forEach(x => x.classList.toggle('on', x === c)); });
  $('#wSave', b).addEventListener('click', () => {
    const m = +$('#wMin').value;
    if (!(m >= 1 && m <= 300)) { $('#fMin').classList.add('err'); return; }
    moves[3] += m; store.set('moves', moves); closeSheet(); drawWeek(); toast(`${m} min of ${$('#wKind .on').textContent.toLowerCase()} logged`);
  });
  $('#wMin', b).addEventListener('input', () => $('#fMin').classList.remove('err'));
});
sheets.expense = () => openSheet(`
  <div class="sh-title">Add expense</div>
  <div class="sh-sub">Log it now, forget it later.</div>
  <label class="field" id="fAmt"><span>AMOUNT · €</span><input id="xAmt" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="12.50"><em class="err-msg">Enter an amount above zero.</em></label>
  <div class="field"><span>CATEGORY</span><div class="chips" id="xCat">${money.cats.map((c, i) => `<button class="chip ${i ? '' : 'on'}" data-i="${i}">${c.n}</button>`).join('')}</div></div>
  <div class="sh-actions"><button class="text-btn" data-close>Cancel</button><button class="cap-btn" id="xSave"><i class="dot sm"></i>Add</button></div>`, b => {
  $('#xCat', b).addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) $$('#xCat .chip').forEach(x => x.classList.toggle('on', x === c)); });
  $('#xSave', b).addEventListener('click', () => {
    const a = +$('#xAmt').value;
    if (!(a > 0)) { $('#fAmt').classList.add('err'); return; }
    const c = money.cats[+$('#xCat .on').dataset.i]; c.s += a; saveM(); closeSheet(); drawMoney();
    toast(c.s > c.b ? `${c.n} is over budget` : `${eur(a)} added to ${c.n}`);
  });
  $('#xAmt', b).addEventListener('input', () => $('#fAmt').classList.remove('err'));
});

/* ---------- enter hooks ---------- */
Object.assign(onEnter, {
  body: () => { drawSleep(); drawWeek(); },
  money: () => { $('#goalRing').style.strokeDashoffset = 540; drawMoney(); G?.from('.coin', { scale: .6, rotate: -90, duration: .9, ease: 'back.out(1.6)' }); },
  people: () => { drawPeople(); G?.from('.orb-p', { scale: 0, duration: .6, stagger: .08, ease: 'back.out(2)' }); }
});
