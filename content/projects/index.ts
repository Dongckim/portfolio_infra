import type { Project } from "./types";
import { smartsight } from "./smartsight";
import { glassistant } from "./glassistant";
import { arc } from "./arc";
import { contentMonitor } from "./content-monitor";
import { autobass } from "./autobass";
import { pymark } from "./pymark";
import { xrOptimization } from "./xr-optimization";
import { securesbu } from "./securesbu";
import { ape } from "./ape";
import { cortexSdk } from "./cortex-sdk";
import { tryl } from "./tryl";

export type { Project } from "./types";

export const projects: Project[] = [
  arc,
  glassistant,
  smartsight,
  contentMonitor,
  autobass,
  pymark,
  xrOptimization,
  securesbu,
  ape,
  cortexSdk,
  tryl,
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

// Limits the type system can't express. Throws at import, so `next build` fails on a violation.
const words = (s: string) => s.trim().split(/\s+/).length;
const sentences = (s: string) => (s.match(/[.!?](?=\s+[A-Z`"(]|\s*$)/g) ?? []).length;
for (const p of projects) {
  const fail = (msg: string) => {
    throw new Error(`content/projects/${p.slug}: ${msg}`);
  };
  if (words(p.summary.tagline) > 15) fail("summary.tagline is over 15 words");
  if (sentences(p.context.problem) > 2) fail("context.problem is over 2 sentences");
  if (sentences(p.context.myScope) > 2) fail("context.myScope is over 2 sentences");
  if (new Set(projects.map((q) => q.slug)).size !== projects.length) fail("duplicate slug");
}
