import type { Project } from "./types";

export const tryl: Project = {
  slug: "tryl",
  summary: {
    eyebrow: "AI fashion try-on · Founder",
    title: "Tryl: AI Fashion Try-On",
    tagline: "Try on clothes from any shopping page, with slow AI generation queued in the background.",
    role: "Full Stack Engineer (solo)",
    team: "Solo",
    duration: "Mar – Jun 2026",
    links: { repo: "https://github.com/Dongckim/tryl-beta", demo: "https://chromewebstore.google.com/detail/tryl/ncmgabhfidmlbammoelhhlnlkijhjpdi" },
    stack: {
      Frontend: ["React", "TypeScript", "Chrome Extension (MV3)"],
      Backend: ["FastAPI", "Python"],
      Data: ["PostgreSQL", "Redis"],
      Tooling: ["pnpm workspaces"],
    },
    stats: [
      { value: "5–30 s", label: "Try-on generation per image, moved off the request path" },
      { value: "4", label: "Apps in one monorepo (web, extension, API, worker)" },
      { value: "Live", label: "On the Chrome Web Store since Apr 2026" },
    ],
    thumbnail: "/tryl-tryon-v2.webp",
    media: [
      { src: "/tryl-1.png", alt: "Tryl try-on flow" },
      { src: "/tryl-2.png", alt: "Tryl product detection" },
      { src: "/tryl-3.png", alt: "Tryl generated try-on result" },
    ],
  },

  context: {
    lede: "AI try-on takes 5–30 seconds per image, which is far too slow for a synchronous API response.",
    problem:
      "Generation is too slow to hold a request open, and product images live behind inconsistent DOM structures on every storefront. " +
      "The product needed an async job pipeline plus product detection that does not depend on brittle CSS selectors.",
    myScope: "I built the whole monorepo alone: the Chrome extension, the React web app, the FastAPI backend and the Redis worker.",
  },

  architecture: {
    lede: "The extension finds the product, FastAPI queues a job in Redis, and a worker generates and archives the try-on image.",
    image: {
      "description": "Monorepo: Chrome Ext + Web → FastAPI → Redis → Worker → S3 + PostgreSQL",
      "components": [
        {
          "label": "User",
          "position": {
            "x": 5,
            "y": 50
          }
        },
        {
          "label": "Chrome Extension (MV3)",
          "position": {
            "x": 20,
            "y": 25
          }
        },
        {
          "label": "React Web App",
          "position": {
            "x": 20,
            "y": 75
          }
        },
        {
          "label": "FastAPI Backend",
          "position": {
            "x": 40,
            "y": 50
          }
        },
        {
          "label": "JWT Auth",
          "position": {
            "x": 55,
            "y": 25
          }
        },
        {
          "label": "PostgreSQL (profiles)",
          "position": {
            "x": 55,
            "y": 75
          }
        },
        {
          "label": "Redis Job Queue",
          "position": {
            "x": 70,
            "y": 35
          }
        },
        {
          "label": "Try-On Worker",
          "position": {
            "x": 85,
            "y": 50
          }
        },
        {
          "label": "S3 Image Archive",
          "position": {
            "x": 85,
            "y": 80
          }
        }
      ],
      "connections": [
        {
          "from": 0,
          "to": 1
        },
        {
          "from": 0,
          "to": 2
        },
        {
          "from": 1,
          "to": 3
        },
        {
          "from": 2,
          "to": 3
        },
        {
          "from": 3,
          "to": 4
        },
        {
          "from": 3,
          "to": 5
        },
        {
          "from": 3,
          "to": 6
        },
        {
          "from": 6,
          "to": 7
        },
        {
          "from": 7,
          "to": 8
        },
        {
          "from": 7,
          "to": 5
        }
      ]
    },
    caption: "Highlighted: one try-on, from product detection to the archived result.",
    highlightedPath: ["Chrome Extension (MV3)", "FastAPI Backend", "Redis Job Queue", "Try-On Worker", "S3 Image Archive"],
  },

  decisions: {
    lede: "Three choices keep the pipeline simple: a blocking queue, a single status column and an `og:image`-first detector.",
    items: [
      {
        title: "Redis BRPOP instead of a polling worker",
        problem: "Workers need to pick up jobs immediately without burning CPU while idle.",
        options: ["A sleep-poll loop", "A blocking `brpop` on a Redis list"],
        decision: "Workers block on `brpop`, and the API creates the job and returns its status immediately.",
        result: "No CPU burn between jobs, FIFO ordering, and scaling out is just more worker containers.",
        tradeoff: "A plain Redis list has no built-in acknowledgement, so a crashed worker needs a watchdog to re-queue its job.",
      },
      {
        title: "One status column instead of event tables",
        problem: "Clients poll for job progress, and the lifecycle has to be easy to query.",
        options: ["Event sourcing / separate tables", "A single `status` column (queued / processing / completed / failed) with `updated_at`"],
        decision: "Job lifecycle lives in one row, with `error_message` filled when a job fails.",
        result: "It is simpler to query, index and reason about for an MVP.",
        tradeoff: "There is no history of transitions, only the current state.",
      },
      {
        title: "`og:image` first, heuristics second",
        problem: "Site-specific scrapers break every time a storefront is redesigned.",
        options: ["Per-site structured scrapers", "Heuristic DOM selectors with an `og:image` fallback"],
        decision: "Prefer `og:image`, which site owners set for sharing, then fall back to heuristic selectors, then manual URL input.",
        result: "A stable, high-quality product image on Zara, the first supported storefront, without depending on its DOM structure.",
        tradeoff: "`og:image` describes the page rather than the selected variant, so colour or size variants can be missed.",
      },
    ],
  },

  measurement: {
    lede: "Generation takes 5–30 s per image, but queue wait and end-to-end times have not been measured.",
    headline: { label: "TODO: what was measured", before: "TODO: before", after: "TODO: after" },
    method: {
      network: "TODO: environment measured",
      samples: "TODO: number of jobs timed",
      p50: "TODO: p50",
      p95: "TODO: p95",
    },
    before: [{ stage: "Synchronous generation (request held open)", ms: "TODO: measure" }],
    after: [
      { stage: "Create job + respond", ms: "TODO: measure" },
      { stage: "Queue wait", ms: "TODO: measure" },
      { stage: "Generation in worker", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "A failed job always ends in a readable `failed` state, never a silent hang.",
    bullets: [
      "**CI** runs web lint and build, the extension build and **19 API tests** against Postgres 16 and Redis 7 on every push; storefront flows on Zara are checked by hand.",
      "**Prometheus + Grafana** track API p50 / p95 / p99, job duration, retries, failure ratio and queue backlog (`tryon_job_duration_seconds`, `redis_key_size`).",
      "The worker wraps each job in try/except, and any unhandled error sets `status = \"failed\"` with the message stored in `error_message`.",
      "FastAPI dependencies validate auth and profile ownership before a job is created, returning 403 on a mismatch.",
      "The extension's service worker catches fetch failures and shows readable messages in the popup instead of raw status codes.",
    ],
    details: [
      "**Retryable failure**: job re-queued with backoff up to the retry limit; `CONFIG:` errors are not retried",
      "**Extension on SPA (React/Next.js storefront)**: MutationObserver detects route changes and re-runs product detection on navigation",
      "**User submits duplicate job**: idempotency check on (profile_id, product_image_url) returns the existing job_id",
      "**No og:image and no matching selector**: extension shows \"Could not detect product image\" with a manual URL input fallback",
      "**Auth token expired while polling**: 401 triggers a silent refresh, and polling continues after the new token is issued",
    ],
  },

  limits: {
    lede: "The MVP's queue and testing work at demo scale and would need hardening for real traffic.",
    items: [
      {
        today: "`brpop` removes a job before it is processed, so a worker crash mid-job loses it; only failures the worker catches are re-queued through the DB retry count.",
        atScale: "TODO: confirm. For example, a reliable queue pattern (`BLMOVE` into a processing list, or Redis Streams with consumer groups) so jobs are acknowledged.",
      },
      {
        today: "Clients poll for job status.",
        atScale: "TODO: confirm. For example, push completion over SSE or WebSocket.",
      },
      {
        today: "Only the API has automated tests; the worker, extension and storefront flows are tested by hand, and only Zara has an adapter.",
        atScale: "TODO: confirm. For example, saved storefront fixtures and automated extension tests in CI.",
      },
      {
        today: "Extension job state lives in an in-memory `Map` in the MV3 service worker, which Chrome can suspend between events.",
        atScale: "TODO: confirm how this should change at scale.",
      },
    ],
  },

  learnings: {
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: [
      "TODO: confirm. For example, decouple anything slower than a second from the request with a job ID and a status.",
      "TODO: confirm. For example, data that site owners publish themselves, like `og:image`, outlives scraping the DOM.",
    ],
  },

  deepDive: [
    {
      kind: "code",
      label: "0. Monorepo Structure (pnpm workspaces)",
      language: "markdown",
      snippet: `tryl/
  ├─ apps/
  │    ├─ web/          React + TypeScript — auth, fitting profiles, archive
  │    ├─ extension/    Chrome MV3 — product detection on shopping pages
  │    ├─ api/          FastAPI — REST API for profiles, jobs, archive
  │    └─ worker/       Python — async try-on job processor
  ├─ packages/
  │    ├─ shared-types/ TypeScript types shared by web + extension
  │    └─ config/       Shared ESLint + TS config
  └─ pnpm-workspace.yaml`,
    },
    {
      kind: "code",
      label: "1. Try-On Job Pipeline — create → queue → process → archive",
      language: "markdown",
      snippet: `POST /api/tryon/jobs  { profile_id, product_image_url, product_metadata }
  │
  ├─ Validate profile exists + user owns it
  ├─ Resolve product: download image → store to S3-compatible store
  ├─ INSERT job { status: "queued", profile_id, product_image_key }
  │
  └─ redis.lpush("tryon:queue", job_id)   ← enqueue
       │
       ▼  [Worker process — separate container]
  redis.brpop("tryon:queue")              ← blocking pop
       │
       ├─ UPDATE job { status: "processing" }
       ├─ Fetch fitting profile image + product image
       ├─ Call try-on AI model API (async httpx)
       │    └─ Poll / stream until result image ready
       ├─ Store result image
       ├─ UPDATE job { status: "completed", result_image_key }
       │
       └─ On any error:
            UPDATE job { status: "failed", error_message }

GET /api/tryon/jobs/{job_id}   → { status, result_image_url? }
GET /api/tryon/archive         → paginated completed jobs`,
    },
    {
      kind: "code",
      label: "2. Chrome Extension — product detection across storefronts",
      language: "markdown",
      snippet: `Content script injected on shopping page load
  │
  ├─ DOM scan: heuristic selectors for product images
  │    ├─ meta[property="og:image"]           ← most reliable
  │    ├─ [data-testid*="product"] img         ← framework apps (Next.js)
  │    ├─ .pdp-image, .product-image img       ← legacy CSS patterns
  │    └─ largest visible <img> (fallback)
  │
  ├─ Inject "Try with Tryl" button adjacent to detected image
  │
  └─ On button click:
       ├─ Send product_image_url + page_url to background service worker
       ├─ background → POST /api/tryon/jobs (with auth cookie / token)
       ├─ Receive job_id → open popup with job status polling
       │    └─ GET /api/tryon/jobs/{job_id} every 3 s
       └─ On "completed" → display result image in popup overlay`,
    },
    {
      kind: "text",
      label: "More design notes",
      body:
        "**pnpm workspaces over separate repos**: shared TypeScript types (`shared-types`) flow straight to both `web` and `extension` with no publish step. The cost is a slightly more complex CI matrix, because build order matters.\n" +
        "**Chrome MV3**: MV3 service workers replace the persistent background pages Chrome is retiring.",
    },
  ],
};
