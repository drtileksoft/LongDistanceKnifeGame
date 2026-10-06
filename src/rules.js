// Long Distance rules engine (Blade Throwers z. s.).
// Pure module: no DOM, immutable state, all distances in whole centimetres.

export const SECTOR_CM = 300;
export const RESERVE = 3;

export const VARIANTS = Object.freeze({
  nospin: Object.freeze({ id: 'nospin', start: 400, tool: 'knife' }),
  spin: Object.freeze({ id: 'spin', start: 700, tool: 'knife' }),
  axe: Object.freeze({ id: 'axe', start: 700, tool: 'axe' }),
});

/** Converts metres (e.g. 11.6) to whole centimetres (1160). */
export function toCm(metres) {
  return Math.round(metres * 100);
}

function variantOf(v) {
  const id = typeof v === 'string' ? v : v.variant;
  const variant = VARIANTS[id];
  if (!variant) throw new Error(`Unknown variant: ${id}`);
  return variant;
}

/** Sector index of distance d (cm): floor((d − start) / 3 m). First sector = 0. */
export function sectorOf(variantOrState, d) {
  return Math.floor((d - variantOf(variantOrState).start) / SECTOR_CM);
}

export function createGame(variant) {
  const v = variantOf(variant);
  return Object.freeze({
    variant: v.id,
    start: v.start,
    reserve: RESERVE,
    lastStick: null,
    throws: Object.freeze([]),
    over: false,
  });
}

/**
 * Where the next throw may be taken from.
 * Without a stick: start ≤ d ≤ start + 3 m (closed first sector).
 * After a stick at L: L < d ≤ start + 3 m · (sector(L) + 2).
 */
export function allowedRange(state) {
  const { start, lastStick } = state;
  if (lastStick === null) {
    return Object.freeze({ min: start, minInclusive: true, max: start + SECTOR_CM });
  }
  return Object.freeze({
    min: lastStick,
    minInclusive: false,
    max: start + SECTOR_CM * (sectorOf(state, lastStick) + 2),
  });
}

/**
 * Validates a throw from distance d (cm).
 * reason: 'over' | 'invalid' | 'beforeFirst' | 'outsideFirst' | 'notFarther' | 'skipSector' | null
 */
export function check(state, d) {
  const range = allowedRange(state);
  const fail = (reason) => Object.freeze({ ok: false, reason, range });
  if (state.over || state.reserve <= 0) return fail('over');
  if (!Number.isInteger(d) || d < 0) return fail('invalid');
  if (state.lastStick === null) {
    if (d < range.min) return fail('beforeFirst');
    if (d > range.max) return fail('outsideFirst');
  } else {
    if (d <= range.min) return fail('notFarther');
    if (d > range.max) return fail('skipSector');
  }
  return Object.freeze({ ok: true, reason: null, range });
}

export class RuleError extends Error {
  constructor(reason) {
    super(`Throw not allowed: ${reason}`);
    this.name = 'RuleError';
    this.reason = reason;
  }
}

/** Returns the new state after a throw from d (cm) that stuck (true) or not (false). */
export function applyThrow(state, d, stuck) {
  if (typeof stuck !== 'boolean') throw new TypeError('stuck must be a boolean');
  const verdict = check(state, d);
  if (!verdict.ok) throw new RuleError(verdict.reason);
  const reserve = stuck ? RESERVE : state.reserve - 1;
  const over = reserve === 0;
  const record = Object.freeze({
    n: state.throws.length + 1,
    d,
    stuck,
    range: verdict.range,
    reserve,
    note: stuck ? 'reset' : over ? 'end' : 'minus',
  });
  return Object.freeze({
    ...state,
    reserve,
    lastStick: stuck ? d : state.lastStick,
    throws: Object.freeze([...state.throws, record]),
    over,
  });
}

/** Result in cm = the longest measured stick, or null without any stick. */
export function result(state) {
  const sticks = state.throws.filter((t) => t.stuck).map((t) => t.d);
  return sticks.length ? Math.max(...sticks) : null;
}

/** Takes back the last throw (replays the history without it). */
export function undo(state) {
  if (state.throws.length === 0) return state;
  return state.throws
    .slice(0, -1)
    .reduce((s, t) => applyThrow(s, t.d, t.stuck), createGame(state.variant));
}
