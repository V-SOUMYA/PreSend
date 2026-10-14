// UI wiring. All state lives in memory only: no localStorage, no network.
const $ = (id) => document.getElementById(id);
const chat = $('chat'), nudge = $('nudge'), msg = $('msg');
const stats = { shown: 0, reworded: 0, anyway: 0 };
let pending = null; // { text, isPhoto }

function bubble(text, who) {
  const d = document.createElement('div');
  d.className = 'b ' + who;
  d.textContent = text; // textContent, never innerHTML
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}
function renderStats() {
  $('s1').textContent = stats.shown;
  $('s2').textContent = stats.reworded;
  $('s3').textContent = stats.anyway;
}
function fakeReply() {
  const r = ['haha ok', 'oh really? tell me more', 'nice, what else is up?', 'ok cool 🙂', 'lol same'];
  setTimeout(() => bubble(r[Math.floor(Math.random() * r.length)], 'them'), 700);
}
function deliver(text) { bubble(text, 'me'); fakeReply(); }
function hideNudge() { nudge.style.display = 'none'; pending = null; }

function showNudge(hit, payload) {
  pending = payload;
  stats.shown++; renderStats();
  $('nt').textContent = (hit.lvl >= 3 ? '🛑 ' : '⏸️ ') + hit.title;
  $('nm').textContent = hit.msg;
  $('ntip').textContent = hit.tip;
  nudge.className = hit.lvl >= 3 ? 'high' : '';
  nudge.style.display = 'block';
  $('reword').focus();
}

function attemptText() {
  const text = msg.value.trim();
  if (!text) return;
  const hit = PauseDetector.analyze(text, $('ctx').value);
  if (hit) showNudge(hit, { text });
  else { deliver(text); msg.value = ''; }
}
function attemptPhoto() {
  const hit = PauseDetector.analyzePhoto($('ctx').value);
  if (hit) showNudge(hit, { text: '📷 [photo]', isPhoto: true });
  else deliver('📷 [photo]');
}

$('send').onclick = attemptText;
msg.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptText(); });
$('photo').onclick = attemptPhoto;
$('reword').onclick = () => { stats.reworded++; renderStats(); hideNudge(); msg.focus(); };
$('anyway').onclick = () => {
  if (!pending) return;
  stats.anyway++; renderStats();
  const p = pending; hideNudge();
  deliver(p.text);
  if (!p.isPhoto) msg.value = '';
};
document.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { msg.value = b.dataset.t; msg.focus(); }));
$('ctx').onchange = hideNudge;
bubble('hey! what are you up to?', 'them');
