// UI wiring. State lives in memory only: no localStorage, no network.
// Detector contract: PauseDetector.analyze(text, ctx) / analyzePhoto(ctx) -> null | {id,lvl,title,msg,tip}
const $ = (id) => document.getElementById(id);
const chat = $('chat'), nudge = $('nudge'), msg = $('msg'), app = $('app');
const stats = { s1: 0, s2: 0, s3: 0 };
let pending = null; // { text, isPhoto }

const getCtx = () => app.dataset.ctx;

// --- Chatting-with toggle ---------------------------------------------
function setCtx(v) {
  app.dataset.ctx = v;
  document.querySelectorAll('#ctx button').forEach((b) =>
    b.setAttribute('aria-checked', String(b.dataset.v === v)));
  const stranger = v === 'stranger';
  $('av').textContent = stranger ? '👤' : '🌿';
  $('name').textContent = stranger ? 'Alex' : 'Sam';
  $('status').textContent = stranger ? "Someone you haven't met in person" : 'Online';
  $('tag').hidden = !stranger;
  hideNudge();
}
document.querySelectorAll('#ctx button').forEach((b) => (b.onclick = () => { DemoFriend.reset(); setCtx(b.dataset.v); }));

// --- Chat ----------------------------------------------------------------
function bubble(text, who) {
  const d = document.createElement('div');
  d.className = 'b ' + who;
  d.textContent = text; // textContent only, never innerHTML
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  return d;
}
function friendReply(text) {
  const t = document.createElement('div');
  t.className = 'b them typing';
  t.innerHTML = '<i></i><i></i><i></i>'; // static markup, no user text
  chat.appendChild(t);
  chat.scrollTop = chat.scrollHeight;
  const answer = DemoFriend.reply(text, getCtx()); // scripted demo friend, on-device
  setTimeout(() => { t.remove(); bubble(answer, 'them'); }, 700 + Math.min(answer.length * 12, 700));
}
function deliver(text) { bubble(text, 'me'); friendReply(text); }

// --- Counters ---------------------------------------------------------------
function count(key) {
  stats[key]++;
  const el = $(key);
  el.textContent = stats[key];
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}

// --- Nudge ---------------------------------------------------------------------
function showNudge(hit, payload) {
  pending = payload;
  count('s1');
  $('nt').textContent = hit.title;
  $('nm').textContent = hit.msg;
  $('ntip').textContent = hit.tip;
  $('adult').hidden = hit.lvl < 3;
  currentHit = hit;
  $('pausey').innerHTML = pausey(hit.lvl >= 3 ? 'worried' : hit.lvl === 2 ? 'oops' : 'hmm');
  renderHelpers(hit, payload);
  nudge.dataset.lvl = String(hit.lvl);
  nudge.hidden = false;
  nudge.scrollIntoView({ block: 'nearest' });
  $('reword').focus();
}
function hideNudge() { nudge.hidden = true; $('grownup').hidden = true; pending = null; }

function attemptText() {
  const text = msg.value.trim();
  if (!text) return;
  const hit = PauseDetector.analyze(text, getCtx());
  if (hit) showNudge(hit, { text });
  else { deliver(text); msg.value = ''; }
}
function attemptPhoto() {
  const hit = PauseDetector.analyzePhoto(getCtx());
  if (hit) showNudge(hit, { text: '📷 [photo]', isPhoto: true });
  else deliver('📷 [photo]');
}

// A real <form> makes Enter, the Send button, and mobile "send" keys all behave the same.
$('composer').addEventListener('submit', (e) => { e.preventDefault(); attemptText(); });
// Editing the text while a nudge is open means the child is rewording: dismiss it.
msg.addEventListener('input', () => { if (!nudge.hidden && pending && !pending.isPhoto) { count('s2'); award(currentHit); hideNudge(); } });
$('photo').onclick = attemptPhoto;
$('reword').onclick = () => { count('s2'); award(currentHit); hideNudge(); msg.focus(); };
$('anyway').onclick = () => {
  if (!pending) return;
  count('s3');
  const p = pending; hideNudge();
  deliver(p.text);
  if (!p.isPhoto) msg.value = '';
};
document.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { msg.value = b.dataset.t; msg.focus(); }));

bubble('hey! what are you up to? 🙂', 'them');

// --- Decorative floating background (no user text, purely visual) ----------
(function makeBackground() {
  const bg = $('bg');
  if (!bg || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const shapes = [
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="8.5" cy="8.5" r="2" fill="currentColor" opacity=".6"/></svg>', // bubble
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>', // star
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16a2 2 0 012 2v8a2 2 0 01-2 2h-8l-5 4v-4H4a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>', // chat bubble
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.7A4.5 4.5 0 0120 10c0 5.800-8 11-8 11z"/></svg>', // heart
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18a4 4 0 010-8 5.500 5.500 0 0110.600-1A4.500 4.500 0 0117 18z"/></svg>', // cloud
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4.500" height="16" rx="2"/><rect x="13.500" y="4" width="4.500" height="16" rx="2"/></svg>' // pause
  ];
  const colors = ['--p1', '--p2', '--p3', '--p4', '--p5'];
  const rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 16; i++) {
    const el = document.createElement('span');
    el.className = 'fl';
    el.innerHTML = shapes[i % shapes.length]; // static markup from the list above
    el.style.setProperty('--x', rnd(2, 94).toFixed(1) + '%');
    el.style.setProperty('--s', rnd(24, 58).toFixed(0) + 'px');
    el.style.setProperty('--d', rnd(26, 48).toFixed(1) + 's');
    el.style.setProperty('--dl', '-' + rnd(0, 40).toFixed(1) + 's');
    el.style.setProperty('--sw', rnd(-50, 50).toFixed(0) + 'px');
    el.style.setProperty('--c', 'var(' + colors[i % colors.length] + ')');
    bg.appendChild(el);
  }
})();

// ===== Fun layer: Pausey mascot, reword helpers, badges, confetti (all in memory) =====
let currentHit = null;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GROUP = { mean: 'kind', selfharm: 'kind', sexual: 'stranger', secret: 'secret', meet: 'stranger',
  photoask: 'stranger', photo: 'stranger', alone: 'privacy', addr: 'privacy', contact: 'privacy', school: 'privacy' };
const BADGES = [
  { k: 'kind', e: '💛', n: 'Kind Words', d: 'Reworded something hurtful' },
  { k: 'privacy', e: '🛡️', n: 'Privacy Pro', d: 'Protected your private info' },
  { k: 'secret', e: '🔍', n: 'Secret Spotter', d: 'Spotted a secret red flag' },
  { k: 'stranger', e: '🦊', n: 'Stranger Smart', d: 'Stayed safe with someone new' },
  { k: 'voice', e: '📣', n: 'Brave Voice', d: 'Got words to tell a grown-up' },
  { k: 'streak', e: '⭐', n: 'Pause Pro', d: 'Paused 3 times' }
];
const earned = new Set();
const HELP = {
  mean: ["I'm upset because…", 'Can we talk about it?', 'Please stop, that hurts.'],
  secret: ["I'm going to tell my parents.", "I don't keep secrets like that."],
  meet: ["I can't meet people from online.", 'I need to ask my parents first.'],
  photoask: ["I don't share photos online.", 'No thanks.'],
  addr: ["I'll ask my parents first."], contact: ["I'll ask my parents first."],
  alone: ['Talk to you later!'], school: ["Let's talk about something else!"]
};
const GROWNUP = ['Something happened online and I need help.',
  'Someone asked me for something and it felt wrong. Can we talk?',
  'I saw a message that upset me. Can you sit with me?'];

// Pausey: a friendly blob whose face changes with the mood. Static SVG, no user text.
function pausey(mood) {
  const mouth = { happy: 'M20 33q6 6 12 0', hmm: 'M21 35h10', oops: 'M21 36q5-4 10 0', worried: 'M21 37q5-5 10 0', cheer: 'M19 32q7 9 14 0z' }[mood];
  const brows = mood === 'worried' || mood === 'oops'
    ? '<path d="M13 17l8-3M39 17l-8-3" stroke="#1e2a32" stroke-width="2" stroke-linecap="round"/>' : '';
  return '<svg viewBox="0 0 52 52" class="pz"><circle cx="26" cy="26" r="20" fill="var(--accent)"/>' +
    '<g class="eyes"><circle cx="19" cy="24" r="4.2" fill="#fff"/><circle cx="33" cy="24" r="4.2" fill="#fff"/>' +
    '<circle cx="19.8" cy="24.6" r="2.1" fill="#1e2a32"/><circle cx="33.8" cy="24.6" r="2.1" fill="#1e2a32"/></g>' +
    '<circle cx="12.5" cy="31" r="3" fill="#ff9bb0" opacity=".6"/><circle cx="39.5" cy="31" r="3" fill="#ff9bb0" opacity=".6"/>' +
    brows + '<path d="' + mouth + '" stroke="#1e2a32" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="' +
    (mood === 'cheer' ? '#1e2a32' : 'none') + '"/></svg>';
}

function renderShelf() {
  const s = $('shelf'); s.replaceChildren();
  BADGES.forEach((b) => {
    const el = document.createElement('span');
    el.className = 'badge' + (earned.has(b.k) ? ' on' : '');
    el.id = 'bd-' + b.k; el.textContent = b.e; el.title = b.n + ': ' + b.d;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', b.n + (earned.has(b.k) ? ' (earned)' : ' (locked): ' + b.d));
    s.appendChild(el);
  });
  $('bcount').textContent = earned.size + '/' + BADGES.length;
}
function unlock(k) {
  if (!k || earned.has(k)) return;
  earned.add(k); renderShelf();
  $('bd-' + k).classList.add('new');
  const b = BADGES.find((x) => x.k === k);
  toast('New badge: ' + b.n + ' ' + b.e);
  confetti();
}
function award(hit) {
  if (!hit) return;
  unlock(GROUP[hit.id]);
  if (stats.s2 >= 3) unlock('streak');
}
let toastTimer;
function toast(text) {
  const t = $('toast');
  $('tpausey').innerHTML = pausey('cheer'); $('ttext').textContent = text;
  t.hidden = false; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
}
function confetti() {
  if (calm) return;
  const r = app.getBoundingClientRect(), colors = ['--p1', '--p2', '--p3', '--p4', '--p5', '--accent'];
  for (let i = 0; i < 28; i++) {
    const c = document.createElement('i'); c.className = 'cf';
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 160;
    c.style.setProperty('--ox', r.left + r.width / 2 + 'px'); c.style.setProperty('--oy', r.top + r.height * 0.6 + 'px');
    c.style.setProperty('--dx', Math.cos(ang) * dist + 'px'); c.style.setProperty('--dy', Math.sin(ang) * dist - 60 + 'px');
    c.style.setProperty('--r', Math.random() * 720 - 360 + 'deg'); c.style.setProperty('--c', 'var(' + colors[i % colors.length] + ')');
    document.body.appendChild(c); setTimeout(() => c.remove(), 1400);
  }
}

// Reword helpers: the child picks kinder words or hides private details. Nothing is sent or reported.
function useWords(text, hit) {
  msg.value = text; count('s2'); award(hit); hideNudge(); msg.focus();
  msg.setSelectionRange(text.length, text.length);
}
function renderHelpers(hit, payload) {
  const box = $('helpers'); box.replaceChildren();
  const mk = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = label; b.onclick = fn; box.appendChild(b); };
  if ((hit.id === 'addr' || hit.id === 'contact') && !payload.isPhoto)
    mk('✨ Hide the private part for me', 'hl magic', () => useWords(PauseDetector.redact(payload.text), hit));
  (HELP[hit.id] || []).forEach((t) => mk(t, 'hl', () => useWords(t, hit)));
  if (hit.lvl >= 3) mk('🆘 Help me tell a grown-up', 'hl help', showGrownup);
}
function showGrownup() {
  const g = $('grownup'), list = $('gulist'); list.replaceChildren();
  GROWNUP.forEach((t) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hl copy'; b.textContent = t;
    b.onclick = async () => {
      try { await navigator.clipboard.writeText(t); } catch (e) { /* clipboard may be blocked; still celebrate */ }
      b.textContent = 'Copied ✓ ' + t; unlock('voice');
    };
    list.appendChild(b);
  });
  g.hidden = false;
}
renderShelf();