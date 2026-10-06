import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, allowedRange, check, applyThrow, result, undo, sectorOf, toCm, RuleError,
} from '../../src/rules.js';
import { EXAMPLES } from '../../src/examples.js';

const range = (min, minInclusive, max) => ({ min, minInclusive, max });

function play(variant, steps) {
  return steps.reduce((s, step) => applyThrow(s, step.d, step.stuck), createGame(variant));
}

describe('acceptance examples', () => {
  const cases = [
    {
      name: 'SPIN',
      variant: 'spin',
      throws: [
        [7.5, true, range(700, true, 1000), 3],
        [8.5, true, range(750, false, 1300), 3],
        [12.6, false, range(850, false, 1300), 2],
        [11.6, true, range(850, false, 1300), 3],
        [13.6, false, range(1160, false, 1600), 2],
        [12.5, false, range(1160, false, 1600), 1],
        [12.2, false, range(1160, false, 1600), 0],
      ],
      result: 1160,
    },
    {
      name: 'NO-SPIN',
      variant: 'nospin',
      throws: [
        [5.2, true, range(400, true, 700), 3],
        [6.0, true, range(520, false, 1000), 3],
        [6.5, false, range(600, false, 1000), 2],
        [6.4, true, range(600, false, 1000), 3],
        [7.8, true, range(640, false, 1000), 3],
        [8.2, false, range(780, false, 1300), 2],
        [8.1, false, range(780, false, 1300), 1],
        [7.9, false, range(780, false, 1300), 0],
      ],
      result: 780,
    },
  ];
  // The axe uses the same sectors as spin, so the SPIN run gives the same result.
  cases.push({ ...cases[0], name: 'AXE', variant: 'axe' });

  for (const c of cases) {
    test(`${c.name}: allowed ranges, reserve and result`, () => {
      let s = createGame(c.variant);
      assert.equal(s.reserve, 3);
      assert.equal(result(s), null);
      for (const [m, stuck, expectedRange, reserve] of c.throws) {
        assert.equal(s.over, false);
        assert.deepEqual({ ...allowedRange(s) }, expectedRange, `range before ${m} m`);
        assert.equal(check(s, toCm(m)).ok, true, `${m} m allowed`);
        s = applyThrow(s, toCm(m), stuck);
        assert.equal(s.reserve, reserve, `reserve after ${m} m`);
      }
      assert.equal(s.over, true);
      assert.equal(result(s), c.result);
      assert.equal(s.throws.length, c.throws.length);
      assert.deepEqual(
        s.throws.map((t) => t.note),
        c.throws.map(([, stuck, , reserve]) => (stuck ? 'reset' : reserve === 0 ? 'end' : 'minus')),
      );
    });
  }

  test('shared EXAMPLES data match the engine', () => {
    for (const [variant, ex] of Object.entries(EXAMPLES)) {
      let s = createGame(variant);
      for (const step of ex.steps) {
        const [min, minInclusive, max] = step.range;
        assert.deepEqual({ ...allowedRange(s) }, { min, minInclusive, max });
        s = applyThrow(s, step.d, step.stuck);
        assert.equal(s.reserve, step.reserve);
      }
      assert.equal(s.over, true);
      assert.equal(result(s), ex.result);
    }
  });
});

describe('invalid throws', () => {
  test('spin first throw 6.90 m is in front of the first sector', () => {
    const v = check(createGame('spin'), 690);
    assert.equal(v.ok, false);
    assert.equal(v.reason, 'beforeFirst');
  });

  test('spin first throw 10.50 m is outside the first sector', () => {
    const v = check(createGame('spin'), 1050);
    assert.equal(v.ok, false);
    assert.equal(v.reason, 'outsideFirst');
  });

  test('after a stick at 7.50 m, 7.50 m is not farther', () => {
    const s = applyThrow(createGame('spin'), 750, true);
    assert.deepEqual(check(s, 750), { ok: false, reason: 'notFarther', range: range(750, false, 1300) });
    assert.equal(check(s, 751).ok, true, '7.51 m is the closest allowed distance');
  });

  test('after a stick at 7.50 m, 13.20 m would skip a sector', () => {
    const s = applyThrow(createGame('spin'), 750, true);
    assert.equal(check(s, 1320).reason, 'skipSector');
    assert.equal(check(s, 1300).ok, true, '13.00 m is the end of the next sector');
    assert.equal(check(s, 1301).reason, 'skipSector');
  });

  test('no throw after the reserve is used up', () => {
    let s = createGame('spin');
    s = applyThrow(s, 800, false);
    s = applyThrow(s, 800, false);
    s = applyThrow(s, 800, false);
    assert.equal(s.over, true);
    assert.equal(s.reserve, 0);
    assert.equal(check(s, 800).reason, 'over');
    assert.throws(() => applyThrow(s, 800, true), (e) => e instanceof RuleError && e.reason === 'over');
    assert.equal(result(s), null, 'no stick = no result');
  });

  test('applyThrow rejects invalid distances and non-boolean outcomes', () => {
    const s = createGame('nospin');
    assert.throws(() => applyThrow(s, 390, true), (e) => e.reason === 'beforeFirst');
    assert.throws(() => applyThrow(s, 520.5, true), (e) => e.reason === 'invalid');
    assert.throws(() => applyThrow(s, 520, 'yes'), TypeError);
  });
});

describe('boundaries', () => {
  test('d = start + 3 m is still in the first sector for the first throw', () => {
    assert.equal(check(createGame('spin'), 1000).ok, true);
    assert.equal(check(createGame('spin'), 700).ok, true);
    assert.equal(check(createGame('nospin'), 700).ok, true);
    assert.equal(check(createGame('nospin'), 400).ok, true);
    assert.equal(check(createGame('axe'), 1001).reason, 'outsideFirst');
  });

  test('sector(7.00) for no-spin is 1', () => {
    assert.equal(sectorOf('nospin', 700), 1);
    assert.equal(sectorOf('nospin', 699), 0);
    assert.equal(sectorOf('spin', 700), 0);
    assert.equal(sectorOf('spin', 1000), 1);
  });

  test('a stick exactly on a sector boundary opens the sector after the next one', () => {
    // No-spin stick at 7.00 m: sector 1 (7–10), so the next one (10–13) ends at 13 m.
    const s = applyThrow(createGame('nospin'), 700, true);
    assert.deepEqual({ ...allowedRange(s) }, range(700, false, 1300));
  });

  test('a miss keeps the allowed range and allows moving closer', () => {
    let s = applyThrow(createGame('spin'), 850, true);
    s = applyThrow(s, 1260, false);
    assert.deepEqual({ ...allowedRange(s) }, range(850, false, 1300));
    assert.equal(check(s, 900).ok, true);
  });

  test('misses before the first stick keep the first sector', () => {
    let s = applyThrow(createGame('nospin'), 650, false);
    assert.deepEqual({ ...allowedRange(s) }, range(400, true, 700));
    assert.equal(s.reserve, 2);
  });

  test('toCm avoids floating point drift', () => {
    assert.equal(toCm(11.6), 1160);
    assert.equal(toCm(8.1), 810);
    assert.equal(toCm(0.29), 29);
  });
});

describe('state handling', () => {
  test('state is immutable', () => {
    const s0 = createGame('spin');
    const s1 = applyThrow(s0, 750, true);
    assert.notEqual(s0, s1);
    assert.equal(s0.throws.length, 0);
    assert.equal(s0.lastStick, null);
    assert.ok(Object.isFrozen(s1));
    assert.ok(Object.isFrozen(s1.throws));
    assert.ok(Object.isFrozen(s1.throws[0]));
    assert.throws(() => { s1.reserve = 1; }, TypeError);
  });

  test('undo goes back exactly one step', () => {
    const steps = EXAMPLES.spin.steps;
    const full = play('spin', steps);
    assert.equal(full.over, true);
    const back = undo(full);
    assert.equal(back.over, false);
    assert.equal(back.reserve, 1);
    assert.equal(back.throws.length, steps.length - 1);
    assert.deepEqual(back, play('spin', steps.slice(0, -1)));
    const first = undo(undo(undo(undo(undo(undo(back))))));
    assert.deepEqual(first, createGame('spin'));
    assert.equal(undo(first), first, 'undo on a fresh game is a no-op');
  });

  test('unknown variant is rejected', () => {
    assert.throws(() => createGame('boomerang'), /Unknown variant/);
  });
});
