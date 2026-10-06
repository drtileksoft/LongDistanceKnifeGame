// Side-view pictogram of the thrower. Joints in metres: x towards the target, y up from the
// ground, origin = toe of the front foot. `tool` = angle of the held tool (SVG degrees,
// 0 = point/head towards the target, negative = up) or null when it is not in the hand;
// `toolAxe` overrides it for the axe, which is carried with its head up.

export const THICKNESS = { leg: 0.115, arm: 0.09, torso: 0.2, head: 0.118 };
export const PIVOT_X = -0.42; // hip; the figure is mirrored around it when walking away
export const RELEASE = [0.28, 1.76];

const LEGS_THROW = {
  back: [[-0.42, 0.95], [-0.7, 0.5], [-0.92, 0.08], [-0.78, 0.04]],
  front: [[-0.42, 0.95], [-0.22, 0.5], [-0.24, 0.08], [-0.05, 0.05]],
};

export const POSES = {
  cocked: {
    ...LEGS_THROW,
    torso: [[-0.42, 0.98], [-0.4, 1.44]],
    head: [-0.36, 1.69],
    arm: [[-0.42, 1.44], [-0.62, 1.64], [-0.5, 1.9]],
    arm2: [[-0.38, 1.42], [-0.14, 1.36], [0.1, 1.42]],
    tool: -100,
  },
  follow: {
    ...LEGS_THROW,
    torso: [[-0.42, 0.98], [-0.36, 1.44]],
    head: [-0.3, 1.69],
    arm: [[-0.38, 1.44], [-0.1, 1.44], [0.18, 1.34]],
    arm2: [[-0.4, 1.42], [-0.6, 1.22], [-0.66, 0.98]],
    tool: null,
  },
  stand: {
    back: [[-0.42, 0.97], [-0.5, 0.52], [-0.58, 0.08], [-0.44, 0.04]],
    front: [[-0.42, 0.97], [-0.32, 0.52], [-0.22, 0.08], [-0.04, 0.05]],
    torso: [[-0.42, 0.98], [-0.42, 1.44]],
    head: [-0.41, 1.69],
    arm: [[-0.42, 1.44], [-0.47, 1.16], [-0.44, 0.9]],
    arm2: [[-0.41, 1.42], [-0.36, 1.15], [-0.32, 0.9]],
    tool: 70,
    toolAxe: -55,
  },
  // Two step phases; the walk blends between them.
  walkA: {
    back: [[-0.42, 0.97], [-0.58, 0.55], [-0.8, 0.18], [-0.68, 0.07]],
    front: [[-0.42, 0.97], [-0.26, 0.55], [-0.2, 0.08], [-0.04, 0.05]],
    torso: [[-0.42, 0.98], [-0.39, 1.44]],
    head: [-0.37, 1.69],
    arm: [[-0.41, 1.44], [-0.55, 1.19], [-0.62, 0.95]],
    arm2: [[-0.4, 1.42], [-0.29, 1.17], [-0.18, 0.96]],
    tool: 80,
    toolAxe: -40,
  },
  walkB: {
    back: [[-0.42, 0.97], [-0.27, 0.55], [-0.22, 0.08], [-0.06, 0.05]],
    front: [[-0.42, 0.97], [-0.57, 0.55], [-0.78, 0.18], [-0.66, 0.07]],
    torso: [[-0.42, 0.98], [-0.39, 1.44]],
    head: [-0.37, 1.69],
    arm: [[-0.41, 1.44], [-0.3, 1.17], [-0.2, 0.96]],
    arm2: [[-0.4, 1.42], [-0.54, 1.19], [-0.6, 0.95]],
    tool: 55,
    toolAxe: -70,
  },
};

const lerp = (a, b, t) => a + (b - a) * t;
const lerpPt = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
const lerpLine = (a, b, t) => a.map((p, i) => lerpPt(p, b[i], t));

/** Interpolates two poses (t = 0 → a, 1 → b). */
export function blendPose(a, b, t) {
  const pick = (key) => {
    const x = a[key] ?? a.tool;
    const y = b[key] ?? b.tool;
    if (x !== null && y !== null) return lerp(x, y, t);
    return t < 0.5 ? x : y;
  };
  return {
    back: lerpLine(a.back, b.back, t),
    front: lerpLine(a.front, b.front, t),
    torso: lerpLine(a.torso, b.torso, t),
    head: lerpPt(a.head, b.head, t),
    arm: lerpLine(a.arm, b.arm, t),
    arm2: lerpLine(a.arm2, b.arm2, t),
    tool: pick('tool'),
    toolAxe: pick('toolAxe'),
  };
}
