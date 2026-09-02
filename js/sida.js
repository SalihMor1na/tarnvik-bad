/* Subpage motion — reveals, link hover and smooth scroll only. */

gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText);

const durS = 0.4, durM = 0.8, durL = 1.2, stagger = 0.1, delayReveal = 0.3, breakPoint = 992;
CustomEase.create('InOut', '0.75,0,0.25,1');
CustomEase.create('Out', '0.25,1,0.5,1');
CustomEase.create('In', '0.5,0,0.75,0');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis = null;

if (!reduced) {
  lenis = new Lenis({
    duration: 1.2, smoothWheel: true, touchMultiplier: 2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), infinite: false
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* Same contract as main.js: autoSplit re-splits once the webfont lands, so a
   split taken during the font block period cannot strand the copy at one
   word per line. */
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

function animateTextH(targets, state, delay) {
  gsap.utils.toArray(targets).forEach((el, i) => {
    if (!el.textContent.trim()) return;
    const split = makeSplit(el,
      { type: 'words,chars', wordsClass: 'split-word', charsClass: 'split-char', smartWrap: true },
      (self, phase) => gsap.set(self.chars, phase === 'revealed'
        ? { opacity: 1, yPercent: 0, rotateY: 0 }
        : { opacity: 0, yPercent: 50, rotateY: 90 }));
    if (state === 'reveal') {
      el._state = 'revealed';
      gsap.fromTo(split.chars, { opacity: 0, yPercent: 50, rotateY: 90 },
        { opacity: 1, yPercent: 0, rotateY: 0, duration: durL, delay: (delay ?? delayReveal) + i * stagger, stagger: stagger * 0.5, ease: 'Out', overwrite: true });
    } else {
      el._state = 'initial';
      gsap.set(split.chars, { opacity: 0, yPercent: 50, rotateY: 90 });
    }
  });
}

function animateTextP(targets, state, delay) {
  gsap.utils.toArray(targets).forEach((el, i) => {
    if (!el.textContent.trim()) return;
    const split = makeSplit(el,
      { type: 'lines,words', linesClass: 'split-line', wordsClass: 'split-word', mask: 'lines' },
      (self, phase) => gsap.set(self.lines, { yPercent: phase === 'revealed' ? 0 : 110 }));
    if (state === 'reveal') {
      el._state = 'revealed';
      gsap.fromTo(split.lines, { yPercent: 110 },
        { yPercent: 0, duration: durL, delay: (delay ?? delayReveal) + i * stagger, stagger, ease: 'Out', overwrite: true });
    } else {
      el._state = 'initial';
      gsap.set(split.lines, { yPercent: 110 });
    }
  });
}

function animateCtn(targets, state, delay) {
  const items = gsap.utils.toArray(targets);
  if (!items.length) return;
  const from = window.innerWidth >= breakPoint ? '3.333rem' : '5.5rem';
  if (state === 'reveal') {
    gsap.fromTo(items, { opacity: 0, y: from },
      { opacity: 1, y: '0rem', duration: durL, delay: delay ?? delayReveal, stagger, ease: 'Out', overwrite: true });
  } else {
    gsap.set(items, { opacity: 0, y: from });
  }
}

function boot() {
  const fns = { h: animateTextH, p: animateTextP, ctn: animateCtn };

  Object.keys(fns).forEach(key => {
    const nodes = document.querySelectorAll(`[data-scroll-reveal="${key}"]`);
    if (!nodes.length) return;
    const groups = new Map();
    nodes.forEach(node => {
      const wrap = node.closest('[data-scroll-reveal="w"]') || node;
      if (!groups.has(wrap)) groups.set(wrap, []);
      groups.get(wrap).push(node);
    });
    groups.forEach((items, trigger) => {
      gsap.set(items, { visibility: 'visible' });
      fns[key](items, 'initial');
      ScrollTrigger.create({ trigger, start: 'top bottom', once: true, onEnter: () => fns[key](items, 'reveal') });
    });
  });

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
      gsap.to(top.chars, { opacity: 0, x: '0.4em', yPercent: -25, rotateY: -90, duration: durM, ease: 'Out', stagger: stagger / 4, overwrite: true, force3D: true });
      gsap.to(bottom.chars, { opacity: 1, x: '0em', yPercent: 0, rotateY: 0, duration: durM, ease: 'Out', delay: 0.2, stagger: stagger / 4, overwrite: true, force3D: true });
      gsap.to(rules, { scaleX: 0, transformOrigin: 'right center', duration: durM, ease: 'Out', stagger, overwrite: true });
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

  document.querySelectorAll('.year').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* Newsletter / subpage forms — same validation contract as the main form. */
  document.querySelectorAll('[data-form]').forEach(form => {
    const status = form.querySelector('[data-form-status]');

    form.querySelectorAll('.input_field').forEach(field => {
      const label = field.parentElement.querySelector('.input_label:not(.input_label--static)');
      if (!label) return;
      field.addEventListener('focusin', () => label.classList.add('focused'));
      field.addEventListener('focusout', () => { if (!field.value.trim()) label.classList.remove('focused'); });
    });

    const check = input => {
      const wrap = input.closest('.field');
      const err = wrap.querySelector('.field_err');
      let message = '';
      if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) {
        message = 'Kontrollera e-postadressen.';
      }
      wrap.classList.toggle('is-invalid', !!message);
      err.textContent = message;
      return !message;
    };

    form.querySelectorAll('.input_field[type="email"]').forEach(input => {
      input.addEventListener('blur', () => check(input));
      input.addEventListener('input', () => {
        if (input.closest('.field').classList.contains('is-invalid')) check(input);
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true, first = null;
      form.querySelectorAll('.input_field[type="email"]').forEach(input => {
        if (!check(input)) { ok = false; first = first || input; }
      });
      const consent = form.querySelector('input[type="checkbox"]');
      if (consent) {
        const wrap = consent.closest('.check');
        const err = wrap.querySelector('.field_err');
        if (!consent.checked) {
          ok = false;
          wrap.classList.add('is-invalid');
          err.textContent = 'Kryssa i rutan för att anmäla dig.';
          first = first || consent;
        } else {
          wrap.classList.remove('is-invalid');
          err.textContent = '';
        }
      }
      if (!ok) {
        status.textContent = 'Några fält behöver ses över.';
        status.classList.add('is-error');
        first && first.focus();
        return;
      }
      status.classList.remove('is-error');
      form.reset();
      form.querySelectorAll('.input_label').forEach(l => l.classList.remove('focused'));
      status.textContent = 'Tack. Du är med på listan.';
    });
  });
}

/* Splitting before the webfont resolves measures every word at zero width. */
Promise.race([
  document.fonts ? document.fonts.ready : Promise.resolve(),
  new Promise(resolve => setTimeout(resolve, 3000))
]).then(boot);
