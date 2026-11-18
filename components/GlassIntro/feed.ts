// All intro copy, plus the point-of-view footage and the scripted scene data drawn over it.
// Frames live in /public/intro/feed/0001.jpg … (FEED.count of them); boxes are in normalised frame coordinates.

export const FEED = {
  dir: "/intro/feed",
  ext: "jpg",
  count: 102,
  width: 1920,
  height: 1080,
};

/* ---------- copy ---------- */

// 3D part callouts in Analyze
export const PART_LABELS = [
  { part: "cam", name: "Camera", tag: "Computer vision" },
  { part: "lensL", name: "Lens", tag: "Spatial UI" },
  { part: "frame", name: "Frame", tag: "Product design" },
  { part: "boardR", name: "Logic board", tag: "Embedded systems" },
  { part: "batteryR", name: "Battery", tag: "Rapid prototyping" },
  { part: "speakerR", name: "Speaker", tag: "Interaction design" },
];

// interface strings
export const UI = {
  section: "Smart glasses: what is inside, and what they see",
  skip: "Skip intro",
  drag: "Drag to rotate",
  scrollHint: "Scroll to explore",
  dragHint: "or drag the glasses to rotate",
  loading: "Loading model",
  loadingLabel: "Loading 3D model",
};

export const QUESTION = "What's coming?";
export const SPOKEN = "Deep shot coming. Likely completion.";
export const BOARD_LABEL = "Cover 2";

// one caption per scene. Scenes 03–06 lead with a one-word title; `spoken` reveals the line word by word.
export const CAPTIONS: { num?: string; word?: string; title: string; lead?: string; body?: string; spoken?: boolean }[] = [
  { num: "Smart glasses & end-to-end AI production engineer", title: "Dongchan\nKim", lead: "I build AI glasses, and the AI behind them." },
  { num: "01 / Analyze", title: "Take it apart first.", body: "Every part, and what it taught me. Select one." },
  { num: "02 / Wear", title: "Then put it on.", body: "And see what it sees." },
  { word: "See.", title: "It sees what you see.", body: "Every player in view. Detected in 9 ms. On device." },
  { word: "Understand.", title: "Pixels become structure.", body: "A scene graph, built on device. The model gets the graph, never the video." },
  { word: "Predict.", title: "Then it looks ahead.", body: "A policy ranks the next play. 14 ms." },
  { word: "Throw.", title: "Then the ball is in the air." },
  { word: "Score.", title: "Called it.", body: "Post route, 71%. Touchdown." },
  { word: "Speak.", title: SPOKEN, spoken: true },
  { word: "Augmented.", title: "A game today. Anything tomorrow.", body: "From the sensor on your face, to the model, back to your ear." },
];

// readout beside the scenes: each stage of the pipeline lights up as the intro reaches it ([stage, detail, first scene index])
export const PIPELINE: [string, string, number][] = [
  ["Capture", "1080p · 24 fps", 3], ["Detect", "22 objects · 9 ms", 3], ["Track", "stable IDs", 3],
  ["Scene graph", "22 nodes · Cover 2", 4], ["Policy", "post 0.71 · 14 ms", 5], ["Voice", "on-ear, private", 8],
];
// the closing diagram: the whole system, glasses to model and back
export const SYSTEM: [string, string, string?][] = [
  ["Sensor", "Camera · IMU"], ["On-device vision", "Detect · track", "Vision"], ["Scene graph", "Structure, not pixels"],
  ["AI model", "Policy · language"], ["Voice", "Back to your ear"],
];

export const STEPS = ["Analyze", "Wear", "See", "Understand", "Predict", "Throw", "Score", "Speak"];
// tag that lands on the ball once it is in the air
export const THROW_TAG = "As predicted";

/* ---------- scene data ---------- */

// See + Understand hold on this pre-snap frame; the footage plays up to it during Wear
export const FREEZE_FRAME = 20;

// every player visible in the frozen frame: [x, y, w, h] in 0–1 of the frame
export const FROZEN: { side: "Offense" | "Defense"; box: [number, number, number, number]; name?: string }[] = [
  { side: "Offense", box: [0.49, 0.41, 0.06, 0.4], name: "Quarterback" },
  { side: "Offense", box: [0.205, 0.29, 0.095, 0.26] },
  { side: "Offense", box: [0.335, 0.31, 0.085, 0.22] },
  { side: "Offense", box: [0.455, 0.28, 0.08, 0.22] },
  { side: "Offense", box: [0.595, 0.31, 0.07, 0.24] },
  { side: "Offense", box: [0.71, 0.31, 0.08, 0.26] },
  { side: "Offense", box: [0.875, 0.37, 0.095, 0.23] },
  { side: "Offense", box: [0.695, 0.45, 0.09, 0.34] },
  { side: "Defense", box: [0.135, 0.0, 0.045, 0.11] },
  { side: "Defense", box: [0.175, 0.125, 0.07, 0.185] },
  { side: "Defense", box: [0.03, 0.24, 0.065, 0.21] },
  { side: "Defense", box: [0.315, 0.275, 0.06, 0.145] },
  { side: "Defense", box: [0.555, 0.28, 0.055, 0.17] },
  { side: "Defense", box: [0.625, 0.145, 0.065, 0.175] },
  { side: "Defense", box: [0.73, 0.0, 0.045, 0.13] },
  { side: "Defense", box: [0.885, 0.22, 0.07, 0.21] },
];

// top-down board, 0–1: u across the field, v downfield→backfield (offense drives up, line of scrimmage at LOS)
export const LOS = 0.55;
export const BOARD: { side: "Offense" | "Defense"; u: number; v: number; safety?: boolean }[] = [
  // offense: five linemen, shotgun QB, back offset right, two receivers wide, slot, tight end
  ...[0.38, 0.44, 0.5, 0.56, 0.62].map((u) => ({ side: "Offense" as const, u, v: 0.6 })),
  { side: "Offense", u: 0.5, v: 0.74 }, { side: "Offense", u: 0.58, v: 0.75 },
  { side: "Offense", u: 0.08, v: 0.58 }, { side: "Offense", u: 0.92, v: 0.58 }, { side: "Offense", u: 0.79, v: 0.62 }, { side: "Offense", u: 0.69, v: 0.61 },
  // defense: four down, three linebackers, two corners, two deep safeties (cover 2)
  ...[0.41, 0.47, 0.53, 0.59].map((u) => ({ side: "Defense" as const, u, v: 0.5 })),
  ...[0.33, 0.5, 0.67].map((u) => ({ side: "Defense" as const, u, v: 0.4 })),
  { side: "Defense", u: 0.09, v: 0.45 }, { side: "Defense", u: 0.91, v: 0.45 },
  { side: "Defense", u: 0.28, v: 0.18, safety: true }, { side: "Defense", u: 0.72, v: 0.18, safety: true },
];

// Predict: safeties drift apart, the gap between them opens, and the policy weighs three throws (illustrative values).
// The picked one matches where the ball really goes in the footage: deep, middle-left.
export const SAFETY_DRIFT = 0.1;
export const SEAM: [number, number, number, number] = [0.36, 0.06, 0.62, 0.36]; // u0, v0, u1, v1
export const OPTIONS: { name: string; prob: number; route: [number, number][]; pick?: boolean }[] = [
  { name: "Post", prob: 0.71, route: [[0.08, 0.58], [0.08, 0.38], [0.45, 0.12]], pick: true },
  { name: "Out", prob: 0.18, route: [[0.92, 0.58], [0.92, 0.42], [0.99, 0.42]] },
  { name: "Check-down", prob: 0.11, route: [[0.58, 0.75], [0.7, 0.68]] },
];

// Throw: the play runs on from the frozen frame to the release; keyed every few frames where it moves fast
type Track = [number, number, number, number, number][]; // [frame, x, y, w, h]
export const QB_TRACK: Track = [
  [20, 0.49, 0.41, 0.06, 0.4], [30, 0.49, 0.41, 0.065, 0.4], [50, 0.515, 0.47, 0.065, 0.38], [75, 0.55, 0.5, 0.08, 0.43],
  [86, 0.54, 0.44, 0.08, 0.39], [90, 0.515, 0.44, 0.1, 0.39], [95, 0.5, 0.46, 0.1, 0.39], [99, 0.49, 0.42, 0.095, 0.39], [101, 0.5, 0.46, 0.1, 0.4],
];
export const BALL_TRACK: Track = [
  [86, 0.58, 0.515, 0.035, 0.05], [90, 0.585, 0.56, 0.035, 0.05], [92, 0.575, 0.5, 0.035, 0.05], [95, 0.565, 0.47, 0.03, 0.045],
  [99, 0.475, 0.115, 0.025, 0.035], [101, 0.43, 0.045, 0.025, 0.035],
];
export const RELEASE_FRAME = 95;

// Score: second clip, continuing from the throw's last frame — catch, run in, celebration with a push-in
// (1080p finals of both clips; boxes/keys are normalised so they carry over from the 480p drafts unchanged)
export const FEED2 = { dir: "/intro/feed2", ext: "jpg", count: 145 };
export const CATCH_FRAME = 50; // FEED2 frame of the catch
export const TD_FRAME = 100;   // FEED2 frame where the receiver crosses the goal line
export const RECEIVER_LABEL = "Receiver";
export const TOUCHDOWN = "Touchdown";
// ball and receiver in the second clip, [frame, x, y, w, h]; the camera whips from 0 to ~20 and follows the ball
const ball2 = (f: number, x: number, y: number): [number, number, number, number, number] => [f, x - 0.015, y - 0.0225, 0.03, 0.045];
export const BALL_TRACK2: [number, number, number, number, number][] = [
  ball2(0, 0.483, 0.125), ball2(3, 0.41, 0.02), ball2(6, 0.36, 0.005), ball2(9, 0.355, 0.035), ball2(12, 0.38, 0.105), ball2(15, 0.42, 0.15),
  ball2(18, 0.47, 0.21), ball2(21, 0.51, 0.23), ball2(24, 0.55, 0.225), ball2(30, 0.59, 0.2), ball2(36, 0.6, 0.19), ball2(42, 0.585, 0.215),
  ball2(45, 0.575, 0.24), ball2(48, 0.565, 0.255), ball2(50, 0.555, 0.27),
];
// keeps the field-centre team logo out of shot during the whip pan (frames 7–17 at desktop): extra zoom and a leftward
// shift of the zoom centre, [frame, zoom ×, centre dx] — found offline against the logo's pixels, interpolated linearly
export const LOGO_DODGE: [number, number, number][] = [[4, 1, 0], [7, 1.2, -0.12], [8, 1.25, -0.15], [9, 1.2, -0.13], [11, 1.1, -0.11], [13, 1, -0.1], [18, 1, 0]];
export const RECEIVER_TRACK2: [number, number, number, number, number][] = [
  [42, 0.555, 0.26, 0.1, 0.32], [50, 0.54, 0.24, 0.1, 0.38], [62, 0.505, 0.22, 0.13, 0.5], [74, 0.41, 0.2, 0.22, 0.6], [86, 0.46, 0.2, 0.18, 0.62],
  [96, 0.39, 0.17, 0.21, 0.72], [104, 0.4, 0.13, 0.22, 0.78], [112, 0.38, 0.14, 0.26, 0.8],
];
