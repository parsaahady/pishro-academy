const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));

const teams = {
  kids: { no: '۰۱', title: 'ببرهای کوچک', category: '۶ تا ۹ سال', discipline: 'اسکیت هاکی', image: 'assets/gallery/team-kids.png' },
  junior: { no: '۰۲', title: 'نوجوانان پیشرو', category: '۱۰ تا ۱۵ سال', discipline: 'اسکیت هاکی', image: 'assets/gallery/team-junior-action.jpg' },
  women: { no: '۰۳', title: 'بانوان پیشرو', category: 'رده بانوان', discipline: 'هاکی روی یخ', image: 'assets/gallery/team-women.png' },
  adult: { no: '۰۴', title: 'تیم بزرگسالان', category: '۱۶ سال به بالا', discipline: 'هاکی روی یخ', image: 'assets/gallery/team-champions.jpg' },
  pro: { no: '۰۵', title: 'مسیر قهرمانی', category: 'استعدادیابی', discipline: 'اسکیت هاکی و هاکی روی یخ', image: 'assets/gallery/ice-action.jpg' }
};

let activeTeamKey = 'kids';
let activePlayers = [];
let editingId = null;
let currentPhotoData = '';
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

function rosterKey(key) { return `pishro_roster_${key}`; }
function getPlayers(key) {
  try { return JSON.parse(localStorage.getItem(rosterKey(key)) || '[]'); } catch (error) { return []; }
}
function savePlayers(key, players) {
  try {
    localStorage.setItem(rosterKey(key), JSON.stringify(players));
    return true;
  } catch (error) {
    showToast('ذخیره انجام نشد', 'حافظه مرورگر پر شده است؛ حجم عکس را کمتر کنید.');
    return false;
  }
}
function allPlayerCount() { return Object.keys(teams).reduce((total, key) => total + getPlayers(key).length, 0); }
function createId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function initials(name) { return (String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('') || 'P').toUpperCase(); }

function updateOverview() {
  const team = teams[activeTeamKey];
  $('#adminActiveTeamName').textContent = team.title;
  $('#adminActiveCount').textContent = faDigits(activePlayers.length);
  $('#adminTotalCount').textContent = faDigits(allPlayerCount());
  $('#adminTeamKicker').textContent = `TEAM / ${team.no}`;
  $('#adminTeamTitle').textContent = team.title;
}

function renderTeamList() {
  $('#adminTeamList').innerHTML = Object.entries(teams).map(([key, team]) => {
    const count = getPlayers(key).length;
    return `<button type="button" class="admin-team-button ${key === activeTeamKey ? 'active' : ''}" data-admin-team="${key}"><span class="admin-team-number">${team.no}</span><span><b>${team.title}</b><small>${team.category}</small></span><strong>${faDigits(count)}</strong></button>`;
  }).join('');
}

function renderRoster() {
  const term = ($('#adminSearch')?.value || '').trim().toLowerCase();
  const filtered = activePlayers.filter((player) => [player.name, player.position, player.ageGroup, player.number, player.bio].join(' ').toLowerCase().includes(term));
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
    const image = player.photo ? `<img src="${player.photo}" alt="${escapeHTML(player.name)}" />` : `<div class="player-initials">${escapeHTML(initials(player.name))}</div>`;
    const number = player.number ? faDigits(player.number) : '—';
    const age = player.age ? `${faDigits(player.age)} سال` : '—';
    const experience = player.experience ? `${faDigits(player.experience)} سال` : '—';
    const position = player.position || 'بازیکن';
    const group = player.ageGroup || teams[activeTeamKey].category;
    return `<article class="admin-player-card" data-player-id="${escapeHTML(player.id)}"><div class="admin-player-card-image">${image}<span class="player-card-number">${number}</span><span class="player-card-position">${escapeHTML(position)}</span></div><div class="admin-player-card-body"><div class="player-card-kicker">PLAYER / ${faDigits(String(index + 1).padStart(2, '0'))}</div><h3>${escapeHTML(player.name)}</h3><div class="admin-player-mini-meta"><span>${age}</span><span>${experience} فعالیت</span><span>${escapeHTML(group)}</span></div><p>${escapeHTML(player.bio || 'بدون توضیحات تکمیلی')}</p><div class="admin-player-actions"><button class="player-edit" data-admin-action="edit">ویرایش <span>↗</span></button><button class="player-delete" data-admin-action="delete">حذف</button></div></div></article>`;
  }).join('');
}

function refreshAdmin() {
  activePlayers = getPlayers(activeTeamKey);
  renderTeamList();
  updateOverview();
  renderRoster();
}

// Login guard. The session is kept only in this browser tab.
function showDashboard() {
  loginView.hidden = true;
  dashboardView.hidden = false;
  refreshAdmin();
}
function showLogin() {
  loginView.hidden = false;
  dashboardView.hidden = true;
}
if (sessionStorage.getItem('pishro_admin_session') === 'active') showDashboard();
else showLogin();

$('#adminLoginForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  const valid = typeof PISHRO_ADMIN_CONFIG !== 'undefined' && username === PISHRO_ADMIN_CONFIG.username && password === PISHRO_ADMIN_CONFIG.password;
  const error = $('#loginError');
  if (!valid) { error.classList.add('visible'); return; }
  error.classList.remove('visible');
  sessionStorage.setItem('pishro_admin_session', 'active');
  event.target.reset();
  showDashboard();
});
$('#togglePassword')?.addEventListener('click', () => {
  const input = $('#adminPassword');
  input.type = input.type === 'password' ? 'text' : 'password';
});
$('#logoutButton')?.addEventListener('click', () => { sessionStorage.removeItem('pishro_admin_session'); showLogin(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

$('#adminTeamList')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-admin-team]');
  if (!button) return;
  activeTeamKey = button.dataset.adminTeam;
  $('#adminSearch').value = '';
  refreshAdmin();
});
$('#adminSearch')?.addEventListener('input', renderRoster);

function openPlayerModal(player = null) {
  editingId = player?.id || null;
  currentPhotoData = player?.photo || '';
  playerForm.reset();
  playerForm.elements.playerId.value = player?.id || '';
  if (player) {
    ['name', 'number', 'age', 'experience', 'position', 'ageGroup', 'bio'].forEach((field) => { if (playerForm.elements[field]) playerForm.elements[field].value = player[field] || ''; });
  }
  $('#adminPlayerModalTitle').innerHTML = player ? 'ویرایش بازیکن<br /><span>و ذخیره تغییرات.</span>' : 'افزودن بازیکن<br /><span>به فهرست تیم.</span>';
  photoPreview.innerHTML = currentPhotoData ? `<img src="${currentPhotoData}" alt="پیش‌نمایش تصویر بازیکن" /><button type="button" id="removeAdminPhoto">حذف عکس</button>` : '';
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
  currentPhotoData = '';
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
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const max = 560;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      currentPhotoData = canvas.toDataURL('image/jpeg', .76);
      photoPreview.innerHTML = `<img src="${currentPhotoData}" alt="پیش‌نمایش تصویر بازیکن" /><button type="button" id="removeAdminPhoto">حذف عکس</button>`;
    };
    image.onerror = () => showToast('خطا در تصویر', 'لطفاً یک فایل تصویری معتبر انتخاب کنید.');
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});
photoPreview?.addEventListener('click', (event) => {
  if (event.target.id !== 'removeAdminPhoto') return;
  currentPhotoData = '';
  playerPhotoInput.value = '';
  photoPreview.innerHTML = '';
});

playerForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const wasEditing = Boolean(editingId);
  const formData = new FormData(playerForm);
  const data = Object.fromEntries(formData.entries());
  delete data.photo;
  const existing = activePlayers.find((player) => player.id === editingId);
  const player = { ...data, id: editingId || createId(), photo: currentPhotoData || existing?.photo || '', updatedAt: new Date().toISOString() };
  const nextPlayers = wasEditing ? activePlayers.map((item) => item.id === editingId ? player : item) : [player, ...activePlayers];
  if (!savePlayers(activeTeamKey, nextPlayers)) return;
  activePlayers = nextPlayers;
  closePlayerModal();
  refreshAdmin();
  showToast(wasEditing ? 'اطلاعات به‌روزرسانی شد' : 'بازیکن اضافه شد', wasEditing ? 'تغییرات در صفحه عمومی هم اعمال شد.' : 'پروفایل بازیکن ساخته شد.');
});

$('#adminRosterGrid')?.addEventListener('click', (event) => {
  const action = event.target.closest('[data-admin-action]');
  if (!action) return;
  const card = action.closest('[data-player-id]');
  const player = activePlayers.find((item) => item.id === card?.dataset.playerId);
  if (!player) return;
  if (action.dataset.adminAction === 'edit') openPlayerModal(player);
  if (action.dataset.adminAction === 'delete') {
    if (!window.confirm(`اطلاعات ${player.name} حذف شود؟`)) return;
    const nextPlayers = activePlayers.filter((item) => item.id !== player.id);
    if (!savePlayers(activeTeamKey, nextPlayers)) return;
    activePlayers = nextPlayers;
    refreshAdmin();
    showToast('بازیکن حذف شد', 'اطلاعات از فهرست این تیم حذف شد.');
  }
});

function showToast(title, text) {
  $('#adminToastTitle').textContent = title;
  $('#adminToastText').textContent = text;
  $('#adminToast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#adminToast').classList.remove('show'), 4300);
}
