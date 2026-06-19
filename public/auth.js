// public/auth.js
// Locks the guide behind a Name + Email sign-in. Remembers the agent on
// their device, and re-logs a sign-in once per (US Central) day so daily
// usage tracking keeps working even though they're remembered.

(function () {
  var KEY = 'phoenix-agent';
  var DAYKEY = 'phoenix-agent-day';
  var TZ = 'America/Chicago';

  var overlay = document.getElementById('signinOverlay');
  if (!overlay) return; // gate markup not present; do nothing

  var nameI = document.getElementById('si-name');
  var emailI = document.getElementById('si-email');
  var btn = document.getElementById('si-enter');
  var err = document.getElementById('si-err');

  function today() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function getAgent() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  }
  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function log(a) {
    return fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'log', name: a.name, email: a.email })
    }).then(function () {
      try { localStorage.setItem(DAYKEY, today()); } catch (e) {}
    }).catch(function () { /* offline: let them in anyway */ });
  }
  function unlock() {
    overlay.classList.add('hidden');
    document.body.classList.remove('locked');
  }
  function submit() {
    var name = (nameI.value || '').trim();
    var email = (emailI.value || '').trim().toLowerCase();
    if (!name) { err.textContent = 'Please enter your name.'; nameI.focus(); return; }
    if (!validEmail(email)) { err.textContent = 'Please enter a valid email address.'; emailI.focus(); return; }
    err.textContent = '';
    var a = { name: name, email: email };
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
    btn.disabled = true; btn.textContent = 'Entering…';
    log(a).then(function () {
      unlock();
      btn.disabled = false; btn.textContent = 'Enter Guide';
    });
  }

  btn.addEventListener('click', submit);
  nameI.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); emailI.focus(); } });
  emailI.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });

  var agent = getAgent();
  if (agent && agent.email) {
    unlock();
    var last = null;
    try { last = localStorage.getItem(DAYKEY); } catch (e) {}
    if (last !== today()) log(agent);          // log a fresh sign-in for the new day
  } else {
    document.body.classList.add('locked');
    setTimeout(function () { if (nameI) nameI.focus(); }, 100);
  }
})();
