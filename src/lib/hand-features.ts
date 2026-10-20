export type Point = { x: number; y: number; z: number };

export const LM = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function dist2(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalizeLandmarks(landmarks: Point[]): Point[] {
  const wrist = landmarks[LM.WRIST];
  const scale = dist(wrist, landmarks[LM.MIDDLE_MCP]) || 1;
  return landmarks.map((p) => ({
    x: (p.x - wrist.x) / scale,
    y: (p.y - wrist.y) / scale,
    z: (p.z - wrist.z) / scale,
  }));
}

function fingerOpen(lm: Point[], tip: number, pip: number, mcp: number) {
  return dist(lm[tip], lm[mcp]) > dist(lm[pip], lm[mcp]) * 1.18;
}

function fingerBent(lm: Point[], tip: number, pip: number, mcp: number) {
  return dist(lm[tip], lm[mcp]) < dist(lm[pip], lm[mcp]) * 1.05;
}

function thumbOpen(lm: Point[]) {
  const span = dist(lm[LM.THUMB_TIP], lm[LM.INDEX_MCP]);
  const extended = dist(lm[LM.THUMB_TIP], lm[LM.THUMB_MCP]) > dist(lm[LM.THUMB_IP], lm[LM.THUMB_MCP]) * 1.12;
  return extended && span > 0.55;
}

export type FingerState = {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
};

export type HandFeatures = {
  fingers: FingerState;
  curled: FingerState;
  tips: {
    thumbIndex: number;
    indexMiddle: number;
    middleRing: number;
    ringPinky: number;
    thumbMiddle: number;
    thumbPinky: number;
    indexRing: number;
  };
  palmFacing: boolean;
  pointingDown: boolean;
  pointingSide: boolean;
  indexHooked: boolean;
  indexMiddleCrossed: boolean;
  fist: boolean;
  openPalm: boolean;
  ily: boolean;
  thumbsUp: boolean;
  thumbsDown: boolean;
};

export function extractFeatures(raw: Point[]): HandFeatures {
  const lm = normalizeLandmarks(raw);

  const fingers: FingerState = {
    thumb: thumbOpen(lm),
    index: fingerOpen(lm, LM.INDEX_TIP, LM.INDEX_PIP, LM.INDEX_MCP),
    middle: fingerOpen(lm, LM.MIDDLE_TIP, LM.MIDDLE_PIP, LM.MIDDLE_MCP),
    ring: fingerOpen(lm, LM.RING_TIP, LM.RING_PIP, LM.RING_MCP),
    pinky: fingerOpen(lm, LM.PINKY_TIP, LM.PINKY_PIP, LM.PINKY_MCP),
  };

  const curled: FingerState = {
    thumb: !fingers.thumb,
    index: fingerBent(lm, LM.INDEX_TIP, LM.INDEX_PIP, LM.INDEX_MCP),
    middle: fingerBent(lm, LM.MIDDLE_TIP, LM.MIDDLE_PIP, LM.MIDDLE_MCP),
    ring: fingerBent(lm, LM.RING_TIP, LM.RING_PIP, LM.RING_MCP),
    pinky: fingerBent(lm, LM.PINKY_TIP, LM.PINKY_PIP, LM.PINKY_MCP),
  };

  const tips = {
    thumbIndex: dist(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]),
    indexMiddle: dist(lm[LM.INDEX_TIP], lm[LM.MIDDLE_TIP]),
    middleRing: dist(lm[LM.MIDDLE_TIP], lm[LM.RING_TIP]),
    ringPinky: dist(lm[LM.RING_TIP], lm[LM.PINKY_TIP]),
    thumbMiddle: dist(lm[LM.THUMB_TIP], lm[LM.MIDDLE_TIP]),
    thumbPinky: dist(lm[LM.THUMB_TIP], lm[LM.PINKY_TIP]),
    indexRing: dist(lm[LM.INDEX_TIP], lm[LM.RING_TIP]),
  };

  const averageZ =
    (lm[LM.INDEX_MCP].z + lm[LM.MIDDLE_MCP].z + lm[LM.RING_MCP].z + lm[LM.PINKY_MCP].z) / 4;
  const palmFacing = averageZ < 0.15;

  const indexDirY = lm[LM.INDEX_TIP].y - lm[LM.INDEX_MCP].y;
  const indexDirX = lm[LM.INDEX_TIP].x - lm[LM.INDEX_MCP].x;
  const pointingDown = indexDirY > 0.45 && Math.abs(indexDirX) < 0.55;
  const pointingSide = Math.abs(indexDirX) > Math.abs(indexDirY) + 0.15;

  const indexHooked =
    dist(lm[LM.INDEX_TIP], lm[LM.INDEX_MCP]) < dist(lm[LM.INDEX_PIP], lm[LM.INDEX_MCP]) * 1.35 &&
    dist(lm[LM.INDEX_TIP], lm[LM.INDEX_PIP]) > 0.22 &&
    curled.middle &&
    curled.ring &&
    curled.pinky;

  const indexMiddleCrossed =
    fingers.index &&
    fingers.middle &&
    tips.indexMiddle < 0.28 &&
    Math.abs(lm[LM.INDEX_TIP].x - lm[LM.MIDDLE_TIP].x) < 0.12;

  const closedCount = [curled.index, curled.middle, curled.ring, curled.pinky].filter(Boolean).length;
  const fist = closedCount >= 3 && !fingers.index && !fingers.middle;
  const openPalm = fingers.index && fingers.middle && fingers.ring && fingers.pinky && tips.indexMiddle > 0.18;
  const ily = fingers.thumb && fingers.index && !fingers.middle && !fingers.ring && fingers.pinky;

  const thumbUp =
    fingers.thumb &&
    curled.index &&
    curled.middle &&
    curled.ring &&
    curled.pinky &&
    lm[LM.THUMB_TIP].y < lm[LM.THUMB_MCP].y - 0.15;

  const thumbDown =
    fingers.thumb &&
    curled.index &&
    curled.middle &&
    curled.ring &&
    curled.pinky &&
    lm[LM.THUMB_TIP].y > lm[LM.THUMB_MCP].y + 0.15;

  return {
    fingers,
    curled,
    tips,
    palmFacing,
    pointingDown,
    pointingSide,
    indexHooked,
    indexMiddleCrossed,
    fist,
    openPalm,
    ily,
    thumbsUp: thumbUp,
    thumbsDown: thumbDown,
  };
}
