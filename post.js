const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
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

// Emoji / symbols that reliably BEGIN a section header, bullet or phone line
// in this project's content. Inline emoji (🏆🤩⚡🔥🥇📜💨🛼) are deliberately
// excluded so sentences are never split mid-way.
const SECTION_STARTERS = '🎯🏅📅📍💳🚀☎🏁🗓⏰📞✅';

// Some editors save content as a single run-on string with no newlines: each
// paragraph is glued to the next (the line breaks were lost). We recover the
// structure from the surviving separators (━━ lines) and section-starter
// emoji. This is a lossy repair — the DB should be fixed via api/repair-blogs.php
// and future posts are saved correctly by api/helpers.php — but it makes the
// page readable immediately.
function repairGluedText(text) {
  const segments = text.split(/(━{2,})/);
  const lines = [];
  segments.forEach((segment) => {
    if (/^━+$/.test(segment)) { lines.push(segment); return; }
    const parts = segment.split(new RegExp('(?=[' + SECTION_STARTERS + '])', 'u'));
    parts.forEach((part) => {
      part.split(/(?=•\s)/).forEach((sub) => {
        const cleaned = sub.trim();
        if (cleaned) lines.push(cleaned);
      });
    });
  });
  return lines.join('\n');
}

function renderPostContent(html) {
  const raw = html || '';
  // Already structured (has block or inline tags) → render as-is (sanitised server-side).
  if (/<[a-z][^>]*>/i.test(raw)) return raw;
  // Plain text with line breaks → convert newlines to <br>.
  if (/[\r\n]/.test(raw)) return escapeHTML(raw).replace(/\r\n|\r|\n/g, '<br>');
  // Glued plain text (no newlines, no tags) → try to recover line structure.
  return escapeHTML(repairGluedText(raw)).replace(/\r\n|\r|\n/g, '<br>');
}

function renderComments(comments = []) {
  const list = $('#commentsList');
  if (!list) return;
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
  $('#postContent').innerHTML = renderPostContent(post.content_html);
  const gallery = post.gallery || [];
  $('#postGallery').innerHTML = gallery.length ? `<div class="post-gallery-head"><div class="eyebrow">PISHRO / ALBUM</div><h3>قاب‌های این مطلب</h3></div><div class="post-gallery-grid">${gallery.map((image) => `<figure><img src="${escapeHTML(image.url)}" alt="${escapeHTML(image.alt || post.title)}" /></figure>`).join('')}</div>` : '';
  renderComments(post.comments || []);
  $('#commentForm').elements.slug.value = post.slug;
}

async function loadPost() {
  if (!slug) { $('#postTitle').textContent = 'مطلب پیدا نشد'; return; }
  try {
    const response = await PishroAPI.getBlogs({ slug });
    post = response.post;
    if (!post) { $('#postTitle').textContent = 'مطلب پیدا نشد'; return; }
    renderPost();
  } catch (error) {
    console.error(error);
    $('#postTitle').textContent = 'مطلب پیدا نشد';
    $('#postExcerpt').textContent = 'این مطلب وجود ندارد یا هنوز منتشر نشده است.';
  }
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
