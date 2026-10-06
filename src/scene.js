// SVG scene (1920×1080): header, side view with figure and target, sector band, progress table.
import { POSES, blendPose, THICKNESS, PIVOT_X, RELEASE } from './figure.js';
import { allowedRange, result, SECTOR_CM } from './rules.js';

const NS = 'http://www.w3.org/2000/svg';
export const GROUND_Y = 520;
export const PX_PER_M = 75;
export const TARGET_X = 1760;
export const AXIS_END_CM = 2200;
const TARGET_CENTER_Y = GROUND_Y - 1.4 * PX_PER_M;
const AXIS_LEFT = TARGET_X - (PX_PER_M * AXIS_END_CM) / 100; // x(22 m) = 110

/** Screen x of a distance in cm from the target. */
export const xOf = (cm) => TARGET_X - (PX_PER_M * cm) / 100;

const C = {
  bg: '#141414', panel: '#1E1E1E', line: '#2A2A2A', ground: '#4A4A4A', white: '#FFFFFF',
  muted: '#B5B5B5', steel: '#D5D5D5', steelDark: '#6E6E6E', red: '#E10600', black: '#0A0A0A',
  wood: '#C9A36A', woodDark: '#8A6A3C',
};
const TEKO = "Teko, 'Arial Narrow', sans-serif";
const RAJ = "Rajdhani, 'Segoe UI', Arial, sans-serif";
const TOOL_LEN = { knife: 56, axe: 70 };
const GRIP = { knife: [-0.27, 0], axe: [-0.4, 0] }; // × length
const IMPACT_JITTER = [0, -10, 8, -16, 12, -4, 16, -12, 4, -8];

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(tag, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, x, y, str, attrs = {}) {
  const e = el('text', { x, y, ...attrs }, parent);
  e.textContent = str;
  return e;
}
/** Shrinks the font size so that the text is at most maxW wide. */
function fit(e, maxW) {
  let w = 0;
  try { w = e.getComputedTextLength(); } catch { return; }
  if (w > maxW) {
    const fs = parseFloat(e.getAttribute('font-size'));
    e.setAttribute('font-size', ((fs * maxW) / w).toFixed(1));
  }
}
const clear = (g) => { while (g.firstChild) g.firstChild.remove(); };
const pts = (list, s = 1) => list.map(([x, y]) => `${(x * s).toFixed(2)},${(y * s).toFixed(2)}`).join(' ');
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const rot = ([x, y], deg) => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

/** Red (or other) slanted label: parallelogram with upper-case letter-spaced text. */
function slantTag(parent, x, y, h, label, { fill = C.red, color = C.white, size = 21, spacing = 3, anchor = 'start' } = {}) {
  const g = el('g', {}, parent);
  const skew = h * 0.3;
  const pad = h * 0.42;
  const t = txt(g, 0, y + h * 0.5 + size * 0.36, label.toUpperCase(), {
    'font-family': RAJ, 'font-weight': 700, 'font-size': size, 'letter-spacing': spacing, fill: color,
  });
  let w = 0;
  try { w = t.getComputedTextLength(); } catch { /* not rendered */ }
  const total = w + 2 * pad + skew;
  const x0 = anchor === 'end' ? x - total : anchor === 'middle' ? x - total / 2 : x;
  t.setAttribute('x', x0 + skew * 0.5 + pad);
  const poly = el('polygon', {
    points: pts([[x0 + skew, y], [x0 + total, y], [x0 + total - skew, y + h], [x0, y + h]]), fill,
  });
  g.insertBefore(poly, t);
  return g;
}

function drawTool(parent, kind) {
  const g = el('g', { class: `tool tool-${kind}` }, parent);
  const l = TOOL_LEN[kind];
  if (kind === 'knife') {
    el('rect', { x: -0.5 * l, y: -0.065 * l, width: 0.47 * l, height: 0.13 * l, rx: 0.03 * l, fill: C.steelDark }, g);
    el('polygon', { points: pts([[-0.06, -0.085], [0.28, -0.07], [0.5, 0], [0.28, 0.07], [-0.06, 0.085]], l), fill: C.steel }, g);
  } else {
    el('rect', { x: -0.5 * l, y: -0.035 * l, width: 0.94 * l, height: 0.07 * l, rx: 0.03 * l, fill: C.wood, stroke: C.woodDark, 'stroke-width': 1 }, g);
    const s = (v) => (v * l).toFixed(1);
    el('path', {
      d: `M${s(0.32)},${s(-0.09)} L${s(0.48)},${s(-0.09)} L${s(0.5)},${s(0.1)} L${s(0.6)},${s(0.32)} ` +
        `Q${s(0.41)},${s(0.46)} ${s(0.22)},${s(0.32)} L${s(0.3)},${s(0.1)} Z`,
      fill: C.steel,
    }, g);
    el('path', { d: `M${s(0.6)},${s(0.32)} Q${s(0.41)},${s(0.46)} ${s(0.22)},${s(0.32)}`, fill: 'none', stroke: C.white, 'stroke-width': 2 }, g);
  }
  return g;
}

/** Places a tool so that its local point `local` (×length) sits at screen point p. */
function placeTool(g, kind, p, angle, local = [0, 0], mirrored = false) {
  const l = TOOL_LEN[kind];
  const a = mirrored ? 180 - angle : angle;
  const lp = [local[0] * l, (mirrored ? -local[1] : local[1]) * l];
  const off = rot(lp, a);
  const cx = p[0] - off[0];
  const cy = p[1] - off[1];
  g.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${a.toFixed(1)})${mirrored ? ' scale(1 -1)' : ''}`);
  return [cx, cy];
}

// Flight: start/end angle and the local contact point (×length) that touches the target.
function flightPlan(variant, stuck, d) {
  const turns = Math.max(1, Math.round(d / 320));
  if (variant === 'nospin') {
    const end = stuck ? 0 : 80;
    return { angle: (t) => -100 + (end + 100) * (1 - (1 - t) ** 2), end, contact: stuck ? [0.5, 0] : [0.1, -0.085] };
  }
  if (variant === 'axe') {
    const end = stuck ? -75 : 105;
    return { angle: (t) => end - 360 * turns * (1 - t), end, contact: stuck ? [0.41, 0.39] : [-0.5, 0] };
  }
  const end = stuck ? 0 : 180;
  return { angle: (t) => end - 360 * turns * (1 - t), end, contact: stuck ? [0.5, 0] : [-0.5, 0] };
}

export function createScene(svg) {
  svg.setAttribute('viewBox', '0 0 1920 1080');
  clear(svg);
  el('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: C.bg }, svg);
  const L = {};
  for (const name of ['header', 'comment', 'tiles', 'band', 'allowed', 'table', 'footer', 'target', 'dim', 'trail', 'figure', 'fly', 'badge']) {
    L[name] = el('g', { class: `layer-${name}` }, svg);
  }

  const fig = { pos: 850, target: 850, facing: 1, walked: 0, pose: POSES.stand, raf: 0, last: 0, held: null, waiters: [] };
  let kind = 'knife';
  let variant = 'spin';
  let figureParts = null;
  let flying = null;
  let reserveBalls = [];

  // ---------- figure ----------
  function buildFigure() {
    clear(L.figure);
    const line = (w) => el('polyline', { fill: 'none', stroke: C.white, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, L.figure);
    const s = PX_PER_M;
    figureParts = {
      back: line(THICKNESS.leg * s),
      arm2: line(THICKNESS.arm * s),
      torso: line(THICKNESS.torso * s),
      front: line(THICKNESS.leg * s),
      head: el('circle', { r: THICKNESS.head * s, fill: C.white }, L.figure),
      arm: line(THICKNESS.arm * s),
    };
    fig.held = drawTool(L.figure, kind);
  }

  function toScreen([px, py], base, facing) {
    const mx = facing > 0 ? px : 2 * PIVOT_X - px;
    return [base + PX_PER_M * mx, GROUND_Y - PX_PER_M * py];
  }

  function drawFigure(pose = fig.pose, facing = fig.facing) {
    fig.pose = pose;
    const base = xOf(fig.pos);
    const map = (list) => pts(list.map((p) => toScreen(p, base, facing)));
    for (const part of ['back', 'arm2', 'torso', 'front', 'arm']) figureParts[part].setAttribute('points', map(pose[part]));
    const [hx, hy] = toScreen(pose.head, base, facing);
    figureParts.head.setAttribute('cx', hx.toFixed(1));
    figureParts.head.setAttribute('cy', hy.toFixed(1));
    const angle = kind === 'axe' ? pose.toolAxe ?? pose.tool : pose.tool;
    if (angle === null) {
      fig.held.setAttribute('visibility', 'hidden');
    } else {
      fig.held.setAttribute('visibility', 'visible');
      const hand = toScreen(pose.arm[2], base, facing);
      placeTool(fig.held, kind, hand, angle, GRIP[kind], facing < 0);
    }
  }

  function walkFrame(now) {
    const dt = Math.min(0.05, (now - (fig.last || now)) / 1000);
    fig.last = now;
    const diff = fig.target - fig.pos;
    if (Math.abs(diff) < 0.5) {
      fig.pos = fig.target;
      fig.raf = 0;
      fig.last = 0;
      fig.facing = 1;
      drawFigure(POSES.stand, 1);
      fig.waiters.splice(0).forEach((r) => r());
      return;
    }
    const speed = Math.max(260, Math.abs(diff) * 3.5); // cm/s
    const step = Math.sign(diff) * Math.min(Math.abs(diff), speed * dt);
    fig.pos += step;
    fig.walked += Math.abs(step);
    fig.facing = step > 0 ? -1 : 1; // walking away from the target = back to the target
    const phase = (1 - Math.cos((Math.PI * fig.walked) / 45)) / 2;
    drawFigure(blendPose(POSES.walkA, POSES.walkB, phase), fig.facing);
    fig.raf = requestAnimationFrame(walkFrame);
  }

  function stopWalking(snap = true) {
    if (fig.raf) cancelAnimationFrame(fig.raf);
    fig.raf = 0;
    fig.last = 0;
    if (snap) fig.pos = fig.target;
    fig.facing = 1;
    fig.waiters.splice(0).forEach((r) => r());
  }

  // ---------- static parts ----------
  function buildStatic(v, t) {
    variant = v;
    kind = v === 'axe' ? 'axe' : 'knife';
    const start = v === 'nospin' ? 400 : 700;
    [L.header, L.tiles, L.band, L.footer, L.target].forEach(clear);

    slantTag(L.header, 70, 55, 38, t(`tool_${v}`), { size: 22, spacing: 4 });
    const title = txt(L.header, 80, 218, t('title').toUpperCase(), {
      'font-family': TEKO, 'font-weight': 600, 'font-size': 118, fill: C.white,
    });
    fit(title, 1060);

    // tiles
    const tile = (x, w, label) => {
      const g = el('g', {}, L.tiles);
      el('path', { d: `M${x},60 h${w} v100 l-16,16 h${-(w - 16)} z`, fill: C.panel, stroke: C.line, 'stroke-width': 2 }, g);
      el('rect', { x, y: 60, width: 6, height: 116, fill: C.red }, g);
      const lab = txt(g, x + w / 2 + 3, 160, label.toUpperCase(), {
        'font-family': RAJ, 'font-weight': 700, 'font-size': 17, 'letter-spacing': 2.5, fill: C.muted, 'text-anchor': 'middle',
      });
      fit(lab, w - 28);
      return g;
    };
    const t1 = tile(1168, 216, t('tileReserve'));
    reserveBalls = [0, 1, 2].map((i) => el('circle', { cx: 1168 + 108 + 3 + (i - 1) * 50, cy: 108, r: 17, class: 'ball' }, t1));
    const big = { 'font-family': TEKO, 'font-weight': 600, 'font-size': 84, fill: C.white, 'text-anchor': 'middle' };
    txt(tile(1398, 216, t('tileSector')), 1398 + 111, 134, '3 m', big);
    txt(tile(1628, 216, t('tilePrecision')), 1628 + 111, 134, '1 cm', big);

    // ground + sectors
    el('line', { x1: 58, y1: GROUND_Y, x2: 1862, y2: GROUND_Y, stroke: C.ground, 'stroke-width': 4 }, L.band);
    for (let b = start, i = 0; b < AXIS_END_CM; b += SECTOR_CM, i++) {
      const x1 = xOf(b + SECTOR_CM);
      el('rect', { x: x1, y: 522, width: (PX_PER_M * SECTOR_CM) / 100, height: 54, fill: i === 0 ? C.red : i % 2 ? '#2B2B2B' : '#333333' }, L.band);
      txt(L.band, x1 + (PX_PER_M * 1.5), 564, `${b / 100}–${(b + SECTOR_CM) / 100} m`, {
        'font-family': TEKO, 'font-weight': 600, 'font-size': 40, fill: C.white, 'text-anchor': 'middle',
      });
    }
    txt(L.band, 34, 562, `◄ ${t('etc')}`, { 'font-family': RAJ, 'font-weight': 600, 'font-size': 22, fill: C.muted });
    for (let b = start; b <= AXIS_END_CM; b += SECTOR_CM) {
      el('line', { x1: xOf(b), y1: 578, x2: xOf(b), y2: 948, stroke: C.ground, 'stroke-width': 1.5, 'stroke-dasharray': '3 6' }, L.band);
    }

    // target on a wooden stand
    el('line', { x1: 1776, y1: 452, x2: 1815, y2: 520, stroke: C.woodDark, 'stroke-width': 6 }, L.target);
    el('rect', { x: 1772, y: 368, width: 8, height: 152, fill: C.wood }, L.target);
    el('rect', { x: TARGET_X, y: TARGET_CENTER_Y - 37.5, width: 12, height: 75, fill: C.white }, L.target);
    txt(L.target, 1858, 322, t('target1'), { 'font-family': RAJ, 'font-weight': 700, 'font-size': 22, 'letter-spacing': 2, fill: C.white, 'text-anchor': 'end' });
    txt(L.target, 1860, 352, t('target2', { a: t.cm(130), b: t.cm(150) }), { 'font-family': RAJ, 'font-weight': 500, 'font-size': 20, fill: C.muted, 'text-anchor': 'end' });

    // legend + rules bar
    el('rect', { x: 430, y: 958, width: 43, height: 24, fill: '#2C2C2C', stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, L.footer);
    fit(txt(L.footer, 490, 978, t('legend'), { 'font-family': RAJ, 'font-weight': 500, 'font-size': 24, fill: C.muted }), 1350);
    el('line', { x1: 70, y1: 993, x2: 1840, y2: 993, stroke: C.line, 'stroke-width': 2 }, L.footer);
    const bar = el('text', { x: 80, y: 1041, 'font-family': RAJ, 'font-weight': 500, 'font-size': 28, fill: C.muted }, L.footer);
    ['barResult', 'barSkip', 'barFoot', `barRot_${v}`].forEach((key, i) => {
      if (i) el('tspan', { fill: C.red, 'font-weight': 700 }, bar).textContent = ' / ';
      el('tspan', {}, bar).textContent = t(key);
    });
    fit(bar, 1760);

    buildFigure();
    drawFigure(POSES.stand, 1);
  }

  // ---------- dynamic parts ----------
  function setCommentary(line1, line2) {
    clear(L.comment);
    [line1, line2].forEach((s, i) => {
      if (!s) return;
      const y = 290 + i * 50;
      el('polygon', { points: pts([[90, y - 20], [98, y - 20], [92, y], [84, y]]), fill: C.red }, L.comment);
      fit(txt(L.comment, 114, y, s, {
        'font-family': RAJ, 'font-weight': i === 0 ? 700 : 600, 'font-size': 30, fill: i === 0 ? C.white : C.muted,
      }), 1190);
    });
  }

  function setReserve(n, blink) {
    reserveBalls.forEach((b, i) => {
      b.setAttribute('class', `ball ${i < n ? 'ball-on' : 'ball-off'}`);
    });
    const g = reserveBalls[0]?.parentNode;
    if (g && blink) {
      g.classList.remove('blink');
      void g.getBBox();
      g.classList.add('blink');
    }
  }

  function setAllowed(game, aim, aimOk, t) {
    clear(L.allowed);
    if (!game.over) {
      const r = allowedRange(game);
      const x1 = Math.max(AXIS_LEFT, xOf(r.max));
      const x2 = xOf(r.min);
      el('rect', { x: x1, y: 525, width: x2 - x1, height: 48, fill: 'rgba(255,255,255,0.08)', stroke: C.white, 'stroke-width': 3, 'stroke-dasharray': '10 6' }, L.allowed);
      const lab = txt(L.allowed, (x1 + x2) / 2, 613, t('allowedTag').toUpperCase(), {
        'font-family': RAJ, 'font-weight': 700, 'font-size': 20, 'letter-spacing': 3, fill: C.white, 'text-anchor': 'middle',
      });
      fit(lab, Math.max(x2 - x1 + 60, 200));
    }
    if (aim !== null) {
      const x = xOf(aim);
      const tick = { stroke: aimOk ? C.white : C.red, 'stroke-width': 4, class: 'aim' };
      el('line', { x1: x, y1: 522, x2: x, y2: 532, ...tick }, L.allowed);
      el('line', { x1: x, y1: 566, x2: x, y2: 576, ...tick }, L.allowed);
      el('polygon', { points: pts([[x - 9, 578], [x + 9, 578], [x, 590]]), fill: aimOk ? C.white : C.red }, L.allowed);
    }
  }

  function setTable(game, { demo, t }) {
    clear(L.table);
    slantTag(L.table, 70, 602, 36, t(demo ? 'exampleHead' : 'logHead'), { size: 21, spacing: 4 });
    txt(L.table, 1838, 626, t('reserveHead').toUpperCase(), {
      'font-family': RAJ, 'font-weight': 700, 'font-size': 18, 'letter-spacing': 3, fill: C.muted, 'text-anchor': 'end',
    });
    const MAX_ROWS = 16;
    const rows = game.throws.slice(-MAX_ROWS);
    const top = 682;
    const span = 932 - top;
    const rowH = rows.length <= 1 ? 46 : Math.min(46, span / (rows.length - 1));
    const s = Math.min(1, rowH / 41);
    rows.forEach((row, i) => {
      const y = top + i * rowH;
      const g = el('g', { class: `row ${row.stuck ? 'row-stuck' : 'row-miss'}`, 'data-n': row.n }, L.table);
      txt(g, 84, y + 8 * s, t('rowThrow', { n: row.n }), { 'font-family': RAJ, 'font-weight': 700, 'font-size': 24 * s, fill: C.white });
      txt(g, 210, y + 12 * s, `${t.cm(row.d)} m`, { 'font-family': TEKO, 'font-weight': 600, 'font-size': 38 * s, fill: row.stuck ? C.white : C.muted });
      const x1 = Math.max(AXIS_LEFT, xOf(row.range.max));
      const x2 = xOf(row.range.min);
      const bh = 30 * s;
      el('rect', { x: x1, y: y - bh / 2, width: x2 - x1, height: bh, fill: '#2C2C2C', stroke: '#8A8A8A', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, g);
      const mx = xOf(row.d);
      const r = 16 * s;
      el('circle', { cx: mx, cy: y, r, fill: row.stuck ? C.white : C.red }, g);
      const k = r / 16;
      el('path', {
        d: row.stuck
          ? `M${mx - 7 * k},${y + 0.5 * k} L${mx - 2 * k},${y + 5.5 * k} L${mx + 7.5 * k},${y - 5.5 * k}`
          : `M${mx - 6 * k},${y - 6 * k} L${mx + 6 * k},${y + 6 * k} M${mx + 6 * k},${y - 6 * k} L${mx - 6 * k},${y + 6 * k}`,
        fill: 'none', stroke: row.stuck ? C.black : C.white, 'stroke-width': 3.6 * k, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }, g);
      txt(g, 1722, y + 8 * s, t(`note_${row.note}`), {
        'font-family': RAJ, 'font-weight': 700, 'font-size': 24 * s, fill: row.note === 'end' ? C.red : C.white, 'text-anchor': 'end',
      });
      for (let b = 0; b < 3; b++) {
        el('circle', {
          cx: 1758 + b * 34, cy: y, r: 10 * s, fill: b < row.reserve ? C.white : 'none',
          stroke: b < row.reserve ? 'none' : C.steelDark, 'stroke-width': 2.5,
        }, g);
      }
    });
    const best = result(game);
    if (best !== null) slantTag(L.table, 70, 953, 37, t('resultTag', { d: t.cm(best) }), { size: 22, spacing: 4 });
    else if (game.over) slantTag(L.table, 70, 953, 37, t('noResultTag'), { size: 22, spacing: 4, fill: C.steelDark });
  }

  // ---------- animation helpers ----------
  function tween(ms, fn) {
    const dur = prefersReducedMotion() ? ms * 0.2 : ms;
    return new Promise((resolve) => {
      if (dur <= 1) { fn(1); resolve(); return; }
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        fn(t);
        if (t < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }
  const wait = (ms) => tween(ms, () => {});

  function clearFx({ keepTool = false } = {}) {
    clear(L.dim);
    clear(L.badge);
    if (!keepTool) {
      clear(L.trail);
      clear(L.fly);
      flying = null;
    }
  }

  function showBadge(label, stuck) {
    clear(L.badge);
    const g = el('g', { class: 'badge' }, L.badge);
    slantTag(g, 1500, 216, 62, label, { fill: stuck ? C.white : C.red, color: stuck ? C.black : C.white, size: 36, spacing: 3, anchor: 'middle' });
    return tween(220, (t) => {
      const sc = 0.6 + 0.4 * ease(t);
      g.setAttribute('transform', `translate(1500 247) scale(${sc.toFixed(3)}) translate(-1500 -247)`);
      g.setAttribute('opacity', Math.min(1, t * 2).toFixed(2));
    });
  }

  async function showDimension(d, t) {
    clear(L.dim);
    const y = 506;
    const xa = xOf(d);
    const xb = TARGET_X;
    const g = el('g', { class: 'dimension' }, L.dim);
    el('line', { x1: xa, y1: y - 14, x2: xa, y2: y + 12, stroke: C.red, 'stroke-width': 3 }, g);
    el('line', { x1: xb, y1: y - 14, x2: xb, y2: y + 12, stroke: C.red, 'stroke-width': 3 }, g);
    const line = el('line', { x1: xa, y1: y, x2: xa, y2: y, stroke: C.red, 'stroke-width': 4 }, g);
    const headL = el('polygon', { points: pts([[xa, y], [xa + 16, y - 8], [xa + 16, y + 8]]), fill: C.red }, g);
    const headR = el('polygon', { points: pts([[xb, y], [xb - 16, y - 8], [xb - 16, y + 8]]), fill: C.red, visibility: 'hidden' }, g);
    await tween(380, (k) => line.setAttribute('x2', (xa + (xb - xa) * ease(k)).toFixed(1)));
    headR.setAttribute('visibility', 'visible');
    void headL;
    const mid = (xa + xb) / 2;
    const label = `${t.cm(d)} m`;
    const lt = txt(g, mid, y - 22, label, { 'font-family': TEKO, 'font-weight': 600, 'font-size': 46, fill: C.red, 'text-anchor': 'middle' });
    let w = 120;
    try { w = lt.getComputedTextLength(); } catch { /* ignore */ }
    g.insertBefore(el('rect', { x: mid - w / 2 - 10, y: y - 58, width: w + 20, height: 44, fill: C.bg, opacity: 0.85 }), lt);
  }

  async function playThrow({ d, stuck, n, t }) {
    stopWalking();
    fig.pos = fig.target = d;
    clearFx();
    drawFigure(POSES.stand, 1);
    await tween(320, (k) => drawFigure(blendPose(POSES.stand, POSES.cocked, ease(k)), 1));
    await tween(130, (k) => drawFigure(blendPose(POSES.cocked, POSES.follow, k), 1));

    const base = xOf(d);
    const p0 = toScreen(RELEASE, base, 1);
    const plan = flightPlan(variant, stuck, d);
    const impact = [TARGET_X, TARGET_CENTER_Y + IMPACT_JITTER[(n - 1) % IMPACT_JITTER.length]];
    const l = TOOL_LEN[kind];
    const off = rot([plan.contact[0] * l, plan.contact[1] * l], plan.end);
    const p2 = [impact[0] - off[0], impact[1] - off[1]];
    const p1 = [(p0[0] + p2[0]) / 2, Math.min(p0[1], p2[1]) - 70];
    const bez = (k) => [
      (1 - k) ** 2 * p0[0] + 2 * (1 - k) * k * p1[0] + k * k * p2[0],
      (1 - k) ** 2 * p0[1] + 2 * (1 - k) * k * p1[1] + k * k * p2[1],
    ];
    flying = drawTool(L.fly, kind);
    const trail = el('polyline', { fill: 'none', stroke: C.muted, 'stroke-width': 3, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round' }, L.trail);
    const trailPts = [];
    const flight = tween(450 + d * 0.35, (k) => {
      const p = bez(k);
      trailPts.push(p);
      trail.setAttribute('points', pts(trailPts));
      placeTool(flying, kind, p, plan.angle(k));
    });
    const recover = wait(250).then(() => tween(380, (k) => drawFigure(blendPose(POSES.follow, POSES.stand, ease(k)), 1)));
    await flight;

    if (stuck) {
      await tween(260, (k) => {
        const a = plan.end + 5 * Math.sin(k * Math.PI * 4) * (1 - k);
        placeTool(flying, kind, impact, a, plan.contact);
      });
      await Promise.all([showBadge(t('badgeStuck'), true), showDimension(d, t), recover]);
    } else {
      // bounce back off the target and fall to the ground in front of it
      let [cx, cy] = p2;
      const vx = -280;
      const vy = -230;
      const g = 1700;
      const restY = GROUND_Y - (kind === 'axe' ? 0.035 * l + 2 : 0.085 * l);
      const T = (-vy + Math.sqrt(vy * vy + 2 * g * (restY - cy))) / g;
      let a = plan.end;
      await tween(T * 1000, (k) => {
        const s = k * T;
        a = plan.end - 520 * s;
        flying.setAttribute('transform', `translate(${(cx + vx * s).toFixed(1)} ${(cy + vy * s + 0.5 * g * s * s).toFixed(1)}) rotate(${a.toFixed(1)})`);
      });
      cx += vx * T;
      cy = restY;
      // lie flat (the axe with its blade up)
      const flat = kind === 'axe' ? Math.round((a - 180) / 360) * 360 + 180 : Math.round(a / 180) * 180;
      await tween(140, (k) => {
        flying.setAttribute('transform', `translate(${(cx - 18 * k).toFixed(1)} ${cy.toFixed(1)}) rotate(${(a + (flat - a) * k).toFixed(1)})`);
      });
      await Promise.all([showBadge(t(`badgeMiss_${kind}`), false), recover]);
    }
    await wait(450);
    drawFigure(POSES.stand, 1);
  }

  return {
    build(v, t) { buildStatic(v, t); },
    setCommentary,
    setReserve,
    setTable,
    setAim(game, aim, aimOk, t, { instant = false } = {}) {
      setAllowed(game, aim, aimOk, t);
      if (aim === null) return;
      fig.target = aim;
      if (instant || prefersReducedMotion()) {
        stopWalking();
        drawFigure(POSES.stand, 1);
      } else if (!fig.raf && fig.pos !== fig.target) {
        fig.raf = requestAnimationFrame(walkFrame);
      }
    },
    /** Resolves when the figure has walked to its target. */
    idle() {
      if (!fig.raf) return Promise.resolve();
      return new Promise((r) => fig.waiters.push(r));
    },
    playThrow,
    clearFx,
    wait,
  };
}
