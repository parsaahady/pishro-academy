const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeHTML = (value = '') => String(value).replace(/[&<>\'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);

const topbar = $('#topbar');
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
window.addEventListener('scroll', () => topbar?.classList.toggle('scrolled', window.scrollY > 16), { passive: true });
menuToggle?.addEventListener('click', () => { const open = mainNav.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); });
$$('.main-nav a').forEach((link) => link.addEventListener('click', () => mainNav?.classList.remove('open')));

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
}, { threshold: .08 });
$$('.reveal').forEach((element) => revealObserver.observe(element));

let posts = [];
let activeFilter = 'all';
const categoryLabels = { rules: 'قوانین بازی', gear: 'تجهیزات', skates: 'اسکیت و تمرین', training: 'آموزش', news: 'اخبار' };

function renderBlogs() {
  const filtered = posts.filter((post) => activeFilter === 'all' || post.category === activeFilter);
  $('#blogCount').textContent = faDigits(filtered.length);
  $('#blogEmpty').classList.toggle('visible', filtered.length === 0);
  const featuredSlot = $('#featuredBlogSlot');
  const grid = $('#blogGrid');
  if (!filtered.length) { featuredSlot.innerHTML = ''; grid.innerHTML = ''; return; }
  const featured = filtered[0];
  featuredSlot.innerHTML = `<a class="featured-blog-card" href="post.html?slug=${encodeURIComponent(featured.slug)}"><div class="featured-blog-image">${featured.cover_url ? `<img src="${escapeHTML(featured.cover_url)}" alt="${escapeHTML(featured.title)}" />` : ''}<span></span></div><div class="featured-blog-copy"><div class="blog-meta"><span>${categoryLabels[featured.category] || 'پیشرو هاکی'}</span><small>FEATURED / ۰۱</small></div><h3>${escapeHTML(featured.title)}</h3><p>${escapeHTML(featured.excerpt || '')}</p><span class="blog-card-link">خواندن مطلب <b>←</b></span></div></a>`;
  grid.innerHTML = filtered.slice(1).map((post, index) => `<a class="blog-card" href="post.html?slug=${encodeURIComponent(post.slug)}"><div class="blog-card-image">${post.cover_url ? `<img src="${escapeHTML(post.cover_url)}" alt="${escapeHTML(post.title)}" />` : ''}<span class="blog-card-index">${faDigits(String(index + 2).padStart(2, '0'))}</span></div><div class="blog-card-body"><div class="blog-meta"><span>${categoryLabels[post.category] || 'مطلب'}</span><small>PISHRO HOCKEY</small></div><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.excerpt || '')}</p><span class="blog-card-link">ادامه مطلب <b>←</b></span></div></a>`).join('');
}

$$('.blog-filter').forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.blogFilter; $$('.blog-filter').forEach((item) => item.classList.toggle('active', item === button)); renderBlogs(); }));

async function loadBlogs() {
  try {
    const response = await PishroAPI.getBlogs({ limit: 50 });
    posts = response.posts || [];
    renderBlogs();
  } catch (error) {
    console.error(error);
    $('#blogEmpty').classList.add('visible');
  }
}
loadBlogs();
