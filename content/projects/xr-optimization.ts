import type { Project } from "./types";

export const xrOptimization: Project = {
  slug: "xr-optimization",
  summary: {
    eyebrow: "Mixed-reality K-pop theatre · SM Entertainment",
    title: "SM REALIVE",
    tagline: "A mixed-reality K-pop theatre: 8K stereo video, frame-synced across headsets, with hand-held cheering.",
    role: "VR Software Engineer",
    team: "TODO: team size",
    duration: "TODO: duration",
    links: { demo: "https://youtube.com/watch?v=UoeiSMDjMIo" },
    stack: {
      Headset: ["Unity", "C#", "HLSL (ShaderLab)", "Meta XR SDK", "XR Interaction Toolkit", "Passthrough API"],
      Server: ["Node.js", "Socket.io"],
      Ops: ["Docker", "Meta Horizon Managed Services", "Kiosk Mode"],
    },
    stats: [
      { value: "±1–2 frames", label: "Playback sync across 5 Quest 3 headsets" },
      { value: "8K", label: "Stereo video from a single decode" },
      { value: "50%", label: "Less decode memory, and less on-site setup time" },
    ],
    // Apple-style order: the alpha-test film, one key visual, then one row per idea. No loose gallery.
    video: "https://youtube.com/watch?v=UoeiSMDjMIo",
    mediaLayout: "grid",
    media: [
      {
        src: "/projects/sm-stereo.mp4",
        alt: "8K stereoscopic concert footage on a Quest 3",
        title: "8K stereo, decoded once.",
        body: "One `VideoPlayer` decodes a single 7680×3840 frame and custom UVs split it to each eye: half the decode memory, and the eyes can never drift apart.",
      },
      {
        src: "/projects/sm-sync.mp4",
        alt: "Master server monitoring every headset's playback position",
        title: "Every headset, the same frame.",
        body: "A master server sends play, pause and seek as **future timestamps**. Each Quest 3 converts that to its own clock and fires `VideoPlayer.Play()` at the same physical moment, holding drift to ±1–2 frames.",
      },
      {
        src: "/projects/sm-blend.mp4",
        alt: "The concert sphere fading into the real room through passthrough",
        title: "The concert fades into your room.",
        body: "A custom HLSL shader fades the video sphere by height, so the stage melts into the real room through passthrough instead of ending at a hard edge.",
      },
      {
        src: "/projects/sm-grab-after.mp4",
        alt: "A stable virtual cheering stick held in a tracked hand",
        title: "A cheering stick that stays in your hand.",
        body: "Physics grabbing jittered and dropped the stick when fans shook it. A thumb–index proximity check, anchor snapping and a holding-hand mesh keep it locked to the hand.",
      },
      {
        src: "/projects/sm-grab-before.mp4",
        alt: "Before: the cheering stick jittering with physics grab",
        title: "Before: physics grab.",
        body: "With a collider grab the stick floated, lagged and fell out of shaking hands, the problem the anchor fix solved.",
      },
      {
        src: "/projects/sm-5clients.jpg",
        alt: "Frame logs from five headsets overlaid",
        title: "Measured, frame by frame.",
        body: "Every headset logs its `CurrentFrame` to CSV during stress tests. Five clients stay within one to two frames of each other.",
      },
    ],
  },

  context: {
    lede: "A shared VR concert only works if everyone sees the same frame, in full 8K, and can still feel the room around them.",
    problem:
      "Standard replication across 5+ Quest 3 headsets drifted by more than 100 ms, and two-player stereo doubled the decode load on mobile hardware. " +
      "Physics-based grabbing also made the hand-held cheering stick jitter and fall out of fans' hands.",
    myScope: "As VR Software Engineer I built the master-client sync, the single-decode 8K stereo player, the passthrough blending shader and the cheering-stick interaction, plus the deployment pipeline.",
  },

  architecture: {
    lede: "A master server keeps every headset on one clock; inside each headset, one decoder feeds both eyes, a shader blends the stage into the room, and hand tracking drives the cheering stick.",
    image: {
      description: "Master-client sync · single-decode 8K stereo · passthrough blend · hand interaction",
      components: [
        { label: "Master Server", position: { x: 14, y: 22 } },
        { label: "Scheduled play", position: { x: 14, y: 70 } },
        { label: "Clock offset", position: { x: 40, y: 22 } },
        { label: "One 8K decode", position: { x: 40, y: 70 } },
        { label: "L / R eyes", position: { x: 64, y: 70 } },
        { label: "Height fade", position: { x: 64, y: 22 } },
        { label: "Passthrough", position: { x: 88, y: 22 } },
        { label: "Cheering stick", position: { x: 88, y: 70 } },
      ],
      connections: [
        { from: 0, to: 1 },
        { from: 0, to: 2, label: "per headset" },
        { from: 1, to: 3, label: "scheduled" },
        { from: 3, to: 4, label: "shared texture" },
        { from: 4, to: 5 },
        { from: 5, to: 6, label: "alpha" },
        { from: 4, to: 7 },
      ],
      groups: [{ label: "Each Meta Quest 3 (× 5, HMS-managed)", members: [2, 3, 4, 5, 6, 7], color: "#5AC8FA" }],
    },
    caption: "Critical path highlighted: a scheduled command reaches the single decoder, which feeds both eyes at the same frame.",
    highlightedPath: ["Master Server", "Scheduled play", "One 8K decode", "L / R eyes"],
  },

  decisions: {
    lede: "Three choices shaped the show: schedule in the future, decode once, and fade on the GPU.",
    items: [
      {
        title: "Schedule playback at a future server timestamp",
        problem: "Playing on packet arrival lets network jitter become frame drift above 100 ms.",
        options: ["Play when the command arrives", "Send a future server time and let each client wait locally"],
        decision:
          "Each client computes `timeOffset = ServerTime − LocalTime − RTT/2`, waits until the local equivalent of the target time, and seeks forward if the packet arrived late.",
        result: "±1–2 frame (≈33 ms) sync across 5 devices, validated with frame logs.",
        tradeoff: "Commands need lead time, and the RTT/2 estimate assumes symmetric latency.",
      },
      {
        title: "One decoder for both eyes",
        problem: "Stock stereo players run two `VideoPlayer`s, doubling decode load for 8K footage on a standalone headset.",
        options: ["Two players, one per eye", "One player rendering to a shared material, split per eye by UV"],
        decision: "A single `VideoPlayer` in `MaterialOverride` mode feeds two duplicated materials (`_EyeSelect` 0/1) on left and right spheres.",
        result: "Stutter-free 8K stereo with about 50% less decode memory, and no left/right drift by construction.",
        tradeoff: "Both eyes share one texture size, so per-eye resolution is half the frame width.",
      },
      {
        title: "Blend reality in the vertex shader",
        problem: "The bottom edge of the video sphere cut hard into the passthrough view.",
        options: ["C# opacity by head angle (`MaterialPropertyBlock`)", "HLSL alpha by world height in the vertex shader"],
        decision: "Fade per vertex with `saturate((y − _EndY) / range)`, `ZWrite Off` and standard alpha blending, keeping the C# angle zones for global opacity.",
        result: "A smooth stage-to-room transition with no per-frame CPU work for the gradient.",
        tradeoff: "The fade band is fixed in world height, so it is tuned per venue.",
      },
    ],
  },

  measurement: {
    lede: "Drift went from over 100 ms to about ±33 ms, measured by logging `CurrentFrame` from every client to CSV during stress tests.",
    headline: { label: "Inter-device playback drift", before: "> 100 ms", after: "≈ 33 ms" },
    method: {
      network: "TODO: venue Wi-Fi / router setup",
      samples: "TODO: number of frames or sessions logged",
      p50: "TODO: p50 inter-device drift",
      p95: "TODO: p95 inter-device drift",
    },
    before: [{ stage: "Inter-device drift (source says > 100 ms)", ms: "TODO: exact value" }],
    after: [{ stage: "Inter-device drift (source says ≈ 33 ms)", ms: "TODO: exact value from CSV logs" }],
  },

  reliability: {
    lede: "Sync is checked with per-client frame logs, and a dropped headset can rejoin mid-show without a restart.",
    bullets: [
      "A real-time CSV logger records `CurrentFrame` from all clients during stress tests.",
      "**Fail-safe LOD**: devices above 150 ms RTT downgrade video resolution to keep sync.",
      "Disconnected clients **hot-swap** back in using the computed global time offset, without restarting the experience.",
      "Late packets fall back to seeking to the correct position instead of playing behind.",
      "**Targeted emits** (`io.to(guestId).emit`) correct only clients beyond ±3 frames; broadcasting to everyone had flooded client main threads.",
      "In a 5-person test the cheering stick no longer dropped during vigorous shaking, the main complaint from the first session.",
    ],
  },

  limits: {
    lede: "The design is proven for one room of five headsets driven by one server.",
    items: [
      {
        today: "A single master server drives every device, so it is a single point of failure.",
        atScale: "TODO: confirm. A standby master with state handover, or per-room masters.",
      },
      {
        today: "Clock offset uses RTT/2, which assumes symmetric up and down latency.",
        atScale: "Use multiple NTP-style samples and take the lowest-RTT measurement.",
      },
      {
        today: "Validated with 5 concurrent devices.",
        atScale: "TODO: load-test larger fleets before claiming the ±1–2 frame result holds.",
      },
    ],
  },

  learnings: {
    lede: "Real-time XR is a timing problem first and a rendering problem second.",
    items: [
      "Schedule against a shared clock instead of reacting to packets; jitter then stops mattering.",
      "On standalone hardware, the cheapest frame is the one you only decode once.",
      "Real hands are noisier than physics engines expect, so interaction needs intent, not just colliders.",
    ],
  },

  deepDive: [
    {
      kind: "code",
      label: "Key implementation",
      language: "csharp",
      snippet: `// Future Timestamp Execution Strategy
public void SchedulePlayback(long targetServerTime) {
    // 1. Calculate precise local offset using RTT
    // timeOffset = ServerTime - LocalTime - (RTT / 2)
    long localTargetTime = targetServerTime - this.timeOffset;
    
    // 2. Calculate exact wait duration
    // WaitTime = TargetTime - CurrentLocalTime
    double waitSeconds = (localTargetTime - DateTime.UtcNow.Ticks) / 10000000.0;
    
    if (waitSeconds > 0) {
        // 3. Schedule execution
        StartCoroutine(ExecuteAtTime(waitSeconds, () => {
            videoPlayer.Play(); // Triggers at the exact same physical moment
        }));
    } else {
        // Fallback: Seek to correct position if packet arrived late
        videoPlayer.time += Math.Abs(waitSeconds);
        videoPlayer.Play();
    }
}`,
    },
    {
      kind: "code",
      label: "Passthrough blend (vertex shader)",
      language: "hlsl",
      snippet: `v2f vert (appdata v) {
    v2f o;
    // Fade the video sphere by height so the stage melts into passthrough
    float alpha = saturate((v.vertex.y - _EndY) / range);
    o.alpha = alpha;
    return o;
}
// Cull Off · ZWrite Off · Blend SrcAlpha OneMinusSrcAlpha`,
    },
    {
      kind: "text",
      label: "Cheering-stick grab",
      body: "A `HandMeshActivationController` runs four states: Initial (hidden) → Proximity (guide) → Mesh activation (holding-hand swap) → Full interaction (anchored grab). The thumb–index distance, not a collider, decides when a grab starts and ends.",
    },
    {
      kind: "text",
      label: "Deployment",
      body: "The architecture was deployed commercially for the SM REALIVE K-pop VR Theater. An automated Docker and Kiosk Mode deployment pipeline cut on-site setup time by 50%.",
    },
  ],
};
