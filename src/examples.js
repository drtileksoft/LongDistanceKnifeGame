// Reference examples from the rules (used by the "Play example" demo and by the unit tests).
// Distances in cm; range = allowed range before the throw [min, minInclusive, max].

const SPIN_LIKE = [
  { d: 750, stuck: true, range: [700, true, 1000], reserve: 3 },
  { d: 850, stuck: true, range: [750, false, 1300], reserve: 3 },
  { d: 1260, stuck: false, range: [850, false, 1300], reserve: 2 },
  { d: 1160, stuck: true, range: [850, false, 1300], reserve: 3 },
  { d: 1360, stuck: false, range: [1160, false, 1600], reserve: 2 },
  { d: 1250, stuck: false, range: [1160, false, 1600], reserve: 1 },
  { d: 1220, stuck: false, range: [1160, false, 1600], reserve: 0 },
];

export const EXAMPLES = Object.freeze({
  spin: { steps: SPIN_LIKE, result: 1160 },
  axe: { steps: SPIN_LIKE, result: 1160 },
  nospin: {
    steps: [
      { d: 520, stuck: true, range: [400, true, 700], reserve: 3 },
      { d: 600, stuck: true, range: [520, false, 1000], reserve: 3 },
      { d: 650, stuck: false, range: [600, false, 1000], reserve: 2 },
      { d: 640, stuck: true, range: [600, false, 1000], reserve: 3 },
      { d: 780, stuck: true, range: [640, false, 1000], reserve: 3 },
      { d: 820, stuck: false, range: [780, false, 1300], reserve: 2 },
      { d: 810, stuck: false, range: [780, false, 1300], reserve: 1 },
      { d: 790, stuck: false, range: [780, false, 1300], reserve: 0 },
    ],
    result: 780,
  },
});
