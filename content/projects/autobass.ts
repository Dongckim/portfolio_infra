import type { Project } from "./types";

export const autobass: Project = {
  slug: "autobass",
  summary: {
    eyebrow: "Developer utility",
    title: "AutoBASS CLI",
    tagline: "A zero-dependency Bash backup tool that refuses to fail silently.",
    role: "TODO: role",
    team: "TODO: team size",
    duration: "TODO: duration",
    links: { repo: "https://github.com/Dongckim/autobass-CLI" },
    stack: {
      Language: ["Bash", "Regex"],
      Platform: ["Linux", "tar / gzip"],
      Automation: ["Cron", "CI/CD"],
    },
    stats: [
      { value: "4", label: "Input scenarios validated (args, config, dry-run, invalid)" },
      { value: "0", label: "Runtime dependencies beyond a Unix shell" },
      { value: "TODO: size reduction", label: "Backup size saved by .bassignore" },
    ],
  },

  context: {
    lede: "Shell backup scripts often exit 0 after a partial failure, so nobody learns the backup is broken until a restore.",
    problem:
      "Plain `cp` or `tar` scripts suffer silent failures where partial data corruption still ends in success. " +
      "The tool had to validate inputs strictly, operate atomically and support exclusions via `.bassignore` without hardcoded paths.",
    myScope: "TODO: confirm. I designed and wrote the CLI, including validation, exclusions, dry-run and logging.",
  },

  architecture: {
    lede: "Arguments and config are validated first, exclusions applied, and only then does tar run, with every step logged to two streams.",
    image: {
      "description": "CLI → Validate → Exclude → Dry-run → tar/gzip → Dual-stream Log",
      "components": [
        {
          "label": "User / Cron",
          "position": {
            "x": 7,
            "y": 50
          }
        },
        {
          "label": "CLI Arg Parser",
          "position": {
            "x": 22,
            "y": 28
          }
        },
        {
          "label": "archive.conf Reader",
          "position": {
            "x": 22,
            "y": 72
          }
        },
        {
          "label": "Path Validator",
          "position": {
            "x": 40,
            "y": 50
          }
        },
        {
          "label": ".bassignore Parser",
          "position": {
            "x": 57,
            "y": 28
          }
        },
        {
          "label": "Dry-run Engine",
          "position": {
            "x": 57,
            "y": 72
          }
        },
        {
          "label": "tar Compression Core",
          "position": {
            "x": 75,
            "y": 50
          }
        },
        {
          "label": ".tar.gz Archive",
          "position": {
            "x": 90,
            "y": 28
          }
        },
        {
          "label": "archive.log (stdout/stderr)",
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
          "from": 0,
          "to": 2
        },
        {
          "from": 1,
          "to": 3
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
          "to": 7
        },
        {
          "from": 6,
          "to": 8
        }
      ]
    },
    caption: "Critical path highlighted: nothing is compressed until paths are validated and exclusions resolved.",
    highlightedPath: ["CLI Arg Parser", "Path Validator", ".bassignore Parser", "tar Compression Core", ".tar.gz Archive"],
  },

  decisions: {
    lede: "Three choices define the tool: Bash for portability, explicit exit checks over `set -e`, and errors on their own stream.",
    items: [
      {
        title: "Bash instead of Python",
        problem: "The tool must run in any Unix-based CI/CD environment without installing anything.",
        options: ["Python with proper exception handling", "Bash with direct access to `tar` pipes"],
        decision: "Bash, for zero-dependency portability and direct filesystem stream handling.",
        result: "Runs anywhere a shell and tar exist.",
        tradeoff: "Bash's error handling is loose, which the next decision has to compensate for.",
      },
      {
        title: "Explicit exit-code checks instead of `set -e`",
        problem: "`set -e` aborts immediately and skips cleanup, while ignoring errors produces silent failures.",
        options: ["`set -e`", "Check `$?` after every critical operation"],
        decision: "Explicit `$?` checks after each critical step, followed by graceful cleanup routines.",
        result: "Failures stop the run and still leave the filesystem tidy.",
        tradeoff: "More boilerplate, and a missed check is a silent gap.",
      },
      {
        title: "Dual-stream logging",
        problem: "CI pipelines need failures to break the build while users still see progress.",
        options: ["Single log output", "ERROR to `stderr`, INFO to `stdout`, everything appended to `archive.log`"],
        decision: "`log_message` routes errors to fd 2, info to fd 1 and appends every entry to a persistent audit log.",
        result: "Missing sources or permission errors break pipelines immediately, with a full audit trail on disk.",
        tradeoff: "`archive.log` grows without rotation.",
      },
    ],
  },

  measurement: {
    lede: "TODO: no run time or size measurement is recorded yet.",
    headline: { label: "TODO: what was measured", before: "TODO: before", after: "TODO: after" },
    method: {
      network: "TODO: n/a or host description",
      samples: "TODO: number of runs measured",
      p50: "TODO: p50 run time",
      p95: "TODO: p95 run time",
    },
    before: [{ stage: "Ad-hoc cp / tar commands (baseline)", ms: "TODO: measure" }],
    after: [
      { stage: "Validate", ms: "TODO: measure" },
      { stage: ".bassignore exclusion", ms: "TODO: measure" },
      { stage: "tar / gzip", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "Invalid input stops the run before any disk I/O, and every failure is visible on `stderr`.",
    bullets: [
      "Validated against **4 input scenarios**: arguments, config file, dry-run and invalid input.",
      "Execution is blocked if target directories cannot be created or the source is unreadable.",
      "Critical failures (missing source, permission denied) go to `stderr` to break build pipelines.",
      "**Dry-run** mode builds the backup manifest without disk I/O, preventing accidental storage saturation.",
    ],
  },

  limits: {
    lede: "It is a reliable single-host backup, not a backup system.",
    items: [
      {
        today: "Every run writes a full tar.gz of the source.",
        atScale: "Incremental or deduplicated backups (for example `rsync --link-dest` or restic).",
      },
      {
        today: "Archives stay on the machine that made them.",
        atScale: "Ship archives off-host to object storage with a retention policy.",
      },
      {
        today: "`archive.log` is appended forever.",
        atScale: "Rotate logs with logrotate, or send them to the system journal.",
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
      language: "bash",
      snippet: `log_message() {
    LEVEL=$1
    MESSAGE=$2 
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    LOG_ENTRY="\${LEVEL}: [\${TIMESTAMP}] \${MESSAGE}"

    # Strict Stream Separation: 
    # Errors to stderr (fd2) for pipeline monitoring
    # Info to stdout (fd1) for user feedback
    if [ "$LEVEL" == "ERROR" ]; then
        echo "\${LOG_ENTRY}" >&2
    else
        echo "\${LOG_ENTRY}"
    fi

    # Persistent audit trail
    echo "\${LOG_ENTRY}" >> "\${LOG_FILE}"
}`,
    },
  ],
};
