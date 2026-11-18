// Shared schema for every project page. Every field except deepDive is required,
// so a project missing a section fails `tsc`.

/** Placeholder for a number or method we have not measured yet. Rendered visibly, never as 0. */
export type Todo = `TODO: ${string}`;
export const isTodo = (v: unknown): v is Todo => typeof v === "string" && v.startsWith("TODO:");

export interface Stat {
  value: string | Todo;
  label: string;
}

/** Node-and-edge diagram drawn by DiagramPlaceholder (no exported image files exist yet). */
export interface DiagramSpec {
  description: string;
  components: Array<{ label: string; position: { x: number; y: number } }>;
  connections: Array<{ from: number; to: number; label?: string }>;
  groups?: Array<{ label: string; members: number[]; color?: string }>;
}

export interface Decision {
  title: string;
  problem: string;
  options: string[];
  decision: string;
  result: string;
  tradeoff: string;
}

export interface StageTiming {
  stage: string;
  ms: number | Todo;
}

export type DeepDiveBlock =
  | { kind: "code"; label: string; language: string; snippet: string }
  | { kind: "text"; label?: string; body: string }
  | { kind: "images"; label: string; items: Array<{ src: string; alt: string }> };

export interface Project {
  /** URL segment; also the id used by constants/data.ts cards. */
  slug: string;
  summary: {
    /** Category line above the title, e.g. "Wearable AI · MIT Reality Hack 2026". */
    eyebrow: string;
    title: string;
    /** ≤ 15 words (asserted in index.ts). */
    tagline: string;
    role: string;
    team: string | Todo;
    duration: string | Todo;
    links: { repo?: string; demo?: string };
    /** e.g. { Backend: [...], Infra: [...] } */
    stack: Record<string, string[]>;
    stats: [Stat, Stat, Stat];
    /** Awards shown as badges under the tagline. */
    awards?: Array<{ title: string; event: string }>;
    /** YouTube demo URL, embedded under the hero. */
    video?: string;
    /** Listing-page image; falls back to the first media item. */
    thumbnail?: string;
    /** Demo footage / screenshots. The first item is the hero visual. */
    /** An item with `title` + `body` renders as an image-and-text split row instead of a gallery tile. */
    media?: Array<{ src: string; alt: string; title?: string; body?: string }>;
    /** How titled media render: "split" (default) one full-width row each; "grid" equal tiles, two per row. */
    mediaLayout?: "split" | "grid";
  };
  context: {
    lede: string;
    /** ≤ 2 sentences. */
    problem: string;
    /** ≤ 2 sentences. */
    myScope: string;
  };
  architecture: {
    lede: string;
    image: string | DiagramSpec;
    caption: string;
    highlightedPath: string[];
  };
  decisions: {
    lede: string;
    items: [Decision, Decision] | [Decision, Decision, Decision];
  };
  measurement: {
    lede: string;
    /** Stated end-to-end before/after, shown as the headline comparison. */
    headline: { label: string; before: string | Todo; after: string | Todo };
    method: {
      network: string | Todo;
      samples: number | Todo;
      p50: string | Todo;
      p95: string | Todo;
    };
    before: StageTiming[];
    after: StageTiming[];
  };
  reliability: {
    lede: string;
    bullets: string[];
    /** Edge-case list, rendered collapsed. */
    details?: string[];
  };
  limits: {
    lede: string;
    items: Array<{ today: string; atScale: string }>;
  };
  learnings: {
    lede: string;
    items: [string, string] | [string, string, string];
  };
  deepDive?: DeepDiveBlock[];
}
