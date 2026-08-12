const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeHTML = (value = '') => String(value).replace(/[&<>\'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);
const initials = (name) => (String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('') || 'C').toUpperCase();

const topbar = $('#topbar');
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
window.addEventListener('scroll', () => topbar?.classList.toggle('scrolled', window.scrollY > 16), { passive: true });
menuToggle?.addEventListener('click', () => { const open = mainNav.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); });
$$('.main-nav a').forEach((link) => link.addEventListener('click', () => mainNav?.classList.remove('open')));
const revealObserver = new IntersectionObserver((entries, observer) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: .08 });
$$('.reveal').forEach((element) => revealObserver.observe(element));

function renderCoaches(coaches = []) {
  $('#coachCount').textContent = faDigits(coaches.length);
  $('#coachesEmpty').classList.toggle('visible', coaches.length === 0);
  $('#coachesGrid').innerHTML = coaches.map((coach, index) => {
    const visual = coach.image_url ? `<img src="${escapeHTML(coach.image_url)}" alt="${escapeHTML(coach.name)}" />` : `<div class="coach-initials">${escapeHTML(initials(coach.name))}</div>`;
    const tags = (coach.specialties || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3).map((item) => `<span>${escapeHTML(item)}</span>`).join('');
    return `<article class="coach-card reveal is-visible"><div class="coach-image">${visual}<span class="coach-number">${faDigits(String(index + 1).padStart(2, '0'))}</span></div><div class="coach-body"><div class="coach-kicker">PISHRO COACHING STAFF</div><h3>${escapeHTML(coach.name)}</h3><div class="coach-role">${escapeHTML(coach.role || 'مربی پیست')} · ${faDigits(coach.years_active || 0)} سال فعالیت</div><p>${escapeHTML(coach.bio || 'پروفایل این مربی به‌زودی تکمیل می‌شود.')}</p><div class="coach-tags">${tags}</div></div></article>`;
  }).join('');
}
async function loadCoaches() {
  try { const response = await PishroAPI.getCoaches(); renderCoaches(response.coaches || []); }
  catch (error) { console.error(error); renderCoaches([]); }
}
loadCoaches();
