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
document.querySelectorAll('#ctx button').forEach((b) => (b.onclick = () => setCtx(b.dataset.v)));

// --- Chat ----------------------------------------------------------------
function bubble(text, who) {
  const d = document.createElement('div');
  d.className = 'b ' + who;
  d.textContent = text; // textContent only, never innerHTML
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  return d;
}
function friendReply() {
  const t = document.createElement('div');
  t.className = 'b them typing';
  t.innerHTML = '<i></i><i></i><i></i>'; // static markup, no user text
  chat.appendChild(t);
  chat.scrollTop = chat.scrollHeight;
  const replies = ['haha ok', 'oh really? tell me more', 'nice, what else is up?', 'ok cool 🙂', 'lol same'];
  setTimeout(() => { t.remove(); bubble(replies[Math.floor(Math.random() * replies.length)], 'them'); }, 900);
}
function deliver(text) { bubble(text, 'me'); friendReply(); }

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
  nudge.dataset.lvl = String(hit.lvl);
  nudge.hidden = false;
  nudge.scrollIntoView({ block: 'nearest' });
  $('reword').focus();
}
function hideNudge() { nudge.hidden = true; pending = null; }

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

$('send').onclick = attemptText;
msg.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptText(); });
$('photo').onclick = attemptPhoto;
$('reword').onclick = () => { count('s2'); hideNudge(); msg.focus(); };
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