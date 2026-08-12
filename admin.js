const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);
const escapeHTML = (value = '') => String(value).replace(/[&<>\'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));

const teams = {
  kids: { no: '۰۱', title: 'ببرهای کوچک', category: '۶ تا ۹ سال', discipline: 'اسکیت هاکی' },
  junior: { no: '۰۲', title: 'نوجوانان پیشرو', category: '۱۰ تا ۱۵ سال', discipline: 'اسکیت هاکی' },
  women: { no: '۰۳', title: 'بانوان پیشرو', category: 'رده بانوان', discipline: 'هاکی روی یخ' },
  adult: { no: '۰۴', title: 'تیم بزرگسالان', category: '۱۶ سال به بالا', discipline: 'هاکی روی یخ' },
  pro: { no: '۰۵', title: 'مسیر قهرمانی', category: 'استعدادیابی', discipline: 'اسکیت هاکی و هاکی روی یخ' }
};

let activeTeamKey = 'kids';
let activePlayers = [];
let teamCounts = {};
let editingId = null;
let removeExistingPhoto = false;
let toastTimer;

const topbar = $('#topbar');
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
const loginView = $('#loginView');
const dashboardView = $('#dashboardView');
const playerModal = $('#adminPlayerModal');
const playerForm = $('#adminPlayerForm');
const playerPhotoInput = $('#adminPlayerPhoto');
const photoPreview = $('#adminPhotoPreview');

window.addEventListener('scroll', () => topbar?.classList.toggle('scrolled', window.scrollY > 16), { passive: true });
menuToggle?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('.main-nav a').forEach((link) => link.addEventListener('click', () => mainNav?.classList.remove('open')));

function showToast(title, text) {
  $('#adminToastTitle').textContent = title;
  $('#adminToastText').textContent = text;
  $('#adminToast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#adminToast').classList.remove('show'), 4300);
}

function updateOverview() {
  const team = teams[activeTeamKey];
  $('#adminActiveTeamName').textContent = team.title;
  $('#adminActiveCount').textContent = faDigits(activePlayers.length);
  $('#adminTotalCount').textContent = faDigits(Object.values(teamCounts).reduce((sum, count) => sum + count, 0));
  $('#adminTeamKicker').textContent = `TEAM / ${team.no}`;
  $('#adminTeamTitle').textContent = team.title;
}

function renderTeamList() {
  $('#adminTeamList').innerHTML = Object.entries(teams).map(([key, team]) => `<button type="button" class="admin-team-button ${key === activeTeamKey ? 'active' : ''}" data-admin-team="${key}"><span class="admin-team-number">${team.no}</span><span><b>${team.title}</b><small>${team.category}</small></span><strong>${faDigits(teamCounts[key] || 0)}</strong></button>`).join('');
}

function renderRoster() {
  const term = ($('#adminSearch')?.value || '').trim().toLowerCase();
  const filtered = activePlayers.filter((player) => [player.name, player.position, player.age_group, player.jersey_number, player.bio].join(' ').toLowerCase().includes(term));
  const empty = $('#adminEmpty');
  const grid = $('#adminRosterGrid');
  empty.classList.toggle('visible', activePlayers.length === 0);
  if (!activePlayers.length) { grid.innerHTML = ''; return; }
  if (!filtered.length) {
    grid.innerHTML = `<div class="roster-no-results"><span>⌕</span><h3>نتیجه‌ای پیدا نشد</h3><p>نام یا فیلتر دیگری را امتحان کن.</p></div>`;
    empty.classList.remove('visible');
    return;
  }
  grid.innerHTML = filtered.map((player, index) => {
    const visual = player.image_url ? `<img src="${escapeHTML(player.image_url)}" alt="${escapeHTML(player.name)}" />` : `<div class="player-initials">${escapeHTML(initials(player.name))}</div>`;
    const number = player.jersey_number !== null && player.jersey_number !== undefined ? faDigits(player.jersey_number) : '—';
    const age = player.age ? `${faDigits(player.age)} سال` : '—';
    const experience = `${faDigits(player.years_active || 0)} سال`;
    const position = player.position || 'بازیکن';
    const group = player.age_group || teams[activeTeamKey].category;
    return `<article class="admin-player-card" data-player-id="${escapeHTML(player.id)}"><div class="admin-player-card-image">${visual}<span class="player-card-number">${number}</span><span class="player-card-position">${escapeHTML(position)}</span></div><div class="admin-player-card-body"><div class="player-card-kicker">PLAYER / ${faDigits(String(index + 1).padStart(2, '0'))}</div><h3>${escapeHTML(player.name)}</h3><div class="admin-player-mini-meta"><span>${age}</span><span>${experience} فعالیت</span><span>${escapeHTML(group)}</span></div><p>${escapeHTML(player.bio || 'بدون توضیحات تکمیلی')}</p><div class="admin-player-actions"><button class="player-edit" data-admin-action="edit">ویرایش <span>↗</span></button><button class="player-delete" data-admin-action="delete">حذف</button></div></div></article>`;
  }).join('');
}

async function refreshAdmin() {
  try {
    const [rosterResponse, statsResponse] = await Promise.all([
      PishroAPI.getAdminPlayers(activeTeamKey),
      PishroAPI.getStats(),
    ]);
    activePlayers = rosterResponse.players || [];
    teamCounts = Object.fromEntries((statsResponse.teams || []).map((team) => [team.slug, Number(team.player_count || 0)]));
    renderTeamList();
    updateOverview();
    renderRoster();
  } catch (error) {
    console.error(error);
    showToast('اتصال برقرار نشد', 'اطلاعات پنل از سرور دریافت نشد. تنظیمات دیتابیس را بررسی کنید.');
  }
}

function showDashboard() {
  loginView.hidden = true;
  dashboardView.hidden = false;
  refreshAdmin();
}
function showLogin() {
  loginView.hidden = false;
  dashboardView.hidden = true;
}

async function bootstrapAuth() {
  try {
    const response = await PishroAPI.me();
    if (response.authenticated) showDashboard();
    else showLogin();
  } catch (error) {
    showLogin();
    $('#loginError').textContent = 'ارتباط با سرور برقرار نشد. تنظیمات هاست و دیتابیس را بررسی کنید.';
    $('#loginError').classList.add('visible');
  }
}
bootstrapAuth();

$('#adminLoginForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const error = $('#loginError');
  error.classList.remove('visible');
  try {
    await PishroAPI.login(String(form.get('username') || '').trim(), String(form.get('password') || ''));
    event.target.reset();
    showDashboard();
  } catch (requestError) {
    error.textContent = requestError.status === 429 ? 'تعداد تلاش‌ها زیاد است. چند دقیقه بعد دوباره امتحان کنید.' : 'نام کاربری یا رمز عبور صحیح نیست.';
    error.classList.add('visible');
  }
});
$('#togglePassword')?.addEventListener('click', () => {
  const input = $('#adminPassword');
  input.type = input.type === 'password' ? 'text' : 'password';
});
$('#logoutButton')?.addEventListener('click', async () => {
  try { await PishroAPI.logout(); } catch (error) { console.error(error); }
  showLogin();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#adminTeamList')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-admin-team]');
  if (!button) return;
  activeTeamKey = button.dataset.adminTeam;
  $('#adminSearch').value = '';
  refreshAdmin();
});
$('#adminSearch')?.addEventListener('input', renderRoster);

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((part) => part[0]).join('') || 'P').toUpperCase();
}

function showPhotoPreview(url = '') {
  photoPreview.innerHTML = url ? `<img src="${escapeHTML(url)}" alt="پیش‌نمایش تصویر بازیکن" /><button type="button" id="removeAdminPhoto">حذف عکس</button>` : '';
}

function openPlayerModal(player = null) {
  editingId = player?.id || null;
  removeExistingPhoto = false;
  playerForm.reset();
  playerForm.elements.playerId.value = player?.id || '';
  if (player) {
    ['name', 'number', 'age', 'experience', 'position', 'ageGroup', 'bio'].forEach((field) => { if (playerForm.elements[field]) playerForm.elements[field].value = player[field] || ''; });
  }
  $('#adminPlayerModalTitle').innerHTML = player ? 'ویرایش بازیکن<br /><span>و ذخیره تغییرات.</span>' : 'افزودن بازیکن<br /><span>به فهرست تیم.</span>';
  showPhotoPreview(player?.image_url || '');
  playerModal.classList.add('open');
  playerModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  window.setTimeout(() => playerForm.elements.name.focus(), 180);
}
function closePlayerModal() {
  playerModal.classList.remove('open');
  playerModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  editingId = null;
  removeExistingPhoto = false;
}
$('#adminAddPlayerButton')?.addEventListener('click', () => openPlayerModal());
$('#adminEmptyAdd')?.addEventListener('click', () => openPlayerModal());
$('#adminCloseModal')?.addEventListener('click', closePlayerModal);
$('#adminCancelModal')?.addEventListener('click', closePlayerModal);
playerModal?.addEventListener('click', (event) => { if (event.target === playerModal) closePlayerModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closePlayerModal(); });

playerPhotoInput?.addEventListener('change', () => {
  const file = playerPhotoInput.files?.[0];
  if (!file) return;
  removeExistingPhoto = false;
  showPhotoPreview(URL.createObjectURL(file));
});
photoPreview?.addEventListener('click', (event) => {
  if (event.target.id !== 'removeAdminPhoto') return;
  playerPhotoInput.value = '';
  removeExistingPhoto = Boolean(editingId);
  showPhotoPreview('');
});

playerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const wasEditing = Boolean(editingId);
  const formData = new FormData(playerForm);
  formData.set('id', editingId ? String(editingId) : '');
  formData.set('team', activeTeamKey);
  if (removeExistingPhoto) formData.set('remove_image', '1');
  try {
    await PishroAPI.savePlayer(formData);
    closePlayerModal();
    await refreshAdmin();
    window.dispatchEvent(new CustomEvent('pishro-roster-updated'));
    showToast(wasEditing ? 'اطلاعات به‌روزرسانی شد' : 'بازیکن اضافه شد', 'اطلاعات در دیتابیس ذخیره شد.');
  } catch (error) {
    console.error(error);
    showToast('ذخیره انجام نشد', error.payload?.error || 'اطلاعات را بررسی کنید و دوباره تلاش کنید.');
  }
});

$('#adminRosterGrid')?.addEventListener('click', async (event) => {
  const action = event.target.closest('[data-admin-action]');
  if (!action) return;
  const card = action.closest('[data-player-id]');
  const player = activePlayers.find((item) => String(item.id) === String(card?.dataset.playerId));
  if (!player) return;
  if (action.dataset.adminAction === 'edit') openPlayerModal(player);
  if (action.dataset.adminAction === 'delete') {
    if (!window.confirm(`اطلاعات ${player.name} حذف شود؟`)) return;
    try {
      await PishroAPI.deletePlayer(player.id);
      await refreshAdmin();
      window.dispatchEvent(new CustomEvent('pishro-roster-updated'));
      showToast('بازیکن حذف شد', 'اطلاعات از دیتابیس حذف شد.');
    } catch (error) {
      showToast('حذف انجام نشد', error.payload?.error || 'دوباره تلاش کنید.');
    }
  }
});
