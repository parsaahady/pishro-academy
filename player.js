const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
const safeUrl = (value) => {
  const url = String(value || '').trim();
  if (!/^https?:\/\//i.test(url)) return '';
  return /["'<>`\s\\]/.test(url) ? '' : url;
};
const initials = (name) => (String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('') || 'P').toUpperCase();

const app = $('#playerProfileApp');
const params = new URLSearchParams(window.location.search);
const playerId = params.get('id') || '';

// Shared topbar behaviour (same as the other pages).
const topbar = $('#topbar');
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
window.addEventListener('scroll', () => topbar?.classList.toggle('scrolled', window.scrollY > 16), { passive: true });
menuToggle?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('.main-nav a').forEach((link) => link.addEventListener('click', () => mainNav?.classList.remove('open')));

function observeReveals() {
  const targets = $$('.reveal').filter((el) => !el.classList.contains('is-visible'));
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
    });
  }, { threshold: .08 });
  targets.forEach((el) => observer.observe(el));
}

function notFound(message) {
  app.innerHTML = `<section class="section player-profile-notfound"><div class="empty-emblem">✦</div><h2>بازیکن پیدا نشد</h2><p>${escapeHTML(message)}</p><a class="button button-primary" href="teams.html">بازگشت به تیم‌ها <span>←</span></a></section>`;
  document.title = 'بازیکن پیدا نشد | پیشرو هاکی';
}

function renderPlayer(player) {
  const jersey = player.jersey_number !== null && player.jersey_number !== undefined
    ? `#${faDigits(player.jersey_number)}`
    : 'P';
  const photo = player.image_url
    ? `<img src="${escapeHTML(player.image_url)}" alt="${escapeHTML(player.name)}" />`
    : `<div class="player-initials">${escapeHTML(initials(player.name))}</div>`;
  const iranHockeyUrl = safeUrl(player.iran_hockey_url);

  const position = player.position || 'بازیکن';
  const age = player.age ? `${faDigits(player.age)} سال` : '—';
  const years = `${faDigits(player.years_active || 0)} سال`;
  const ageGroup = player.age_group || '—';
  const teamName = player.team_name || '—';
  const teamLink = player.team_slug ? `team.html?team=${encodeURIComponent(player.team_slug)}` : 'teams.html';

  document.title = `${player.name} | پیشرو هاکی`;

  app.innerHTML = `
    <section class="section player-profile-hero">
      <div class="player-profile-copy reveal">
        <a class="back-link" href="teams.html">← بازگشت به تیم‌ها</a>
        <div class="eyebrow">PISHRO HOCKEY / PLAYER PROFILE</div>
        <h1 id="playerName">${escapeHTML(player.name)}</h1>
        <p>${escapeHTML(player.team_name || '')}${player.team_age_range ? ` · ${escapeHTML(player.team_age_range)}` : ''}${player.team_discipline ? ` · ${escapeHTML(player.team_discipline)}` : ''}</p>
        <div class="player-profile-actions">
          ${iranHockeyUrl ? `<a class="button button-primary" href="${escapeHTML(iranHockeyUrl)}" target="_blank" rel="noopener noreferrer">پروفایل ایران هاکی <span>↗</span></a>` : ''}
          <a class="button button-ghost" href="${teamLink}">صفحه تیم <span>←</span></a>
        </div>
      </div>
      <div class="player-profile-photo reveal reveal-delay-1">
        ${photo}
        <div class="overlay"></div>
        <span class="player-profile-jersey">${escapeHTML(jersey)}</span>
        <span class="player-profile-label">PISHRO / PLAYER</span>
      </div>
    </section>

    <section class="section player-profile-metrics reveal">
      <div><span>پست بازی</span><strong>${escapeHTML(position)}</strong></div>
      <div><span>سن</span><strong>${escapeHTML(age)}</strong></div>
      <div><span>سابقه فعالیت</span><strong>${escapeHTML(years)}</strong></div>
      <div><span>رده سنی</span><strong>${escapeHTML(ageGroup)}</strong></div>
      <div><span>تیم</span><strong>${escapeHTML(teamName)}</strong></div>
    </section>

    <section class="section player-profile-bio">
      <div class="section-heading split-heading reveal">
        <div><div class="eyebrow">PISHRO / BIOGRAPHY</div><h2>درباره<br /><span>بازیکن.</span></h2></div>
        <p>اطلاعات این بازیکن توسط مدیر باشگاه پیشرو هاکی ثبت و مدیریت می‌شود.</p>
      </div>
      <div class="bio-card reveal">${player.bio ? `<p>${escapeHTML(player.bio)}</p>` : '<p>پروفایل این بازیکن به‌زودی تکمیل می‌شود.</p>'}</div>
    </section>
  `;

  observeReveals();
}

async function loadPlayer() {
  if (!playerId || !window.PishroAPI) {
    notFound('این بازیکن وجود ندارد یا هنوز منتشر نشده است.');
    return;
  }
  try {
    const response = await PishroAPI.getPublicPlayer(playerId);
    const player = response && response.player;
    if (!player) {
      notFound('این بازیکن وجود ندارد یا هنوز منتشر نشده است.');
      return;
    }
    try {
      renderPlayer(player);
    } catch (renderError) {
      console.error(renderError);
      notFound('در نمایش اطلاعات این بازیکن مشکلی پیش آمد.');
    }
  } catch (error) {
    console.error(error);
    notFound('این بازیکن وجود ندارد یا هنوز منتشر نشده است.');
  }
}

loadPlayer();
