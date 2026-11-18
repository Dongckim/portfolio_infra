import type { Project } from "./types";

export const smartsight: Project = {
  slug: "reality-hack",
  summary: {
    eyebrow: "Wearable AI · MIT Reality Hack 2026",
    title: "SmartSight",
    tagline: "A Ray-Ban Meta study companion that sees your page and tutors you by voice.",
    role: "Backend lead (API, S3, database, auth, tests)",
    team: "5-person team",
    duration: "Jan 2026 hackathon build, continued as a startup",
    links: { repo: "https://github.com/Dongckim/2026-MIT-RealityHack", demo: "https://getsmartsight.com" },
    stack: {
      Backend: ["Node.js", "Express", "Prisma"],
      AI: ["OpenAI Responses API (GPT-4.1 Vision)", "OpenAI Realtime API (WebSocket)"],
      Infra: ["AWS EC2", "AWS S3 (SDK v3)", "PostgreSQL (RDS)"],
      Auth: ["Google OAuth", "JWT rotation"],
      Quality: ["Jest", "GitHub Actions CI"],
    },
    stats: [
      { value: "~13 s → ~5 s", label: "Upload-and-analyze latency" },
      { value: "0", label: "Native deps in the audio pipeline (no ffmpeg)" },
      { value: "7 / ~50", label: "Jest suites / cases, CI-gated" },
    ],
    awards: [
      { title: "Gold Prize", event: "MIT Reality Hack 2026 · Overall" },
      {
        title: "Best Use of the Meta Wearables Device Access Toolkit Showcasing a Hands-free Everyday Use Case",
        event: "MIT Reality Hack 2026 · Sponsored by Meta",
      },
    ],
    video: "https://www.youtube.com/watch?v=PbS7iEWzLyw",
    thumbnail: "/mit-reality-hack-2026-1.jpg",
    media: [
      { src: "/mit-reality-hack-2026-1.jpg", alt: "The SmartSight team at MIT Reality Hack 2026" },
      {
        src: "/smartsight-ui.webp",
        alt: "SmartSight app: the home dashboard and Luna, the AI tutor",
        title: "From hackathon prototype to study coach.",
        body:
          "After the hackathon the team kept building SmartSight as a startup. The companion app tracks progress toward the MCAT, and Luna, the AI tutor, recaps what the glasses captured and quizzes you on it.",
      },
    ],
  },

  context: {
    lede: "Glasses capture what a student is reading every few seconds, and the backend has to turn that into a tutor that keeps up.",
    problem:
      "Upload-and-analyze took ~13 s over cellular, the iOS audio format did not match what OpenAI Realtime accepts, and every analysis fired four side effects that could each crash the server. " +
      "All three had to be solved without growing the lightweight EC2 deploy.",
    myScope:
      "I led the backend on a 5-person team and owned the API, AWS infrastructure, the database, auth and the tests, with a teammate building the realtime audio path. " +
      "The team was Jayden Decambre, Dongchan Kim, Hyunseok Hwang, Xiaofan (Sylvan) Shen and Vivian Xin Shu, and the iOS client and glasses integration were built by teammates.",
  },

  architecture: {
    lede: "One endpoint takes the photo, S3 serves it straight to GPT-4.1 Vision, and the result feeds both the database and the live voice session.",
    image: {
      "description": "13 s → 5 s Upload-Analyze + WebSocket Realtime Tutor + OAuth",
      "components": [
        {
          "label": "Ray-Ban Meta Glasses",
          "position": {
            "x": 5,
            "y": 50
          }
        },
        {
          "label": "Express API Server",
          "position": {
            "x": 22,
            "y": 50
          }
        },
        {
          "label": "Google OAuth + JWT",
          "position": {
            "x": 22,
            "y": 80
          }
        },
        {
          "label": "AWS S3 (image store)",
          "position": {
            "x": 42,
            "y": 28
          }
        },
        {
          "label": "Presigned URL (1 h)",
          "position": {
            "x": 58,
            "y": 28
          }
        },
        {
          "label": "GPT-4.1 Vision API",
          "position": {
            "x": 58,
            "y": 55
          }
        },
        {
          "label": "Session & Topic Tracker",
          "position": {
            "x": 75,
            "y": 35
          }
        },
        {
          "label": "PostgreSQL (RDS)",
          "position": {
            "x": 90,
            "y": 22
          }
        },
        {
          "label": "OpenAI Realtime WS",
          "position": {
            "x": 75,
            "y": 72
          }
        },
        {
          "label": "Fire-and-Forget Workers",
          "position": {
            "x": 90,
            "y": 55
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
          "from": 5,
          "to": 9
        },
        {
          "from": 1,
          "to": 8
        },
        {
          "from": 8,
          "to": 9
        }
      ]
    },
    caption: "Critical path in bold: image bytes never pass back through Node once they reach S3.",
    highlightedPath: [
      "Ray-Ban Meta Glasses",
      "Express API Server",
      "AWS S3 (image store)",
      "Presigned URL (1 h)",
      "GPT-4.1 Vision API",
      "Session & Topic Tracker",
    ],
  },

  decisions: {
    lede: "Three choices shaped the backend: one round-trip, no native audio binaries, and side effects that can never take the request down.",
    items: [
      {
        title: "Collapse upload and analysis into one request",
        problem: "The client made three round-trips (upload, then analyze, then save) and waited on a blocking DB write, which took ~13 s on cellular.",
        options: [
          "Keep the three-call flow",
          "Proxy the image bytes through Node to OpenAI",
          "A single POST /api/upload-and-analyze plus a presigned S3 read URL for OpenAI",
        ],
        decision: "One multipart endpoint. The server uploads to S3 and hands GPT-4.1 Vision a 1 h presigned read URL, so OpenAI fetches the image directly.",
        result: "Removing two client round-trips saved ~4 s and the presigned URL saved ~2 s. End to end went from ~13 s to ~5 s.",
        tradeoff: "The presigned URL is readable by anyone holding it for an hour, and a slow S3 upload now blocks the whole request.",
      },
      {
        title: "Resample audio in pure JS instead of shipping ffmpeg",
        problem: "iOS sends Float32 16 kHz mono, while OpenAI Realtime expects PCM16 24 kHz as Base64 JSON.",
        options: ["Bundle ffmpeg on the EC2 host", "Convert on the iOS client", "A stateful pure-JS converter and resampler on the server"],
        decision:
          "`float32ToPcm16LE` plus a stateful `Resampler16kTo24k` that carries `prevSample` and `fractionalPos` across 20 ms chunks, with a backpressure guard that drops frames above 100 KB buffered and closes the socket above 300 KB.",
        result: "No native binaries, so deploy stays `npm install`. Chunk boundaries do not click because interpolation state carries over.",
        tradeoff: "Linear interpolation is simpler than a windowed-sinc filter, and backpressure drops audio rather than queueing it.",
      },
      {
        title: "Fire-and-forget side effects, capped at 500 ms",
        problem: "Every ~3 s an analysis triggers a DB write, a topic upsert and a realtime context push, and one unhandled rejection would crash the process mid-session.",
        options: ["Await every side effect before responding", "Fire and forget with a race against a 500 ms timer"],
        decision:
          "`Promise.race([savePromise, timeout(500)])` returns `analysisId` when the DB is fast and `null` otherwise. Each side effect is try-caught on its own, and a trailing `.catch(() => {})` prevents unhandled rejections.",
        result: "The response returns 200 whenever the vision analysis succeeds. A DB outage, a dropped WS or a bad topic only degrades its own feature.",
        tradeoff: "Failed writes are swallowed silently, and clients sometimes get `analysisId: null` (see Limits).",
      },
    ],
  },

  measurement: {
    lede: "Collapsing three round-trips into one cut end-to-end upload-and-analyze latency from ~13 s to ~5 s.",
    headline: { label: "Upload-and-analyze latency", before: "~13 s", after: "~5 s" },
    method: {
      network: "TODO: network used (cellular? which carrier / throttling profile)",
      samples: "TODO: number of requests measured",
      p50: "TODO: p50",
      p95: "TODO: p95",
    },
    before: [
      { stage: "Client round-trips (3 calls)", ms: "TODO: measure" },
      { stage: "Image transfer via Node", ms: "TODO: measure" },
      { stage: "GPT-4.1 Vision", ms: "TODO: measure" },
      { stage: "Blocking DB write", ms: "TODO: measure" },
    ],
    after: [
      { stage: "Client round-trips (1 call)", ms: "TODO: measure" },
      { stage: "Presigned S3 fetch by OpenAI", ms: "TODO: measure" },
      { stage: "GPT-4.1 Vision", ms: "TODO: measure" },
      { stage: "DB write (≤ 500 ms cap)", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "Any one subsystem can fail and the analysis response still comes back, with 7 mocked Jest suites gating every merge.",
    bullets: [
      "**7 Jest suites (~50 cases)** cover controllers, services and middleware with S3, OpenAI and Prisma mocked. **GitHub Actions** runs them on every push and PR, and a failure blocks the merge.",
      "Session validation returns 4xx before any S3 or OpenAI call is made.",
      "S3 and OpenAI errors reach a global error middleware that returns structured JSON.",
      "Auth returns 401 for a missing token, a blacklisted JTI or an invalid Google token. Refresh revokes and reissues inside one `$transaction`.",
      "The realtime `response_cancel_not_active` race is ignored, and a failed context push is logged without breaking the analysis.",
    ],
    details: [
      "**session**: missing sessionId (auto-create), inactive session (400), session not found (404)",
      "**upload/analyze**: missing s3Key and file (400), no file in upload-and-analyze (400)",
      "**fire-and-forget**: `createImageAnalysis` rejected → asserts 200 with `analysisId: null`",
      "**presigned URL**: `generatePresignedReadUrl(s3Key, 3600)` and `analyzeStudentPOV(presignedUrl)` invocation verified",
      "**OpenAI**: no output text, invalid JSON, missing contentAnalysis, missing required fields, APIError, nested output extraction",
      "**S3**: missing S3_BUCKET, upload failure, presigned URL failure, PNG vs JPEG, prefix handling",
      "**middleware**: sessionId from header vs body (header wins), 400 when inactive, 404 when not found, DB error passthrough",
      "**Prisma**: createSession, endSession (P2025 → not found), createImageAnalysis (P2003 → invalid FK), getActiveSession null",
      "**multer**: file too large → 400, non-image → 400",
    ],
  },

  limits: {
    lede: "These hackathon shortcuts are fine for a demo and would be the first things to change before real users.",
    items: [
      {
        today: "CORS allows `*` with custom headers.",
        atScale: "Allow-list the app's origins and stop sending credentials to wildcard origins.",
      },
      {
        today: "When there is no JWT, `optionalAuth` trusts an `X-User-Id` header, so any client can act as any user.",
        atScale: "Drop the fallback and require a verified token on every user-scoped route.",
      },
      {
        today: "Background DB saves and topic upserts swallow their errors with `.catch(() => {})`, so lost writes are invisible.",
        atScale: "Log and count every failure, and write side effects through an outbox table or an SQS queue with retries and a DLQ.",
      },
      {
        today: "Active topic state lives in an in-memory `Map`, which a restart wipes and a second instance cannot see.",
        atScale: "Move session topic state to Redis with a TTL so instances can scale horizontally.",
      },
    ],
  },

  learnings: {
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: [
      "TODO: confirm. For example, take the database off the critical path first, because that was where the latency was.",
      "TODO: confirm. For example, check the exact wire format at both ends before writing any streaming code.",
    ],
  },

  deepDive: [
    {
      kind: "text",
      label: "What it became",
      body:
        "The prototype won both the **Gold Prize** and Meta's **Best Use of the Meta Wearables Device Access Toolkit Showcasing a Hands-free Everyday Use Case** at MIT Reality Hack 2026, and the team kept going as a startup: SmartSight, \"an AI study coach for smart glasses\" (getsmartsight.com).\n" +
        "The product now has four parts: **passive capture** of study materials through the glasses, **AI coaching** with next steps based on your gaps, auto-generated **flashcards and quizzes**, and a **study story** timeline in a companion app. It started with MCAT students and is taking a waitlist.",
    },
    {
      kind: "code",
      label: "0. Server Bootstrap — server.js",
      language: "markdown",
      snippet: `HTTP Request
    │
    ├─ CORS (Allow-Origin: *, custom headers)
    ├─ express.json() + urlencoded + cookieParser
    ├─ optionalAuth (JWT verify + blacklist check ∥ X-User-Id fallback)
    │
    ├─ /api/upload/*          → uploadRoutes
    ├─ /api/upload-and-analyze → multer → uploadController.uploadAndAnalyze
    ├─ /api/analyze           → analyzeRoutes
    ├─ /api/session/*         → sessionRoutes
    ├─ /api/bookmark          → bookmarkRoutes
    ├─ /api/topic/*           → topicRoutes
    ├─ /api/help-count        → helpCountRoutes
    ├─ /api/admin/*           → adminRoutes
    ├─ /api/auth/*            → authRoutes
    ├─ /api-docs              → swagger-ui-express
    │
    ├─ Global Error Middleware → { success: false, error: { message } }
    ├─ 404 Handler
    │
    └─ http.createServer(app)
         └─ realtimeService.setupWebSocket(server) → WS /ws`,
    },
    {
      kind: "code",
      label: "1. Upload & Analyze Pipeline (13 s → 5 s) — the critical path",
      language: "markdown",
      snippet: `iOS Client (Ray-Ban Meta)
    │
    │  POST /api/upload-and-analyze  [multipart image, X-Session-Id?]
    ▼
  multer (memory, 10 MB, image-only filter)
    │
    ▼
  optionalAuth → req.user (JWT or X-User-Id)
    │
    ▼
  uploadController.uploadAndAnalyze()
    │
    ├─ analysisService.resolveSession(sessionId, userId)
    │    ├─ no sessionId → prismaService.createSession(userId)
    │    └─ sessionId    → prismaService.getSession() → assert 'active'
    │
    ├─ s3Service.uploadFile(buffer, null, mimetype)
    │    ├─ saveFileLocally()        ← local backup
    │    └─ S3 PutObjectCommand      ← cloud upload
    │
    ▼
  analysisService.analyzeAndPersist()
    │
    ├─ s3Service.generatePresignedReadUrl(s3Key, 3600)
    │    └─ GetObjectCommand + getSignedUrl (1 h TTL)
    │
    ├─ openaiService.analyzeStudentPOV(presignedUrl)
    │    ├─ OpenAI Responses API (GPT-4.1 Vision)
    │    │    └─ JSON Schema: { contentAnalysis: { isStudying, isActive,
    │    │         isDistracted, topic, subtopic, extractedText } }
    │    ├─ Parse + validate contentAnalysis
    │    └─ Context Bridge → realtimeService.updateSessionContext()
    │         └─ topic/subtopic/text → session.update to Realtime WS
    │
    ├─ normalizeContent() → topicEnum, isStudying, isActive, isDistracted
    │
    ├─ topicTracker.trackTopic(sessionId, topic)
    │    └─ in-memory Map + fire-and-forget DB upsert
    │
    └─ Fire-and-Forget DB Save
         ├─ prismaService.createImageAnalysis(sessionId, { ... })
         ├─ Promise.race([ savePromise, setTimeout(500ms) ])
         │    └─ returns analysisId if fast, null otherwise
         └─ savePromise.catch(() => {})  ← prevents unhandled rejection
    │
    ▼
  res.status(200).json({
    sessionId, s3Key, s3Url, analysis, analysisId, uploadedAt
  })`,
    },
    {
      kind: "code",
      label: "2. Zero-Dep Audio Pipeline — Float32 16 kHz → PCM16 24 kHz",
      language: "markdown",
      snippet: `iOS Client (Float32, 16 kHz, mono)
    │
    │  WS /ws binary frame
    ▼
  Validate: frame.length % 4 === 0 (Float32 = 4 bytes/sample)
    │
    ▼
  float32ToPcm16LE(frame)                          ── audioUtils.js
    │  for each sample:
    │    readFloatLE → clamp [-1, 1] → × 32767 → writeInt16LE
    │  Float32 (4 B/sample) → PCM16 (2 B/sample)
    │
    ▼
  accumulator = appendBuffer(accumulator, pcm16)
    │
    ▼
  drainPcm16Chunks(accumulator, 640 bytes)          ── 20 ms @ 16 kHz
    │  └─ { chunks: Buffer[], remainder: Buffer }
    │
    ▼
  Resampler16kTo24k.process(chunk)                  ── stateful across chunks
    │
    │  ┌─ prevSample: Int16       (last sample from previous chunk)
    │  ├─ fractionalPos: Float    (sub-sample position, carries over)
    │  │
    │  │  for each input sample:
    │  │    while (fractionalPos < 1):
    │  │      interpolated = prevSample + (current - prev) × fractionalPos
    │  │      outputSamples.push( clampInt16(round(interpolated)) )
    │  │      fractionalPos += 16000/24000  (= 0.6667 step)
    │  │    fractionalPos -= 1
    │  │    prevSample = current
    │  │
    │  └─ drain outputAccumulator into 960-byte chunks (20 ms @ 24 kHz)
    │
    ▼
  realtimeClient.sendAudioFrame(pcm24)
    │  ├─ backpressure check: bufferedAmount > 100 KB → drop
    │  ├─ backpressure check: bufferedAmount > 300 KB → close socket
    │  └─ toBase64(frame) → { type: 'input_audio_buffer.append', audio }
    │
    ▼
  OpenAI Realtime API (gpt-realtime, 24 kHz PCM16)
    │
    ├─ response.audio.delta → Base64 decode → ws.send(binary to iOS)
    ├─ speech_started → barge-in → response.cancel + notify client
    │
    ▼
  on close:
    ├─ savePcmToWav(inputBuffer,  16 kHz) → session-{id}-input-{ts}.wav
    └─ savePcmToWav(outputBuffer, 24 kHz) → session-{id}-output-{ts}.wav`,
    },
    {
      kind: "code",
      label: "3. Crash-Safe Async — every subsystem can fail, server never dies",
      language: "markdown",
      snippet: `Every ~3 s: image analysis triggers 4 async side-effects
    │
    ├─ 1. DB Save (can fail: connection timeout, constraint violation)
    │      │
    │      └─ analysisService.analyzeAndPersist()
    │           ├─ savePromise = (async () => {
    │           │     try { return (await prismaService.createImageAnalysis(...)).id; }
    │           │     catch (dbError) { return null; }         ← swallow
    │           │  })();
    │           ├─ Promise.race([ savePromise, timeout(500) ]) ← don't block
    │           │     └─ analysisId = id ∥ null
    │           └─ savePromise.catch(() => {})                 ← prevent crash
    │                 └─ background save continues after res.json()
    │
    ├─ 2. Topic Upsert (can fail: DB race condition on upsert)
    │      │
    │      └─ topicTracker.addToDailyStats()
    │           ├─ in-memory Map updated first                 ← always succeeds
    │           └─ try { await prismaService.upsertDailyTopicStudy(...) }
    │              catch (error) { /* swallow — in-memory still valid */ }
    │
    ├─ 3. Realtime Context Push (can fail: WS disconnected, no active conn)
    │      │
    │      └─ openaiService.analyzeStudentPOV()
    │           └─ try {
    │                realtimeService.updateSessionContext(sessionId, context);
    │                // returns false if no connection — not an error
    │              } catch (err) {
    │                console.warn('Failed to update realtime context');
    │                // never throw — analysis endpoint must not break
    │              }
    │
    └─ 4. Topic Tracking State (can fail: null topic, empty string)
           │
           └─ topicTracker.trackTopic()
                └─ const topic = newTopic?.trim() || 'Unknown'  ← normalize
  
  Result: all 4 can fail independently
    │
    └─ res.status(200).json({ success: true, data: { ... } })
         └─ ALWAYS returns 200 if OpenAI analysis itself succeeded
              DB down? → analysisId: null
              Realtime disconnected? → context skipped
              Topic upsert failed? → in-memory still tracks
              Null topic? → normalized to 'Unknown'`,
    },
    {
      kind: "code",
      label: "4. Auth Pipeline — Google OAuth + JWT Rotation + Blacklisting",
      language: "markdown",
      snippet: `── Login ────────────────────────────────────────────────────────────────
  POST /api/auth/google { idToken }
    │
    ├─ googleClient.verifyIdToken({ idToken, audience })
    │    └─ payload: { sub, email, name }
    ├─ prisma.user.upsert({ where: { email }, create/update })
    ├─ issueTokensForUser(user, sub)
    │    ├─ jwt.sign({ userId, email, jti }, JWT_SECRET, { expiresIn: '15m' })
    │    └─ crypto.randomBytes(48) → SHA256 → prisma.refreshToken.create()
    ├─ setAuthCookie(res, accessToken)   ← HTTP-only, sameSite: lax
    ├─ setRefreshCookie(res, refreshToken)
    └─ res.json({ userId, email, token, refreshToken })
  
  ── Refresh ──────────────────────────────────────────────────────────────
  POST /api/auth/refresh (cookie or body)
    │
    ├─ hashToken(rawRefreshToken) → findFirst({ tokenHash, !revoked, !expired })
    ├─ prisma.$transaction:
    │    ├─ revoke old: refreshToken.update({ revokedAt: now })
    │    └─ issue new: issueTokensForUser(user, tx)  ← atomic swap
    └─ new cookies + res.json({ token, refreshToken })
  
  ── Logout ───────────────────────────────────────────────────────────────
  POST /api/auth/logout
    │
    ├─ refreshToken → updateMany({ revokedAt: now })
    ├─ accessToken  → jwt.verify → tokenBlacklist.create({ jti, expiresAt })
    └─ clearCookie(auth_token, refresh_token)
  
  ── Middleware (every request) ────────────────────────────────────────────
  optionalAuth:
    ├─ extractToken (Bearer header ∥ auth cookie)
    ├─ jwt.verify → check tokenBlacklist by jti
    │    ├─ blacklisted → 401
    │    └─ valid → req.user = { id, email, name }
    └─ no token → fallback to X-User-Id header → next()`,
    },
    {
      kind: "code",
      label: "5. Session & Topic Analytics Pipeline",
      language: "markdown",
      snippet: `── Session Lifecycle ─────────────────────────────────────────────────────
  POST /api/session/start
    └─ prismaService.createSession(userId)
         ├─ getOrCreateDefaultUser() ∥ resolveUser(userId)
         ├─ sessionDay.upsert({ userId, date: 'YYYY-MM-DD' })
         └─ subSession.create({ sessionDayId })
              └─ → { sessionId, status: 'active', startedAt }
  
  POST /api/session/:id/end
    ├─ topicTracker.finalizeSession(sessionId, endTime)
    │    ├─ calculate remaining duration for current topic
    │    ├─ addToDailyStats() → DB upsert (fire-and-forget)
    │    └─ remove from active Map
    └─ prismaService.endSession(sessionId)
         └─ → { sessionId, endedAt, totalAnalyses, topicStats }
  
  ── Topic Tracking (hybrid: in-memory + DB) ──────────────────────────────
  Every image analysis:
    analysisService.analyzeAndPersist()
      └─ topicTracker.trackTopic(sessionId, topic, timestamp, userId)
           │
           ├─ First image   → create Map entry { currentTopic, startTime }
           ├─ Topic change  → accumulate duration, DB upsert, update entry
           └─ Same topic    → no-op (timer continues)
  
  Reads:
    GET /api/session/:id/topic-stats  → topicTracker.getSessionTopicStats()
    GET /api/today/topic-stats        → getDailyTopicStatsFromDB() + active sessions
    GET /api/topic/daily?date=...     → getDailyTopicStatsFromDB(date)
    GET /api/topic/weekly             → getWeeklyTopicStatsFromDB() → dailyBreakdown
  
  ── Data Model (Prisma / PostgreSQL) ─────────────────────────────────────
  User
    └─ SessionDay (userId + date, unique)
         └─ SubSession (startedAt, endedAt)
              └─ LearningEvent (s3Key, analysisResult, topicId, isActive, isDistracted)
                   └─ Bookmark (note)
         └─ DailyTopicStats (topicId, durationSec, active, passive, numDistracted)
  
  Topic (name, unique) → Subtopic (topicId + name, unique)
  RefreshToken (userId, tokenHash, expiresAt, revokedAt)
  TokenBlacklist (jti, expiresAt)`,
    },
  ],
};
