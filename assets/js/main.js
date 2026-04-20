(function () {
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');
  const savedTheme = localStorage.getItem('cal_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const startTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  root.setAttribute('data-theme', startTheme);
  if (themeBtn) themeBtn.textContent = startTheme === 'dark' ? '☀' : '☾';

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('cal_theme', next);
      themeBtn.textContent = next === 'dark' ? '☀' : '☾';
    });
  }

  const shots = Array.from(document.querySelectorAll('.shot'));
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lbClose');
  const prevBtn = document.getElementById('lbPrev');
  const nextBtn = document.getElementById('lbNext');
  let activeIndex = 0;
  let lastFocus = null;

  function openLb(index) {
    if (!lb || !lbImg || !shots.length) return;
    activeIndex = Math.max(0, Math.min(index, shots.length - 1));
    const src = shots[activeIndex].getAttribute('data-full');
    const alt = shots[activeIndex].querySelector('img')?.getAttribute('alt') || 'Çiftlik Ajandası ekran görüntüsü';
    if (!src) return;
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt;
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeLb() {
    if (!lb) return;
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lbImg) lbImg.removeAttribute('src');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function step(delta) {
    if (!shots.length) return;
    activeIndex = (activeIndex + delta + shots.length) % shots.length;
    openLb(activeIndex);
  }

  shots.forEach((btn, index) => btn.addEventListener('click', () => openLb(index)));
  const openGallery = document.getElementById('openGallery');
  if (openGallery) openGallery.addEventListener('click', () => openLb(0));
  if (closeBtn) closeBtn.addEventListener('click', closeLb);
  if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => step(1));
  if (lb) {
    lb.addEventListener('click', (event) => { if (event.target === lb) closeLb(); });
  }
  window.addEventListener('keydown', (event) => {
    if (!lb || lb.getAttribute('aria-hidden') !== 'false') return;
    if (event.key === 'Escape') closeLb();
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
    if (event.key === 'Tab' && closeBtn && prevBtn && nextBtn) {
      const focusables = [closeBtn, prevBtn, nextBtn];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();
