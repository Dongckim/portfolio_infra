import type { Project } from "./types";

export const xrOptimization: Project = {
  slug: "xr-optimization",
  summary: {
    eyebrow: "Multi-device XR",
    title: "SM REALIVE",
    tagline: "Frame-accurate video sync across standalone Quest 3 headsets for a K-pop VR theatre.",
    role: "VR Software Engineer",
    team: "TODO: team size",
    duration: "TODO: duration",
    links: { repo: "https://github.com/Dongckim/xr-sync", demo: "https://youtube.com/watch?v=UoeiSMDjMIo" },
    stack: {
      Client: ["Unity", "C#"],
      Server: ["Node.js", "Socket.io"],
      Ops: ["Docker", "Meta Horizon Managed Services", "Kiosk Mode"],
    },
    stats: [
      { value: "±1–2 frames", label: "Sync accuracy (≈33 ms)" },
      { value: "5", label: "Concurrent Meta Quest 3 devices" },
      { value: "50%", label: "Less on-site setup time" },
    ],
    media: [
      { src: "/sm-realive-sync.png", alt: "SM REALIVE synchronised playback across headsets" },
      { src: "/xr-frame-comparison-1.jpg", alt: "Frame index comparison across devices (1)" },
      { src: "/xr-frame-comparison-2.jpg", alt: "Frame index comparison across devices (2)" },
    ],
  },

  context: {
    lede: "In a shared VR concert, headsets that start the video even 100 ms apart make people sick and break the illusion.",
    problem:
      "Standard network replication across 5+ Meta Quest 3 devices drifted by more than 100 ms because packets arrive at different times. " +
      "`VideoPlayer.Play()` had to fire at the same physical moment on every device regardless of jitter.",
    myScope: "TODO: confirm. As VR Software Engineer I built the master-client sync, the Unity playback scheduling and the deployment pipeline.",
  },

  architecture: {
    lede: "A master server issues play, pause and seek as future timestamps, and every headset converts that to its own clock before acting.",
    image: {
      "description": "Master-Client NTP Sync · Play / Pause / Seek · HMS Fleet Management",
      "components": [
        {
          "label": "Master Server",
          "position": {
            "x": 30,
            "y": 22
          }
        },
        {
          "label": "Play / Pause / Seek",
          "position": {
            "x": 68,
            "y": 22
          }
        },
        {
          "label": "Client A (Quest 3)",
          "position": {
            "x": 10,
            "y": 68
          }
        },
        {
          "label": "Client B (Quest 3)",
          "position": {
            "x": 28,
            "y": 68
          }
        },
        {
          "label": "Client C (Quest 3)",
          "position": {
            "x": 50,
            "y": 68
          }
        },
        {
          "label": "Client D (Quest 3)",
          "position": {
            "x": 72,
            "y": 68
          }
        },
        {
          "label": "Client E (Quest 3)",
          "position": {
            "x": 90,
            "y": 68
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
          "to": 2,
          "label": "RTT ±33ms"
        },
        {
          "from": 0,
          "to": 3,
          "label": "RTT ±33ms"
        },
        {
          "from": 0,
          "to": 4,
          "label": "RTT ±33ms"
        },
        {
          "from": 0,
          "to": 5,
          "label": "RTT ±33ms"
        },
        {
          "from": 0,
          "to": 6,
          "label": "RTT ±33ms"
        }
      ],
      "groups": [
        {
          "label": "Meta Horizon Managed Services (HMS)",
          "members": [
            2,
            3,
            4,
            5,
            6
          ],
          "color": "#5AC8FA"
        }
      ]
    },
    caption: "Critical path highlighted: the master schedules, each client corrects for its own RTT offset.",
    highlightedPath: ["Master Server", "Play / Pause / Seek", "Client A (Quest 3)"],
  },

  decisions: {
    lede: "Three choices made sync hold: schedule in the future, correct only drifting clients, and trade resolution for timing.",
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
        title: "Targeted emits instead of broadcast",
        problem: "`socket.broadcast.emit` for time sync flooded client main threads (O(n²) messages) and caused stutter.",
        options: ["Broadcast corrections to everyone", "`io.to(guestId).emit` only to drifting clients"],
        decision: "Send correction data only to clients beyond a ±3 frame threshold.",
        result: "Lower client CPU overhead and stable networking.",
        tradeoff: "Clients within ±3 frames are never corrected; network stability wins over constant updates.",
      },
      {
        title: "Fail-safe LOD under high RTT",
        problem: "A headset on a poor connection would fall out of sync.",
        options: ["Keep full resolution and accept drift", "Downgrade video resolution above 150 ms RTT"],
        decision: "Devices exceeding 150 ms RTT automatically drop video resolution to keep sync priority.",
        result: "Sync holds on slow links.",
        tradeoff: "Those viewers see lower visual quality.",
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
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: ["TODO: learning 1", "TODO: learning 2"],
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
      kind: "text",
      label: "Deployment",
      body: "The architecture was deployed commercially for the SM REALIVE K-pop VR Theater. An automated Docker and Kiosk Mode deployment pipeline cut on-site setup time by 50%.",
    },
  ],
};
