import type { Project } from "./types";

// Source: github.com/Dongckim/Meta-Global-AI-Developer-Hackathon (README, docs/design, eval/results).
export const glassistant: Project = {
  slug: "glassistant",
  summary: {
    eyebrow: "Wearable AI agent · Meta Global AI Developer Hackathon",
    title: "Glassistant",
    tagline: "A hands-free lab assistant on Ray-Ban Meta that turns bench work into robot code.",
    role: "Team lead · all engineering",
    team: "2-person team",
    duration: "Oct 26 – Nov 4, 2026",
    links: {
      repo: "https://github.com/Dongckim/Meta-Global-AI-Developer-Hackathon",
      demo: "https://www.youtube.com/watch?v=RqihtHh110s",
    },
    stack: {
      Client: ["SwiftUI (iPadOS 26)", "Meta Wearables DAT 1.0.1", "Apple Speech"],
      Server: ["Python 3.12", "FastAPI", "WebSocket + SSE", "JSON Schema", "OpenCV"],
      AI: ["Muse Spark 1.3 (tool calls)", "Muse Voice Transcribe", "SAM 3.1", "Muse Glimmer 30B (llama.cpp)"],
      Infra: ["Modal GPU (L40S)", "Opentrons Flex simulator"],
    },
    stats: [
      { value: "84 s → ~6 s", label: "From pipette tip landing to the well marked on the iPad" },
      { value: "30 / 33", label: "Multi-action voice requests executed, up from 10 / 30" },
      { value: "1.78 → 1.37 s", label: "Median Spark voice turn, with 99% of input tokens cached" },
    ],
    video: "https://www.youtube.com/watch?v=RqihtHh110s",
    thumbnail: "/glassistant-thumb.webp",
    media: [
      { src: "/glassistant-ui-experiment.webp", alt: "In-run iPad screen: the plate fills in as wells are pipetted, with the current step and timers" },
      { src: "/glassistant-watching.mp4", alt: "Watching: the glasses mark wells on the iPad as they are filled" },
      { src: "/glassistant-search.mp4", alt: "A spoken question answered from the web" },
      { src: "/glassistant-handoff.mp4", alt: "Handoff: the as-run record becomes simulator-checked Opentrons code" },
    ],
  },

  context: {
    lede: "Wet-lab scientists pipette for hours with gloves on, then rebuild the record from memory.",
    problem:
      "A record written after the fact misses what actually happened at the bench, so a lab robot ends up repeating the plan instead of the real run. " +
      "We confirmed the problem in interviews with 6 biology PhDs and lab researchers.",
    myScope:
      "I led the team and wrote all of the engineering: the SwiftUI iPad app, the FastAPI server and agent, the SAM vision pipeline and the robot handoff. " +
      "Eunbi Cho owned product and interaction design.",
  },

  architecture: {
    lede: "Everything goes in one way: the glasses feed an iPad, the server decides, and a single run record is the source of truth.",
    image: {
      description: "Voice turn + Watching + Handoff around one run record",
      components: [
        { label: "Ray-Ban Meta Glasses", position: { x: 5, y: 50 } },
        { label: "iPad App (SwiftUI)", position: { x: 20, y: 50 } },
        { label: "FastAPI Server", position: { x: 36, y: 50 } },
        { label: "Muse Voice Transcribe", position: { x: 36, y: 18 } },
        { label: "Grammar Matcher", position: { x: 54, y: 30 } },
        { label: "Muse Spark 1.3 Agent", position: { x: 72, y: 30 } },
        { label: "Run Record (JSON Schema)", position: { x: 90, y: 50 } },
        { label: "SAM 3.1 Watching", position: { x: 54, y: 80 } },
        { label: "Opentrons Simulator + Checker", position: { x: 90, y: 82 } },
        { label: "Muse Glimmer 30B (Private)", position: { x: 72, y: 8 } },
      ],
      connections: [
        { from: 0, to: 1, label: "audio + photos" },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5, label: "no match" },
        { from: 4, to: 6, label: "exact command" },
        { from: 5, to: 6, label: "validated tool calls" },
        { from: 5, to: 9, label: "Private mode" },
        { from: 2, to: 7, label: "1 photo/s" },
        { from: 7, to: 6 },
        { from: 6, to: 8, label: "handoff" },
      ],
    },
    caption:
      "Critical path is the voice turn. Exact bench commands are answered by the grammar in about 0.1 s, everything else goes to Spark, and the server validates every tool call before it touches the record.",
    highlightedPath: [
      "Ray-Ban Meta Glasses",
      "iPad App (SwiftUI)",
      "FastAPI Server",
      "Muse Voice Transcribe",
      "Grammar Matcher",
      "Muse Spark 1.3 Agent",
      "Run Record (JSON Schema)",
    ],
  },

  decisions: {
    lede: "Three rules shaped the system: code checks what the model picks, vision never overrides a person, and private runs stay on our own GPU.",
    items: [
      {
        title: "Grammar first, the model second",
        problem: "Bench commands arrive every few seconds, and sending each one to an LLM costs latency, tokens and the occasional wrong tool call.",
        options: ["Send every utterance to Muse Spark", "Match exact bench commands with a grammar, and send only the rest to Spark"],
        decision:
          "A grammar answers exact commands. Everything else goes to Muse Spark 1.3 with strict schemas, and the server validates every call before it changes the record (\"the model picks, code checks\").",
        result:
          "Grammar hits take about 0.1 s on the server, return the same result every time and use no tokens. Multi-action requests went from 10 / 30 to 30 / 33 executed, and silent drops from 20 / 30 to 0 / 33.",
        tradeoff: "Phrasing outside the grammar always pays the full model round-trip.",
      },
      {
        title: "Watching: from video clips to one photo a second",
        problem: "Marking a well took 84 s from the moment the pipette tip landed, far too slow to follow a person at the bench.",
        options: [
          "Track only the pipette tip (32–38 s)",
          "Sample video at 3–3.5 fps instead of 7 (changed which wells were read)",
          "Drop shaken photos (threw away 21 of 40)",
          "Judge each photo as it arrives and re-find the plate every third photo",
        ],
        decision: "Photos are judged by SAM 3.1 as they arrive, and the plate is re-located every third photo instead of every frame.",
        result:
          "About 6 s per photo. Server compute per photo fell from 1.25 s to 0.53 s, SAM time stayed flat at 4.9–5.9 s instead of growing past 18 s, and SAM server errors went from 3 clips to 0.",
        tradeoff: "Fewer wells are caught: a stay under about 3 s can be missed, and one live session showed 9 of 12 wells (all 9 correct, 0 false).",
      },
      {
        title: "Private mode on a self-hosted model",
        problem: "Some runs should never leave the lab, so the run record cannot go to the hosted Meta Model API.",
        options: [
          "Hosted Muse Spark only",
          "Self-host Muse Glimmer 30B on Modal with the same tools and prompt (L40S, A10, H100 and A100 80 GB compared)",
        ],
        decision: "Glimmer 30B runs on llama.cpp with a DFlash draft model on an L40S, behind the same tools and prompt as Spark, with Apple Speech on the iPad.",
        result: "A turn went from 6.0 s to 1.5 s: decode rose from 27 to ~100 tok/s and prefill fell from 1.75 s to ~0.3 s, at $1.95 / h.",
        tradeoff: "Multi-action accuracy drops from 30 / 33 to 23 / 33, cold starts take 20–25 s, and Watching and Handoff are off in Private mode.",
      },
    ],
  },

  measurement: {
    lede: "Watching went from 84 s to about 6 s per photo, and every number here comes from the eval harnesses in the repo.",
    headline: { label: "Watching: pipette tip landing → well marked", before: "84 s", after: "~6 s" },
    method: {
      network: "TODO: network used for the live sessions",
      samples: "TODO: sessions behind the 84 s → 6 s figure",
      p50: "TODO: p50",
      p95: "TODO: p95",
    },
    before: [
      { stage: "SAM per photo", ms: "TODO: exact value (README: 18 s and growing)" },
      { stage: "Server compute per photo", ms: 1250 },
    ],
    after: [
      { stage: "SAM per photo", ms: "TODO: exact value (README: 4.9–5.9 s)" },
      { stage: "Server compute per photo", ms: 530 },
    ],
  },

  reliability: {
    lede: "The model is never trusted on its own: schemas, a simulator check and a human fallback sit between every model output and the lab.",
    bullets: [
      "**JSON Schema snapshot contract** with a version check between server and iPad, and the app shows an \"Out of sync\" banner on mismatch.",
      "**Handoff checker** compares the Opentrons simulator's command log with the approved record and names failures like \"D4 got 20 µL, not 25\". After three failures it hands the run back to the person.",
      "Unsure vision becomes a question to the user, never a silent edit to the record.",
      "`MODEL_MODE=recorded` replays model calls and blocks all outside network traffic, so 34 server test scripts and the eval harnesses run offline.",
      "Documented 3 Wearables DAT SDK issues (speech stalling after A2DP playback, silent A2DP during stream audio, no vocabulary hints).",
    ],
    details: [
      "**ASR paths** (146 rows, quiet room): Muse with keywords WER 0.09, 16 / 18 exact, p50 0.97 s; camera-stream audio to Muse WER 0.10, p50 0.66 s; Apple Speech WER 0.24–0.26; MWDATSpeech WER 0.25",
      "**Tool choice**: 25–27 / 28 spoken requests over 4 runs, with 42 actions available",
      "**Effort settings**: minimal 11 / 12 at 1,800 ms median, low 10 / 12 at 2,575 ms, contributor 12 / 12 at 3,253 ms",
      "**Web search**: correct source chosen 18 / 18, median latency 1,660–4,021 ms across runs",
      "**Live Watching sessions**: pen session 9 / 12 wells shown, 9 / 9 correct, 0 false, 6.3 s per photo; pipette session 4 / 4 shown, 4 / 4 correct, 0 false, 8.1 s per photo (each a single session, not a test set)",
      "**SAM tuning set**: desk 43 / 55 wells with 10 false over 14 clips; hand 16 / 16 wells with 0 false over 4 clips",
      "**Glimmer fallback**: Try again / Use Full when the GPU can't wake, and a prompt to switch to Full for documents too long for Glimmer",
    ],
  },

  limits: {
    lede: "Watching and the evaluation are hackathon-grade, and the demo protocols are synthetic.",
    items: [
      {
        today: "Watching misses stays under about 3 s and some outer wells, because the designed parallax correction is not applied yet.",
        atScale: "Apply the parallax correction from the design doc and tune on a larger set of plates and pipettes.",
      },
      {
        today: "The held-out confirm set for the 90% accuracy bar was never filmed, so accuracy comes from single live sessions and a tuning set.",
        atScale: "Film the confirm set and report accuracy against the 90% bar on data the pipeline was never tuned on.",
      },
      {
        today: "Demo protocols and data are synthetic.",
        atScale: "Move to real lab runs; the stated next step is Oakley Meta Vanguard (IP67) glasses for wet-bench use.",
      },
      {
        today: "Private mode trades accuracy and features for privacy: 23 / 33 multi-action, 20–25 s cold starts, no Watching or Handoff.",
        atScale: "Keep one GPU container warm (`GLIMMER_KEEP_WARM=1`) to skip cold starts, at $46.80 a day on an L40S.",
      },
    ],
  },

  learnings: {
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: ["TODO: learning 1", "TODO: learning 2"],
  },

  deepDive: [
    {
      kind: "images",
      label: "iPad UI (Figma)",
      items: [
        { src: "/glassistant-ui-well.webp", alt: "Well card: what went into a single well, and when" },
        { src: "/glassistant-ui-handoff.webp", alt: "Handoff: the as-run record checked in the Opentrons simulator" },
      ],
    },
    {
      kind: "text",
      label: "Design rules",
      body:
        "**One way in.** Glasses, iPad and voice all enter through the same server path, so there is one run record.\n" +
        "**The model picks, code checks.** Spark proposes tool calls; the server validates each against a schema before it changes anything.\n" +
        "**Vision never overrides a person.** When SAM is unsure, Milo asks instead of editing the record.",
    },
    {
      kind: "text",
      label: "What Watching tried before it worked",
      body:
        "Tracking the tip only: 32–38 s. Sampling video at 3–3.5 fps instead of 7: changed which wells were read. Leaving the pen out of ORB matching: mean delay rose to 41–50 s and was rolled back. Dropping shaken photos: dropped 21 of 40 photos and was removed. Unused fallbacks kept in the design doc: a RANSAC grid fit and a \"pipette\" prompt.",
    },
  ],
};
