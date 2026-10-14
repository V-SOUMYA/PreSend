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
