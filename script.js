// ---------- Tab nav switching ----------
const navItems = document.querySelectorAll('.tab[data-target]');
const panels = document.querySelectorAll('.panel');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = item.dataset.target;

    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');

    panels.forEach(p => p.classList.toggle('active', p.id === target));

    pageTitle.textContent = item.textContent;

    window.scrollTo({ top: 0, behavior: 'instant' });
  });
});

// ---------- Modal open/close ----------
const modalTriggers = document.querySelectorAll('[data-modal]');
const notesBtn = document.getElementById('notesBtn');
const notesModal = document.getElementById('notesModal');

function openModal(modal) {
  modal.classList.add('open');
}

function closeModal(modal) {
  modal.classList.remove('open');
}

modalTriggers.forEach(trigger => {
  trigger.addEventListener('click', () => {
    const modal = document.getElementById(trigger.dataset.modal);
    if (modal) openModal(modal);
  });
});

notesBtn.addEventListener('click', () => openModal(notesModal));

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay);
  });
  overlay.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(overlay));
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
  }
});

// ---------- Menu / Admin buttons (placeholder) ----------
const menuBtn = document.getElementById('menuBtn');
const adminBtn = document.getElementById('adminBtn');
const tabnav = document.getElementById('tabnav');

if (menuBtn && tabnav) {
  menuBtn.addEventListener('click', () => {
    tabnav.classList.toggle('hidden-on-mobile');
  });
}

if (adminBtn) {
  adminBtn.addEventListener('click', () => {
    alert('Admin tools are not yet set up for this guide.');
  });
}

// ---------- Pricing constants ----------
// Hourly rate is tied to membership fee tier.
const HOURLY_RATES = {
  59: 35,
  49: 30,
  39: 25,
};

// One-time cleaning rate (no membership) is a flat premium rate.
const ONE_TIME_RATE = 45;

// Base hours estimate from bedrooms/bathrooms.
function estimateHours(bedrooms, bathrooms) {
  const base = 1.5; // base hours for a small home
  return base + (bedrooms * 0.75) + (bathrooms * 0.5);
}

// ---------- Cleaning Calculator ----------
document.getElementById('cc-calculate').addEventListener('click', () => {
  const bedrooms = parseFloat(document.getElementById('cc-bedrooms').value) || 0;
  const bathrooms = parseFloat(document.getElementById('cc-bathrooms').value) || 0;
  const preferredHours = parseFloat(document.getElementById('cc-preferred-hours').value);
  const premiumHours = parseFloat(document.getElementById('cc-premium-hours').value) || 0;
  const frequency = parseInt(document.getElementById('cc-frequency').value, 10);
  const membershipFee = parseInt(document.getElementById('cc-membership-fee').value, 10);

  const rate = HOURLY_RATES[membershipFee] || 35;

  const estimatedHours = estimateHours(bedrooms, bathrooms);
  const baseHours = (preferredHours && preferredHours > 0) ? preferredHours : estimatedHours;
  const totalHours = baseHours + premiumHours;

  const perVisitCost = totalHours * rate;
  const monthlyCleaningCost = perVisitCost * frequency;
  const monthlyTotal = monthlyCleaningCost + membershipFee;

  const resultBox = document.getElementById('cc-result');
  resultBox.innerHTML = `
    <p class="result-label">Estimate</p>
    <div class="result-row"><span>Estimated hours (home size)</span><span>${estimatedHours.toFixed(2)} hrs</span></div>
    <div class="result-row"><span>Hours used for quote</span><span>${baseHours.toFixed(2)} hrs</span></div>
    <div class="result-row"><span>Premium / extra hours</span><span>${premiumHours.toFixed(2)} hrs</span></div>
    <div class="result-row"><span>Total hours per visit</span><span>${totalHours.toFixed(2)} hrs</span></div>
    <div class="result-row"><span>Rate</span><span>$${rate.toFixed(2)}/hr</span></div>
    <div class="result-row"><span>Cost per visit</span><span>$${perVisitCost.toFixed(2)}</span></div>
    <div class="result-row"><span>Visits per month</span><span>${frequency}x</span></div>
    <div class="result-row"><span>Membership fee</span><span>$${membershipFee.toFixed(2)}/mo</span></div>
    <div class="result-row total"><span>Estimated monthly total</span><span>$${monthlyTotal.toFixed(2)}</span></div>
  `;
});

// ---------- ETF Calculator ----------
document.getElementById('etf-calculate').addEventListener('click', () => {
  const cohortSelect = document.getElementById('etf-cohort');
  const selectedOption = cohortSelect.options[cohortSelect.selectedIndex];
  const etfRate = parseFloat(selectedOption.value);
  const membershipFee = parseFloat(selectedOption.dataset.mf);
  const hours = parseFloat(document.getElementById('etf-hours').value) || 0;

  const etfAmount = hours * etfRate;

  const resultBox = document.getElementById('etf-result');
  resultBox.innerHTML = `
    <p class="result-label">ETF Result</p>
    <div class="result-row"><span>Cohort membership fee</span><span>$${membershipFee.toFixed(2)}/mo</span></div>
    <div class="result-row"><span>ETF rate</span><span>$${etfRate.toFixed(2)}/hr</span></div>
    <div class="result-row"><span>Initial cleaning hours</span><span>${hours.toFixed(2)} hrs</span></div>
    <div class="result-row total"><span>Early Termination Fee</span><span>$${etfAmount.toFixed(2)}</span></div>
  `;
});

// ---------- One-Time Cleaning Calculator ----------
document.getElementById('ot-calculate').addEventListener('click', () => {
  const hours = parseFloat(document.getElementById('ot-hours').value) || 0;

  const standardTotal = hours * ONE_TIME_RATE;
  const deepCleanTotal = hours * ONE_TIME_RATE + (hours * 10); // deep clean adds $10/hr
  const moveTotal = hours * ONE_TIME_RATE + (hours * 15); // move in/out adds $15/hr

  const resultBox = document.getElementById('ot-result');
  resultBox.innerHTML = `
    <p class="result-label">One-Time Options (${hours.toFixed(2)} hrs)</p>
    <div class="ot-option">
      <span class="ot-label">Standard clean — $${ONE_TIME_RATE}/hr</span>
      <span class="ot-price">$${standardTotal.toFixed(2)}</span>
    </div>
    <div class="ot-option">
      <span class="ot-label">Deep clean — $${(ONE_TIME_RATE + 10)}/hr</span>
      <span class="ot-price">$${deepCleanTotal.toFixed(2)}</span>
    </div>
    <div class="ot-option">
      <span class="ot-label">Move in/out — $${(ONE_TIME_RATE + 15)}/hr</span>
      <span class="ot-price">$${moveTotal.toFixed(2)}</span>
    </div>
  `;
});

// ---------- Negotiation Calculator ----------
document.getElementById('neg-calculate').addEventListener('click', () => {
  const negotiatedPrice = parseFloat(document.getElementById('neg-price').value) || 0;
  const term = parseInt(document.getElementById('neg-term').value, 10);

  const total = negotiatedPrice * term;

  document.getElementById('neg-total').textContent = `$${total.toFixed(2)}`;
});
