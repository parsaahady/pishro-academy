const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const faDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));

// Public roster preview on the homepage. Data is read from the server database.
const homePlayersGrid = $('#homePlayersGrid');
const homePlayersEmpty = $('#homePlayersEmpty');
const homePlayersCount = $('#homePlayersCount');
const homeInitials = (name) => (String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('') || 'P').toUpperCase();
function renderHomePlayers(players = []) {
  if (!homePlayersGrid) return;
  if (homePlayersCount) homePlayersCount.textContent = faDigits(players.length);
  if (!players.length) {
    homePlayersGrid.innerHTML = '';
    homePlayersEmpty?.classList.add('visible');
    return;
  }
  homePlayersEmpty?.classList.remove('visible');
  homePlayersGrid.innerHTML = players.slice(0, 6).map((player) => {
    const visual = player.image_url ? `<img src="${escapeHTML(player.image_url)}" alt="${escapeHTML(player.name)}" />` : `<div class="home-player-initials">${escapeHTML(homeInitials(player.name))}</div>`;
    const number = player.jersey_number !== null && player.jersey_number !== undefined ? faDigits(player.jersey_number) : '—';
    const age = player.age ? `${faDigits(player.age)} سال` : '—';
    const exp = `${faDigits(player.years_active || 0)} سال سابقه`;
    return `<a class="home-player-card" href="player.html?id=${encodeURIComponent(player.id)}"><div class="home-player-image">${visual}<span class="home-player-number">${number}</span><span class="home-player-position">${escapeHTML(player.position || 'بازیکن')}</span></div><div class="home-player-body"><div class="home-player-team">${escapeHTML(player.team_name)} · ${escapeHTML(player.team_age_range)}</div><h3>${escapeHTML(player.name)}</h3><div class="home-player-meta"><span>${age}</span><span>${escapeHTML(exp)}</span></div><span class="home-player-link">مشاهده پروفایل <b>←</b></span></div></a>`;
  }).join('');
}
async function loadHomePlayers() {
  if (!homePlayersGrid || !window.PishroAPI) return;
  try {
    const response = await PishroAPI.getPublicPlayers({ limit: 6 });
    renderHomePlayers(response.players || []);
  } catch (error) {
    console.warn('Public roster is not available yet.', error);
    renderHomePlayers([]);
  }
}
loadHomePlayers();
window.addEventListener('pishro-roster-updated', loadHomePlayers);
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadHomePlayers(); });

// Sticky header state
const topbar = $('#topbar');
const setHeaderState = () => topbar?.classList.toggle('scrolled', window.scrollY > 16);
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

// Mobile navigation
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
menuToggle?.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.classList.toggle('is-open', isOpen);
});
$$('.main-nav a').forEach((link) => link.addEventListener('click', () => {
  mainNav?.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

// Reveal sections as they enter the viewport
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .12 });
$$('.reveal').forEach((element) => revealObserver.observe(element));

// Animated stats
const statsObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count || 0);
    const duration = 1000;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = (element.dataset.prefix || '') + faDigits(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    observer.unobserve(element);
  });
}, { threshold: .6 });
$$('[data-count]').forEach((element) => statsObserver.observe(element));

// Program filters
const filterButtons = $$('.filter-button');
const programCards = $$('.program-card');
filterButtons.forEach((button) => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  filterButtons.forEach((item) => item.classList.toggle('active', item === button));
  programCards.forEach((card) => {
    const matches = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('is-hidden', !matches);
  });
}));

// Team switcher
const teamData = {
  kids: { no: '۰۱', title: 'ببرهای کوچک', text: 'اولین تجربه هاکی باید پر از بازی و کشف باشد. کودکان با تمرین‌های کوتاه و جذاب، تعادل، همکاری و لذت حرکت را یاد می‌گیرند.', tags: ['بازی‌محور', 'مربی همراه', 'اعتمادبه‌نفس'], image: 'assets/gallery/team-kids.png' },
  junior: { no: '۰۲', title: 'نوجوانان پیشرو', text: 'در این رده، مهارت‌های پایه به تکنیک واقعی بازی وصل می‌شوند؛ از پاس و شوت تا تصمیم‌گیری سریع در زمین.', tags: ['تکنیک', 'تاکتیک', 'رفاقت تیمی'], image: 'assets/gallery/team-junior-action.jpg' },
  adult: { no: '۰۳', title: 'تیم بزرگسالان', text: 'برای بزرگسالانی که می‌خواهند جدی‌تر بازی کنند، تمرین‌های منظم سالن با تمرکز بر آمادگی بدنی و بازی تیمی برگزار می‌شود.', tags: ['تمرین منظم', 'آمادگی بدنی', 'مسابقه'], image: 'assets/gallery/team-adults.jpg' },
  pro: { no: '۰۴', title: 'مسیر قهرمانی', text: 'استعدادهایی که هدف بزرگ‌تری دارند، وارد مسیر تمرین پیشرفته می‌شوند؛ با ارزیابی، برنامه اختصاصی و نگاه رقابتی.', tags: ['استعدادیابی', 'پیشرفته', 'آماده مسابقه'], image: 'assets/gallery/team-pro-action.jpg' }
};
const teamTitle = $('#teamTitle');
const teamText = $('#teamText');
const teamNumber = $('#teamNumber');
const teamTags = $('#teamTags');
const teamFeatureImage = $('#teamFeatureImage');
$$('.team-row').forEach((row) => row.addEventListener('click', () => {
  const data = teamData[row.dataset.team];
  if (!data) return;
  $$('.team-row').forEach((item) => item.classList.toggle('active', item === row));
  [teamTitle, teamText, teamNumber].forEach((element) => element?.classList.add('swap-out'));
  window.setTimeout(() => {
    if (teamTitle) teamTitle.textContent = data.title;
    if (teamText) teamText.textContent = data.text;
    if (teamNumber) teamNumber.textContent = data.no;
    if (teamTags) teamTags.innerHTML = data.tags.map((tag) => `<span>${tag}</span>`).join('');
    if (teamFeatureImage) {
      teamFeatureImage.src = data.image;
      teamFeatureImage.alt = `تصویر ${data.title} پیشرو هاکی`;
    }
    [teamTitle, teamText, teamNumber].forEach((element) => element?.classList.remove('swap-out'));
  }, 160);
}));

// Modal flows
const modal = $('#consultModal');
const modalPlan = $('#modalPlan');
const openModal = (plan = 'مشاوره رایگان') => {
  if (!modal) return;
  if (modalPlan) {
    const option = [...modalPlan.options].find((item) => item.textContent.trim() === plan.trim());
    if (option) modalPlan.value = option.value;
    else modalPlan.value = 'مشاوره رایگان';
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  window.setTimeout(() => $('[name="modalName"]', modal)?.focus(), 180);
};
const closeModal = () => {
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
};
$$('[data-open-modal]').forEach((button) => button.addEventListener('click', () => openModal(button.dataset.plan || 'مشاوره رایگان')));
$$('[data-close-modal]').forEach((button) => button.addEventListener('click', closeModal));
modal?.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });

const toast = $('#toast');
let toastTimer;
const showToast = () => {
  toast?.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast?.classList.remove('show'), 4800);
};

async function submitContactForm(form, payload, afterSuccess = () => {}) {
  if (!window.PishroAPI) return;
  try {
    await PishroAPI.submitContact(payload);
    form.reset();
    afterSuccess();
    showToast();
  } catch (error) {
    console.error(error);
    window.alert('ارسال درخواست انجام نشد. لطفاً دوباره تلاش کنید.');
  }
}

$('#modalForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  await submitContactForm(form, {
    name: form.elements.modalName.value,
    phone: form.elements.modalPhone.value,
    course: form.elements.modalPlan.value,
  }, closeModal);
});
$('#contactForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  await submitContactForm(form, {
    name: form.elements.name.value,
    phone: form.elements.phone.value,
    course: form.elements.course.value,
  });
});

// Map query button. The query stays editable and can later be replaced with a precise pin.
$('#mapButton')?.addEventListener('click', () => {
  const query = encodeURIComponent('پیست اسکیت الغدیر قزوین');
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener');
});

// Subtle pointer depth on the hero jersey panel
const heroStage = $('.hero-stage');
const stageCard = $('.stage-card');
if (heroStage && stageCard && window.matchMedia('(pointer: fine)').matches) {
  heroStage.addEventListener('pointermove', (event) => {
    const rect = heroStage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    stageCard.style.transform = `perspective(1200px) rotateY(${-7 + x * 4}deg) rotateX(${2 - y * 3}deg) translate3d(${x * 5}px, ${y * -5}px, 0)`;
  });
  heroStage.addEventListener('pointerleave', () => {
    stageCard.style.transform = 'perspective(1200px) rotateY(-7deg) rotateX(2deg)';
  });
}

// Active nav item while scrolling through major sections
const navLinks = $$('.main-nav a');
const navSections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
navSections.forEach((section) => navObserver.observe(section));
