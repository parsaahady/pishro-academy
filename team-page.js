const $ = (s, r = document) => r.querySelector(s);
const fa = v => String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹' [d]);
const safeUrl = v => {
  const u = String(v || '').trim();
  // Only absolute http(s) links, and never characters that could break out of href="".
  if (!/^https?:\/\//i.test(u)) return '';
  return /["'<>`\s\\]/.test(u) ? '' : u;
};
const esc = v => String(v || '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
} [c]));
const category = new URLSearchParams(location.search).get('category') || 'novice';
const labels = {
  novice: 'نونهالان',
  teen: 'نوجوانان',
  youth: 'جوانان',
  adult: 'بزرگسالان',
  new: 'ورزشکاران تازه'
};
const title = labels[category] || labels.novice;
const topbar = $('#topbar'),
  menu = $('#menuToggle'),
  nav = $('#mainNav');
menu?.addEventListener('click', () => nav.classList.toggle('open'));
const heroImages = {
  novice: 'assets/gallery/team-novice.webp',
  teen: 'assets/gallery/team-teen.webp',
  youth: 'assets/gallery/team-youth.webp',
  adult: 'assets/gallery/team-adult.webp',
  new: 'assets/gallery/team-new.webp'
};
$('#rosterTitle').innerHTML = `${title}<br><span>بانوان و آقایان</span>`;
$('#rosterDescription').textContent = `فهرست بازیکنان، گالری و لحظه‌های تیم‌های ${title} پیشرو.`;
$('#rosterHeroImage').src = heroImages[category] || heroImages.novice;
$('#rosterHeroImage').alt = `تصویر تیم ${title} پیشرو`;
$('#rosterHeroNumber').textContent = ({
  'novice': '۰۱',
  teen: '۰۲',
  youth: '۰۳',
  adult: '۰۴',
  new: '۰۵'
} [category] || '۰۱');
$('#rosterCategory').textContent = title;
$('#rosterDiscipline').textContent = 'بانوان و آقایان';
document.title = `${title} | پیشرو`;

function card(p) {
  const img = p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}">` : `<div class="player-initials">${esc((p.name||'پ')[0])}</div>`;
  const profile = safeUrl(p.iran_hockey_url);
  const link = profile ? `<a class="player-external-link" href="${esc(profile)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span>پروفایل ایران هاکی</span><b>↗</b></a>` : '';
  return `<article class="player-card"><div class="player-card-image">${img}<span class="player-card-position">${esc(p.position||'بازیکن')}</span></div><div class="player-card-body"><h3>${esc(p.name)}</h3><p>${esc(p.bio||'پروفایل این بازیکن به‌زودی تکمیل می‌شود.')}</p>${link}</div></article>`
}
async function load() {
  try {
    const data = await PishroAPI.getTeams().catch(() => ({
      teams: []
    }));
    const teams = (data.teams || []).filter(t => t.category_key === category);
    if (!teams.length) teams.push({
      slug: `${category}-women`,
      gender: 'women'
    }, {
      slug: `${category}-men`,
      gender: 'men'
    });
    let total = 0;
    const blocks = await Promise.all(['women', 'men'].map(async gender => {
      const t = teams.find(x => x.gender === gender);
      if (!t) return '';
      const [p, g] = await Promise.all([PishroAPI.getPublicPlayers({
        team: t.slug
      }).catch(() => ({
        players: []
      })), PishroAPI.getTeamGallery(t.slug).catch(() => ({
        images: []
      }))]);
      total += (p.players || []).length;
      const people = (p.players || []).map(card).join('') || '<p class="roster-no-results">هنوز بازیکنی ثبت نشده است.</p>';
      const photos = (g.images || []).map(x => `<figure><img src="${esc(x.image_url)}" alt="${esc(x.caption)}"><figcaption>${esc(x.caption||'لحظه‌ای از تیم پیشرو')}</figcaption></figure>`).join('') || '<p class="roster-no-results">گالری این تیم به‌زودی تکمیل می‌شود.</p>';
      const genderLabel = gender === 'women' ? (category === 'adult' ? 'بانوان' : 'دختران') : (category === 'adult' ? 'آقایان' : 'پسران');
      const sectionImage = t.image_path || (gender === 'women' ? (category === 'novice' ? 'assets/gallery/club-gallery-03.webp' : 'assets/gallery/club-gallery-12.webp') : heroImages[category]);
      return `<section class="gender-roster"><div class="team-section-hero"><img src="${esc(sectionImage)}" alt="تیم ${genderLabel} ${title} پیشرو"><div class="team-section-shade"></div><div class="team-section-copy"><div class="eyebrow">${gender==='women'?'WOMEN TEAM':'MEN TEAM'}</div><h2>${genderLabel}<br><span>${title}.</span></h2><p>بازیکنان، تمرین‌ها و لحظه‌های تیم ${genderLabel} ${title} باشگاه پیشرو.</p></div><span class="team-section-number">${gender==='women'?'W':'M'} / ${fa(category==='novice'?1:category==='teen'?2:category==='youth'?3:category==='adult'?4:5)}</span></div><div class="roster-grid">${people}</div><div class="team-gallery"><h3>گالری تیم</h3><div class="team-gallery-grid">${photos}</div></div></section>`;
    }));
    $('#rosterListSection').innerHTML = blocks.join('');
    $('#rosterCount').textContent = fa(total)
  } catch (e) {
    console.error(e)
  }
}
load();
