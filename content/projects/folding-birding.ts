import type { Project } from "./types";

export const foldingBirding: Project = {
  slug: "folding-birding",
  summary: {
    eyebrow: "Mixed reality exhibit · Meta Quest 3",
    title: "Folding Birding",
    tagline: "Visitors fold a paper bird, then meet it alive in mixed reality.",
    role: "TODO: your role (Dev team: texturing, scan, XR, admin tablet)",
    team: "TODO: team size (Research, Dev and Design sub-teams)",
    duration: "TODO: dates",
    links: {},
    stack: {
      XR: ["Unity", "C#", "Meta XR SDK", "Interaction SDK hand tracking", "MR passthrough", "OVRSpatialAnchor (MRUK)"],
      Scan: ["OpenCV", "Python", "REST API"],
      Hardware: ["Meta Quest 3"],
    },
    stats: [
      { value: "6", label: "Bird states driven by hand gestures" },
      { value: "1 m", label: "Distance the bird keeps while following you" },
      { value: "3", label: "Steps: pick a texture, apply it, play in MR" },
    ],
    mediaLayout: "grid",
    media: [
      { src: "/projects/birding-affection.mp4", alt: "Touching the bird triggers a heart effect", title: "Touch.", body: "Stroke the bird's head gently and it answers with a heart." },
      { src: "/projects/birding-call.mp4", alt: "Call", title: "Call.", body: "Raise a hand above your head and the bird flies closer." },
      { src: "/projects/birding-follow.mp4", alt: "Follow", title: "Follow.", body: "The bird follows you around the space, about 1 m away." },
      { src: "/projects/birding-direct-a.mp4", alt: "Direct A", title: "Direct, with one finger.", body: "Extend the index finger and fold the rest to send the bird somewhere." },
      { src: "/projects/birding-direct-b.mp4", alt: "Direct B", title: "Direct, with an open palm.", body: "Open the hand, palm up, to give it a place to land." },
      { src: "/projects/birding-bye.mp4", alt: "Bye", title: "Bye.", body: "A pinky-promise gesture and the bird flies away." },
    ],
  },

  context: {
    lede: "Most exhibits ask you to look. This one asks you to make something, then play with it.",
    problem:
      "A visitor's hand-decorated paper bird had to become a living 3D bird in the room within the visit. " +
      "And the virtual space had to stay locked to the physical hall across every session of a long-running exhibit.",
    myScope: "TODO: which parts you built (texturing, scan, XR, admin tablet).",
  },

  architecture: {
    lede: "A phone scans the paper bird, OpenCV extracts its pattern, and Unity applies it to a 3D model anchored in the hall.",
    image: {
      description: "Paper bird scan → OpenCV texture → REST server → Unity MR on Quest 3",
      components: [
        { label: "Paper Bird", position: { x: 6, y: 50 } },
        { label: "Mobile Camera", position: { x: 20, y: 50 } },
        { label: "OpenCV Texture Extract", position: { x: 36, y: 50 } },
        { label: "REST Server", position: { x: 52, y: 50 } },
        { label: "Unity Texture List", position: { x: 68, y: 30 } },
        { label: "3D Bird Material", position: { x: 84, y: 30 } },
        { label: "Hand Gesture Input", position: { x: 68, y: 75 } },
        { label: "Spatial Anchors", position: { x: 84, y: 75 } },
        { label: "MR Scene on Quest 3", position: { x: 95, y: 52 } },
      ],
      connections: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3, label: "texture" },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 8 },
        { from: 6, to: 8 },
        { from: 7, to: 8 },
      ],
    },
    caption: "Highlighted: a visitor's paper bird becoming their 3D bird.",
    highlightedPath: ["Paper Bird", "Mobile Camera", "OpenCV Texture Extract", "REST Server", "Unity Texture List", "3D Bird Material", "MR Scene on Quest 3"],
  },

  decisions: {
    lede: "Two choices made it work as an exhibit: real paper as the input, and anchors that survive restarts.",
    items: [
      {
        title: "Texture the bird from the real paper",
        problem: "The bird should feel like the visitor's own creation, not a preset.",
        options: ["Pick from preset skins", "Scan the folded paper and map its pattern"],
        decision: "A phone captures the bird, OpenCV extracts contours and vertices, and the texture goes to Unity as a Material via REST.",
        result: "Each visitor finds their own pattern in the headset list, taps their name and sees it on the 3D bird.",
        tradeoff: "TODO: confirm. For example, scan quality depends on lighting and how flat the paper is.",
      },
      {
        title: "Persist spatial anchors across sessions",
        problem: "The virtual fence and spawn points drift out of place every time the headset restarts.",
        options: ["Re-place content by hand each session", "Persisted OVRSpatialAnchor with UUIDs"],
        decision: "Anchor UUIDs are serialized to local storage and relocalized at startup.",
        result: "The fence and bird spawn points stay aligned with the exhibit hall across sessions.",
        tradeoff: "TODO: confirm. For example, anchors are stored per device, so each headset needs its own setup.",
      },
      {
        title: "Gestures instead of buttons",
        problem: "Visitors pick it up in seconds, and the interaction should feel like bonding, not using a menu.",
        options: ["Controller buttons", "Hand-tracked gestures mapped to bird states"],
        decision: "Six states, Idle → Call → Follow → Direct → Affection → Bye, each tied to a gesture.",
        result: "Raising a hand, pointing, an open palm and a touch all mean what they look like.",
        tradeoff: "TODO: confirm. For example, similar hand poses can be misread.",
      },
    ],
  },

  measurement: {
    lede: "No timing or visitor numbers were recorded for the exhibit.",
    headline: { label: "TODO: what was measured", before: "TODO: before", after: "TODO: after" },
    method: {
      network: "TODO: network between scan server and headset",
      samples: "TODO: number of scans or visitors",
      p50: "TODO: p50",
      p95: "TODO: p95",
    },
    before: [{ stage: "TODO: baseline stage", ms: "TODO: measure" }],
    after: [
      { stage: "Scan → OpenCV texture", ms: "TODO: measure" },
      { stage: "Texture fetch → applied in Unity", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "Built to run all day in one hall without being re-aligned.",
    bullets: [
      "**Persistent spatial anchors** relocalize the fence and spawn points on every launch.",
      "Textures are stored on the **server**, so the headset list shows every registered bird.",
      "A low-poly fairytale environment with custom sky shaders and fog shows time passing.",
    ],
  },

  limits: {
    lede: "TODO: confirm what broke or felt fragile during the exhibit.",
    items: [
      {
        today: "TODO: confirm. For example, anchors are saved locally on one headset.",
        atScale: "TODO: confirm. For example, shared cloud anchors across several headsets.",
      },
    ],
  },

  learnings: {
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: [
      "TODO: confirm. For example, a physical artifact makes the virtual one matter.",
      "TODO: confirm. For example, exhibits need persistence more than features.",
    ],
  },

  deepDive: [
    {
      kind: "images",
      label: "Design and flow",
      items: [
        { src: "/projects/birding-design.png", alt: "Folding Birding design system" },
        { src: "/projects/birding-interfaces.jpg", alt: "Step 1: the list of registered bird textures in the headset" },
        { src: "/projects/birding-selection.jpg", alt: "Step 2: selecting your name applies your design to the bird" },
        { src: "/projects/birding-mr.jpg", alt: "Step 3: interacting with your bird in mixed reality" },
        { src: "/projects/birding-texture.png", alt: "A custom paper texture applied to the 3D bird" },
        { src: "/projects/birding-flow.png", alt: "State-interaction diagram: Idle, Call, Follow, Direct, Affection, Bye" },
      ],
    },
    {
      kind: "text",
      label: "Team",
      body:
        "**Research** set the concept, the XR UX flow and the functional spec. **Dev** built texturing, scanning, the XR app and the admin tablet. **Design** made the logo, 3D models and animation, and the spatial environment.",
    },
  ],
};
