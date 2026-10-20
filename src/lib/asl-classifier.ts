import { extractFeatures, type Point } from "./hand-features";

export type RecognitionMode = "fingerspell" | "phrases";

export type Classification = {
  label: string;
  english: string;
  confidence: number;
  kind: "letter" | "phrase" | "control";
};

type Candidate = Classification & { score: number };

function pick(candidates: Candidate[]): Classification | null {
  if (candidates.length === 0) {
    return null;
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (best.score < 0.58) {
    return null;
  }
  return {
    label: best.label,
    english: best.english,
    confidence: Math.min(0.99, best.score),
    kind: best.kind,
  };
}

export function classifyHand(
  landmarks: Point[],
  mode: RecognitionMode,
  motion: { waving: boolean; zTrace: number[]; indexPath: { x: number; y: number }[] },
): Classification | null {
  const f = extractFeatures(landmarks);
  const { fingers: g, curled: c, tips: t } = f;

  if (mode === "phrases") {
    return pick(phraseCandidates(f, motion));
  }

  const candidates: Candidate[] = [];

  if (f.ily) {
    candidates.push({ label: "ILY", english: "I love you", confidence: 0, kind: "phrase", score: 0.9 });
  }

  if (f.openPalm && !g.thumb && t.indexMiddle < 0.42) {
    candidates.push({ label: "B", english: "B", confidence: 0, kind: "letter", score: 0.86 });
  }

  if (f.openPalm && g.thumb && motion.waving) {
    candidates.push({ label: "HELLO", english: "Hello", confidence: 0, kind: "phrase", score: 0.84 });
  }

  if (f.openPalm && g.thumb && !motion.waving) {
    candidates.push({ label: "SPACE", english: " ", confidence: 0, kind: "control", score: 0.8 });
  }

  if (f.fist && !g.thumb) {
    candidates.push({ label: "E", english: "E", confidence: 0, kind: "letter", score: 0.72 });
  }

  if (f.fist && g.thumb && t.thumbIndex < 0.55) {
    const thumbOverFist = t.thumbIndex < 0.42 && t.thumbMiddle < 0.5;
    if (thumbOverFist) {
      candidates.push({ label: "S", english: "S", confidence: 0, kind: "letter", score: 0.82 });
    } else {
      candidates.push({ label: "A", english: "A", confidence: 0, kind: "letter", score: 0.84 });
    }
  }

  if (f.fist && t.thumbIndex < 0.35 && c.index) {
    candidates.push({ label: "T", english: "T", confidence: 0, kind: "letter", score: 0.74 });
  }

  if (g.index && c.middle && c.ring && c.pinky) {
    if (f.pointingDown && g.thumb) {
      candidates.push({ label: "Q", english: "Q", confidence: 0, kind: "letter", score: 0.8 });
    } else if (f.pointingSide && g.thumb) {
      candidates.push({ label: "G", english: "G", confidence: 0, kind: "letter", score: 0.8 });
    } else if (f.indexHooked) {
      candidates.push({ label: "X", english: "X", confidence: 0, kind: "letter", score: 0.78 });
    } else {
      candidates.push({ label: "D", english: "D", confidence: 0, kind: "letter", score: 0.83 });
    }
  }

  if (g.thumb && g.index && c.middle && c.ring && c.pinky && t.thumbIndex > 0.7) {
    candidates.push({ label: "L", english: "L", confidence: 0, kind: "letter", score: 0.88 });
  }

  if (!g.index && g.middle && g.ring && g.pinky && t.thumbIndex < 0.38) {
    candidates.push({ label: "F", english: "F", confidence: 0, kind: "letter", score: 0.86 });
  }

  if (c.index && c.middle && c.ring && g.pinky && !g.thumb) {
    const zMotion = isZOrJMotion(motion.indexPath);
    if (zMotion === "J" || (motion.indexPath.length > 8 && arcMotion(motion.indexPath))) {
      candidates.push({ label: "J", english: "J", confidence: 0, kind: "letter", score: 0.8 });
    } else {
      candidates.push({ label: "I", english: "I", confidence: 0, kind: "letter", score: 0.86 });
    }
  }

  if (g.thumb && c.index && c.middle && c.ring && g.pinky) {
    candidates.push({ label: "Y", english: "Y", confidence: 0, kind: "letter", score: 0.88 });
  }

  if (g.index && g.middle && c.ring && c.pinky) {
    if (f.indexMiddleCrossed) {
      candidates.push({ label: "R", english: "R", confidence: 0, kind: "letter", score: 0.8 });
    } else if (t.indexMiddle < 0.32) {
      if (f.pointingSide) {
        candidates.push({ label: "H", english: "H", confidence: 0, kind: "letter", score: 0.78 });
      } else {
        candidates.push({ label: "U", english: "U", confidence: 0, kind: "letter", score: 0.84 });
      }
    } else {
      candidates.push({ label: "V", english: "V", confidence: 0, kind: "letter", score: 0.86 });
    }
  }

  if (g.index && g.middle && g.ring && c.pinky) {
    candidates.push({ label: "W", english: "W", confidence: 0, kind: "letter", score: 0.86 });
  }

  if (g.index && g.middle && c.ring && c.pinky && g.thumb && t.thumbIndex < 0.45) {
    if (f.pointingDown) {
      candidates.push({ label: "P", english: "P", confidence: 0, kind: "letter", score: 0.76 });
    } else {
      candidates.push({ label: "K", english: "K", confidence: 0, kind: "letter", score: 0.74 });
    }
  }

  const roundShape = t.thumbIndex < 0.45 && t.thumbMiddle < 0.55 && !f.openPalm && !f.fist;
  if (roundShape && !g.index && !g.middle) {
    const veryRound = t.thumbIndex < 0.32;
    if (veryRound) {
      candidates.push({ label: "O", english: "O", confidence: 0, kind: "letter", score: 0.8 });
    } else {
      candidates.push({ label: "C", english: "C", confidence: 0, kind: "letter", score: 0.76 });
    }
  }

  if (f.fist && g.thumb && t.thumbIndex < 0.5 && t.indexMiddle < 0.28) {
    const thumbUnder = landmarks[4].y > landmarks[8].y;
    if (thumbUnder && c.ring && c.pinky) {
      candidates.push({ label: "N", english: "N", confidence: 0, kind: "letter", score: 0.7 });
    }
    if (thumbUnder && c.pinky) {
      candidates.push({ label: "M", english: "M", confidence: 0, kind: "letter", score: 0.68 });
    }
  }

  if (g.index && c.middle && c.ring && c.pinky && isZOrJMotion(motion.indexPath) === "Z") {
    candidates.push({ label: "Z", english: "Z", confidence: 0, kind: "letter", score: 0.82 });
  }

  if (f.fist && motion.waving === false && holdClosed(motion)) {
    candidates.push({ label: "DELETE", english: "", confidence: 0, kind: "control", score: 0.62 });
  }

  return pick(candidates);
}

function phraseCandidates(
  f: ReturnType<typeof extractFeatures>,
  motion: { waving: boolean },
): Candidate[] {
  const candidates: Candidate[] = [];
  if (f.ily) {
    candidates.push({ label: "I LOVE YOU", english: "I love you", confidence: 0, kind: "phrase", score: 0.93 });
  }
  if (f.thumbsUp) {
    candidates.push({ label: "YES", english: "Yes", confidence: 0, kind: "phrase", score: 0.9 });
  }
  if (f.thumbsDown) {
    candidates.push({ label: "NO", english: "No", confidence: 0, kind: "phrase", score: 0.9 });
  }
  if (f.openPalm && motion.waving) {
    candidates.push({ label: "HELLO", english: "Hello", confidence: 0, kind: "phrase", score: 0.9 });
  }
  if (f.openPalm && !motion.waving && f.fingers.thumb) {
    candidates.push({ label: "THANK YOU", english: "Thank you", confidence: 0, kind: "phrase", score: 0.7 });
  }
  if (f.openPalm && !f.fingers.thumb) {
    candidates.push({ label: "PLEASE", english: "Please", confidence: 0, kind: "phrase", score: 0.72 });
  }
  if (f.fist) {
    candidates.push({ label: "HELP", english: "Help", confidence: 0, kind: "phrase", score: 0.64 });
  }
  return candidates;
}

function isZOrJMotion(path: { x: number; y: number }[]): "Z" | "J" | null {
  if (path.length < 10) {
    return null;
  }
  const xs = path.map((p) => p.x);
  const ys = path.map((p) => p.y);
  const dx = Math.max(...xs) - Math.min(...xs);
  const dy = Math.max(...ys) - Math.min(...ys);
  if (dx < 0.08 && dy < 0.08) {
    return null;
  }
  const start = path[0];
  const end = path[path.length - 1];
  if (dy > dx * 0.8 && end.y > start.y && end.x <= start.x + 0.05) {
    return "J";
  }
  if (dx > 0.12 && dy > 0.08) {
    return "Z";
  }
  return null;
}

function arcMotion(path: { x: number; y: number }[]) {
  if (path.length < 8) {
    return false;
  }
  const start = path[0];
  const end = path[path.length - 1];
  return Math.hypot(end.x - start.x, end.y - start.y) > 0.12;
}

function holdClosed(motion: { zTrace: number[] }) {
  return motion.zTrace.length > 12;
}
