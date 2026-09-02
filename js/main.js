/* ============================================================
   TÄRNVIK BAD — motion system
   GSAP 3.15 (ScrollTrigger, SplitText, CustomEase) + Lenis
   ============================================================ */

gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText);

/* ── shared timing vocabulary ─────────────────────────────── */
const durS = 0.4;
const durM = 0.8;
const durL = 1.2;
const stagger = 0.1;
const delayReveal = 0.3;
const breakPoint = 992;

CustomEase.create('InOut', '0.75,0,0.25,1');
CustomEase.create('Out', '0.25,1,0.5,1');
CustomEase.create('In', '0.5,0,0.75,0');
CustomEase.create('Ease', '0.25,0.1,0.25,1');
CustomEase.create('diveIn', '0.6,0,0,1');
CustomEase.create('loaderEase', 'M0,0 C0,0 0.13,0.34 0.238,0.442 0.305,0.506 0.322,0.514 0.396,0.54 0.478,0.568 0.468,0.56 0.522,0.584 0.572,0.606 0.61,0.719 0.714,0.826 0.798,0.912 1,1 1,1');

let lenis = null;
let resizeTimeout = null;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── scroll lock ──────────────────────────────────────────── */
function lockScroll() { lenis && lenis.stop(); }
function unlockScroll() { lenis && lenis.start(); }
function scrollToTop() { window.scrollTo(0, 0); }

/* ============================================================
   TEXT PRIMITIVES
   Five reveal shapes, each with reveal / hide / initial states.
   ============================================================ */

/* Splits are created once per element and re-split automatically when the
   font finally lands or the viewport changes width. Without autoSplit, a
   split taken during the font block period measures every word at zero and
   lays the paragraph out one word per line. */
function makeSplit(el, config, restore) {
  if (el._split) return el._split;
  el._state = 'initial';
  el._split = SplitText.create(el, Object.assign({
    tag: 'span',
    autoSplit: true,
    onSplit: self => restore(self, el._state)
  }, config));
  return el._split;
}

/* a — display characters tumble in from the right on the X axis */
function animateTextA(targets, state, delay) {
  const items = gsap.utils.toArray(targets);
  if (!items.length) return;
  items.forEach((el, i) => {
    if (!el.textContent.trim()) return;
    const split = makeSplit(el,
      { type: 'chars', charsClass: 'split-char', smartWrap: true },
      (self, phase) => gsap.set(self.chars, phase === 'revealed'
        ? { opacity: 1, rotateX: 0, x: '0rem' }
        : { opacity: 0, rotateX: -90, x: '-10rem', transformOrigin: 'center top' }));
    const offset = i * stagger;
    switch (state) {
      case 'reveal':
        el._state = 'revealed';
        gsap.fromTo(split.chars,
          { opacity: 0, rotateX: 90, x: '10rem', transformOrigin: 'center bottom' },
          { opacity: 1, rotateX: 0, x: '0rem', duration: durL, delay: (delay ?? delayReveal) + offset, stagger, ease: 'Out', overwrite: true });
        break;
      case 'hide':
        el._state = 'initial';
        gsap.to(split.chars,
          { opacity: 0, rotateX: -90, x: '-10rem', transformOrigin: 'center top', duration: durS, delay: delay ?? 0, stagger: stagger * 0.5, ease: 'In', overwrite: true });
        break;
      case 'initial':
        el._state = 'initial';
        gsap.set(split.chars, { opacity: 0, rotateX: -90, x: '-10rem', transformOrigin: 'center top' });
    }
  });
}

/* h — headings, characters swing in around the Y axis */
function animateTextH(targets, state, delay) {
  const items = gsap.utils.toArray(targets);
  if (!items.length) return;
  items.forEach((el, i) => {
    if (!el.textContent.trim()) return;
    const split = makeSplit(el,
      { type: 'words,chars', wordsClass: 'split-word', charsClass: 'split-char', smartWrap: true },
      (self, phase) => gsap.set(self.chars, phase === 'revealed'
        ? { opacity: 1, yPercent: 0, rotateY: 0 }
        : { opacity: 0, yPercent: 50, rotateY: 90 }));
    const offset = i * stagger;
    switch (state) {
      case 'reveal':
        el._state = 'revealed';
        gsap.fromTo(split.chars,
          { opacity: 0, yPercent: 50, rotateY: 90 },
          { opacity: 1, yPercent: 0, rotateY: 0, duration: durL, delay: (delay ?? delayReveal) + offset, stagger: stagger * 0.5, ease: 'Out', overwrite: true });
        break;
      case 'hide':
        el._state = 'initial';
        gsap.to(split.chars,
          { opacity: 0, yPercent: -50, rotateY: -90, duration: durS, delay: delay ?? 0, stagger: stagger * 0.25, ease: 'In', overwrite: true });
        break;
      case 'initial':
        el._state = 'initial';
        gsap.set(split.chars, { opacity: 0, yPercent: 50, rotateY: 90 });
    }
  });
}

/* p — body copy, whole lines rise out of their own mask */
function animateTextP(targets, state, delay) {
  const items = gsap.utils.toArray(targets);
  if (!items.length) return;
  items.forEach((el, i) => {
    if (!el.textContent.trim()) return;
    const split = makeSplit(el,
      { type: 'lines,words', linesClass: 'split-line', wordsClass: 'split-word', mask: 'lines' },
      (self, phase) => gsap.set(self.lines, { yPercent: phase === 'revealed' ? 0 : 110 }));
    const offset = i * stagger;
    switch (state) {
      case 'reveal':
        el._state = 'revealed';
        gsap.fromTo(split.lines, { yPercent: 110 },
          { yPercent: 0, duration: durL, delay: (delay ?? delayReveal) + offset, stagger, ease: 'Out', overwrite: true });
        break;
      case 'hide':
        el._state = 'initial';
        gsap.to(split.lines, { yPercent: -110, duration: durS, delay: delay ?? 0, stagger: stagger * 0.5, ease: 'In', overwrite: true });
        break;
      case 'initial':
        el._state = 'initial';
        gsap.set(split.lines, { yPercent: 110 });
    }
  });
}

/* ctn — containers and buttons, lift and fade */
function animateCtn(targets, state, delay) {
  const items = gsap.utils.toArray(targets);
  if (!items.length) return;
  const from = window.innerWidth >= breakPoint ? '3.333rem' : '5.5rem';
  switch (state) {
    case 'reveal':
      gsap.fromTo(items, { opacity: 0, y: from },
        { opacity: 1, y: '0rem', duration: durL, delay: delay ?? delayReveal, stagger, ease: 'Out', overwrite: true });
      break;
    case 'hide':
      gsap.to(items, { opacity: 0, y: '0rem', duration: durS, delay: delay ?? 0, stagger: stagger * 0.5, ease: 'In', overwrite: true });
      break;
    case 'initial':
      gsap.set(items, { opacity: 0, y: from });
  }
}

/* line — rules draw themselves top to bottom */
function animateLine(targets, state, delay) {
  const items = gsap.utils.toArray(targets);
  if (!items.length) return;
  switch (state) {
    case 'reveal':
      gsap.fromTo(items, { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: durL, delay: delay ?? delayReveal, stagger, ease: 'Out', overwrite: true });
      break;
    case 'hide':
      gsap.to(items, { clipPath: 'inset(100% 0% 0% 0%)', duration: durS, delay: delay ?? 0, stagger: stagger * 0.5, ease: 'In', overwrite: true });
      break;
    case 'initial':
      gsap.set(items, { clipPath: 'inset(0% 0% 100% 0%)' });
  }
}

/* slide — image wipes open while the photo inside settles back to scale 1 */
function animateSlide(targets, state, delay) {
  const items = gsap.utils.toArray(targets);
  if (!items.length) return;
  const inner = items.map(el => el.firstElementChild).filter(Boolean);
  switch (state) {
    case 'reveal':
      gsap.fromTo(items,
        { clipPath: 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)' },
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: durL, delay: delay ?? delayReveal, ease: 'InOut', overwrite: true });
      gsap.fromTo(inner, { scale: 1.5, xPercent: 25 },
        { scale: 1, xPercent: 0, duration: durL, delay: delay ?? delayReveal, ease: 'InOut', overwrite: true });
      break;
    case 'hide':
      gsap.to(items, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)', duration: durL, delay: delay ?? 0, ease: 'InOut', overwrite: true });
      gsap.to(inner, { scale: 1.5, xPercent: -25, duration: durL, delay: delay ?? 0, ease: 'InOut', overwrite: true });
      break;
    case 'initial':
      gsap.set(items, { clipPath: 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)' });
      gsap.set(inner, { scale: 1.5, xPercent: 25 });
  }
}

const revealFns = { a: animateTextA, h: animateTextH, p: animateTextP, ctn: animateCtn, line: animateLine, slide: animateSlide };

/* ============================================================
   SCROLL REVEAL WIRING
   Elements group under the nearest [data-scroll-reveal="w"] so a
   whole block cascades from one trigger instead of firing per node.
   ============================================================ */
function initScrollElementsReveal() {
  function bind(trigger, items, fn) {
    /* Anything inside a pinned horizontal track is driven off the section
       itself, not off its own position. A containerAnimation trigger needs
       the track to actually travel; when it fits the viewport the travel is
       zero, the trigger never fires, and the copy stays parked in its
       hidden initial state forever. Revealing on the section is one frame
       early for the offscreen cards and always correct. */
    const horizontal = trigger.closest('[data-scroll-horizontal]');
    ScrollTrigger.create({
      trigger: horizontal || trigger,
      start: horizontal ? 'top 85%' : 'top bottom',
      once: true,
      onEnter: () => fn(items, 'reveal')
    });
  }

  Object.keys(revealFns).forEach(key => {
    const nodes = document.querySelectorAll(`[data-scroll-reveal="${key}"]`);
    if (!nodes.length) return;

    const groups = new Map();
    nodes.forEach(node => {
      const wrapper = node.closest('[data-scroll-reveal="w"]') || node;
      if (!groups.has(wrapper)) groups.set(wrapper, []);
      groups.get(wrapper).push(node);
    });

    groups.forEach((items, trigger) => {
      gsap.set(items, { visibility: 'visible' });
      revealFns[key](items, 'initial');
      bind(trigger, items, revealFns[key]);
    });
  });
}

/* ============================================================
   PRELOADER — counter, progress track, iris opening, dive out
   ============================================================ */
function initPreloader() {
  const el = document.querySelector('[data-preloader]');
  if (!el) { initScripts(); return; }

  let seen = false;
  try { seen = sessionStorage.getItem('tv_seen'); } catch (e) {}
  try { sessionStorage.setItem('tv_seen', '1'); } catch (e) {}

  initLenis();
  initCookies();
  initAllParallax();

  const parts = {
    a: el.querySelectorAll('[data-part="a"]'),
    p: el.querySelectorAll('[data-part="p"]'),
    line: el.querySelectorAll('[data-part="line"]')
  };
  const bg = el.querySelector('.preloader_bg_a');
  const track = el.querySelector('.preloader_progress_track');
  const counter = el.querySelector('[data-preloader-count]');
  const heroImg = document.querySelector('.hero_img');

  const wide = window.innerWidth >= breakPoint;
  const rStart = wide ? '16vw' : '34vw';
  const rMid = wide ? '26vw' : '46vw';
  const heroScale = wide ? 1.18 : 1.32;

  setTimeout(scrollToTop, 100);
  lockScroll();
  if (heroImg) gsap.set(heroImg, { scale: heroScale, transformOrigin: 'center top' });

  /* A tab that loads in the background never gets a rAF tick, so the intro
     timeline would sit at frame 0 with the page scroll-locked behind it.
     Skip straight to the site in that case. */
  function finish() {
    gsap.set(el, { display: 'none' });
    if (heroImg) gsap.set(heroImg, { scale: 1 });
    unlockScroll();
    initScripts();
    ScrollTrigger.refresh(true);
  }

  if (document.visibilityState === 'hidden') { finish(); return; }

  const short = !!seen;
  const count = { v: 0 };
  const tl = gsap.timeline();

  tl.set(el, { '--iris-r': rStart, '--iris-y': '112vh' });

  if (!short) {
    tl.add(() => {
      animateTextA(parts.a, 'reveal');
      animateTextP(parts.p, 'reveal');
      animateLine(parts.line, 'reveal');
    })
      .to({}, { duration: durL });
  } else {
    tl.set(el.querySelector('.preloader_ctn'), { display: 'none' });
  }

  tl.fromTo(bg, { opacity: 0 }, { opacity: 0.32, duration: durL, ease: 'Out' }, short ? 0 : '>')
    .fromTo(track, { yPercent: -100 }, { yPercent: 0, duration: short ? 1.1 : 3.2, ease: 'loaderEase' }, '<')
    .to(count, {
      v: 100, duration: short ? 1.1 : 3.2, ease: 'loaderEase',
      onUpdate: () => { if (counter) counter.textContent = String(Math.round(count.v)).padStart(2, '0'); }
    }, '<')
    /* iris rises and widens — the window opens on the hero */
    .fromTo(el,
      { '--iris-r': rStart, '--iris-y': '112vh' },
      { '--iris-r': rMid, '--iris-y': '48vh', duration: durL * 1.25, ease: 'InOut' })
    /* then blows past the frame and dives off the top */
    .to(el, { '--iris-r': '175vw', '--iris-y': '-40vh', duration: durL * 2, ease: 'diveIn' }, '<90%')
    .add(() => {
      if (heroImg) gsap.fromTo(heroImg, { scale: heroScale }, { scale: 1, duration: durL * 1.4, ease: 'InOut' });
    }, '<')
    .add(() => { initScripts(); }, '<25%')
    .add(() => {
      unlockScroll();
      gsap.set(el, { display: 'none' });
      ScrollTrigger.refresh(true);
    });

  /* Wall-clock backstop: setTimeout keeps running where rAF does not. */
  const watchdog = setTimeout(() => { if (!scriptsDone) { tl.kill(); finish(); } },
    (tl.duration() + 2) * 1000);
  tl.eventCallback('onComplete', () => clearTimeout(watchdog));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && !scriptsDone) {
      clearTimeout(watchdog); tl.kill(); finish();
    }
  });
}

/* ── everything that runs once the page is live ───────────── */
let scriptsDone = false;
function initScripts() {
  if (scriptsDone) return;
  scriptsDone = true;
  initHorizontalScroll();
  initScrollElementsReveal();
  initAllParallax();
  initThemeChange();
  initIndexCounter();
  initMagneticEffect();
  initNavItemHover();
  initLinkHover();
  initMarquee();
  initWideClip();
  initFooterReveal();
  initLogo();
  initScrollBar();
  initActiveNav();
  initTreatments();
  initMenu();
  initForm();
  initYear();
}

/* ============================================================
   SMOOTH SCROLL
   ============================================================ */
function initLenis() {
  if (reduced) return;
  lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true,
    touchMultiplier: 2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    infinite: false
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ============================================================
   PARALLAX — four depths, all transform-only
   ============================================================ */
function initAllParallax() {
  if (reduced) return;
  const small = window.innerWidth < breakPoint;

  gsap.utils.toArray('[data-parallax="img"]').forEach(img => {
    const wrap = img.closest('[data-parallax="w"]');
    if (!wrap || (small && wrap.dataset.mob === 'off')) return;
    gsap.fromTo(img, { yPercent: -15 }, {
      yPercent: 15, ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: 0.5 }
    });
  });

  gsap.utils.toArray('[data-parallax="img-out"]').forEach(img => {
    const wrap = img.closest('[data-parallax="w"]');
    if (!wrap) return;
    gsap.fromTo(img, { yPercent: 0 }, {
      yPercent: 20, ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'bottom bottom', end: 'bottom top', scrub: 0.5 }
    });
  });

  gsap.utils.toArray('[data-parallax="ctn-down"]').forEach(el => {
    if (small) return;
    gsap.fromTo(el, { yPercent: -10 }, {
      yPercent: 10, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 125%', end: 'bottom -25%', scrub: 0.5 }
    });
  });

  gsap.utils.toArray('[data-parallax="ctn-up"]').forEach(el => {
    if (small) return;
    gsap.fromTo(el, { yPercent: 10 }, {
      yPercent: -10, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 125%', end: 'bottom -25%', scrub: 0.5 }
    });
  });
}

/* ============================================================
   HORIZONTAL RITUAL TRACK — pinned, scrubbed
   ============================================================ */
function initHorizontalScroll() {
  gsap.matchMedia().add(`(min-width: ${breakPoint}px)`, () => {
    document.querySelectorAll('[data-scroll-horizontal]').forEach(section => {
      const track = section.querySelector('[data-horizontal-track]');
      if (!track) return;
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);

      /* On a wide screen the whole track can already be visible. Pinning
         then steals a scroll stop and produces a zero-length trigger. */
      if (distance() <= 0) { section._horizontalTween = null; return; }

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: () => '+=' + distance(),
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });
      section._horizontalTween = tween;
    });
  });
}

/* ============================================================
   THEME INVERSION — header/scrollbar flip over light/dark bands
   ============================================================ */
function initThemeChange() {
  const chrome = document.querySelectorAll('[data-theme]');
  const sections = [...document.querySelectorAll('[data-bg]')];
  if (!chrome.length || !sections.length) return;

  /* Resolved per frame rather than by a web of enter/leave triggers: each
     fixed element asks which band its own midpoint is currently sitting in.
     Trigger pairs went stale whenever the pin-spacer changed the document
     height, and overlapping ranges made the winner depend on event order
     rather than on what is actually behind the header. */
  function apply() {
    const bands = sections.map(s => ({ bg: s.dataset.bg, r: s.getBoundingClientRect() }));
    chrome.forEach(node => {
      const b = node.getBoundingClientRect();
      if (!b.width && !b.height) return;               // hidden at this breakpoint
      const py = b.top + b.height / 2;
      const px = b.left + b.width / 2;
      let bg = null;
      for (const band of bands) {
        const r = band.r;
        if (r.top <= py && r.bottom > py && r.left <= px && r.right >= px) bg = band.bg;
      }
      if (!bg) return;
      const light = bg === 'light';
      node.classList.toggle('theme_on-light', light);
      node.classList.toggle('theme_on-dark', !light);
    });
  }

  apply();
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: apply, onRefresh: apply });
  window.addEventListener('resize', apply);
}

/* ============================================================
   INDEX COUNTER — 1.0 / 2.0 / 3.0 written from the DOM order
   ============================================================ */
function initIndexCounter() {
  document.querySelectorAll('[data-index]').forEach(scope => {
    scope.querySelectorAll('[data-index="text"]').forEach((el, i) => {
      el.textContent = `${i + 1}.0`;
    });
  });
}

/* ============================================================
   MAGNETIC BUTTONS — cursor pull, elastic release
   ============================================================ */
function initMagneticEffect() {
  gsap.matchMedia().add(`(min-width: ${breakPoint}px)`, () => {
    if (reduced) return;
    const btns = document.querySelectorAll('[data-magnetic-btn]');
    const inners = el => el.querySelectorAll('[data-magnetic-inner]');

    const reset = (el, instant) => {
      gsap.killTweensOf(el);
      (instant ? gsap.set : gsap.to)(el, {
        x: 0, y: 0, force3D: true, clearProps: 'all',
        ...(!instant && { ease: 'elastic.out(1, 0.3)', duration: 1.6 })
      });
    };

    const enter = e => { reset(e.currentTarget, true); inners(e.currentTarget).forEach(i => reset(i, true)); };
    const leave = e => { reset(e.currentTarget, false); inners(e.currentTarget).forEach(i => reset(i, false)); };
    const move = e => {
      const el = e.currentTarget;
      const box = el.getBoundingClientRect();
      const strength = parseFloat(el.dataset.magneticStrength) || 25;
      const strengthInner = parseFloat(el.dataset.magneticStrengthInner) || strength;
      const rx = (e.clientX - box.left) / el.offsetWidth - 0.5;
      const ry = (e.clientY - box.top) / el.offsetHeight - 0.5;

      gsap.to(el, { x: rx * (strength / 16) + 'em', y: ry * (strength / 16) + 'em', force3D: true, ease: 'power4.out', duration: 1.6 });
      inners(el).forEach(inner => {
        gsap.to(inner, { x: rx * (strengthInner / 16) + 'em', y: ry * (strengthInner / 16) + 'em', force3D: true, ease: 'power4.out', duration: 2 });
      });
    };

    btns.forEach(btn => {
      btn.addEventListener('mouseenter', enter);
      btn.addEventListener('mousemove', move);
      btn.addEventListener('mouseleave', leave);
    });
  });
}

/* ============================================================
   NAV HOVER — two stacked labels, characters roll over each other
   ============================================================ */
function initNavItemHover() {
  const positional = amount => (i, target, all) => {
    const lefts = all.map(el => el.getBoundingClientRect().left);
    const min = Math.min(...lefts);
    const span = Math.max(...lefts) - min || 1;
    return ((lefts[i] - min) / span) * amount;
  };

  document.querySelectorAll('[hover-nav-item]').forEach(item => {
    const labels = item.querySelectorAll('[hover="text"]');
    if (labels.length < 2) return;

    const opts = { type: 'words,chars', tag: 'span', smartWrap: true, wordsClass: 'split-word', charsClass: 'split-char', mask: 'words' };
    const top = new SplitText(labels[0], opts);
    const bottom = new SplitText(labels[1], opts);
    gsap.set(bottom.chars, { yPercent: 100, opacity: 0 });

    const enter = () => {
      gsap.fromTo(top.chars, { opacity: 1, yPercent: 0 },
        { opacity: 0, yPercent: -100, duration: durM, ease: 'Ease', stagger: positional(stagger * 2), overwrite: true, force3D: true });
      gsap.fromTo(bottom.chars, { yPercent: 100, opacity: 0 },
        { opacity: 1, yPercent: 0, duration: durM, ease: 'Ease', stagger: positional(stagger * 2), overwrite: true, force3D: true });
    };
    const leave = () => {
      gsap.to(top.chars, { opacity: 1, yPercent: 0, duration: durM, ease: 'Ease', stagger: positional(stagger * 2), overwrite: true, force3D: true });
      gsap.to(bottom.chars, { opacity: 0, yPercent: 100, duration: durM, ease: 'Ease', stagger: positional(stagger * 2), overwrite: true, force3D: true });
    };

    item.addEventListener('mouseenter', enter);
    item.addEventListener('mouseleave', leave);
    item.addEventListener('focus', enter);
    item.addEventListener('blur', leave);
  });
}

/* ============================================================
   LINK HOVER — characters flip out on Y, underline retracts
   ============================================================ */
function initLinkHover() {
  document.querySelectorAll('[hover-link]').forEach(link => {
    const labels = link.querySelectorAll('[hover="text"]');
    if (labels.length < 2) return;

    const top = new SplitText(labels[0], { type: 'lines,words,chars', tag: 'span', linesClass: 'split-line', wordsClass: 'split-word', charsClass: 'split-char', smartWrap: true });
    const bottom = new SplitText(labels[1], { type: 'words,chars', tag: 'span', wordsClass: 'split-word', charsClass: 'split-char', smartWrap: true });

    const rules = top.lines.map(line => {
      const span = document.createElement('span');
      span.classList.add('link_line');
      line.appendChild(span);
      return span;
    });

    gsap.set(rules, { scaleX: 1, transformOrigin: 'right center' });
    gsap.set(bottom.chars, { opacity: 0, x: '-0.4em', yPercent: 25, rotateY: 90 });

    const enter = () => {
      gsap.fromTo(top.chars, { opacity: 1, x: '0em', yPercent: 0, rotateY: 0 },
        { opacity: 0, x: '0.4em', yPercent: -25, rotateY: -90, duration: durM, ease: 'Out', stagger: stagger / 4, overwrite: true, force3D: true });
      gsap.fromTo(bottom.chars, { opacity: 0, x: '-0.4em', yPercent: 25, rotateY: 90 },
        { opacity: 1, x: '0em', yPercent: 0, rotateY: 0, duration: durM, ease: 'Out', delay: 0.2, stagger: stagger / 4, overwrite: true, force3D: true });
      gsap.fromTo(rules, { scaleX: 1, transformOrigin: 'right center' },
        { scaleX: 0, duration: durM, ease: 'Out', stagger, overwrite: true });
    };
    const leave = () => {
      gsap.to(top.chars, { opacity: 1, x: '0em', yPercent: 0, rotateY: 0, duration: durM, ease: 'Out', delay: 0.2, stagger: stagger / 4, overwrite: true, force3D: true });
      gsap.to(bottom.chars, { opacity: 0, x: '-0.4em', yPercent: 25, rotateY: 90, duration: durM, ease: 'Out', stagger: stagger / 4, overwrite: true, force3D: true });
      gsap.to(rules, { scaleX: 1, transformOrigin: 'left center', duration: durM, ease: 'Out', stagger, overwrite: true });
    };

    link.addEventListener('mouseenter', enter);
    link.addEventListener('mouseleave', leave);
    link.addEventListener('focus', enter);
    link.addEventListener('blur', leave);
  });
}

/* ============================================================
   MARQUEE — seamless loop, speed and direction follow the scroll
   ============================================================ */
function initMarquee() {
  document.querySelectorAll('[data-marquee]').forEach(track => {
    const set = track.querySelector('.marquee_set');
    if (!set) return;
    const width = () => set.offsetWidth;

    const loop = gsap.to(track, {
      x: () => -width(),
      duration: 26,
      ease: 'none',
      repeat: -1,
      modifiers: { x: gsap.utils.unitize(x => parseFloat(x) % width()) }
    });
    if (reduced) { loop.pause(); return; }

    let idle;
    lenis && lenis.on('scroll', ({ velocity }) => {
      const boost = gsap.utils.clamp(0.6, 5, 1 + Math.abs(velocity) * 0.12);
      loop.timeScale(velocity < 0 ? -boost : boost);
      clearTimeout(idle);
      idle = setTimeout(() => gsap.to(loop, { timeScale: 1, duration: durL, ease: 'Out' }), 120);
    });
  });
}

/* ============================================================
   WIDE PANEL — clip-path widens on scrub
   ============================================================ */
function initWideClip() {
  const panel = document.querySelector('[data-wide-clip]');
  if (!panel) return;
  const closed = window.innerWidth >= breakPoint ? 'inset(0% 22% 0% 22%)' : 'inset(0% 8% 0% 8%)';
  gsap.fromTo(panel, { clipPath: closed }, {
    clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
    scrollTrigger: { trigger: panel, start: 'top bottom', end: 'center center', scrub: 0.6 }
  });
}

/* ============================================================
   FOOTER — image squeezes inward while the content settles in
   ============================================================ */
function initFooterReveal() {
  const footer = document.querySelector('.footer-w');
  if (!footer) return;
  const clip = footer.querySelector('[data-footer-clip]');
  const sheet = footer.querySelector('.footer-s');
  const target = window.innerWidth >= breakPoint ? 'inset(8% 22% 8% 22%)' : 'inset(4% 10% 4% 10%)';

  gsap.timeline({
    scrollTrigger: { trigger: footer, start: 'top 65%', end: 'bottom bottom', scrub: 0.5 }
  })
    .fromTo(clip, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: target, ease: 'none' }, 0)
    .fromTo(sheet, { opacity: 0, scale: 0.75 }, { opacity: 1, scale: 1, ease: 'none' }, 0);

  const cue = document.querySelector('.s-down');
  if (cue) {
    gsap.to(cue, {
      opacity: 0, ease: 'InOut',
      scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'top center', scrub: true }
    });
  }
}

/* ============================================================
   LOGO — rotates continuously, scroll velocity drives speed
   ============================================================ */
function initLogo() {
  const mark = document.querySelector('.header_mark_bg');
  if (!mark || reduced) return;

  const state = { speed: 26 };
  let angle = 0, direction = 1, awake = false, idle;

  window.addEventListener('wheel', () => { awake = true; }, { once: true });
  window.addEventListener('touchmove', () => { awake = true; }, { once: true });

  gsap.ticker.add((time, delta) => {
    angle += state.speed * (Math.min(delta, 100) / 1000);
    gsap.set(mark, { rotation: angle, transformOrigin: 'center center' });
  });

  lenis && lenis.on('scroll', ({ velocity }) => {
    if (!awake) return;
    if (velocity !== 0) direction = velocity > 0 ? 1 : -1;
    gsap.to(state, { speed: direction * (26 + 12 * Math.abs(velocity)), duration: 0.3, ease: 'Out', overwrite: true });
    clearTimeout(idle);
    idle = setTimeout(() => gsap.to(state, { speed: 26 * direction, duration: durL, ease: 'Out' }), 100);
  });
}

/* ============================================================
   SCROLL BAR — percentage readout, draggable thumb
   ============================================================ */
function initScrollBar() {
  gsap.matchMedia().add(`(min-width: ${breakPoint}px)`, () => {
    const bar = document.querySelector('[data-s-bar]');
    if (!bar) return;
    const thumb = bar.querySelector('[data-s-bar-thumb]');
    const label = bar.querySelector('[data-s-bar-label]');

    ScrollTrigger.create({
      start: 'top top', end: 'bottom bottom',
      onUpdate: self => {
        bar.style.setProperty('--progress', self.progress * 100 + '%');
        if (label) label.textContent = String(Math.round(self.progress * 100)).padStart(2, '0');
      }
    });

    let dragging = false;
    thumb.addEventListener('pointerenter', () => { document.body.style.cursor = 'grab'; });
    thumb.addEventListener('pointerleave', () => { if (!dragging) document.body.style.cursor = ''; });
    thumb.addEventListener('pointerdown', e => {
      dragging = true; thumb.setPointerCapture(e.pointerId);
      document.body.style.cursor = 'grabbing';
    });
    thumb.addEventListener('pointermove', e => {
      if (!dragging) return;
      const rail = bar.querySelector('.s-bar_rail').getBoundingClientRect();
      const ratio = gsap.utils.clamp(0, 1, (e.clientY - rail.top) / rail.height);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      lenis ? lenis.scrollTo(ratio * max, { duration: 1.6 }) : window.scrollTo(0, ratio * max);
    });
    thumb.addEventListener('pointerup', () => { dragging = false; document.body.style.cursor = 'grab'; });
  });
}

/* ============================================================
   ACTIVE NAV — marks the section you are standing in
   ============================================================ */
function initActiveNav() {
  const links = [...document.querySelectorAll('[data-nav-link]')];
  if (!links.length) return;
  links.forEach(link => {
    const id = link.getAttribute('href');
    const section = document.querySelector(id);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section, start: 'top 45%', end: 'bottom 45%',
      onToggle: self => {
        if (self.isActive) {
          links.forEach(l => l.classList.remove('is-current'));
          link.classList.add('is-current');
        } else {
          link.classList.remove('is-current');
        }
      }
    });
  });
}

/* ============================================================
   TREATMENTS — preview image trails the cursor between rows
   ============================================================ */
function initTreatments() {
  const preview = document.querySelector('[data-treat-hover]');
  const img = document.querySelector('[data-treat-hover-img]');
  const rows = document.querySelectorAll('[data-treat-row]');
  if (!rows.length) return;

  /* gsap.matchMedia re-evaluates when the query flips, so the preview also
     works if the window starts narrow (or reports a transient width during
     load) and widens afterwards. A one-shot innerWidth read at init misses
     that and the preview stays dead for the whole session. */
  gsap.matchMedia().add(`(min-width: ${breakPoint}px) and (hover: hover) and (pointer: fine)`, () => {
    if (!preview || !img || reduced) return;
    /* GSAP owns the whole transform — the centring lives here rather than in
       CSS so the x/y tweens compose with it instead of replacing it. */
    gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.88, opacity: 0 });

    const x = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3.out' });
    const y = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3.out' });
    let primed = false;

    const place = (e, jump) => {
      if (jump) { gsap.set(preview, { x: e.clientX, y: e.clientY }); primed = true; }
      else { x(e.clientX); y(e.clientY); }
    };

    rows.forEach(row => {
      row.addEventListener('mouseenter', e => {
        img.src = row.dataset.img;
        img.alt = '';
        /* Drop it straight onto the cursor the first time, otherwise it flies
           in from wherever it was last parked. */
        place(e, !primed);
        /* overwrite:'auto' only clears conflicting properties — plain `true`
           would kill the x/y tweens and strand the panel at the origin. */
        gsap.to(preview, { opacity: 1, scale: 1, duration: durM, ease: 'Out', overwrite: 'auto' });
      });
      row.addEventListener('mouseleave', () => {
        gsap.to(preview, { opacity: 0, scale: 0.88, duration: durS, ease: 'In', overwrite: 'auto' });
      });
      row.addEventListener('mousemove', e => place(e, false));
    });

    /* Leaving the list entirely still has to put it away. */
    const list = document.querySelector('[data-treat-list]');
    list && list.addEventListener('mouseleave', () => {
      gsap.to(preview, { opacity: 0, scale: 0.88, duration: durS, ease: 'In', overwrite: 'auto' });
    });
  });

  /* clicking a treatment prefills the booking form */
  document.querySelectorAll('[data-treat-book]').forEach(btn => {
    btn.addEventListener('click', () => {
      const message = document.querySelector('#f-medd');
      const errand = document.querySelector('#f-arende');
      const label = document.querySelector('.input_label[for="f-medd"]');
      if (errand) errand.value = 'Behandling';
      if (message) {
        message.value = `Jag vill boka ${btn.dataset.treat.toLowerCase()}.`;
        label && label.classList.add('focused');
      }
      const target = document.querySelector('#boka');
      lenis ? lenis.scrollTo(target, { duration: 1.6 }) : target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ============================================================
   MOBILE MENU
   ============================================================ */
function initMenu() {
  const menu = document.querySelector('[data-menu]');
  const open = document.querySelector('[data-menu-open]');
  const close = document.querySelector('[data-menu-close]');
  if (!menu || !open) return;

  const links = menu.querySelectorAll('[data-menu-link]');

  function show() {
    menu.hidden = false;
    lockScroll();
    gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: durM, ease: 'InOut' });
    gsap.fromTo(links, { opacity: 0, y: '2rem' }, { opacity: 1, y: 0, duration: durL, stagger: stagger * 0.6, delay: 0.15, ease: 'Out' });
    close && close.focus();
  }
  function hide() {
    gsap.to(menu, {
      clipPath: 'inset(0% 0% 100% 0%)', duration: durM, ease: 'InOut',
      onComplete: () => { menu.hidden = true; unlockScroll(); open.focus(); }
    });
  }

  open.addEventListener('click', show);
  close && close.addEventListener('click', hide);
  links.forEach(link => link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    hide();
    if (target) setTimeout(() => {
      lenis ? lenis.scrollTo(target, { duration: 1.6 }) : target.scrollIntoView();
    }, 500);
  }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) hide(); });
}

/* ============================================================
   FORM — floating labels, inline validation, no alerts
   ============================================================ */
function initForm() {
  document.querySelectorAll('.input_field').forEach(field => {
    const label = field.parentElement.querySelector('.input_label:not(.input_label--static)');
    if (!label) return;
    if (field.value.trim()) label.classList.add('focused');
    field.addEventListener('focusin', () => label.classList.add('focused'));
    field.addEventListener('focusout', () => { if (!field.value.trim()) label.classList.remove('focused'); });
  });

  const tel = document.querySelector('#f-tel');
  tel && tel.addEventListener('input', () => { tel.value = tel.value.replace(/[^\d+\-\s()]/g, ''); });

  const form = document.querySelector('[data-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');

  const rules = {
    'f-namn': v => v.trim().length >= 2 || 'Skriv ditt namn.',
    'f-epost': v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Kontrollera e-postadressen.',
    'f-tel': v => !v.trim() || v.replace(/\D/g, '').length >= 7 || 'Telefonnumret ser för kort ut.'
  };

  function validateField(input) {
    const rule = rules[input.id];
    if (!rule) return true;
    const result = rule(input.value);
    const wrap = input.closest('.field');
    const err = wrap.querySelector('.field_err');
    if (result === true) {
      wrap.classList.remove('is-invalid');
      err.textContent = '';
      return true;
    }
    wrap.classList.add('is-invalid');
    err.textContent = result;
    return false;
  }

  form.querySelectorAll('.input_field').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('is-invalid')) validateField(input);
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    let first = null;

    form.querySelectorAll('.input_field').forEach(input => {
      if (!validateField(input)) { ok = false; first = first || input; }
    });

    const consent = form.querySelector('input[name="gdpr"]');
    const consentWrap = consent.closest('.check');
    const consentErr = consentWrap.querySelector('.field_err');
    if (!consent.checked) {
      ok = false;
      consentWrap.classList.add('is-invalid');
      consentErr.textContent = 'Kryssa i rutan så vi får svara dig.';
      first = first || consent;
    } else {
      consentWrap.classList.remove('is-invalid');
      consentErr.textContent = '';
    }

    if (!ok) {
      status.textContent = 'Några fält behöver ses över.';
      status.classList.add('is-error');
      first && first.focus();
      return;
    }

    status.classList.remove('is-error');
    const btn = form.querySelector('[type="submit"]');
    btn.querySelectorAll('[hover="text"]').forEach(t => { t.textContent = 'Skickar'; });
    status.textContent = '';

    /* stand-in for the real endpoint */
    setTimeout(() => {
      form.reset();
      form.querySelectorAll('.input_label').forEach(l => {
        if (!l.classList.contains('input_label--static')) l.classList.remove('focused');
      });
      btn.querySelectorAll('[hover="text"]').forEach(t => { t.textContent = 'Skickat'; });
      status.textContent = 'Tack. Vi svarar samma dag, senast nästa vardag.';
    }, 900);
  });
}

/* ============================================================
   COOKIES
   ============================================================ */
function initCookies() {
  const bar = document.querySelector('[data-cookies]');
  if (!bar) return;

  let choice = null;
  try { choice = localStorage.getItem('tv_cookies'); } catch (e) {}
  if (choice) { bar.remove(); return; }

  gsap.fromTo(bar, { yPercent: 120 }, { yPercent: 0, duration: durM, delay: 4.2, ease: 'Out' });

  function decide(value) {
    try { localStorage.setItem('tv_cookies', value); } catch (e) {}
    gsap.to(bar, { yPercent: 120, duration: durM, ease: 'In', onComplete: () => bar.remove() });
  }
  bar.querySelector('[data-cookies="accept"]').addEventListener('click', () => decide('accepted'));
  bar.querySelector('[data-cookies="decline"]').addEventListener('click', () => decide('declined'));
}

/* ============================================================
   MISC
   ============================================================ */
function initYear() {
  const now = new Date().getFullYear();
  document.querySelectorAll('.year').forEach(el => { el.textContent = now; });
}

/* ── boot ─────────────────────────────────────────────────── */
document.documentElement.style.setProperty('--_100svh', `${window.innerHeight}px`);
history.scrollRestoration = 'manual';

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => ScrollTrigger.refresh(true), 120);
});

function boot() {
  if (reduced) {
    const pre = document.querySelector('[data-preloader]');
    pre && pre.remove();
    initCookies();
    initScripts();
  } else {
    initPreloader();
  }
}

/* Splitting text before the webfont lands measures every glyph at zero width
   and lays paragraphs out one word per line, so hold the boot until the font
   is ready — with a ceiling so a slow font never blocks the page. */
const fontsReady = document.fonts
  ? document.fonts.ready
  : Promise.resolve();
Promise.race([
  fontsReady,
  new Promise(resolve => setTimeout(resolve, 3000))
]).then(boot);
