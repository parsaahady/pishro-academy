const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeHTML = (value = '') => String(value).replace(/[&<>\'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
const query = new URLSearchParams(window.location.search);
const slug = query.get('slug') || '';
let post = null;

const topbar = $('#topbar');
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
window.addEventListener('scroll', () => topbar?.classList.toggle('scrolled', window.scrollY > 16), { passive: true });
menuToggle?.addEventListener('click', () => { const open = mainNav.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); });
$$('.main-nav a').forEach((link) => link.addEventListener('click', () => mainNav?.classList.remove('open')));

const revealObserver = new IntersectionObserver((entries, observer) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: .08 });
$$('.reveal').forEach((element) => revealObserver.observe(element));

function formatDate(value) {
  if (!value) return 'پیشرو هاکی';
  try { return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value.replace(' ', 'T') + 'Z')); } catch { return value; }
}
function renderComments(comments = []) {
  const list = $('#commentsList');
  if (!comments.length) { list.innerHTML = '<div class="comments-empty"><span>✦</span><p>هنوز نظری ثبت نشده است. اولین نظر را شما بنویسید.</p></div>'; return; }
  list.innerHTML = comments.map((comment) => `<article class="comment-card"><div class="comment-avatar">${escapeHTML(comment.name.slice(0, 1))}</div><div><div class="comment-head"><b>${escapeHTML(comment.name)}</b><small>${formatDate(comment.created_at)}</small></div><p>${escapeHTML(comment.body)}</p></div></article>`).join('');
}
function renderPost() {
  $('#postTitle').textContent = post.title;
  $('#postExcerpt').textContent = post.excerpt || '';
  $('#postCategory').textContent = `PISHRO HOCKEY / ${String(post.category || 'BLOG').toUpperCase()}`;
  $('#postDate').textContent = formatDate(post.published_at || post.created_at);
  document.title = `${post.title} | پیشرو هاکی`;
  if (post.cover_url) { $('#postCover').src = post.cover_url; $('#postCover').alt = post.title; }
  $('#postContent').innerHTML = post.content_html || '';
  $('#postGallery').innerHTML = (post.gallery || []).length ? `<div class="post-gallery-head"><div class="eyebrow">PISHRO / ALBUM</div><h3>قاب‌های این مطلب</h3></div><div class="post-gallery-grid">${post.gallery.map((image) => `<figure><img src="${escapeHTML(image.url)}" alt="${escapeHTML(image.alt || post.title)}" /></figure>`).join('')}</div>` : '';
  renderComments(post.comments || []);
  $('#commentForm').elements.slug.value = post.slug;
}
async function loadPost() {
  if (!slug) { $('#postTitle').textContent = 'مطلب پیدا نشد'; return; }
  try { const response = await PishroAPI.getBlogs({ slug }); post = response.post; renderPost(); }
  catch (error) { console.error(error); $('#postTitle').textContent = 'مطلب پیدا نشد'; $('#postExcerpt').textContent = 'این مطلب وجود ندارد یا هنوز منتشر نشده است.'; }
}
$('#commentForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());
  try { await PishroAPI.submitComment(data); form.reset(); form.elements.slug.value = slug; $('#postToast').classList.add('show'); setTimeout(() => $('#postToast').classList.remove('show'), 4300); }
  catch (error) { window.alert(error.payload?.error || 'ارسال نظر انجام نشد.'); }
});
$('#copyPostLink')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(window.location.href); window.alert('لینک مطلب کپی شد.'); } catch { window.prompt('لینک مطلب:', window.location.href); } });
loadPost();
