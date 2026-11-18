import type { Project } from "./types";

export const ape: Project = {
  slug: "ape",
  summary: {
    eyebrow: "Cloud developer tooling",
    title: "A.P.E: AWS Platform Explorer",
    tagline: "One 16 MB Go binary that gives EC2 and S3 a Finder-style browser UI.",
    role: "Creator and sole maintainer (full stack)",
    team: "1 outside contributor (keyboard-shortcut modal)",
    duration: "Mar–Apr 2026 (v0.1 → v0.5)",
    links: { repo: "https://github.com/Dongckim/A.P.E" },
    stack: {
      Backend: ["Go 1.26", "golang.org/x/crypto/ssh", "github.com/pkg/sftp", "aws-sdk-go-v2"],
      Frontend: ["React 18", "TypeScript", "Tailwind CSS", "Vite", "Monaco Editor"],
      Release: ["GitHub Actions", "4-target cross-compile"],
    },
    stats: [
      { value: "16 MB", label: "Single binary, zero runtime dependencies" },
      { value: "4", label: "Cross-compiled release targets" },
      { value: "32", label: "Go tests run in CI on every push" },
    ],
    media: [
      { src: "/ape-demo.mp4", alt: "A.P.E browsing EC2 and S3 in the browser" },
      { src: "/ape-terminal.png", alt: "A.P.E launched from the terminal" },
    ],
  },

  context: {
    lede: "Editing files on EC2 usually means juggling `scp`, `ssh` and `vim` across terminal tabs.",
    problem:
      "Existing GUI tools like Cyberduck and Transmit need separate installs or licences, or have no S3 integration. " +
      "The goal was a zero-install GUI, one binary dropped into `$PATH`, that handles SSH auth, live SFTP, S3 browsing and a full React frontend without Node.js or a separate web server.",
    myScope: "I built it alone, covering the Go server, the SSH/SFTP and S3 layers, the React file explorer and the release pipeline.",
  },

  architecture: {
    lede: "A Go HTTP server embeds the React build and proxies every file action over one SSH/SFTP session, with S3 through the AWS SDK.",
    image: {
      "description": "Single 16MB Go Binary: Embedded React + SSH/SFTP + S3 + Monaco",
      "components": [
        {
          "label": "Browser (localhost:9000)",
          "position": {
            "x": 5,
            "y": 50
          }
        },
        {
          "label": "Go HTTP Server (embed.FS)",
          "position": {
            "x": 22,
            "y": 50
          }
        },
        {
          "label": "REST API Router",
          "position": {
            "x": 40,
            "y": 50
          }
        },
        {
          "label": "SSH Auth Manager",
          "position": {
            "x": 57,
            "y": 22
          }
        },
        {
          "label": "SFTP Client",
          "position": {
            "x": 73,
            "y": 22
          }
        },
        {
          "label": "EC2 File System",
          "position": {
            "x": 90,
            "y": 22
          }
        },
        {
          "label": "Monaco Editor (UI)",
          "position": {
            "x": 57,
            "y": 50
          }
        },
        {
          "label": "AWS SDK v2",
          "position": {
            "x": 73,
            "y": 72
          }
        },
        {
          "label": "S3 Buckets",
          "position": {
            "x": 90,
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
          "from": 2,
          "to": 6
        },
        {
          "from": 2,
          "to": 7
        },
        {
          "from": 7,
          "to": 8
        }
      ]
    },
    caption: "Highlighted: a drag-and-drop upload, from the browser to the EC2 filesystem.",
    highlightedPath: ["Browser (localhost:9000)", "Go HTTP Server (embed.FS)", "REST API Router", "SFTP Client", "EC2 File System"],
  },

  decisions: {
    lede: "Three choices made it a single, stateless binary: embed the UI, stream uploads directly and push progress over SSE.",
    items: [
      {
        title: "Embed the React build in the Go binary",
        problem: "Users should get the full UI without installing Node.js or running a separate web server.",
        options: ["Ship a separate web server or Node runtime", "Embed `dist/*` with `//go:embed` and serve it from `http.FS`"],
        decision: "The React build is embedded at compile time and served by the same Go process as the API.",
        result: "One 16 MB binary with zero runtime dependencies, distributed via `brew install` or a GitHub Release.",
        tradeoff: "Any UI change needs a rebuild and re-release of the binary.",
      },
      {
        title: "Stream uploads straight to SFTP",
        problem: "Uploads can be large, and staging a full copy before sending it to EC2 wastes memory and disk.",
        options: ["Write a local temp file, then scp it", "`io.Copy(remoteFile, file)` straight into the SFTP handle"],
        decision: "Upload bytes are streamed directly to the EC2 filesystem, with `MkdirAll` creating missing parents.",
        result: "Bytes go from the multipart reader straight into the remote file, with no extra local copy on the SFTP side.",
        tradeoff: "Go's `ParseMultipartForm(32 MB)` still holds the first 32 MB in memory and spills larger files to temp files before the stream starts.",
      },
      {
        title: "Server-Sent Events for upload progress",
        problem: "The browser needs live byte counts while an upload is streaming.",
        options: ["Polling", "WebSocket", "Server-Sent Events"],
        decision: "A custom `io.Writer` wrapper counts bytes and pushes them over SSE to an `EventSource`.",
        result: "Live progress with no polling, and no WebSocket complexity for a one-way data flow.",
        tradeoff: "SSE is one-directional, so cancelling an upload needs a separate request.",
      },
    ],
  },

  measurement: {
    lede: "No latency or throughput numbers have been recorded yet; the size and target counts above come from the release build.",
    headline: { label: "TODO: what was measured", before: "TODO: before", after: "TODO: after" },
    method: {
      network: "TODO: network between the client and the EC2 host",
      samples: "TODO: number of uploads timed",
      p50: "TODO: p50",
      p95: "TODO: p95",
    },
    before: [
      { stage: "scp upload", ms: "TODO: measure" },
      { stage: "ssh + vim edit", ms: "TODO: measure" },
    ],
    after: [
      { stage: "Drag-and-drop upload (SFTP stream)", ms: "TODO: measure" },
      { stage: "Monaco edit + save", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "Every failure reaches the UI as a readable message, and SFTP drops reconnect on their own.",
    bullets: [
      "**CI** runs on every push through GitHub Actions: frontend lint, typecheck and build, then `go vet` and **32 Go tests** on Go 1.22 and 1.23.",
      "GoReleaser cross-compiles 4 targets (macOS and Linux on amd64 and arm64). Integration checks against a live EC2 t2.micro and real S3 buckets are run by hand, across PEM and new-format OpenSSH keys.",
      "All API handlers return `{ error: string }` JSON on failure, and the React UI shows these as toasts.",
      "SFTP sessions reconnect automatically on disconnect, with exponential backoff and at most 3 retries.",
      "S3 errors are unwrapped with `errors.As(err, &apiErr)` so the user sees the AWS error code.",
    ],
    details: [
      "**SSH auth**: missing key file (clear error), passphrase-protected key (prompt), permission denied (403 JSON)",
      "**SFTP**: upload to read-only path (permission error surfaced), mkdir race condition (MkdirAll idempotent)",
      "**S3**: no credentials configured (SDK error surfaced as 401), empty bucket (empty list, no crash)",
      "**Upload**: non-UTF-8 filename (percent-encoded safely)",
      "**Monaco**: binary file opened for edit (hex fallback mode), very large file (lazy load chunks)",
    ],
  },

  limits: {
    lede: "A.P.E is built as a single-user local tool, and these are the places that assumption shows.",
    items: [
      {
        today: "The local HTTP API has no authentication and relies on binding to 127.0.0.1:9000, and the terminal WebSocket skips origin checks, so a malicious page could try to reach it cross-site.",
        atScale: "TODO: confirm. For example, a per-launch token on every API call, and refuse non-loopback binds without it.",
      },
      {
        today: "There is no upload size limit, and anything over 32 MB is buffered to a local temp file before streaming.",
        atScale: "TODO: confirm. For example, chunked or resumable uploads streamed without a size cap.",
      },
      {
        today: "The 32 Go tests cover handlers, config and the SFTP client, but there are no frontend tests and no automated integration tests against real SSH or S3.",
        atScale: "TODO: confirm. For example, an SFTP server container and a mocked S3 endpoint in CI.",
      },
    ],
  },

  learnings: {
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: [
      "TODO: confirm. For example, `go:embed` makes shipping a full web UI as one binary nearly free.",
      "TODO: confirm. For example, use the simplest transport that fits the data flow (SSE for one-way progress).",
    ],
  },

  deepDive: [
    {
      kind: "code",
      label: "0. Binary Bootstrap — main.go",
      language: "markdown",
      snippet: `$ ape [--host ec2-user@54.x.x.x] [--key ~/.ssh/id_rsa]
  │
  ├─ Parse CLI flags (host, key, port, bind-addr)
  ├─ sshClient.Dial("tcp", host+":22") → ssh.NewSession()
  │    └─ sftp.NewClient(sshConn) → SFTP session
  ├─ s3Client = aws.NewConfig() → s3.NewFromConfig()
  │
  ├─ Embed React build via //go:embed dist/*
  │    └─ http.FileServer(http.FS(embedFS)) → /
  │
  ├─ Register API routes:
  │    ├─ GET  /api/files?path=   → sftp.ReadDir()
  │    ├─ GET  /api/file?path=    → sftp.Open() → stream
  │    ├─ POST /api/upload        → multipart → sftp.Create()
  │    ├─ POST /api/mkdir         → sftp.MkdirAll()
  │    ├─ DEL  /api/delete        → sftp.Remove()
  │    ├─ GET  /api/s3/buckets    → s3.ListBuckets()
  │    └─ GET  /api/s3/objects    → s3.ListObjectsV2()
  │
  └─ http.ListenAndServe(bindAddr, mux)
       └─ Web UI ready at http://localhost:9000`,
    },
    {
      kind: "code",
      label: "1. Upload Pipeline — multipart → SFTP stream",
      language: "markdown",
      snippet: `POST /api/upload  [multipart/form-data: file, path]
  │
  ├─ r.ParseMultipartForm(32 MB)
  ├─ file, header = r.FormFile("file")
  ├─ remotePath = r.FormValue("path") + "/" + header.Filename
  │
  ├─ sftpClient.Create(remotePath)   ← opens remote file for writing
  │    └─ If parent dir missing → sftpClient.MkdirAll(dir)
  │
  ├─ io.Copy(remoteFile, file)       ← streams bytes, no local temp
  │    └─ Progress tracked via custom io.Writer wrapper
  │         └─ SSE stream → client EventSource (drag & drop bar)
  │
  └─ res.JSON({ success: true, path: remotePath, size: header.Size })`,
    },
    {
      kind: "code",
      label: "2. React File Explorer — Finder-style UX",
      language: "markdown",
      snippet: `FileExplorer (React 18 + TypeScript)
  │
  ├─ State: { path, entries, view: "grid"|"list", selected: Set<string> }
  │
  ├─ Grid View: thumbnail cards with file-type icons (Monaco-derived)
  ├─ List View: sortable table (name / size / modified)
  │
  ├─ Right-click context menu:
  │    ├─ Open in Monaco Editor  → GET /api/file → editor modal
  │    ├─ Download               → anchor[download] blob URL
  │    ├─ Rename                 → POST /api/rename
  │    └─ Delete                 → DEL /api/delete (confirm dialog)
  │
  ├─ Drag & Drop zone:
  │    └─ onDrop → FormData → POST /api/upload → SSE progress bar
  │
  ├─ Keyboard shortcuts:
  │    ├─ Cmd+N   → new folder dialog
  │    ├─ Delete  → delete selected
  │    └─ Cmd+C   → copy path to clipboard
  │
  └─ Breadcrumb nav: click any segment → navigate to that path`,
    },
    {
      kind: "text",
      label: "More design notes",
      body:
        "**AWS SDK v2 (no CLI dependency)**: S3 operations use the Go SDK directly rather than shelling out to `aws s3 ls`. Credentials come from `~/.aws/credentials` or env vars, the same auth model users already have.\n" +
        "**Monaco in the browser**: editing happens client-side. The Go server only serves file bytes, and Monaco handles syntax highlighting, search and editing locally, which keeps the server stateless.",
    },
  ],
};
