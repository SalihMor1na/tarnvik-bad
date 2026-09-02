/* ============================================================
   Tärnvik Bad — runtime audit

   Klistra in i webbläsarkonsolen på den KÖRANDE sidan:

     await audit()

   Den granskar DOM:en som JavaScript faktiskt producerat, inte den
   som står i HTML-filen. Alla fel den letar efter uppstår först när
   GSAP och SplitText skrivit om sidan, så en granskning med skripten
   avstängda kan per konstruktion inte se någon av dem.

   Returnerar { pass, checks, failures }. Loggar en tabell.
   ============================================================ */

window.audit = async function audit({ step = 400, settle = 2200, quiet = false } = {}) {
  const failures = [];
  const checks = [];
  const add = (name, ok, detail) => {
    /* Detaljer bara vid fel — annars blir tabellen brus och man slutar läsa. */
    checks.push({ kontroll: name, ok: ok ? 'JA' : 'NEJ', detalj: ok ? '' : (detail ?? '') });
    if (!ok) failures.push({ name, detail });
  };

  /* ── 0  Instrumentet först ────────────────────────────────
     En dold flik får ingen requestAnimationFrame-tick. Layouten
     nollställs, tweens fryser och varje mätning nedan blir skräp —
     men den ser precis ut som en riktig bugg. Vägra hellre svara. */
  const live = document.visibilityState === 'visible'
    && document.documentElement.clientWidth > 0;
  if (!live) {
    console.warn(
      '%cAUDIT AVBRUTEN%c  Fliken är dold eller har ingen layout ' +
      '(visibilityState=' + document.visibilityState +
      ', clientWidth=' + document.documentElement.clientWidth + ').\n' +
      'Rendereraren är inte igång, så alla mätvärden blir falska. ' +
      'Ta fram fliken och kör om.',
      'background:#9C3D2E;color:#fff;padding:2px 6px;border-radius:3px', ''
    );
    return { pass: false, aborted: 'renderer not live', checks: [], failures: [] };
  }

  const hasGsap = typeof window.gsap !== 'undefined';
  const hasST = typeof window.ScrollTrigger !== 'undefined';

  /* ── 1  Låt varje trigger avfyra ─────────────────────────── */
  const H = document.documentElement.scrollHeight;
  const goto = y => (window.lenis
    ? lenis.scrollTo(y, { immediate: true, force: true })
    : window.scrollTo(0, y));
  for (let y = 0; y <= H; y += step) {
    goto(y);
    if (hasST) ScrollTrigger.update();
    await new Promise(r => setTimeout(r, 12));
  }
  goto(0);
  if (hasST) ScrollTrigger.update();
  await new Promise(r => setTimeout(r, settle));

  /* ── 2  Delad text ───────────────────────────────────────── */
  const splitSel = '[data-scroll-reveal="p"],[data-scroll-reveal="h"],[data-scroll-reveal="a"]';
  const targets = [...document.querySelectorAll(splitSel)];

  /* Kollapsad: SplitText gör varje rad till ett blockelement. I en
     shrink-to-fit-låda blir bredden lika med längsta ordet, alltså
     ungefär ett ord per rad. */
  const collapsed = targets.filter(el => {
    if (!el._split || !el._split.lines) return false;
    const lines = el._split.lines.length;
    if (lines < 3) return false;
    const words = el.textContent.trim().split(/\s+/).length;
    return words / lines < 1.6;
  }).map(el => ({
    el, sel: label(el),
    bredd: Math.round(el.getBoundingClientRect().width),
    rader: el._split.lines.length,
    ord: el.textContent.trim().split(/\s+/).length
  }));
  add('Ingen delad text kollapsad till längsta ordet', collapsed.length === 0,
    collapsed.map(c => `${c.sel} ${c.bredd}px ${c.ord} ord / ${c.rader} rader`).join(' · '));

  /* Ett delningsmål får aldrig själv vara flex/grid — raderna blir då
     flexobjekt och lägger sig i sidled. */
  const flexTargets = targets.filter(el => /flex|grid/.test(getComputedStyle(el).display))
    .map(el => `${label(el)}:${getComputedStyle(el).display}`);
  add('Inget delningsmål är flex- eller grid-container', flexTargets.length === 0,
    flexTargets.join(' · '));

  /* ── 3  Reveals ──────────────────────────────────────────── */
  const unrevealed = targets.filter(el => el._state && el._state !== 'revealed').map(label);
  add('Alla reveals har avfyrat', unrevealed.length === 0,
    unrevealed.slice(0, 10).join(' · '));

  const faded = [...document.querySelectorAll('[data-scroll-reveal="ctn"]')]
    .filter(el => parseFloat(getComputedStyle(el).opacity) < 0.9).map(label);
  add('Inga containrar kvar otonade', faded.length === 0, faded.slice(0, 10).join(' · '));

  const hidden = targets.filter(el => getComputedStyle(el).visibility === 'hidden').map(label);
  add('Inget delningsmål kvar med visibility:hidden', hidden.length === 0,
    hidden.slice(0, 10).join(' · '));

  /* ── 4  Layout ───────────────────────────────────────────── */
  const clientW = document.documentElement.clientWidth;
  const overflowing = [...document.querySelectorAll('body *')]
    .filter(el => el.getBoundingClientRect().right > clientW + 2)
    .map(el => `${label(el)}:${Math.round(el.getBoundingClientRect().right)}px`);
  add('Ingen horisontell overflow', document.body.scrollWidth <= clientW,
    [...new Set(overflowing)].slice(0, 6).join(' · '));

  /* ── 5  Bilder ───────────────────────────────────────────── */
  const imgs = [...document.querySelectorAll('img')];
  /* Bilder som fylls först vid interaktion räknas inte som trasiga. */
  const broken = imgs
    .filter(i => i.complete && i.naturalWidth === 0 && !/^data:/.test(i.getAttribute('src') || ''))
    .map(i => (i.getAttribute('src') || '(ingen src)').slice(-45));
  add('Alla bilder laddade', broken.length === 0, broken.join(' · '));
  const noAlt = imgs.filter(i => !i.hasAttribute('alt')).map(i => i.src.slice(-45));
  add('Alla bilder har alt-attribut', noAlt.length === 0, noAlt.join(' · '));

  /* ── 6  Länkar ───────────────────────────────────────────── */
  const dead = [...document.querySelectorAll('a[href="#"], a:not([href])')].map(label);
  add('Inga döda länkar', dead.length === 0, dead.slice(0, 8).join(' · '));

  /* ── 7  Rörelsesystemet lever ────────────────────────────── */
  if (hasGsap) {
    add('GSAP-tickern går', gsap.ticker.frame > 0, 'frame=' + gsap.ticker.frame);
  }
  if (hasST) {
    const stale = ScrollTrigger.getAll().filter(t => t.end < t.start).length;
    add('Inga inverterade ScrollTrigger-intervall', stale === 0, stale + ' st');
  }

  /* ── rapport ─────────────────────────────────────────────── */
  const pass = failures.length === 0;
  if (!quiet) {
    console.table(checks);
    console.log(
      pass
        ? '%c ALLT GRÖNT %c ' + checks.length + ' kontroller, ' + targets.length + ' delningsmål'
        : '%c ' + failures.length + ' FEL %c av ' + checks.length + ' kontroller',
      'background:' + (pass ? '#2A473D' : '#9C3D2E') + ';color:#F5F0E7;padding:2px 6px;border-radius:3px',
      ''
    );
    failures.forEach(f => console.warn('✗ ' + f.name + (f.detail ? '\n   ' + f.detail : '')));
  }
  return { pass, checks, failures, splitTargets: targets.length };

  function label(el) {
    const cls = (el.className || '').toString().split(' ').filter(Boolean)[0];
    return (el.tagName.toLowerCase()) + (cls ? '.' + cls : '');
  }
};

console.log('%c audit() laddad %c kör:  await audit()',
  'background:#A6653C;color:#F5F0E7;padding:2px 6px;border-radius:3px', '');
