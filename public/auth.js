// public/auth.js
// Locks the guide behind a Name + Email sign-in.
// The sign-in lasts only for the current browser session: it survives a
// page refresh, but is cleared when the tab/browser is CLOSED — so the
// agent must sign in again each time they reopen the guide, and every
// fresh open is logged.

(function () {
  var SKEY = 'phoenix-agent-session';   // sessionStorage = cleared on tab/browser close

  var overlay = document.getElementById('signinOverlay');
  if (!overlay) return; // gate markup not present; do nothing

  var nameI = document.getElementById('si-name');
  var emailI = document.getElementById('si-email');
  var btn = document.getElementById('si-enter');
  var err = document.getElementById('si-err');
  var teamI = document.getElementById('si-team');

  function escHtml(s){ return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  // Populate the Team dropdown from the same content the admin edits.
  function loadTeams(){
    if (!teamI) return;
    fetch('/api/content').then(function(r){ return r.json(); }).then(function(c){
      var teams = (c && Array.isArray(c.teams)) ? c.teams : [];
      var active = teams.filter(function(t){ return t && t.active !== false && (t.name||'').trim(); });
      if (!active.length){ teamI.innerHTML = '<option value="">(no teams set up yet)</option>'; return; }
      teamI.innerHTML = '<option value="" disabled selected>Select your team</option>' +
        active.map(function(t){ var n = escHtml(t.name); return '<option value="'+n+'">'+n+'</option>'; }).join('');
    }).catch(function(){ teamI.innerHTML = '<option value="">(couldn\'t load teams)</option>'; });
  }
  loadTeams();

  function getAgent() {
    try { return JSON.parse(sessionStorage.getItem(SKEY)); } catch (e) { return null; }
  }
  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function log(a) {
    return fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'log', name: a.name, email: a.email, team: a.team })
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
    var team = teamI ? (teamI.value || '').trim() : '';
    var hasRealTeams = teamI && teamI.querySelector('option[value]:not([value=""])');
    if (hasRealTeams && !team) { err.textContent = 'Please select your team.'; teamI.focus(); return; }
    err.textContent = '';
    var a = { name: name, email: email, team: team };
    try { sessionStorage.setItem(SKEY, JSON.stringify(a)); } catch (e) {}
    btn.disabled = true; btn.textContent = 'Entering…';
    log(a).then(function () {
      unlock();
      btn.disabled = false; btn.textContent = 'Enter Guide';
    });
  }

  btn.addEventListener('click', submit);
  nameI.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); emailI.focus(); } });
  emailI.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });

  // If they already signed in THIS session (e.g. they just refreshed the
  // page), let them straight back in without re-logging. A closed tab clears
  // this, so the next open starts fresh at the sign-in screen.
  var agent = getAgent();
  if (agent && agent.email) {
    unlock();
  } else {
    document.body.classList.add('locked');
    setTimeout(function () { if (nameI) nameI.focus(); }, 100);
  }
})();
