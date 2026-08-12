const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);
const escapeHTML = (value = '') => String(value).replace(/[&<>\'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));

const teams = {
  kids: { no: '۰۱', title: 'ببرهای کوچک', english: 'LITTLE TIGERS', kicker: 'PISHRO TEAM / ۰۱', category: '۶ تا ۹ سال', discipline: 'اسکیت هاکی', image: 'assets/gallery/team-kids.png', description: 'اولین تجربه هاکی باید پر از بازی و کشف باشد. این صفحه برای نمایش اعضای تیم ببرهای کوچک، سن، سابقه و مشخصات هر بازیکن آماده شده است.' },
  junior: { no: '۰۲', title: 'نوجوانان پیشرو', english: 'JUNIOR SQUAD', kicker: 'PISHRO TEAM / ۰۲', category: '۱۰ تا ۱۵ سال', discipline: 'اسکیت هاکی', image: 'assets/gallery/team-junior-action.jpg', description: 'ترکیب سرعت، تکنیک و تصمیم‌گیری؛ اطلاعات بازیکنان تیم نوجوانان اینجا به‌صورت عمومی نمایش داده می‌شود.' },
  women: { no: '۰۳', title: 'بانوان پیشرو', english: 'WOMEN SQUAD', kicker: 'PISHRO TEAM / ۰۳', category: 'رده بانوان', discipline: 'هاکی روی یخ', image: 'assets/gallery/team-women.png', description: 'یک تیم پرانرژی برای رشد و رقابت سالم. صفحه اختصاصی بانوان پیشرو برای معرفی بازیکنان و مسیر ورزشی آن‌ها.' },
  adult: { no: '۰۴', title: 'تیم بزرگسالان', english: 'ADULT SQUAD', kicker: 'PISHRO TEAM / ۰۴', category: '۱۶ سال به بالا', discipline: 'هاکی روی یخ', image: 'assets/gallery/team-champions.jpg', description: 'تمرین منظم، آمادگی بدنی و تجربه بازی در فضای رقابتی. مشخصات بازیکنان تیم بزرگسالان در این صفحه نمایش داده می‌شود.' },
  pro: { no: '۰۵', title: 'مسیر قهرمانی', english: 'PRO PATH', kicker: 'PISHRO TEAM / ۰۵', category: 'استعدادیابی', discipline: 'اسکیت هاکی و هاکی روی یخ', image: 'assets/gallery/ice-action.jpg', description: 'برای بازیکنانی که هدفشان فراتر از تمرین است؛ پروفایل اعضای مسیر قهرمانی را با سابقه، پست و افتخاراتشان ببینید.' }
};

const query = new URLSearchParams(window.location.search);
const teamKey = query.get('team') && teams[query.get('team')] ? query.get('team') : 'kids';
const team = teams[teamKey];
let players = [];

const topbar = $('#topbar');
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
window.addEventListener('scroll', () => topbar?.classList.toggle('scrolled', window.scrollY > 16), { passive: true });
menuToggle?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('.main-nav a').forEach((link) => link.addEventListener('click', () => mainNav?.classList.remove('open')));

$('#rosterKicker').textContent = team.kicker;
$('#rosterTitle').innerHTML = `${team.title}<br /><span>${team.english}</span>`;
$('#rosterDescription').textContent = team.description;
$('#rosterHeroImage').src = team.image;
$('#rosterHeroImage').alt = `تصویر ${team.title} پیشرو هاکی`;
$('#rosterHeroNumber').textContent = team.no;
$('#rosterCategory').textContent = team.category;
$('#rosterDiscipline').textContent = team.discipline;
$('#rosterHeadingTeam').textContent = team.title;
document.title = `${team.title} | بازیکنان پیشرو هاکی`;

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .08 });
$$('.reveal').forEach((element) => revealObserver.observe(element));

const rosterGrid = $('#rosterGrid');
const rosterEmpty = $('#rosterEmpty');
const searchInput = $('#playerSearch');
const rosterCount = $('#rosterCount');

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((item) => item[0]).join('') || 'P').toUpperCase();
}

function renderPlayers() {
  const term = (searchInput?.value || '').trim().toLowerCase();
  const filtered = players.filter((player) => [player.name, player.position, player.age_group, player.jersey_number, player.bio].join(' ').toLowerCase().includes(term));
  rosterCount.textContent = faDigits(players.length);
  rosterEmpty.classList.toggle('visible', players.length === 0);
  if (!players.length) {
    rosterGrid.innerHTML = '';
    return;
  }
  if (!filtered.length) {
    rosterGrid.innerHTML = `<div class="roster-no-results"><span>⌕</span><h3>نتیجه‌ای پیدا نشد</h3><p>نام یا فیلتر دیگری را امتحان کنید.</p></div>`;
    rosterEmpty.classList.remove('visible');
    return;
  }
  rosterGrid.innerHTML = filtered.map((player, index) => {
    const visual = player.image_url ? `<img src="${escapeHTML(player.image_url)}" alt="${escapeHTML(player.name)}" />` : `<div class="player-initials">${escapeHTML(initials(player.name))}</div>`;
    const number = player.jersey_number !== null && player.jersey_number !== undefined ? faDigits(player.jersey_number) : '—';
    const age = player.age ? `${faDigits(player.age)} سال` : '—';
    const experience = `${faDigits(player.years_active || 0)} سال سابقه`;
    const position = player.position || 'بازیکن';
    const group = player.age_group || team.category;
    return `<article class="player-card reveal is-visible"><div class="player-card-image">${visual}<span class="player-card-number">${number}</span><span class="player-card-position">${escapeHTML(position)}</span></div><div class="player-card-body"><div class="player-card-kicker">PLAYER / ${faDigits(String(index + 1).padStart(2, '0'))}</div><h3>${escapeHTML(player.name)}</h3><p>${escapeHTML(player.bio || 'برای این بازیکن هنوز توضیحی ثبت نشده است.')}</p><div class="player-card-meta"><span><b>${age}</b><small>سن</small></span><span><b>${escapeHTML(experience)}</b><small>فعالیت</small></span><span><b>${escapeHTML(group)}</b><small>رده</small></span></div></div></article>`;
  }).join('');
}

async function loadPlayers() {
  if (!window.PishroAPI) return;
  try {
    const response = await PishroAPI.getPublicPlayers({ team: teamKey, limit: 100 });
    players = response.players || [];
  } catch (error) {
    console.error('Could not load public players.', error);
    players = [];
  }
  renderPlayers();
}
searchInput?.addEventListener('input', renderPlayers);
window.addEventListener('pishro-roster-updated', loadPlayers);
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadPlayers(); });
loadPlayers();
