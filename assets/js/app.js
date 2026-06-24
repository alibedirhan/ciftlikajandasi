/* Çiftlik Ajandası — etkileşim katmanı (bağımlılıksız, hafif) */
(function () {
  "use strict";

  /* ---- Tema (aydınlık/karanlık), tercih hatırlanır ---- */
  var root = document.documentElement;
  var themeBtn = document.getElementById("themeBtn");
  var stored = null;
  try { stored = localStorage.getItem("ca-theme"); } catch (e) {}
  if (stored) root.setAttribute("data-theme", stored);
  function syncThemeGlyph() {
    var glyph = themeBtn && themeBtn.querySelector(".themeGlyph");
    if (glyph) glyph.textContent = root.getAttribute("data-theme") === "dark" ? "☀" : "☾";
  }
  syncThemeGlyph();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("ca-theme", next); } catch (e) {}
      syncThemeGlyph();
    });
  }

  /* ---- Scroll ilerleme çubuğu + sticky topbar gölgesi ---- */
  var progress = document.getElementById("scrollProgress");
  var topbar = document.getElementById("topbar");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
    if (topbar) topbar.classList.toggle("scrolled", h.scrollTop > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobil menü ---- */
  var menuBtn = document.getElementById("menuBtn");
  var mobileNav = document.getElementById("mobileNav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Scroll-reveal (IntersectionObserver) ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Ekran görüntüsü galerisi (lightbox) ---- */
  var shots = Array.prototype.slice.call(document.querySelectorAll(".shot"));
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var openGallery = document.getElementById("openGallery");
  var idx = 0;

  function show(i) {
    if (!shots.length) return;
    idx = (i + shots.length) % shots.length;
    var full = shots[idx].getAttribute("data-full");
    var img = shots[idx].querySelector("img");
    lightboxImg.src = full;
    lightboxImg.alt = img ? img.alt : "Ekran görüntüsü";
  }
  function openLb(i) {
    show(i);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLb() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  shots.forEach(function (s, i) { s.addEventListener("click", function () { openLb(i); }); });
  if (openGallery) openGallery.addEventListener("click", function () { openLb(0); });
  if (lbClose) lbClose.addEventListener("click", closeLb);
  if (lbPrev) lbPrev.addEventListener("click", function () { show(idx - 1); });
  if (lbNext) lbNext.addEventListener("click", function () { show(idx + 1); });
  if (lightbox) lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (!lightbox || !lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
  });

  /* ---- Aktif menü vurgusu ---- */
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll(".navLink");
  if ("IntersectionObserver" in window && navLinks.length) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = en.target.getAttribute("id");
          navLinks.forEach(function (l) {
            l.classList.toggle("active", l.getAttribute("href") === "#" + id);
          });
        }
      });
    }, { threshold: 0.5 });
    sections.forEach(function (s) { navIo.observe(s); });
  }

  /* ---- CAL hero sahne döngüsü (sakin; üstüne gelince ve sekme gizliyken durur) ---- */
  var scenes = document.querySelectorAll(".calScene");
  var dots = document.querySelectorAll("#sceneDots span");
  var phone = document.querySelector(".phone");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (scenes.length > 1 && !reduceMotion) {
    var sc = 0, scTimer = null, SCENE_MS = 5600;
    function goScene(n) {
      scenes[sc].classList.remove("active");
      if (dots[sc]) dots[sc].classList.remove("active");
      sc = (n + scenes.length) % scenes.length;
      scenes[sc].classList.add("active");
      if (dots[sc]) dots[sc].classList.add("active");
    }
    function startScenes() { stopScenes(); scTimer = setInterval(function () { goScene(sc + 1); }, SCENE_MS); }
    function stopScenes() { if (scTimer) { clearInterval(scTimer); scTimer = null; } }
    startScenes();
    if (phone) {
      phone.addEventListener("mouseenter", stopScenes);
      phone.addEventListener("mouseleave", startScenes);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopScenes(); else startScenes();
    });
  }
})();
