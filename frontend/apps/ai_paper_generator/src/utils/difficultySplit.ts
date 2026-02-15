function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function toInt100(e: number, m: number, h: number): [number, number, number] {
  // largest remainder -> integers that sum to 100
  const parts = [e, m, h];
  const floors = parts.map((x) => Math.floor(x));
  const rem = 100 - floors.reduce((a, b) => a + b, 0);

  // Sort by fractional part descending
  // we need to keep track of original indices to add back to correct component
  const fracs = parts
    .map((x, i) => ({ val: x - (floors[i] ?? 0), idx: i }))
    .sort((a, b) => b.val - a.val);

  for (let k = 0; k < rem; k++) {
    const item = fracs[k % 3];
    if (item) {
      const idx = item.idx;
      const val = floors[idx];
      if (typeof val === "number") {
        floors[idx] = val + 1;
      }
    }
  }
  return [floors[0] ?? 0, floors[1] ?? 0, floors[2] ?? 0];
}

export interface DifficultySplit {
  easy: number;
  medium: number;
  hard: number;
}

export function difficultySplitInt(
  totalQuestions: number,
  totalMarks: number,
  totalMinutes: number
): DifficultySplit {
  if (totalQuestions <= 0 || totalMarks <= 0 || totalMinutes <= 0) {
    // Fallback if 0 to avoid NaNs, though UI validates > 0 usually
    return { easy: 60, medium: 30, hard: 10 };
  }

  const Q = totalQuestions;
  const M = totalMarks;
  const T = totalMinutes;

  // --- Rates ---
  const marksPerMin = M / T;
  const questionsPerMin = Q / T;
  const marksPerQuestion = M / Q;
  const timePerQuestion = T / Q;

  // --- Baselines (typical school mixed paper) ---
  const baseMpm = 1.2; // marks/min
  const baseQpm = 0.35; // questions/min (~1 per 3 min)
  const baseMpq = 2.0; // marks/question baseline
  const baseTpq = 3.0; // minutes/question baseline

  // --- 1) Pressure: tighter paper => easier ---
  const pressure =
    0.6 * (marksPerMin / baseMpm) + 0.4 * (questionsPerMin / baseQpm);
  const pAdj = clamp(pressure - 1.0, -0.75, 0.75);

  // --- 2) Complexity: very high marks/question or time/question => harder ---
  // Use logs so extreme cases (like Q=1) don't explode but still push towards hard.
  const compBase =
    0.5 * Math.log1p(baseMpq / baseMpq) + 0.5 * Math.log1p(baseTpq / baseTpq); // = log1p(1)=0.693...
  const compNow =
    0.5 * Math.log1p(marksPerQuestion / baseMpq) +
    0.5 * Math.log1p(timePerQuestion / baseTpq);
  const compNorm = clamp((compNow - compBase) / 2.5, 0.0, 1.0); // 0..1

  // --- Base split (school guideline) ---
  let easy = 60.0;
  let medium = 30.0;
  let hard = 10.0;

  // Adjust:
  // - more pressure => more easy, less hard
  // - more complexity => less easy, more hard
  easy = easy + 20.0 * pAdj - 25.0 * compNorm;
  hard = hard - 10.0 * pAdj + 25.0 * compNorm;
  medium = 100.0 - easy - hard;

  // --- Safety bounds ---
  easy = clamp(easy, 35.0, 75.0);
  hard = clamp(hard, 5.0, 35.0);
  // medium is derived, but clamp it to be safe before normalization or just let normalization handle it?
  // User algo: medium = clamp(medium, 10.0, 55.0)
  medium = clamp(medium, 10.0, 55.0);

  // Renormalize to 100
  const s = easy + medium + hard;
  easy = (easy * 100.0) / s;
  medium = (medium * 100.0) / s;
  hard = (hard * 100.0) / s;

  // Integer output that sums to 100
  const [eI, mI, hI] = toInt100(easy, medium, hard);
  return { easy: eI, medium: mI, hard: hI };
}
