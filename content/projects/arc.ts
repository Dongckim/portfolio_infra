import type { Project } from "./types";

// Source: github.com/Dongckim/CHI2027-Competition (README, docs/decisions, docs/validation).
export const arc: Project = {
  slug: "arc",
  summary: {
    eyebrow: "Ongoing · CHI 2027 Digital Experience Competition entry",
    title: "ARC: Academic Research Compass",
    tagline: "Turns 2,600+ CHI papers, posters and demos into a day you can actually walk.",
    role: "Engineering lead",
    team: "3-person team",
    duration: "Oct 2026 – ongoing (submission due Dec 4, 2026)",
    links: {
      repo: "https://github.com/Dongckim/CHI2027-Competition",
      demo: "https://arc-seven-wheat.vercel.app",
    },
    stack: {
      Frontend: ["React 19", "TypeScript", "Vite", "Tailwind v4", "three.js", "PWA service worker"],
      Data: ["Node build scripts", "ajv JSON Schema", "Python + pdfplumber", "ROR (CC0)"],
      Server: ["Vercel functions", "VAPID Web Push"],
      Realtime: ["Soniox real-time STT + translation"],
      Testing: ["node --test", "react-test-renderer", "headless Chrome (CDP)"],
    },
    stats: [
      { value: "87 ms", label: "Plan a full day over all 2,531 papers on a laptop (33 ms on iPhone)" },
      { value: "0.41 s", label: "Median time to the first live caption (p90 0.46 s)" },
      { value: "1,444", label: "Room pairs with a step-free wheelchair route" },
    ],
    thumbnail: "/arc-emblem.jpg",
    media: [
      { src: "/arc-ui-final.webp", alt: "Final UI design in Figma (Nov 2026): onboarding, your research neighborhood, the Arc map and a talk with live Q&A" },
    ],
  },

  context: {
    lede: "CHI attendees face 2,782 programme items in a venue they have never walked.",
    problem:
      "The official programme is a list, not a plan, and its venue maps are oblique drawings with no scale. " +
      "Attendees need a personal schedule that accounts for walking time, with captions and step-free routes built in.",
    myScope:
      "I built the data pipeline, the JSON contracts, the on-device planner, wayfinding, live captions and the React PWA. " +
      "Eunbi Cho leads design and Wonjune Lee owns the recommendation model, which the app stands in for with an on-device TF-IDF baseline until it lands.",
  },

  architecture: {
    lede: "The programme is compiled at build time, and everything personal runs on the phone, so no account and no user data on a server.",
    image: {
      description: "Build-time data pipeline + on-device planning + direct-to-provider captions",
      components: [
        { label: "CHI Programme Feed", position: { x: 5, y: 35 } },
        { label: "Build Pipeline (validate + chunk)", position: { x: 24, y: 35 } },
        { label: "ROR Institution Cache", position: { x: 24, y: 75 } },
        { label: "CCIB Floorplan Venue Graph", position: { x: 46, y: 80 } },
        { label: "On-device Recommender (TF-IDF)", position: { x: 46, y: 35 } },
        { label: "Day Planner (weighted-interval DP)", position: { x: 68, y: 35 } },
        { label: "React PWA + Service Worker", position: { x: 90, y: 55 } },
        { label: "Vercel Functions (key, push)", position: { x: 68, y: 80 } },
        { label: "Soniox Realtime STT", position: { x: 90, y: 90 } },
      ],
      connections: [
        { from: 0, to: 1 },
        { from: 2, to: 1 },
        { from: 1, to: 4, label: "app-data chunks" },
        { from: 4, to: 5 },
        { from: 3, to: 5, label: "walk times" },
        { from: 5, to: 6 },
        { from: 3, to: 6, label: "directions" },
        { from: 6, to: 7 },
        { from: 6, to: 8, label: "direct WebSocket" },
        { from: 0, to: 6, label: "change polling" },
      ],
    },
    caption:
      "Audio for captions goes from the phone straight to Soniox with a short-lived key from a Vercel function, so it never passes through ARC's server.",
    highlightedPath: [
      "CHI Programme Feed",
      "Build Pipeline (validate + chunk)",
      "On-device Recommender (TF-IDF)",
      "Day Planner (weighted-interval DP)",
      "React PWA + Service Worker",
    ],
  },

  decisions: {
    lede: "Each decision is written up with the alternatives that lost, and each one was settled by data from four years of CHI feeds.",
    items: [
      {
        title: "Treat feed times as venue wall-clock time",
        problem:
          "The feed's epoch values are local time written as if they were UTC. Read as UTC, only 1.1% (CHI 2024) and 49.7% (CHI 2025) of sessions fall between 07:00 and 22:00 local.",
        options: ["Display the values as UTC", "Convert inside the app at runtime", "Convert once at build time (`wallToInstant`)"],
        decision: "Convert once at build time, so every screen and the planner share one correct instant.",
        result: "100% of sessions land in local daytime across 4 years of feeds.",
        tradeoff: "It is still an inference about the feed; written confirmation from CHI is pending.",
      },
      {
        title: "Resolve institutions through ROR at build time",
        problem: "2,131 raw affiliation strings, with typos, made author search by institution unreliable.",
        options: [
          "A hand-written abbreviation table (does not scale)",
          "Auto first-letter acronyms (46.9% correct, 241 collisions)",
          "Query ROR at runtime (would leak what users search for)",
          "Query ROR at build time and cache the result",
        ],
        decision: "Look up every affiliation in ROR during the build and ship the cached mapping with the app data.",
        result: "1,752 merged institutions, 85.2% linked, and 98.2% top-1 on 55 test queries.",
        tradeoff: "Companies are not linked, and the 98.2% is inflated because 8 aliases were added after seeing the test list.",
      },
      {
        title: "Measure distances from the official floorplan",
        problem: "The feed's venue maps are oblique drawings with no scale, so walking time between rooms was guesswork.",
        options: [
          "Hand-pin rooms on the feed drawings",
          "Fixed per-floor constants (4 and 7 minutes)",
          "Ask CCIB for CAD files",
          "Extract vectors from the official floorplan PDF",
        ],
        decision: "Extract the floorplan vectors with pdfplumber (0.4163 m per point) and add only human-written labels on top.",
        result: "Dimensions within 2.4%, hand-checked segments within 1 m (5 / 5), and the planner and directions use the same numbers.",
        tradeoff: "The data has no stairs, some corridors are estimated, and walking speeds are assumed rather than measured on site.",
      },
    ],
  },

  measurement: {
    lede: "Splitting the app data cut the first screen from 2.02 MB to 402 KB gzip, and every feature has a measured budget.",
    headline: { label: "First-screen data, gzip", before: "2.02 MB", after: "402 KB" },
    method: {
      network: "TODO: network profile for the first-screen measurement",
      samples: "TODO: runs per measurement",
      p50: "TODO: p50",
      p95: "TODO: p95",
    },
    before: [{ stage: "First-screen data", ms: "TODO: load time" }],
    after: [{ stage: "First-screen data", ms: "TODO: load time" }],
  },

  reliability: {
    lede: "The data build is deterministic and contract-checked, and every screen has a headless-browser check.",
    bullets: [
      "**107 / 107 tests** passing with `node --test` in the last recorded run, plus `contracts:check` 5 / 5, which verifies every quoted span matches its abstract exactly.",
      "**Deterministic builds**: 5 / 5 identical hashes from the same feed.",
      "Headless Chrome checks for directions, entry, programme revisions, offline mode and QA.",
      "Vercel functions return 405 / 429 / 502 with reasons, and push endpoints only accept known push services.",
      "The app polls the programme version about once a minute while visible and diffs changes against your saved stops.",
    ],
    details: [
      "**Planner**: 50 recs 0.2 ms, 200 recs 1.1 ms, all 2,531 papers 87 ms on an M2 laptop; 0.2 / 0.6 / 33.4 ms in iPhone Safari (iOS 26.6.1); hard cases 10 / 10",
      "**Captions**: synthetic 25 s English clip; first text 0.41 s median (p90 0.46 s); translation 0.48 s after the source is final (p90 0.57 s); $0.12 per hour",
      "**Venue**: route computation 0.14 ms; wheelchair routes for all 1,444 room pairs with 0 escalators; median walk 3 min, wheelchair 4 min",
      "**3D directions**: frame p95 16.8 ms in headless Chrome at 4× CPU throttle",
      "**Search**: \"CMU\" in 68–76 ms (headless, 4× CPU), 109 talks returned",
      "**Data**: 1,591 / 1,702 = 93.5% of CHI 2026 papers have a time and room",
    ],
  },

  limits: {
    lede: "ARC is an ongoing entry for the CHI 2027 Digital Experience Competition (chidigitalexperience.org): the core works, and the remaining gaps are written down.",
    items: [
      {
        today: "The real recommender has not landed, so an on-device TF-IDF baseline stands in for it.",
        atScale: "Swap in the recommender behind `/api/recommend`; the RecommendRequest / Response 0.1.0 contract is already drafted.",
      },
      {
        today: "Walking times are assumed, not measured on site, and the venue graph has no stairs.",
        atScale: "Measure walks on site and rebuild the graph from the Pittsburgh 2027 floorplan, which is still needed.",
      },
      {
        today: "Search and 3D directions have not been checked on real phones, and Samsung Internet is untested.",
        atScale: "Run the same budgets on real devices, including Samsung Internet.",
      },
      {
        today: "Rate limits live in memory, so each function instance counts separately.",
        atScale: "Move to the host's own rate limiting once a host is chosen; the Soniox spending limit stays the hard daily cap for captions.",
      },
    ],
  },

  learnings: {
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: ["TODO: learning 1", "TODO: learning 2"],
  },
};
