const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);

const topbar = $('#topbar');
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
window.addEventListener('scroll', () => topbar?.classList.toggle('scrolled', window.scrollY > 16), { passive: true });
menuToggle?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('.main-nav a').forEach((link) => link.addEventListener('click', () => mainNav?.classList.remove('open')));

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .08 });
$$('.reveal').forEach((element) => revealObserver.observe(element));

const filters = $$('.directory-filter-button');
const cards = $$('.directory-team-card');
filters.forEach((button) => button.addEventListener('click', () => {
  const filter = button.dataset.directoryFilter;
  filters.forEach((item) => item.classList.toggle('active', item === button));
  cards.forEach((card) => {
    const categories = card.dataset.directoryCategory || '';
    card.classList.toggle('is-hidden', filter !== 'all' && !categories.includes(filter));
  });
}));

const rosterKeys = ['kids', 'junior', 'women', 'adult', 'pro'];
const totalPlayers = rosterKeys.reduce((total, key) => {
  try { return total + JSON.parse(localStorage.getItem(`pishro_roster_${key}`) || '[]').length; } catch (error) { return total; }
}, 0);
$('#directoryPlayerCount').textContent = faDigits(totalPlayers);
window.addEventListener('storage', () => {
  const total = rosterKeys.reduce((sum, key) => {
    try { return sum + JSON.parse(localStorage.getItem(`pishro_roster_${key}`) || '[]').length; } catch (error) { return sum; }
  }, 0);
  $('#directoryPlayerCount').textContent = faDigits(total);
});
