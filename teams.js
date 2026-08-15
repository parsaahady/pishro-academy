const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));

const categoryLabels = { novice: 'نونهالان', teen: 'نوجوانان', youth: 'جوانان', adult: 'بزرگسالان', new: 'ورزشکاران تازه' };
const genderLabel = (gender, category) => gender === 'women'
  ? (category === 'adult' ? 'بانوان' : 'دختران')
  : (category === 'adult' ? 'آقایان' : 'پسران');

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

// --- Team directory (live, database-backed) ---------------------------------
let allTeams = [];
let activeFilter = 'all';

function renderTeamDirectory() {
  const grid = $('#teamDirectoryGrid');
  const empty = $('#teamDirectoryEmpty');
  if (!grid) return;

  const visible = allTeams.filter((team) => activeFilter === 'all' || team.category_key === activeFilter);
  if (empty) empty.hidden = visible.length !== 0;

  grid.innerHTML = visible.map((team, index) => {
    const image = team.image_path || 'assets/gallery/pishro-logo.png';
    const category = team.category_key || '';
    const gender = genderLabel(team.gender, category);
    return `<a class="directory-team-card" href="team.html?team=${encodeURIComponent(team.slug)}" data-directory-category="${escapeHTML(category)}">
      <div class="directory-team-image">
        <img src="${escapeHTML(image)}" alt="${escapeHTML(team.name)}" loading="lazy" />
        <span class="directory-team-number">${faDigits(String(index + 1).padStart(2, '0'))}</span>
        <span class="directory-team-badge">${escapeHTML((team.english_name || '').toUpperCase())}</span>
      </div>
      <div class="directory-team-content">
        <div class="card-kicker">PISHRO / ${escapeHTML(category ? category.toUpperCase() : 'TEAM')} · ${gender === 'دختران' || gender === 'بانوان' ? 'WOMEN' : 'MEN'}</div>
        <h3>${escapeHTML(team.name)}</h3>
        <p>${escapeHTML(team.age_range || '')} · ${escapeHTML(team.discipline || '')}</p>
        <span class="directory-card-link">ورود به صفحه تیم <b>←</b></span>
      </div>
    </a>`;
  }).join('');
}

function renderDirectoryStats(total) {
  const countElement = $('#directoryPlayerCount');
  if (countElement) countElement.textContent = faDigits(total || 0);
}

async function loadTeamDirectory() {
  if (!window.PishroAPI) {
    $('#teamDirectoryEmpty') && ($('#teamDirectoryEmpty').hidden = false);
    return;
  }
  try {
    const [teamsResponse, statsResponse] = await Promise.all([
      PishroAPI.getTeams().catch(() => ({ teams: [] })),
      PishroAPI.getStats().catch(() => ({ total_players: 0 })),
    ]);
    allTeams = teamsResponse.teams || [];
    renderTeamDirectory();
    renderDirectoryStats(statsResponse.total_players || 0);
  } catch (error) {
    console.warn('Team directory is not available yet.', error);
    if ($('#teamDirectoryEmpty')) $('#teamDirectoryEmpty').hidden = false;
  }
}

const filterContainer = $('#teamDirectoryFilter');
filterContainer?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-directory-filter]');
  if (!button) return;
  activeFilter = button.dataset.directoryFilter || 'all';
  $$('.directory-filter-button', filterContainer).forEach((item) => item.classList.toggle('active', item === button));
  renderTeamDirectory();
});

loadTeamDirectory();
window.addEventListener('pishro-roster-updated', loadTeamDirectory);
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadTeamDirectory(); });

// Visual archive lightbox
const lightbox = $('#pishroLightbox');
$$('[data-lightbox]').forEach((tile) => tile.addEventListener('click', () => {
  $('#pishroLightboxImage').src = tile.dataset.lightbox;
  $('#pishroLightboxImage').alt = tile.dataset.caption || '';
  $('#pishroLightboxCaption').textContent = tile.dataset.caption || '';
  lightbox?.classList.add('open');
  lightbox?.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}));
$('.pishro-lightbox-close')?.addEventListener('click', () => { lightbox?.classList.remove('open'); document.body.classList.remove('modal-open'); });
lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) $('.pishro-lightbox-close')?.click(); });
