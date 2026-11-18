import type { Project } from "./types";

export const ptsdVr: Project = {
  slug: "ptsd-vr",
  summary: {
    eyebrow: "Extended reality · EST 440 interdisciplinary research",
    title: "Adaptive VR for PTSD Exposure Therapy",
    tagline: "A Quest 3 prototype that lets clinicians dial trauma cues up, down or off.",
    role: "TODO: your role on Team 3",
    team: "TODO: Team 3 size and roles",
    duration: "TODO: semester and dates",
    links: {},
    stack: {
      XR: ["Unity 6 (6000.0.45f1)", "URP 17.0.4", "Meta XR SDK 78.0.0", "XR Interaction Toolkit 3.0.9", "OpenXR 1.14.3"],
      Hardware: ["Meta Quest 3", "Hand tracking (26 joints per hand)"],
      Safety: ["Node.js WebSocket server", "C#"],
    },
    stats: [
      { value: "3", label: "Graded exposure stages, from sound to field hospital" },
      { value: "26", label: "Tracked joints per hand, so no controllers" },
      { value: "0–10", label: "In-headset distress (SUDs) prompt after every stage" },
    ],
    media: [
      { src: "/projects/ptsd-thumb.mp4", alt: "The exposure therapy prototype running on Meta Quest 3" },
      {
        src: "/projects/ptsd-sound.mp4",
        alt: "Stage 1: sound exposure",
        title: "Stage 1. Sound only.",
        body: "Gunshots and explosions play with no visual context, so the first step is auditory habituation alone.",
      },
      {
        src: "/projects/ptsd-forest.mp4",
        alt: "Stage 2: the real room fades into a virtual forest",
        title: "Stage 2. The room fades away.",
        body: "Passthrough slowly fades out as a virtual forest fills the field of view, pairing the sounds with a place.",
      },
      {
        src: "/projects/ptsd-hospital.mp4",
        alt: "Stage 3: a military field hospital",
        title: "Stage 3. The field hospital.",
        body: "The heaviest context: a military field hospital with injured soldiers and pain-related audio.",
      },
      {
        src: "/projects/ptsd-kill.mp4",
        alt: "The clinician kill switch ending a session",
        title: "One button ends it.",
        body: "If distress passes a safety threshold, the clinician sends a hard stop over WebSocket and the simulation ends instantly.",
      },
    ],
  },

  context: {
    lede: "Exposure therapy works, but it is usually static, co-located and hard to repeat exactly.",
    problem:
      "Clinicians need to control how intense, how close and how long each trauma cue is, without risking re-traumatization. " +
      "The idea was \"Therapy as Software\": parametric exposure in a safe, repeatable headset session.",
    myScope: "TODO: what you personally built on Team 3.",
  },

  architecture: {
    lede: "The headset runs a graded scene sequence, an adaptive layer reads distress, and a clinician dashboard can override it at any time.",
    image: {
      description: "Quest 3 exposure stages with adaptive control and a WebSocket kill switch",
      components: [
        { label: "Clinician Dashboard", position: { x: 8, y: 25 } },
        { label: "Node.js WebSocket Server", position: { x: 30, y: 25 } },
        { label: "Biometric Sensors (HRV)", position: { x: 8, y: 75 } },
        { label: "Adaptive Algorithm", position: { x: 30, y: 75 } },
        { label: "Trigger Control API", position: { x: 52, y: 75 } },
        { label: "Unity App on Quest 3", position: { x: 52, y: 25 } },
        { label: "Stage 1-3 Scenes", position: { x: 75, y: 50 } },
        { label: "SUDs Prompt (0-10)", position: { x: 92, y: 75 } },
      ],
      connections: [
        { from: 0, to: 1, label: "hard stop" },
        { from: 1, to: 5 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 6, label: "sound, light, proximity" },
        { from: 5, to: 6 },
        { from: 6, to: 7 },
        { from: 7, to: 3 },
      ],
    },
    caption: "Highlighted: the safety override, from the clinician's button to the running scene.",
    highlightedPath: ["Clinician Dashboard", "Node.js WebSocket Server", "Unity App on Quest 3", "Stage 1-3 Scenes"],
  },

  decisions: {
    lede: "Every choice serves one rule: exposure stays inside the therapeutic window, and a person can always stop it.",
    items: [
      {
        title: "A WebSocket kill switch for the clinician",
        problem: "Exposure can cause dissociation or overwhelming distress, and the clinician must be able to end it at once.",
        options: ["TODO: confirm alternatives considered", "Node.js WebSocket link between dashboard and headset"],
        decision: "A dedicated Node.js server carries a real-time hard stop from the clinician's dashboard to the headset.",
        result: "The clinician can terminate the simulation instantly when physiological or self-reported distress passes a threshold.",
        tradeoff: "TODO: confirm. For example, the stop depends on the network link between dashboard and headset.",
      },
      {
        title: "Hand tracking instead of controllers",
        problem: "Holding controllers breaks immersion and adds friction during a sensitive session.",
        options: ["Quest controllers", "Hand tracking with 26 joints per hand"],
        decision: "No controllers. Patients clap to move between stages.",
        result: "Navigation is one intuitive gesture that keeps the patient in the therapeutic state.",
        tradeoff: "TODO: confirm. For example, hand tracking is less reliable in poor lighting.",
      },
      {
        title: "Fuse self-report with biometrics",
        problem: "Neither a patient's report nor a sensor reading alone says enough about distress.",
        options: ["Self-report only", "Biometrics only", "Both, fused by an adaptive algorithm"],
        decision: "An adaptive algorithm combines 0–10 SUDs prompts with HRV and arousal indicators.",
        result: "Exposure intensity can track the patient, and every stage leaves a SUDs record for clinical review.",
        tradeoff: "TODO: confirm how far the biometric loop was implemented versus designed.",
      },
    ],
  },

  measurement: {
    lede: "This is a research prototype. No latency, clinical or user-study numbers were recorded.",
    headline: { label: "TODO: what was measured", before: "TODO: before", after: "TODO: after" },
    method: {
      network: "TODO: network between dashboard and headset",
      samples: "TODO: number of sessions",
      p50: "TODO: p50",
      p95: "TODO: p95",
    },
    before: [{ stage: "TODO: baseline stage", ms: "TODO: measure" }],
    after: [
      { stage: "Kill switch: dashboard → headset stop", ms: "TODO: measure" },
      { stage: "Stage transition (clap gesture)", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "Safety is a separate layer, not a feature of the scenes.",
    bullets: [
      "The **kill switch** ends the simulation immediately, independent of which stage is running.",
      "Exposure is **graded**: sound first, then audio-visual, then the field hospital.",
      "Every stage ends with a **0–10 SUDs prompt** inside VR, so distress is logged for clinical review.",
      "Designed against the **Software as a Medical Device (SaMD)** framework, with HIPAA/GDPR data governance in mind.",
    ],
  },

  limits: {
    lede: "It is a prototype built for a course, not a validated clinical tool.",
    items: [
      {
        today: "The system has not been tested with patients.",
        atScale: "TODO: confirm. For example, an IRB-approved pilot with clinicians.",
      },
      {
        today: "SaMD and HIPAA/GDPR are design targets, not certifications.",
        atScale: "TODO: confirm. For example, a regulatory review before any clinical use.",
      },
    ],
  },

  learnings: {
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: [
      "TODO: confirm. For example, in clinical XR the stop button matters more than the scene.",
      "TODO: confirm. For example, controller-free input keeps users in the moment.",
    ],
  },
};
