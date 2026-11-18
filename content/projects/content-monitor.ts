import type { Project } from "./types";

export const contentMonitor: Project = {
  slug: "content-monitor",
  summary: {
    eyebrow: "Web reliability",
    title: "Web Content Integrity Monitor",
    tagline: "A cron pipeline that reports only the meaningful changes in external documentation.",
    role: "TODO: role",
    team: "TODO: team size",
    duration: "TODO: duration",
    links: { repo: "https://github.com/Dongckim/Web-Content-Integrity-Monitor" },
    stack: {
      Language: ["Python"],
      Parsing: ["BeautifulSoup", "html2md"],
      Automation: ["Cron", "tar.gz archives"],
      Comparison: ["diffcheck (diff algorithms)"],
    },
    stats: [
      { value: "90%", label: "HTML noise (ads, navs) filtered out" },
      { value: "Near zero", label: "False-positive change alerts" },
      { value: "Daily", label: "Unattended diff reports via cron" },
    ],
  },

  context: {
    lede: "External docs change without notice, and a naive diff buries the real edits under ads, nav bars and timestamps.",
    problem:
      "Diffing raw HTML from non-standard pages like Wikipedia raises false positives on every dynamic element. " +
      "The pipeline had to isolate semantic content and run the whole scrape, archive and diff lifecycle without a human.",
    myScope: "TODO: confirm. I built the pipeline end to end: scraping, DOM sanitising, archiving and the diff report.",
  },

  architecture: {
    lede: "Cron drives a linear pipeline that fetches, sanitises, converts to Markdown, snapshots and then diffs against yesterday.",
    image: {
      "description": "Cron → Scrape → Sanitize → Snapshot → Diff → Report",
      "components": [
        {
          "label": "Cron Scheduler",
          "position": {
            "x": 7,
            "y": 50
          }
        },
        {
          "label": "URL Source (CSV)",
          "position": {
            "x": 20,
            "y": 50
          }
        },
        {
          "label": "HTTP Fetcher",
          "position": {
            "x": 35,
            "y": 50
          }
        },
        {
          "label": "BeautifulSoup Parser",
          "position": {
            "x": 50,
            "y": 28
          }
        },
        {
          "label": "DOM Sanitizer",
          "position": {
            "x": 65,
            "y": 28
          }
        },
        {
          "label": "html2md Converter",
          "position": {
            "x": 50,
            "y": 72
          }
        },
        {
          "label": "tar.gz Archiver",
          "position": {
            "x": 78,
            "y": 50
          }
        },
        {
          "label": "diffcheck Engine",
          "position": {
            "x": 91,
            "y": 28
          }
        },
        {
          "label": "Change Report",
          "position": {
            "x": 91,
            "y": 72
          }
        }
      ],
      "connections": [
        {
          "from": 0,
          "to": 1
        },
        {
          "from": 1,
          "to": 2
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
          "from": 4,
          "to": 5
        },
        {
          "from": 5,
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
          "from": 2,
          "to": 5
        }
      ]
    },
    caption: "Critical path highlighted: content is cleaned and normalised before it is ever compared.",
    highlightedPath: ["HTTP Fetcher", "BeautifulSoup Parser", "DOM Sanitizer", "html2md Converter", "diffcheck Engine", "Change Report"],
  },

  decisions: {
    lede: "Three choices keep the signal: clean the DOM, compare Markdown instead of markup, and keep immutable file snapshots.",
    items: [
      {
        title: "Sanitise the DOM before diffing",
        problem: "Naive diffs fire on ads, navigation bars and timestamps, so real edits are lost in noise.",
        options: ["Diff the raw HTML", "Strip non-semantic elements first with BeautifulSoup"],
        decision:
          "`clean_soup` keeps only `mw-parser-output` and decomposes `table`, `script`, `style`, `navbox` plus the `infobox`, `mw-editsection`, `reflist` and `toc` classes.",
        result: "About 90% of HTML noise is removed and false-positive alerts dropped to near zero.",
        tradeoff: "The selectors are Wikipedia-specific, and removed tables and infoboxes are never compared.",
      },
      {
        title: "Normalise to Markdown before comparing",
        problem: "Markup-only changes (attributes, wrappers) would show up as content changes.",
        options: ["Compare sanitised HTML", "Convert to Markdown first, then diff text"],
        decision: "Run html2md on the cleaned DOM and let `diffcheck` compare Markdown text.",
        result: "Reports highlight text changes rather than markup churn.",
        tradeoff: "Pure formatting changes (for example a heading level or link target) can be flattened away.",
      },
      {
        title: "tar.gz snapshots instead of a database",
        problem: "Each day's content needs a durable source of truth to diff against.",
        options: ["Store page versions in a database", "Archive daily snapshots as tar.gz files"],
        decision: "A file-based Snapshot & Compare strategy using tar.gz archives.",
        result: "Snapshots are immutable and easy to debug and transfer.",
        tradeoff: "No fast queries across history, which a database would give.",
      },
    ],
  },

  measurement: {
    lede: "TODO: no timing or accuracy measurement is recorded yet; only the 90% noise reduction is stated.",
    headline: { label: "TODO: what was measured", before: "TODO: before", after: "TODO: after" },
    method: {
      network: "TODO: network / host the cron job ran on",
      samples: "TODO: number of pages and days compared",
      p50: "TODO: p50 pipeline run time",
      p95: "TODO: p95 pipeline run time",
    },
    before: [{ stage: "Raw-HTML diff (baseline)", ms: "TODO: measure" }],
    after: [
      { stage: "Fetch", ms: "TODO: measure" },
      { stage: "Sanitise + html2md", ms: "TODO: measure" },
      { stage: "Archive", ms: "TODO: measure" },
      { stage: "diffcheck", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "One bad URL or missing archive degrades a single report and never stops the batch.",
    bullets: [
      "**Graceful degradation**: network failures (404/500) during ingestion are logged to `stderr` and the batch keeps going.",
      "`diffcheck` handles a missing daily archive with a clear diagnostic message instead of crashing.",
      "TODO: tests or validation for the sanitiser and diff engine, if any exist.",
    ],
  },

  limits: {
    lede: "The pipeline is tuned for one site on one machine, which is fine for a monitor and not for a fleet.",
    items: [
      {
        today: "Content extraction depends on Wikipedia's `mw-parser-output` and class names; other sites return nothing.",
        atScale: "Per-site extraction rules (or a readability-style extractor) with a test page per site.",
      },
      {
        today: "Failed fetches are only logged to `stderr`, so that day's snapshot is silently missing.",
        atScale: "Retry with backoff and alert when a source fails, so gaps are visible.",
      },
      {
        today: "A full tar.gz archive is kept per run on local disk with no retention policy.",
        atScale: "Content-hash deduplication and object storage with a retention policy.",
      },
    ],
  },

  learnings: {
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: ["TODO: learning 1", "TODO: learning 2"],
  },

  deepDive: [
    {
      kind: "code",
      label: "Key implementation",
      language: "python",
      snippet: `def clean_soup(soup):
    """
    Semantic Filtering:
    We decompose purely visual or dynamic elements to ensure 
    the diff engine only compares meaningful content.
    """
    content_div = soup.find('div', {'class': 'mw-parser-output'})
    if not content_div: return None

    # Noise Reduction: Remove dynamic/irrelevant tags
    for tag in content_div.find_all(['table', 'script', 'style', 'navbox']):
        tag.decompose()

    # Advanced filtering for Wikipedia-specific artifacts
    classes_to_remove = ['infobox', 'mw-editsection', 'reflist', 'toc']
    for cls in classes_to_remove:
        for tag in content_div.find_all(class_=cls):
            tag.decompose()
            
    return content_div`,
    },
  ],
};
