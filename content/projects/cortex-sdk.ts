import type { Project } from "./types";

export const cortexSdk: Project = {
  slug: "cortex-sdk",
  summary: {
    eyebrow: "Wearable vision middleware · Paper submitted Apr 2026",
    title: "CORTEX",
    tagline: "Battery-aware middleware that decides which wearable camera frames are worth sending to a VLM.",
    role: "Solo Researcher & Engineer",
    team: "Solo",
    duration: "9 days (Mar 30 – Apr 7, 2026)",
    links: { repo: "https://github.com/Dongckim/cortex-sdk" },
    stack: {
      Core: ["Python 3.11+", "NumPy", "Pillow", "httpx"],
      Vision: ["OpenCV", "scikit-image (SSIM)", "Laplacian blur detection", "MSER text detection", "Spectral saliency"],
      Testing: ["pytest"],
    },
    stats: [
      { value: "60%+", label: "Target cut in frames sent to VLM APIs (design target)" },
      { value: "2×", label: "Target battery extension (design target)" },
      { value: "186", label: "pytest tests across capture, optimizer, memory, graph and compiler" },
    ],
    media: [
      { src: "/cortex-demo.mp4", alt: "CORTEX filtering redundant camera frames" },
    ],
  },

  context: {
    lede: "Smart glasses stream ~30 fps to VLM APIs even when nothing in the scene has changed.",
    problem:
      "Static scenes, unchanged whiteboards and blurry frames still cost tokens and drain the wearable battery on every call. " +
      "The fix had to be a drop-in layer that decides in real time whether a frame is worth sending, then shrinks it, with no hardware changes or model retraining.",
    myScope: "I designed and built the SDK alone, and wrote the accompanying arXiv paper on the 4-layer architecture and benchmark method.",
  },

  architecture: {
    lede: "Four layers sit between the camera and the model: capture gating, compression, routing and context memory.",
    image: {
      "description": "4-Layer Middleware: Gate → Crop → Route → Memory",
      "components": [
        {
          "label": "Smart Glasses Camera",
          "position": {
            "x": 5,
            "y": 50
          }
        },
        {
          "label": "L1 IMU Gate",
          "position": {
            "x": 20,
            "y": 28
          }
        },
        {
          "label": "L1 Blur Detector",
          "position": {
            "x": 20,
            "y": 50
          }
        },
        {
          "label": "L1 SSIM Filter",
          "position": {
            "x": 20,
            "y": 72
          }
        },
        {
          "label": "L2 Scene Classifier",
          "position": {
            "x": 42,
            "y": 35
          }
        },
        {
          "label": "L2 ROI Crop + Encode",
          "position": {
            "x": 42,
            "y": 65
          }
        },
        {
          "label": "L3 VLM Router",
          "position": {
            "x": 62,
            "y": 35
          }
        },
        {
          "label": "L4 Context Memory",
          "position": {
            "x": 62,
            "y": 72
          }
        },
        {
          "label": "Claude / GPT / Gemini",
          "position": {
            "x": 82,
            "y": 35
          }
        },
        {
          "label": "Circuit Breaker",
          "position": {
            "x": 82,
            "y": 65
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
          "from": 0,
          "to": 3
        },
        {
          "from": 1,
          "to": 4
        },
        {
          "from": 2,
          "to": 4
        },
        {
          "from": 3,
          "to": 5
        },
        {
          "from": 4,
          "to": 6
        },
        {
          "from": 5,
          "to": 6
        },
        {
          "from": 6,
          "to": 8
        },
        {
          "from": 6,
          "to": 9
        },
        {
          "from": 7,
          "to": 6
        }
      ]
    },
    caption: "Highlighted: the path an accepted frame takes. Most frames stop at an L1 gate.",
    highlightedPath: ["Smart Glasses Camera", "L1 IMU Gate", "L1 Blur Detector", "L1 SSIM Filter", "L2 ROI Crop + Encode", "L3 VLM Router", "Claude / GPT / Gemini"],
  },

  decisions: {
    lede: "Each L1 and L2 choice trades a little sensitivity for a large cut in what reaches the API.",
    items: [
      {
        title: "SSIM instead of pixel difference for scene change",
        problem: "Naive pixel subtraction flags minor lighting changes and JPEG artifacts as a new scene.",
        options: ["Pixel diff", "Structural Similarity (SSIM)"],
        decision: "An SSIM gate against a persisted reference frame, with a tunable threshold of 0.85–0.95.",
        result: "Robust to small lighting and compression noise, and integrators can tune sensitivity against battery savings.",
        tradeoff: "A sudden flash drops SSIM to ~0.4 with no semantic change, so the threshold needs tuning per environment.",
      },
      {
        title: "Run the cheap blur check before SSIM",
        problem: "SSIM is the most expensive L1 check, and blurry frames are useless anyway.",
        options: ["SSIM on every frame", "Laplacian variance first, SSIM only on sharp frames"],
        decision: "Laplacian variance (O(n)) runs before SSIM (O(n log n)).",
        result: "The blur check drops ~15% of frames before the more expensive comparison runs.",
        tradeoff: "A blur threshold set too high also rejects legitimately low-texture scenes, such as all-black or all-white frames.",
      },
      {
        title: "Lower JPEG quality instead of resolution",
        problem: "Accepted frames still need to be as small as possible without hurting VLM answers.",
        options: ["Scale resolution down", "Adaptive JPEG quality"],
        decision: "Drop JPEG quality from 85 to 55, adjusted per frame against the current network state.",
        result: "Payload shrinks ~3× with minimal VLM accuracy loss on text and object recognition.",
        tradeoff: "TODO: confirm the measured accuracy loss and on which tasks.",
      },
    ],
  },

  measurement: {
    lede: "Numba JIT cut the saliency DFT kernel from 0.421 ms to 0.185 ms per 640×480 frame, and the whole L2 stage runs in about 9.5 ms.",
    headline: { label: "Saliency DFT kernel per 640×480 frame (baseline → Numba JIT)", before: "0.421 ms", after: "0.185 ms" },
    method: {
      network: "None: local, MacBook Pro M2, synthetic frames",
      samples: 100,
      p50: "0.185 ms (median of 100, JIT)",
      p95: "TODO: p95",
    },
    before: [
      { stage: "Capture + encode (every frame)", ms: "TODO: measure" },
      { stage: "VLM call", ms: "TODO: measure" },
    ],
    after: [
      { stage: "L1 gates (IMU, blur, SSIM)", ms: "TODO: measure" },
      { stage: "L2 ROI crop + adaptive encode", ms: "TODO: measure" },
      { stage: "VLM call (accepted frames only)", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "No single bad frame can crash the pipeline, and 186 pytest tests cover the built layers.",
    bullets: [
      "**186 pytest tests** across optimizer (59), memory (35), graph (33), capture (29) and compiler (20). The SSIM gate, blur detector, ROI crop and adaptive encoder each have isolated tests using synthetic frames.",
      "A webcam demo with a live HUD showed accepted and rejected counts, SSIM scores and payload sizes across 3 scene types: static whiteboard, hand movement and walking.",
      "L1 gate errors such as an OpenCV decode failure return `(False, 0.0)`, so the frame is dropped instead of crashing the pipeline.",
      "Out-of-bounds L2 ROI crops are clamped with `np.clip` and never raise `IndexError`.",
    ],
    details: [
      "**All-black / all-white frames**: Laplacian variance = 0 → rejected as blurry before SSIM",
      "**Scene flash (sudden brightness change)**: SSIM drops to ~0.4 even with no semantic change → threshold tuning guide in docs",
      "**MSER on low-contrast text**: falls back to a center crop when fewer than 5 text regions are detected",
      "**Tiny frames (<64×64)**: spatial pyramid pooling skipped, direct encode",
      "**Network switch WiFi→LTE mid-session**: adaptive encoder re-reads network state per frame (no restart needed)",
    ],
  },

  limits: {
    lede: "L1 and L2 are built and tested, while routing and the headline savings are still unproven.",
    items: [
      {
        today: "The L3 VLM router's circuit breaker is planned, not built.",
        atScale: "Track the error rate per provider, open the circuit after more than 3 consecutive failures (30 s), and fall back to the next configured model.",
      },
      {
        today: "Validation used a webcam demo, not glasses hardware, so battery impact has not been measured on a device.",
        atScale: "TODO: confirm. For example, on-device power measurement on the target glasses.",
      },
      {
        today: "SSIM and blur thresholds are global, and a scene flash can trigger false positives.",
        atScale: "TODO: confirm. For example, per-scene or adaptive thresholds learned from session history.",
      },
    ],
  },

  learnings: {
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: [
      "TODO: confirm. For example, order filters by cost so the cheapest checks reject the most frames first.",
      "TODO: confirm. For example, state targets and measured results separately until the benchmark exists.",
    ],
  },

  deepDive: [
    {
      kind: "text",
      label: "Measured L2 profile (paper §6.1, MacBook Pro M2, 640×480, median of 100 runs after 10 warm-ups)",
      body:
        "text_roi_mser 8.11 ms (85% of L2) · motion_map 0.95 ms · saliency_dft 0.43 ms · center_crop 0.03 ms · score_fusion 0.01 ms · ema_smooth 0.003 ms. Total ≈ 9.5 ms per frame; dead-node elimination brings POWER_SAVE to ≈ 9.1 ms.\n" +
        "Saliency DFT kernel: baseline 0.421 ms → vectorized 0.225 ms (1.9×) → Numba JIT 0.185 ms (2.3×), max numerical difference < 1.2e-7.\n" +
        "Payload, battery and API-cost figures (60%+, 2×, 50%+) are design targets in the paper's Table 4, not measurements.",
    },
    {
      kind: "code",
      label: "L1: Capture — \"Should we process this frame?\"",
      language: "markdown",
      snippet: `New camera frame arrives
  │
  ├─ IMU Gate (motion sensor check)
  │    └─ acceleration below threshold? → skip (camera still, likely static scene)
  │
  ├─ Blur Detector (Laplacian variance)
  │    └─ variance < blur_threshold? → skip (frame too blurry for VLM)
  │
  ├─ Scene Change Detector (SSIM vs last accepted frame)
  │    ├─ SSIM > similarity_threshold (e.g. 0.92)? → skip (scene unchanged)
  │    └─ SSIM ≤ threshold → ACCEPT
  │         └─ update "last accepted frame" reference
  │
  Result: maximizes camera-off time; only meaningful frames pass to
  Target: 60%+ of frames filtered before any encode/API call`,
    },
    {
      kind: "code",
      label: "L2: Compress — \"What part matters? How small can it be?\"",
      language: "markdown",
      snippet: `Accepted frame (from L1)
  │
  ├─ Scene Classifier
  │    ├─ "text-heavy" → MSER text region detection → crop to text bounding box
  │    ├─ "face/object" → spectral saliency map → crop to salient region
  │    └─ "general"    → center-weighted crop (safe fallback)
  │
  ├─ Hybrid ROI Crop
  │    └─ expand bounding box by context_margin (avoid cutting off context)
  │         └─ clamp to frame boundary
  │
  ├─ Adaptive Encoder
  │    ├─ WiFi detected      → JPEG quality 85, max 1024px
  │    ├─ LTE detected       → JPEG quality 70, max 768px
  │    └─ low-battery mode   → JPEG quality 55, max 512px
  │
  └─ Output: compressed JPEG bytes (typically 40-120 KB vs 2+ MB raw)`,
    },
    {
      kind: "code",
      label: "L1 Core — SSIM scene change gate",
      language: "python",
      snippet: `def should_process_frame(self, frame: np.ndarray) -> tuple[bool, float]:
    """
    Returns (should_process, ssim_score).
    Rejects frames too similar to the last accepted frame.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # First frame always accepted
    if self._last_frame is None:
        self._last_frame = gray
        return True, 0.0

    score, _ = ssim(self._last_frame, gray, full=True)

    if score >= self.similarity_threshold:   # e.g. 0.92
        return False, score                  # scene unchanged → skip

    self._last_frame = gray                  # update reference
    return True, score`,
    },
    {
      kind: "text",
      label: "More notes",
      body:
        "**State across frames**: the SSIM reference frame and ROI classifier state persist across frames, which gives temporal coherence without a full video encoder.\n" +
        "**Drop-in API**: integrators call `pipeline.process(frame)` and receive `(should_call_vlm, payload_bytes)`, with no changes to existing VLM integration code.\n" +
        "**Paper**: accompanied by an arXiv paper (cortex-arxiv-v5) formalizing the 4-layer architecture and benchmark methodology.",
    },
  ],
};
