const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fa = v => String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
const safeUrl = v => {
  const u = String(v || '').trim();
  if (!/^https?:\/\//i.test(u)) return '';
  return /["'<>`\s\\]/.test(u) ? '' : u;
};

const params = new URLSearchParams(location.search);
const requestedTeam = (params.get('team') || '').trim();
const requestedCategory = (params.get('category') || '').trim();

const labels = { novice: 'نونهالان', teen: 'نوجوانان', youth: 'جوانان', adult: 'بزرگسالان', new: 'ورزشکاران تازه' };
const heroImages = {
  novice: 'assets/gallery/team-novice.webp',
  teen: 'assets/gallery/team-teen.webp',
  youth: 'assets/gallery/team-youth.webp',
  adult: 'assets/gallery/team-adult.webp',
  new: 'assets/gallery/team-new.webp'
};
const numbers = { novice: '۰۱', teen: '۰۲', youth: '۰۳', adult: '۰۴', new: '۰۵' };

const menu = $('#menuToggle'), nav = $('#mainNav');
menu?.addEventListener('click', () => nav.classList.toggle('open'));

const genderLabel = (gender, category) => gender === 'women'
  ? (category === 'adult' ? 'بانوان' : 'دختران')
  : (category === 'adult' ? 'آقایان' : 'پسران');

function playerCard(p) {
  const img = p.image_url
    ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`
    : `<div class="player-initials">${esc((p.name || 'پ')[0])}</div>`;
  const profile = safeUrl(p.iran_hockey_url);
  const extLink = profile
    ? `<a class="player-external-link" href="${esc(profile)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span>پروفایل ایران هاکی</span><b>↗</b></a>`
    : '';
  const searchable = [p.name, p.position, p.age_group, p.jersey_number].filter(Boolean).join(' ');
  return `<article class="player-card" data-search="${esc(searchable)}">
    <a class="player-card-image" style="display:block" href="player.html?id=${p.id}" aria-label="مشاهده پروفایل ${esc(p.name)}">${img}<span class="player-card-position">${esc(p.position || 'بازیکن')}</span></a>
    <div class="player-card-body">
      <div class="player-card-kicker">PISHRO / PLAYER</div>
      <h3><a href="player.html?id=${p.id}" style="color:inherit;text-decoration:none">${esc(p.name)}</a></h3>
      <p>${esc(p.bio || 'پروفایل این بازیکن به‌زودی تکمیل می‌شود.')}</p>
      <a class="directory-card-link" href="player.html?id=${p.id}">مشاهده پروفایل <b>←</b></a>
      ${extLink}
    </div>
  </article>`;
}

function galleryMarkup(images) {
  return (images || []).map(x => `<figure><img src="${esc(x.image_url)}" alt="${esc(x.caption)}" loading="lazy"><figcaption>${esc(x.caption || 'لحظه‌ای از تیم پیشرو')}</figcaption></figure>`).join('')
    || '<p class="roster-no-results">گالری این تیم به‌زودی تکمیل می‌شود.</p>';
}

function sectionMarkup(team, category) {
  const gender = team.gender || (String(team.slug || '').endsWith('-women') ? 'women' : 'men');
  const label = genderLabel(gender, category);
  const sectionImage = team.image_path
    || (gender === 'women' ? (category === 'novice' ? 'assets/gallery/club-gallery-03.webp' : 'assets/gallery/club-gallery-12.webp') : heroImages[category]);
  const num = numbers[category] || '۰۱';
  const side = gender === 'women' ? 'W' : 'M';
  return `<section class="gender-roster">
    <div class="team-section-hero"><img src="${esc(sectionImage)}" alt="تیم ${label} ${labels[category] || ''} پیشرو"><div class="team-section-shade"></div><div class="team-section-copy"><div class="eyebrow">${gender === 'women' ? 'WOMEN TEAM' : 'MEN TEAM'}</div><h2>${label}<br><span>${labels[category] || ''}.</span></h2><p>بازیکنان، تمرین‌ها و لحظه‌های تیم ${label} ${labels[category] || ''} باشگاه پیشرو.</p></div><span class="team-section-number">${side} / ${num}</span></div>
    <div class="roster-grid">${(team.players || []).map(playerCard).join('') || '<p class="roster-no-results">هنوز بازیکنی ثبت نشده است.</p>'}</div>
    <div class="team-gallery"><h3>گالری تیم</h3><div class="team-gallery-grid">${galleryMarkup(team.gallery)}</div></div>
  </section>`;
}

async function load() {
  const fallbackCategory = requestedCategory && labels[requestedCategory] ? requestedCategory : 'novice';
  let category = fallbackCategory;
  let teams = [];
  let single = false;

  const data = await PishroAPI.getTeams().catch(() => ({ teams: [] }));
  const all = data.teams || [];

  if (requestedTeam) {
    const match = all.find(t => t.slug === requestedTeam);
    if (match) {
      teams = [match];
      category = match.category_key || fallbackCategory;
      single = true;
    }
  }

  if (!single) {
    category = fallbackCategory;
    teams = all.filter(t => t.category_key === category);
  }

  // Graceful fallback when the API/database is unavailable or the slug is unknown,
  // so the page still renders with a sensible layout instead of going blank.
  if (!teams.length) {
    const base = (requestedTeam || `${category}-men`).split('-')[0];
    if (labels[base]) category = base;
    if (requestedTeam) {
      teams = [{ slug: requestedTeam, gender: requestedTeam.endsWith('-women') ? 'women' : 'men' }];
    } else {
      teams = [{ slug: `${category}-women`, gender: 'women' }, { slug: `${category}-men`, gender: 'men' }];
    }
  }

  let total = 0;
  const blocks = await Promise.all(teams.map(async (t) => {
    const [players, gallery] = await Promise.all([
      PishroAPI.getPublicPlayers({ team: t.slug }).catch(() => ({ players: [] })),
      PishroAPI.getTeamGallery(t.slug).catch(() => ({ images: [] })),
    ]);
    total += (players.players || []).length;
    return sectionMarkup({ ...t, players: players.players || [], gallery: gallery.images || [] }, category);
  }));

  const content = $('#rosterContent');
  if (content) content.innerHTML = blocks.join('');

  const title = single ? (teams[0].name || labels[category]) : labels[category];
  $('#rosterTitle').innerHTML = single ? `${title}<br><span>تیم پیشرو</span>` : `${title}<br><span>بانوان و آقایان</span>`;
  $('#rosterHeadingTeam').textContent = `${title}.`;
  $('#rosterDescription').textContent = single
    ? `فهرست بازیکنان، گالری و لحظه‌های تیم ${title} پیشرو.`
    : `فهرست بازیکنان، گالری و لحظه‌های تیم‌های ${title} پیشرو.`;
  $('#rosterHeroImage').src = single ? (teams[0].image_path || heroImages[category]) : heroImages[category];
  $('#rosterHeroImage').alt = `تصویر تیم ${title} پیشرو`;
  $('#rosterHeroNumber').textContent = numbers[category] || '۰۱';
  $('#rosterCategory').textContent = title;
  $('#rosterDiscipline').textContent = single ? (teams[0].discipline || teams[0].age_range || 'اسکیت و هاکی') : 'بانوان و آقایان';
  $('#rosterCount').textContent = fa(total);
  document.title = `${title} | پیشرو`;

  // Search filter over the rendered cards (name / position / number / age group).
  const search = $('#playerSearch');
  if (search) {
    search.addEventListener('input', () => {
      const term = search.value.trim().toLowerCase();
      $$('#rosterContent .player-card').forEach((card) => {
        card.style.display = (!term || (card.dataset.search || '').toLowerCase().includes(term)) ? '' : 'none';
      });
    });
  }
}

load().catch((e) => console.error(e));
