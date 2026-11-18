import { projects } from "./projects";
import type { Todo } from "./projects/types";

/**
 * The /projects bento board: a 6 × 4 grid like Apple's keynote spec boards, SmartSight in the middle.
 * Each cell sets its own place, `at: [column, row, width, height]` (1-based), so you can move or resize
 * any cell here. Every one of the 24 slots must be covered exactly once, or the build fails.
 *   hero / image: a screenshot cell (max 3 in total).  stat: one big number.  text: one claim + link.
 */
export const COLS = 6;
export const ROWS = 4;

type At = [col: number, row: number, w: number, h: number];
export type BentoCell =
  | { kind: "hero"; at: At; slug: string; kicker: string; eyebrow: string; title: string; tagline: string; image: string }
  | { kind: "image"; at: At; slug: string; eyebrow: string; title: string; image: string }
  | { kind: "stat"; at: At; slug: string; label?: string; value: string | Todo; caption: string }
  | { kind: "text"; at: At; slug: string; eyebrow: string; claim: string };

export const bento: BentoCell[] = [
  // Centre: the strongest project.
  {
    kind: "hero",
    at: [3, 1, 2, 3],
    slug: "reality-hack",
    kicker: "2× Award Winner",
    eyebrow: "Wearable AI · MIT Reality Hack 2026",
    title: "SmartSight",
    tagline: "A Ray-Ban Meta study companion that sees your page and tutors you by voice.",
    image: "/mit-reality-hack-2026-1.jpg",
  },
  { kind: "stat", at: [3, 4, 2, 1], slug: "reality-hack", label: "Upload and analyze", value: "13s → 5s", caption: "end-to-end latency" },

  // Left wing: Glassistant, then SM REALIVE as the second-largest cell.
  { kind: "image", at: [1, 1, 2, 1], slug: "glassistant", eyebrow: "Meta Global AI Developer Hackathon", title: "Glassistant", image: "/glassistant-thumb.webp" },
  { kind: "stat", at: [1, 2, 1, 1], slug: "glassistant", label: "Well marked in", value: "~6 s", caption: "down from 84 s" },
  { kind: "stat", at: [2, 2, 1, 1], slug: "glassistant", label: "Voice requests done", value: "30/33", caption: "up from 10 / 30" },
  { kind: "image", at: [1, 3, 2, 2], slug: "xr-optimization", eyebrow: "Mixed-reality K-pop theatre · SM Entertainment", title: "SM REALIVE", image: "/projects/sm-realive-cover.jpg" },

  // Right wing: awards, then the rest by weight.
  { kind: "stat", at: [5, 1, 2, 1], slug: "reality-hack", label: "MIT Reality Hack 2026", value: "Gold Prize", caption: "+ Meta's Best Use of the Wearables Device Access Toolkit" },
  { kind: "stat", at: [5, 2, 1, 1], slug: "arc", label: "ARC · first live caption", value: "0.41 s", caption: "median, p90 0.46 s" },
  { kind: "text", at: [6, 2, 1, 1], slug: "tryl", eyebrow: "Tryl · Founder", claim: "AI try-on, live on the Chrome Web Store." },
  { kind: "stat", at: [5, 3, 1, 1], slug: "xr-optimization", label: "SM REALIVE", value: "±1–2", caption: "frames of drift across 5 headsets" },
  { kind: "text", at: [6, 3, 1, 1], slug: "cortex-sdk", eyebrow: "CORTEX", claim: "Sends a VLM only the frames worth sending." },
  { kind: "text", at: [5, 4, 1, 1], slug: "securesbu", eyebrow: "SecureSBU", claim: "HIPAA policy answers in Teams, in seconds." },
  { kind: "stat", at: [6, 4, 1, 1], slug: "ape", label: "A.P.E", value: "16 MB", caption: "one Go binary for EC2 and S3" },
];

// Build-time checks: real slugs, ≤ 3 screenshot cells, and the 6 × 4 board tiled with no gaps or overlaps.
const grid = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
for (const c of bento) {
  if (!projects.some((p) => p.slug === c.slug)) throw new Error(`home-bento: unknown slug "${c.slug}"`);
  const [x, y, w, h] = c.at;
  for (let r = y; r < y + h; r++) for (let k = x; k < x + w; k++) {
    if (r > ROWS || k > COLS) throw new Error(`home-bento: ${c.slug} at ${c.at} runs off the ${COLS}×${ROWS} board`);
    grid[r - 1][k - 1]++;
  }
}
if (bento.filter((c) => c.kind === "hero" || c.kind === "image").length > 3) throw new Error("home-bento: at most 3 image cells");
grid.forEach((row, r) => row.forEach((n, k) => {
  if (n !== 1) throw new Error(`home-bento: slot (col ${k + 1}, row ${r + 1}) is covered ${n} times`);
}));
