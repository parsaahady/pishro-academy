const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);
const escapeHTML = (value = '') => String(value).replace(/[&<>\'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));

const teams = {
  'novice-women': { no: '01', title: 'نونهالان بانوان', category: 'نونهالان', discipline: 'اسکیت و هاکی' },
  'novice-men': { no: '02', title: 'نونهالان آقایان', category: 'نونهالان', discipline: 'اسکیت و هاکی' },
  'teen-women': { no: '03', title: 'نوجوانان بانوان', category: 'نوجوانان', discipline: 'اسکیت و هاکی' },
  'teen-men': { no: '04', title: 'نوجوانان آقایان', category: 'نوجوانان', discipline: 'اسکیت و هاکی' },
  'youth-women': { no: '05', title: 'جوانان بانوان', category: 'جوانان', discipline: 'اسکیت و هاکی' },
  'youth-men': { no: '06', title: 'جوانان آقایان', category: 'جوانان', discipline: 'اسکیت و هاکی' },
  'adult-women': { no: '07', title: 'بزرگسالان بانوان', category: 'بزرگسالان', discipline: 'اسکیت و هاکی' },
  'adult-men': { no: '08', title: 'بزرگسالان آقایان', category: 'بزرگسالان', discipline: 'اسکیت و هاکی' },
  'new-women': { no: '09', title: 'ورزشکاران تازه بانوان', category: 'ورزشکاران تازه', discipline: 'اسکیت و هاکی' },
  'new-men': { no: '10', title: 'ورزشکاران تازه آقایان', category: 'ورزشکاران تازه', discipline: 'اسکیت و هاکی' }
};

let activeTeamKey = 'novice-women';
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
  const totalPlayers = Object.values(teamCounts).reduce((sum, count) => sum + count, 0);
  $('#adminTotalCount').textContent = faDigits(totalPlayers);
  setTabCount('tabPlayersCount', totalPlayers);
  $('#adminTeamKicker').textContent = `TEAM / ${team.no}`;
  $('#adminTeamTitle').textContent = team.title;
}

function renderTeamList() {
  $('#adminTeamList').innerHTML = Object.entries(teams).map(([key, team]) => `<button type="button" class="admin-team-button ${key === activeTeamKey ? 'active' : ''}" data-admin-team="${key}"><span class="admin-team-number">${team.no}</span><span><b>${team.title}</b><small>${team.category}</small></span><strong>${faDigits(teamCounts[key] || 0)}</strong></button>`).join('');
}

async function renderTeamGallery() {
  const grid = $('#adminTeamGalleryGrid');
  if (!grid || !window.PishroAPI) return;
  try { const data = await PishroAPI.getAdminTeamGallery(activeTeamKey); grid.innerHTML = (data.images || []).map(image => `<figure data-gallery-id="${image.id}"><img src="${escapeHTML(image.image_url)}" alt="${escapeHTML(image.caption || '')}" /><figcaption>${escapeHTML(image.caption || 'بدون توضیح')} <button type="button" data-delete-gallery>حذف</button></figcaption></figure>`).join('') || '<p class="admin-tools-note">هنوز تصویری ثبت نشده است.</p>'; } catch (error) { grid.innerHTML = '<p class="admin-tools-note">پس از اجرای migration، گالری فعال می‌شود.</p>'; }
}
function renderRoster() {
  const term = ($('#adminSearch')?.value || '').trim().toLowerCase();
  const filtered = activePlayers.filter((player) => [player.name, player.position, player.age_group, player.jersey_number, player.bio, player.iran_hockey_url].join(' ').toLowerCase().includes(term));
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
    return `<article class="admin-player-card" data-player-id="${escapeHTML(player.id)}"><div class="admin-player-card-image">${visual}<span class="player-card-number">${number}</span><span class="player-card-position">${escapeHTML(position)}</span></div><div class="admin-player-card-body"><div class="player-card-kicker">PLAYER / ${faDigits(String(index + 1).padStart(2, '0'))}</div><h3>${escapeHTML(player.name)}</h3><div class="admin-player-mini-meta"><span>${age}</span><span>${experience} فعالیت</span><span>${escapeHTML(group)}</span></div><p>${escapeHTML(player.bio || 'بدون توضیحات تکمیلی')}</p>${player.iran_hockey_url ? `<a class="admin-player-link" href="${escapeHTML(player.iran_hockey_url)}" target="_blank" rel="noopener noreferrer">پروفایل ایران هاکی <span>↗</span></a>` : ''}<div class="admin-player-actions"><button class="player-edit" data-admin-action="edit">ویرایش <span>↗</span></button><button class="player-delete" data-admin-action="delete">حذف</button></div></div></article>`;
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
    renderTeamGallery();
  } catch (error) {
    console.error(error);
    showToast('اتصال برقرار نشد', 'اطلاعات پنل از سرور دریافت نشد. تنظیمات دیتابیس را بررسی کنید.');
  }
}

function showDashboard() {
  loginView.hidden = true;
  dashboardView.hidden = false;
  refreshAdmin();
  refreshAdminExtras();
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
$('#adminTeamGalleryForm')?.addEventListener('submit', async (event) => { event.preventDefault(); try { await PishroAPI.saveTeamGalleryImage(activeTeamKey, new FormData(event.target)); event.target.reset(); renderTeamGallery(); showToast('تصویر اضافه شد', 'تصویر و توضیح آن در گالری تیم ذخیره شد.'); } catch (error) { showToast('ذخیره انجام نشد', error.payload?.error || 'ابتدا migration دیتابیس را اجرا کنید.'); } });
$('#adminTeamGalleryGrid')?.addEventListener('click', async (event) => { const button = event.target.closest('[data-delete-gallery]'); if (!button || !confirm('این تصویر حذف شود؟')) return; const id = button.closest('[data-gallery-id]')?.dataset.galleryId; try { await PishroAPI.deleteTeamGalleryImage(activeTeamKey, id); renderTeamGallery(); } catch (error) { showToast('حذف انجام نشد', 'دوباره تلاش کنید.'); } });

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
    if (playerForm.elements.iranHockeyUrl) playerForm.elements.iranHockeyUrl.value = player.iran_hockey_url || '';
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

// Secondary admin sections: coaches, blog posts, messages, and comment moderation.
let adminCoaches = [];
let adminBlogs = [];
let adminMessages = [];
let adminComments = [];
let editingCoachId = null;
let editingBlogId = null;
let removeCoachImage = false;

function setTabCount(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = faDigits(value || 0);
}

function activateAdminTab(tabName) {
  $$('.admin-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.adminTab === tabName));
  $$('[data-admin-panel]').forEach((panel) => {
    const active = panel.dataset.adminPanel === tabName;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
  if (tabName === 'coaches') refreshCoaches();
  if (tabName === 'blogs') refreshBlogs();
  if (tabName === 'messages') refreshMessages();
  if (tabName === 'comments') refreshComments();
}

$('#adminTabs')?.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-admin-tab]');
  if (tab) activateAdminTab(tab.dataset.adminTab);
});

function coachPreview(url = '') {
  $('#adminCoachPreview').innerHTML = url ? `<img src="${escapeHTML(url)}" alt="پیش‌نمایش عکس مربی" /><button type="button" id="removeCoachPhoto">حذف عکس</button>` : '';
}
function renderCoaches() {
  setTabCount('tabCoachesCount', adminCoaches.length);
  $('#adminCoachesEmpty').classList.toggle('visible', adminCoaches.length === 0);
  $('#adminCoachesGrid').innerHTML = adminCoaches.map((coach, index) => {
    const visual = coach.image_url ? `<img src="${escapeHTML(coach.image_url)}" alt="${escapeHTML(coach.name)}" />` : `<div class="coach-initials">${escapeHTML(initials(coach.name))}</div>`;
    return `<article class="admin-content-card coach-admin-card" data-coach-id="${coach.id}"><div class="admin-content-image">${visual}<span>${faDigits(String(index + 1).padStart(2, '0'))}</span></div><div class="admin-content-body"><div class="card-kicker">PISHRO COACHING STAFF</div><h3>${escapeHTML(coach.name)}</h3><p class="admin-content-subtitle">${escapeHTML(coach.role || 'مربی پیست')} · ${faDigits(coach.years_active || 0)} سال فعالیت</p><p>${escapeHTML(coach.bio || 'بدون توضیحات')}</p><div class="admin-card-actions"><button data-coach-action="edit">ویرایش <span>↗</span></button><button data-coach-action="delete">حذف</button></div></div></article>`;
  }).join('');
}
async function refreshCoaches() {
  try { const response = await PishroAPI.getAdminCoaches(); adminCoaches = response.coaches || []; renderCoaches(); }
  catch (error) { showToast('دریافت مربیان ناموفق بود', error.payload?.error || 'اتصال سرور را بررسی کنید.'); }
}
function openCoachModal(coach = null) {
  editingCoachId = coach?.id || null;
  removeCoachImage = false;
  const form = $('#adminCoachForm');
  form.reset();
  form.elements.coachId.value = coach?.id || '';
  if (coach) ['name', 'role', 'years_active', 'specialties', 'bio'].forEach((field) => { if (form.elements[field]) form.elements[field].value = coach[field] || ''; });
  $('#adminCoachModalTitle').innerHTML = coach ? 'ویرایش مربی<br /><span>و ذخیره تغییرات.</span>' : 'افزودن مربی<br /><span>به کادر فنی.</span>';
  coachPreview(coach?.image_url || '');
  $('#adminCoachModal').classList.add('open');
  $('#adminCoachModal').setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setTimeout(() => form.elements.name.focus(), 150);
}
function closeCoachModal() {
  $('#adminCoachModal').classList.remove('open');
  $('#adminCoachModal').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  editingCoachId = null;
  removeCoachImage = false;
}
$('#adminAddCoachButton')?.addEventListener('click', () => openCoachModal());
$('#adminEmptyCoach')?.addEventListener('click', () => openCoachModal());
$('#adminCloseCoachModal')?.addEventListener('click', closeCoachModal);
$('#adminCancelCoachModal')?.addEventListener('click', closeCoachModal);
$('#adminCoachModal')?.addEventListener('click', (event) => { if (event.target.id === 'adminCoachModal') closeCoachModal(); });
$('#adminCoachPhoto')?.addEventListener('change', (event) => { const file = event.target.files?.[0]; if (file) { removeCoachImage = false; coachPreview(URL.createObjectURL(file)); } });
$('#adminCoachPreview')?.addEventListener('click', (event) => { if (event.target.id === 'removeCoachPhoto') { $('#adminCoachPhoto').value = ''; removeCoachImage = Boolean(editingCoachId); coachPreview(''); } });
$('#adminCoachForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  data.set('id', editingCoachId ? String(editingCoachId) : '');
  if (removeCoachImage) data.set('remove_image', '1');
  try { await PishroAPI.saveCoach(data); closeCoachModal(); await refreshCoaches(); showToast('مربی ذخیره شد', 'پروفایل مربی در دیتابیس ذخیره شد.'); }
  catch (error) { showToast('ذخیره مربی ناموفق بود', error.payload?.error || 'اطلاعات را بررسی کنید.'); }
});
$('#adminCoachesGrid')?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-coach-action]');
  if (!button) return;
  const card = button.closest('[data-coach-id]');
  const coach = adminCoaches.find((item) => String(item.id) === String(card?.dataset.coachId));
  if (!coach) return;
  if (button.dataset.coachAction === 'edit') openCoachModal(coach);
  if (button.dataset.coachAction === 'delete' && confirm(`پروفایل ${coach.name} حذف شود؟`)) {
    try { await PishroAPI.deleteCoach(coach.id); await refreshCoaches(); showToast('مربی حذف شد', 'پروفایل از دیتابیس حذف شد.'); }
    catch (error) { showToast('حذف مربی ناموفق بود', error.payload?.error || 'دوباره تلاش کنید.'); }
  }
});

function blogCoverPreview(url = '') {
  $('#blogCoverPreview').innerHTML = url ? `<img src="${escapeHTML(url)}" alt="پیش‌نمایش کاور مطلب" />` : '';
}
function renderBlogs() {
  setTabCount('tabBlogsCount', adminBlogs.length);
  $('#adminBlogsEmpty').classList.toggle('visible', adminBlogs.length === 0);
  $('#adminBlogsGrid').innerHTML = adminBlogs.map((post) => `<article class="admin-content-card blog-admin-card" data-blog-id="${post.id}"><div class="admin-content-image">${post.cover_url ? `<img src="${escapeHTML(post.cover_url)}" alt="${escapeHTML(post.title)}" />` : '<div class="blog-admin-placeholder">✎</div>'}<span class="blog-status ${post.status}">${post.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}</span></div><div class="admin-content-body"><div class="card-kicker">${escapeHTML(post.category || 'training')} · ${escapeHTML(post.slug)}</div><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.excerpt || 'بدون خلاصه')}</p><div class="blog-admin-meta">${faDigits(post.gallery?.length || 0)} تصویر آلبوم</div><div class="admin-card-actions"><button data-blog-action="edit">ویرایش <span>↗</span></button><button data-blog-action="delete">حذف</button></div></div></article>`).join('');
}
async function refreshBlogs() {
  try { const response = await PishroAPI.getAdminBlogs(); adminBlogs = response.posts || []; renderBlogs(); }
  catch (error) { showToast('دریافت وبلاگ ناموفق بود', error.payload?.error || 'اتصال سرور را بررسی کنید.'); }
}
function openBlogModal(post = null) {
  editingBlogId = post?.id || null;
  const form = $('#adminBlogForm');
  form.reset();
  form.elements.blogId.value = post?.id || '';
  if (post) {
    ['title', 'slug', 'category', 'status', 'excerpt'].forEach((field) => { if (form.elements[field]) form.elements[field].value = post[field] || ''; });
    $('#blogEditor').innerHTML = post.content_html || '';
  } else $('#blogEditor').innerHTML = '';
  blogCoverPreview(post?.cover_url || '');
  $('#adminBlogModalTitle').innerHTML = post ? 'ویرایش مطلب<br /><span>و انتشار دوباره.</span>' : 'ایجاد مطلب<br /><span>برای وبلاگ.</span>';
  $('#adminBlogModal').classList.add('open');
  $('#adminBlogModal').setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setTimeout(() => form.elements.title.focus(), 150);
}
function closeBlogModal() {
  $('#adminBlogModal').classList.remove('open');
  $('#adminBlogModal').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  editingBlogId = null;
}
$('#adminAddBlogButton')?.addEventListener('click', () => openBlogModal());
$('#adminEmptyBlog')?.addEventListener('click', () => openBlogModal());
$('#adminCloseBlogModal')?.addEventListener('click', closeBlogModal);
$('#adminCancelBlogModal')?.addEventListener('click', closeBlogModal);
$('#adminBlogModal')?.addEventListener('click', (event) => { if (event.target.id === 'adminBlogModal') closeBlogModal(); });
$('#blogCover')?.addEventListener('change', (event) => { const file = event.target.files?.[0]; if (file) blogCoverPreview(URL.createObjectURL(file)); });
$('#editorToolbar')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-editor-command]');
  if (!button) return;
  const command = button.dataset.editorCommand;
  if (command === 'createLink') { const url = prompt('آدرس لینک را وارد کنید:'); if (url) document.execCommand('createLink', false, url); }
  else if (command === 'formatBlock') document.execCommand(command, false, button.dataset.editorValue);
  else document.execCommand(command, false, null);
  $('#blogEditor').focus();
});
$('#adminBlogForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  data.set('id', editingBlogId ? String(editingBlogId) : '');
  data.set('content_html', $('#blogEditor').innerHTML);
  try { await PishroAPI.saveBlog(data); closeBlogModal(); await refreshBlogs(); showToast('مطلب ذخیره شد', 'مطلب و آلبوم تصاویر در دیتابیس ذخیره شد.'); }
  catch (error) { showToast('ذخیره مطلب ناموفق بود', error.payload?.error || 'محتوا یا تصاویر را بررسی کنید.'); }
});
$('#adminBlogsGrid')?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-blog-action]');
  if (!button) return;
  const card = button.closest('[data-blog-id]');
  const post = adminBlogs.find((item) => String(item.id) === String(card?.dataset.blogId));
  if (!post) return;
  if (button.dataset.blogAction === 'edit') openBlogModal(post);
  if (button.dataset.blogAction === 'delete' && confirm(`مطلب «${post.title}» حذف شود؟`)) {
    try { await PishroAPI.deleteBlog(post.id); await refreshBlogs(); showToast('مطلب حذف شد', 'مطلب و تصاویر آن حذف شدند.'); }
    catch (error) { showToast('حذف مطلب ناموفق بود', error.payload?.error || 'دوباره تلاش کنید.'); }
  }
});

function renderMessages() {
  const unread = adminMessages.filter((message) => message.status === 'new').length;
  setTabCount('tabMessagesCount', unread);
  $('#adminMessagesEmpty').classList.toggle('visible', adminMessages.length === 0);
  $('#adminMessagesList').innerHTML = adminMessages.map((message) => `<article class="admin-message-card" data-message-id="${message.id}"><div class="message-top"><span class="message-status ${message.status}">${message.status === 'new' ? 'جدید' : message.status === 'read' ? 'خوانده‌شده' : 'بایگانی'}</span><small>${escapeHTML(message.created_at || '')}</small></div><h3>${escapeHTML(message.name)}</h3><div class="message-contact"><a href="tel:${escapeHTML(message.phone)}">${escapeHTML(message.phone)}</a><span>${escapeHTML(message.course || 'بدون انتخاب پلن')}</span></div><p>${escapeHTML(message.message || 'درخواست مشاوره')}</p><div class="message-actions"><select data-message-status><option value="new" ${message.status === 'new' ? 'selected' : ''}>جدید</option><option value="read" ${message.status === 'read' ? 'selected' : ''}>خوانده‌شده</option><option value="archived" ${message.status === 'archived' ? 'selected' : ''}>بایگانی</option></select><button data-message-action="delete">حذف</button></div></article>`).join('');
}
async function refreshMessages() {
  try { const response = await PishroAPI.getMessages(); adminMessages = response.messages || []; renderMessages(); }
  catch (error) { showToast('دریافت پیام‌ها ناموفق بود', error.payload?.error || 'اتصال سرور را بررسی کنید.'); }
}
$('#refreshMessages')?.addEventListener('click', refreshMessages);
$('#adminMessagesList')?.addEventListener('change', async (event) => { if (!event.target.matches('[data-message-status]')) return; const card = event.target.closest('[data-message-id]'); try { await PishroAPI.updateMessage(card.dataset.messageId, event.target.value); await refreshMessages(); } catch (error) { showToast('به‌روزرسانی پیام ناموفق بود', error.payload?.error || 'دوباره تلاش کنید.'); } });
$('#adminMessagesList')?.addEventListener('click', async (event) => { if (event.target.dataset.messageAction !== 'delete') return; const card = event.target.closest('[data-message-id]'); if (!confirm('این پیام حذف شود؟')) return; try { await PishroAPI.deleteMessage(card.dataset.messageId); await refreshMessages(); showToast('پیام حذف شد', 'پیام از دیتابیس حذف شد.'); } catch (error) { showToast('حذف پیام ناموفق بود', error.payload?.error || 'دوباره تلاش کنید.'); } });

function renderComments() {
  const pending = adminComments.filter((comment) => comment.status === 'pending').length;
  setTabCount('tabCommentsCount', pending);
  $('#adminCommentsEmpty').classList.toggle('visible', adminComments.length === 0);
  $('#adminCommentsList').innerHTML = adminComments.map((comment) => `<article class="admin-comment-card" data-comment-id="${comment.id}"><div class="comment-top"><span class="comment-status ${comment.status}">${comment.status === 'pending' ? 'در انتظار بررسی' : comment.status === 'approved' ? 'تأییدشده' : 'ردشده'}</span><small>${escapeHTML(comment.created_at || '')}</small></div><h3>${escapeHTML(comment.name)}</h3><div class="comment-post-title">${escapeHTML(comment.post_title)}</div><p>${escapeHTML(comment.body)}</p><div class="comment-actions"><select data-comment-status><option value="pending" ${comment.status === 'pending' ? 'selected' : ''}>در انتظار بررسی</option><option value="approved" ${comment.status === 'approved' ? 'selected' : ''}>تأیید</option><option value="rejected" ${comment.status === 'rejected' ? 'selected' : ''}>رد</option></select><button data-comment-action="delete">حذف</button></div></article>`).join('');
}
async function refreshComments() {
  try { const response = await PishroAPI.getComments(); adminComments = response.comments || []; renderComments(); }
  catch (error) { showToast('دریافت نظرات ناموفق بود', error.payload?.error || 'اتصال سرور را بررسی کنید.'); }
}
$('#refreshComments')?.addEventListener('click', refreshComments);
$('#adminCommentsList')?.addEventListener('change', async (event) => { if (!event.target.matches('[data-comment-status]')) return; const card = event.target.closest('[data-comment-id]'); try { await PishroAPI.updateComment(card.dataset.commentId, event.target.value); await refreshComments(); } catch (error) { showToast('به‌روزرسانی نظر ناموفق بود', error.payload?.error || 'دوباره تلاش کنید.'); } });
$('#adminCommentsList')?.addEventListener('click', async (event) => { if (event.target.dataset.commentAction !== 'delete') return; const card = event.target.closest('[data-comment-id]'); if (!confirm('این نظر حذف شود؟')) return; try { await PishroAPI.deleteComment(card.dataset.commentId); await refreshComments(); showToast('نظر حذف شد', 'نظر از دیتابیس حذف شد.'); } catch (error) { showToast('حذف نظر ناموفق بود', error.payload?.error || 'دوباره تلاش کنید.'); } });

async function refreshAdminExtras() {
  try {
    const [coaches, blogs, messages, comments] = await Promise.all([PishroAPI.getAdminCoaches(), PishroAPI.getAdminBlogs(), PishroAPI.getMessages(), PishroAPI.getComments()]);
    adminCoaches = coaches.coaches || [];
    adminBlogs = blogs.posts || [];
    adminMessages = messages.messages || [];
    adminComments = comments.comments || [];
    renderCoaches();
    renderBlogs();
    renderMessages();
    renderComments();
  } catch (error) {
    console.error(error);
  }
}
