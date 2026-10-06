// Game controller: wires the rules engine, the SVG scene and the HTML controls together.
import { createGame, allowedRange, check, applyThrow, result, undo, VARIANTS } from './rules.js';
import { EXAMPLES } from './examples.js';
import { LANGS, STRINGS, detectLang, createT } from './i18n.js';
import { createScene, AXIS_END_CM } from './scene.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } },
};

const params = new URLSearchParams(location.search);
const initialLang = [params.get('lang'), store.get('ldk-lang')].find((l) => LANGS.includes(l))
  ?? detectLang(navigator.languages?.length ? navigator.languages : [navigator.language]);

const app = {
  lang: initialLang,
  t: createT(initialLang),
  variant: null,
  game: null,
  aim: 0,
  busy: false, // a throw animation is running
  demo: null, // { stopped } while the example plays
  event: null, // what the commentary reports: null (next throw) | {type:'stuck'|'miss'|'end', d}
};

const scene = createScene($('#scene'));
const ui = {
  intro: $('#intro'),
  game: $('#game'),
  slider: $('#dist'),
  value: $('#dist-value'),
  reason: $('#reason'),
  stuck: $('#btn-stuck'),
  miss: $('#btn-miss'),
  undo: $('#btn-undo'),
  newGame: $('#btn-new'),
  tool: $('#btn-tool'),
  demo: $('#btn-demo'),
  again: $('#btn-again'),
  summary: $('#summary'),
  controls: $('#controls'),
  lang: $('#lang'),
  log: $('#log tbody'),
  live: $('#live'),
};

// Language menu, each option labelled in its own language.
ui.lang.replaceChildren(...LANGS.map((code) => {
  const o = new Option(STRINGS[code].langName, code);
  o.lang = code;
  return o;
}));

const kindOf = (variant) => VARIANTS[variant].tool;
const defaultAim = (variant) => VARIANTS[variant].start + 150;

// ---------- texts ----------
function applyTexts() {
  const { t } = app;
  document.documentElement.lang = app.lang;
  document.title = t('pageTitle');
  $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  $$('[data-i18n-title]').forEach((node) => { node.title = t(node.dataset.i18nTitle); });
  $('#rules-list').replaceChildren(...t('rulesList').map((s) => {
    const li = document.createElement('li');
    li.textContent = s;
    return li;
  }));
  $('#scene').setAttribute('aria-label', t('sceneLabel'));
  ui.lang.value = app.lang;
  ui.lang.setAttribute('aria-label', t('langLabel'));
  if (app.variant) {
    const kind = kindOf(app.variant);
    ui.stuck.textContent = t(`btnStuck_${kind}`);
    ui.miss.textContent = t(`btnMiss_${kind}`);
    $('#scale-near').textContent = `${t.bound(VARIANTS[app.variant].start)} ${t('unitM')}`;
    $('#scale-far').textContent = `${t.bound(AXIS_END_CM)} ${t('unitM')}`;
  }
  ui.demo.textContent = t(app.demo ? 'btnDemoStop' : 'btnDemo');
}

function reasonText(verdict) {
  const { t } = app;
  const r = verdict.range;
  if (verdict.ok) {
    return app.game.lastStick === null
      ? t('ok_first', { a: t.bound(r.min), b: t.bound(r.max) })
      : t('ok_after', { L: t.cm(r.min), max: t.bound(r.max) });
  }
  return t(`r_${verdict.reason}`, { min: t.bound(r.min), max: t.bound(r.max), L: t.cm(r.min) });
}

function ruleLine() {
  const { t, game } = app;
  const r = allowedRange(game);
  return game.lastStick === null
    ? t('c_ruleFirst', { a: t.bound(r.min), b: t.bound(r.max) })
    : t('c_ruleAfter', { L: t.cm(r.min), max: t.bound(r.max) });
}

function commentary() {
  const { t, game, event } = app;
  const kind = kindOf(app.variant);
  if (event?.type === 'end') {
    const best = result(game);
    return best === null ? [t('c_endNone1'), t('c_endNone2')] : [t('c_end1', { d: t.cm(best) }), t('c_end2')];
  }
  if (event?.type === 'stuck') return [t('c_stuck1', { d: t.cm(event.d) }), t('c_stuck2')];
  if (event?.type === 'miss') {
    if (game.over) return [t(`c_miss1_${kind}`), t('c_missLast')];
    const r = allowedRange(game);
    const closerAllowed = r.minInclusive ? event.d > r.min : event.d - 1 > r.min;
    return [t(`c_miss1_${kind}`), t('c_miss2', { throws: t.plural('throws', game.reserve) }) + (closerAllowed ? t('c_missCloser') : '')];
  }
  return [t('c_throw', { n: game.throws.length + 1, d: t.cm(app.aim) }), ruleLine()];
}

function rangeText(r) {
  const { t } = app;
  return r.minInclusive ? `[${t.bound(r.min)}–${t.bound(r.max)}]` : `(${t.cm(r.min)}–${t.bound(r.max)}]`;
}

// ---------- rendering ----------
function renderAim() {
  const { t, game } = app;
  const verdict = check(game, app.aim);
  const start = VARIANTS[app.variant].start;
  ui.slider.min = String(start);
  ui.slider.max = String(AXIS_END_CM);
  ui.slider.value = String(app.aim);
  ui.slider.setAttribute('aria-valuetext', t.m(app.aim));
  ui.slider.classList.toggle('invalid', !verdict.ok);
  // allowed range on the slider track (the slider runs right→left like the scene)
  const span = AXIS_END_CM - start;
  const r = verdict.range;
  const lo = 1 - (Math.min(r.max, AXIS_END_CM) - start) / span;
  const hi = 1 - (r.min - start) / span;
  ui.slider.style.setProperty('--lo', `${(lo * 100).toFixed(2)}%`);
  ui.slider.style.setProperty('--hi', `${(game.over ? lo * 100 : hi * 100).toFixed(2)}%`);
  ui.value.textContent = t.m(app.aim);
  ui.reason.textContent = game.over ? '' : reasonText(verdict);
  ui.reason.classList.toggle('bad', !verdict.ok);
  const locked = app.busy || !!app.demo;
  ui.stuck.disabled = locked || !verdict.ok;
  ui.miss.disabled = locked || !verdict.ok;
  ui.slider.disabled = locked || game.over;
  $$('.nudge').forEach((b) => { b.disabled = locked || game.over; });
  ui.controls.classList.toggle('busy', app.busy);
  scene.setCommentary(...commentary());
  scene.setAim(game, game.over ? null : app.aim, verdict.ok, t);
}

function renderLog() {
  const { t, game } = app;
  ui.log.replaceChildren(...game.throws.map((row) => {
    const tr = document.createElement('tr');
    tr.className = row.stuck ? 'stuck' : 'miss';
    const cells = [
      String(row.n),
      t.m(row.d),
      rangeText(row.range),
      row.stuck ? '✓' : '✗',
      '●'.repeat(row.reserve) + '○'.repeat(3 - row.reserve),
      t(`note_${row.note}`),
    ];
    cells.forEach((c) => {
      const td = document.createElement('td');
      td.textContent = c;
      tr.appendChild(td);
    });
    return tr;
  }));
}

function render({ blink = false } = {}) {
  const { t, game } = app;
  scene.setReserve(game.reserve, blink);
  scene.setTable(game, { demo: !!app.demo, t });
  renderLog();
  renderAim();
  const locked = app.busy || !!app.demo;
  ui.undo.disabled = locked || game.throws.length === 0;
  // a running throw animation always finishes first; "Stop example" takes effect after it
  ui.newGame.disabled = app.busy;
  ui.tool.disabled = app.busy;
  ui.demo.textContent = t(app.demo ? 'btnDemoStop' : 'btnDemo');
  ui.demo.setAttribute('aria-pressed', String(!!app.demo));
  const showSummary = game.over && app.event?.type === 'end';
  ui.summary.hidden = !showSummary;
  ui.controls.classList.toggle('over', game.over);
  if (showSummary) {
    const best = result(game);
    $('#sum-result').textContent = best === null ? t('sumNone') : t.m(best);
    $('#sum-stats').textContent = `${t.plural('throws', game.throws.length)} · ${t.plural('sticks', game.throws.filter((x) => x.stuck).length)}`;
  }
}

function announce() {
  ui.live.textContent = commentary().join(' – ');
}

// ---------- actions ----------
function setAim(cm) {
  const start = VARIANTS[app.variant].start;
  const next = Math.max(start, Math.min(AXIS_END_CM, Math.round(cm)));
  if (next === app.aim && app.event === null) return;
  app.aim = next;
  if (app.event && app.event.type !== 'end') {
    app.event = null;
    scene.clearFx({ keepTool: true });
  }
  renderAim();
}

async function doThrow(stuck) {
  if (app.busy || app.game.over) return;
  if (!check(app.game, app.aim).ok) return;
  app.busy = true;
  app.event = null;
  render();
  const d = app.aim;
  const game = app.game;
  await scene.playThrow({ d, stuck, n: game.throws.length + 1, t: app.t });
  if (app.game !== game) return; // reset meanwhile
  app.game = applyThrow(game, d, stuck);
  app.event = { type: stuck ? 'stuck' : 'miss', d };
  app.busy = false;
  render({ blink: true });
  announce();
  if (app.game.over) {
    const finished = app.game;
    await scene.wait(1300);
    if (app.game !== finished) return;
    app.event = { type: 'end' };
    render();
    announce();
    if (!app.demo) ui.again.focus();
  }
}

function newGame({ keepDemo = false } = {}) {
  if (!keepDemo) stopDemo();
  app.game = createGame(app.variant);
  app.aim = defaultAim(app.variant);
  app.event = null;
  app.busy = false;
  scene.clearFx();
  scene.setAim(app.game, app.aim, true, app.t, { instant: true });
  render();
}

function undoThrow() {
  if (app.busy || app.demo || app.game.throws.length === 0) return;
  const last = app.game.throws.at(-1);
  app.game = undo(app.game);
  app.aim = last.d;
  app.event = null;
  scene.clearFx();
  render({ blink: true });
}

function startVariant(variant) {
  stopDemo();
  app.variant = variant;
  ui.intro.hidden = true;
  ui.game.hidden = false;
  applyTexts();
  scene.build(variant, app.t);
  newGame();
  const url = new URL(location.href);
  url.searchParams.set('tool', variant);
  history.replaceState(null, '', url);
}

function showIntro({ focus = true } = {}) {
  stopDemo();
  app.variant = null;
  ui.game.hidden = true;
  ui.intro.hidden = false;
  const url = new URL(location.href);
  url.searchParams.delete('tool');
  history.replaceState(null, '', url);
  if (focus) $('.card[data-variant]')?.focus();
}

function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  app.lang = lang;
  app.t = createT(lang);
  store.set('ldk-lang', lang);
  applyTexts();
  if (app.variant) {
    scene.build(app.variant, app.t);
    scene.setAim(app.game, app.game.over ? null : app.aim, true, app.t, { instant: !app.busy });
    render();
  }
}

// ---------- example (demo) ----------
function stopDemo() {
  if (!app.demo) return;
  app.demo.stopped = true;
  app.demo = null;
  if (app.game) render();
}

async function glideAim(to, token) {
  const from = app.aim;
  const steps = 24;
  for (let i = 1; i <= steps; i++) {
    if (token.stopped) return;
    setAim(from + ((to - from) * i) / steps);
    await scene.wait(28);
  }
  setAim(to);
  await scene.idle();
}

async function runDemo() {
  if (app.demo) { stopDemo(); return; }
  newGame();
  const token = { stopped: false };
  app.demo = token;
  render();
  for (const step of EXAMPLES[app.variant].steps) {
    await scene.wait(500);
    if (token.stopped) return;
    await glideAim(step.d, token);
    await scene.wait(450);
    if (token.stopped) return;
    await doThrow(step.stuck);
    if (token.stopped) return;
  }
  await scene.wait(1500);
  if (app.demo === token) {
    app.demo = null;
    render();
  }
}

// ---------- events ----------
function nudge(delta) {
  if (app.busy || app.demo || app.game.over) return;
  setAim(app.aim + delta);
}

function edgeOfRange(which) {
  const r = allowedRange(app.game);
  if (which === 'near') return r.minInclusive ? r.min : r.min + 1;
  return Math.min(r.max, AXIS_END_CM);
}

ui.slider.addEventListener('input', () => setAim(Number(ui.slider.value)));
ui.slider.addEventListener('keydown', (e) => {
  const big = e.shiftKey ? 10 : 1;
  const map = {
    ArrowUp: big, ArrowLeft: big, ArrowDown: -big, ArrowRight: -big, PageUp: 10, PageDown: -10,
  };
  if (e.key in map) {
    e.preventDefault();
    nudge(map[e.key]);
  } else if (e.key === 'Home' || e.key === 'End') {
    e.preventDefault();
    if (!app.game.over) setAim(edgeOfRange(e.key === 'Home' ? 'near' : 'far'));
  }
});

$$('.nudge').forEach((btn) => {
  const delta = Number(btn.dataset.step);
  let timer = 0;
  let repeated = false;
  const stop = () => { clearTimeout(timer); clearInterval(timer); timer = 0; };
  btn.addEventListener('click', () => {
    if (repeated) { repeated = false; return; }
    nudge(delta);
  });
  btn.addEventListener('pointerdown', () => {
    repeated = false;
    stop();
    timer = setTimeout(() => {
      timer = setInterval(() => { repeated = true; nudge(delta); }, 70);
    }, 450);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
});

ui.stuck.addEventListener('click', () => doThrow(true));
ui.miss.addEventListener('click', () => doThrow(false));
ui.undo.addEventListener('click', undoThrow);
ui.newGame.addEventListener('click', () => newGame());
ui.again.addEventListener('click', () => { newGame(); ui.slider.focus(); });
ui.tool.addEventListener('click', () => showIntro());
ui.demo.addEventListener('click', runDemo);
$$('.card[data-variant]').forEach((c) => c.addEventListener('click', () => startVariant(c.dataset.variant)));
ui.lang.addEventListener('change', () => setLang(ui.lang.value));

document.addEventListener('keydown', (e) => {
  if (!app.variant || e.target.closest?.('input, textarea')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undoThrow();
  }
});

// ---------- start ----------
applyTexts();
const requested = params.get('tool');
if (requested && VARIANTS[requested]) startVariant(requested);
else showIntro({ focus: false });

// Text widths are measured for fitting, so re-render once the web fonts are in.
document.fonts?.ready.then(() => {
  if (app.variant && !app.busy) {
    scene.build(app.variant, app.t);
    scene.setAim(app.game, app.game.over ? null : app.aim, true, app.t, { instant: true });
    render();
  }
});

// expose for debugging in the console
window.ldk = { app, STRINGS };
