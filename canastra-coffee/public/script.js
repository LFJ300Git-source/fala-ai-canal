/* ===================================
   CANASTRA COFFEE — script.js
   =================================== */

(function () {
  'use strict';

  /* ─────────────────────────────────────
     CUSTOM CURSOR
  ───────────────────────────────────── */
  const dot  = document.createElement('div'); dot.className  = 'cursor-dot';
  const ring = document.createElement('div'); ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function trackRing() {
    rx += (mx - rx) * .12;
    ry += (my - ry) * .12;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(trackRing);
  })();

  document.querySelectorAll('a, button, .size-pill, .origin-card, .plan-card').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('expanded'));
    el.addEventListener('mouseleave', () => ring.classList.remove('expanded'));
  });

  /* ─────────────────────────────────────
     SCROLL PROGRESS BAR
  ───────────────────────────────────── */
  const progressBar = document.getElementById('scroll-progress-bar');

  /* ─────────────────────────────────────
     HEADER SCROLL STATE
  ───────────────────────────────────── */
  const header     = document.getElementById('site-header');
  const scrollHint = document.getElementById('scroll-hint');

  /* ─────────────────────────────────────
     REVEAL ON SCROLL (IntersectionObserver)
  ───────────────────────────────────── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.10 });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ─────────────────────────────────────
     SIZE PILL SELECTOR
  ───────────────────────────────────── */
  document.querySelectorAll('.size-pills').forEach(group => {
    group.addEventListener('click', e => {
      if (!e.target.classList.contains('size-pill')) return;
      group.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  /* ═════════════════════════════════════════
     HERO VIDEO — CANVAS FRAME EXTRACTION
     Extrai até 300 frames via Canvas API.
     Scroll scruba por índice de frame.
     Loading screen mostra progresso real 0→100%.
  ═════════════════════════════════════════ */

  const video       = document.getElementById('hero-video');
  const heroSection = document.getElementById('hero');
  const overlays    = Array.from(document.querySelectorAll('.hero-overlay'));
  const loadScreen  = document.getElementById('loading-screen');
  const loadFill    = document.getElementById('loading-bar-fill');
  const loadPct     = document.getElementById('loading-percent');

  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';

  let frames     = [];
  let heroPct    = 0;
  let rafPending = false;

  /* ── Helpers ── */
  function setCounter(val) {
    const v = Math.round(val);
    if (loadFill) loadFill.style.width = v + '%';
    if (loadPct)  loadPct.textContent  = v + '%';
  }

  function hideLoading() {
    if (!loadScreen || loadScreen.classList.contains('fade-out')) return;
    loadScreen.classList.add('fade-out');
    setTimeout(() => { loadScreen.style.display = 'none'; }, 900);
  }

  /* ── Text overlays ── */
  function updateOverlays(pct) {
    const FADE = 2.5;
    overlays.forEach(el => {
      const start = +el.dataset.start;
      const end   = +el.dataset.end;
      let opacity = 0;
      if (pct >= start && pct <= end) {
        if      (pct < start + FADE) opacity = (pct - start) / FADE;
        else if (pct > end   - FADE) opacity = (end   - pct) / FADE;
        else                          opacity = 1;
        opacity = Math.max(0, Math.min(1, opacity));
      }
      el.style.opacity = opacity;
    });
  }

  /* ── Scroll handler ── */
  window.addEventListener('scroll', function () {
    const scrollY = window.scrollY;
    const docH    = document.documentElement.scrollHeight - window.innerHeight;

    if (progressBar) progressBar.style.width = ((scrollY / docH) * 100).toFixed(2) + '%';
    if (header)      header.classList.toggle('scrolled', scrollY > 60);

    if (heroSection && frames.length > 0) {
      const heroTop   = heroSection.offsetTop;
      const maxScroll = heroSection.offsetHeight - window.innerHeight;
      heroPct = Math.max(0, Math.min(1, (scrollY - heroTop) / maxScroll));

      if (scrollHint) scrollHint.classList.toggle('hidden', heroPct > 0.03);

      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          const idx = Math.min(frames.length - 1, Math.floor(heroPct * frames.length));
          ctx.putImageData(frames[idx], 0, 0);
          updateOverlays(heroPct * 100);
        });
      }
    }
  }, { passive: true });

  /* ── Frame extraction ── */
  function extractFrames() {
    const MAX_FRAMES = 300;
    const INTERVAL   = 0.1; // segundos entre frames
    const duration   = video.duration;
    const total      = Math.min(MAX_FRAMES, Math.floor(duration / INTERVAL));

    canvas.width  = video.videoWidth  || 1920;
    canvas.height = video.videoHeight || 1080;

    video.parentNode.insertBefore(canvas, video);
    video.style.display = 'none';

    let i = 0;

    function captureNext() {
      if (i >= total) {
        if (frames[0]) ctx.putImageData(frames[0], 0, 0);
        setCounter(100);
        setTimeout(hideLoading, 200);
        return;
      }

      video.currentTime = i * INTERVAL;
      video.onseeked = function () {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        i++;
        setCounter((i / total) * 100);
        captureNext();
      };
    }

    captureNext();
  }

  /* ── Init ── */
  function init() {
    if (video.readyState >= 1) {
      extractFrames();
    } else {
      video.addEventListener('loadedmetadata', extractFrames, { once: true });
    }
    video.load();
  }

  init();

})();
