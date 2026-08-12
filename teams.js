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

async function refreshDirectoryStats() {
  const countElement = $('#directoryPlayerCount');
  if (!countElement || !window.PishroAPI) return;
  try {
    const response = await PishroAPI.getStats();
    countElement.textContent = faDigits(response.total_players || 0);
  } catch (error) {
    console.warn('Directory statistics are not available yet.', error);
    countElement.textContent = '۰';
  }
}
refreshDirectoryStats();
window.addEventListener('pishro-roster-updated', refreshDirectoryStats);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDirectoryStats(); });
