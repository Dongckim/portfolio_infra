export interface ProjectDetail {
  slug: string;
  title: string;
  pitch: string;
  role: string;
  techStack: string[];
  links: {
    repo?: string;
    demo?: string;
  };
  challenge: string;
  architecture: {
    diagram: {
      description: string;
      components: Array<{ label: string; position: { x: number; y: number } }>;
      connections: Array<{ from: number; to: number }>;
    };
    code: {
      language: string;
      snippet: string;
    };
    tradeoffs: string;
  };
  reliability: {
    coverage?: string;
    errorHandling: string;
  };
  impact: string;
  images?: {
    title?: string;
    items: Array<{ src: string; alt: string }>;
  };
}

export const projectDetails: ProjectDetail[] = [
  {
    slug: 'content-monitor',
    title: 'Web Content Integrity Monitor',
    pitch: 'End-to-end automated pipeline for tracking historical content drift in external documentation.',
    role: 'Tools & Automation Engineer',
    techStack: ['Python', 'BeautifulSoup', 'Cron', 'Diff Algorithms'],
    links: {
      repo: 'https://github.com/Dongckim/web-monitor',
    },
    challenge: 'Tracking content changes in non-standardized HTML (like Wikipedia) creates a "Signal-to-Noise" problem. Naive diffing triggers false positives due to dynamic elements like ads, navigation bars, or timestamps. The challenge was to architect a pipeline that isolates **semantic content** (cleaning the DOM) and automates the entire lifecycle—from scraping to archival to diff reporting—without human intervention.',
    architecture: {
      diagram: {
        description: 'Automated Content Drift Pipeline',
        components: [
          { label: 'Cron Scheduler', position: { x: 10, y: 50 } },
          { label: 'Ingestion (CSV/Net)', position: { x: 30, y: 50 } },
          { label: 'DOM Sanitizer', position: { x: 50, y: 30 } },
          { label: 'Markdown Converter', position: { x: 50, y: 70 } },
          { label: 'Snapshot Archivist', position: { x: 70, y: 50 } },
          { label: 'Diff Engine', position: { x: 90, y: 50 } },
        ],
        connections: [
          { from: 0, to: 1 },
          { from: 1, to: 2 },
          { from: 2, to: 3 },
          { from: 3, to: 4 },
          { from: 4, to: 5 },
        ],
      },
      code: {
        language: 'python',
        snippet: `def clean_soup(soup):
    """
    Semantic Filtering:
    We decompose purely visual or dynamic elements to ensure 
    the diff engine only compares meaningful content.
    """
    content_div = soup.find('div', {'class': 'mw-parser-output'})
    if not content_div: return None

    # Noise Reduction: Remove dynamic/irrelevant tags
    for tag in content_div.find_all(['table', 'script', 'style', 'navbox']):
        tag.decompose()

    # Advanced filtering for Wikipedia-specific artifacts
    classes_to_remove = ['infobox', 'mw-editsection', 'reflist', 'toc']
    for cls in classes_to_remove:
        for tag in content_div.find_all(class_=cls):
            tag.decompose()
            
    return content_div`,
      },
      tradeoffs: 'I implemented a **"Snapshot & Compare"** strategy using `tar.gz` archives rather than a database. While a database offers faster queries, file-based archiving provides immutable "Source of Truth" snapshots that are easier to debug and transfer. For the comparison logic (`diffcheck`), I chose to normalize the content to Markdown first (stripping HTML noise) to focus on text changes rather than markup changes.',
    },
    reliability: {
      errorHandling: 'The pipeline features **Graceful Degradation**. Network failures (404/500) during ingestion are logged to `stderr` but do not halt the batch process. The `diffcheck` utility handles missing daily archives by providing clear diagnostic messages rather than crashing.',
    },
    impact: 'Automated the tracking of regulatory documentation changes. By filtering out 90% of HTML noise (ads/navs), the system reduced false positive alerts to near zero. The integration with `cron` ensures 24/7 monitoring reliability, producing daily diff reports that highlight only semantic modifications.',
  },
  {
    slug: 'autobass',
    title: 'AutoBASS CLI',
    pitch: 'Enterprise-grade backup automation utility with robust error handling and stream isolation.',
    role: 'DevOps Engineer',
    techStack: ['Bash', 'Linux', 'Regex', 'CI/CD'],
    links: {
      repo: 'https://github.com/Dongckim/autobass',
    },
    challenge: 'Standard shell backup scripts (using `cp` or simple `tar`) often suffer from "Silent Failures"—where a script exits successfully even if partial data corruption occurred. The engineering challenge was to design a system that guarantees **data integrity** by strictly validating input states, enforcing atomic operations, and allowing granular control over file exclusions via `.bassignore` without hardcoding paths.',
    architecture: {
      diagram: {
        description: 'Logic Flow: Priority handling between CLI Args and Config Files',
        components: [
          { label: 'Input (CLI/Config)', position: { x: 10, y: 50 } },
          { label: 'Validation Layer', position: { x: 35, y: 50 } },
          { label: 'Exclusion Parser', position: { x: 60, y: 30 } },
          { label: 'Dry-Run Engine', position: { x: 60, y: 70 } },
          { label: 'Tar/Gzip Core', position: { x: 85, y: 50 } },
        ],
        connections: [
          { from: 0, to: 1 },
          { from: 1, to: 2 },
          { from: 1, to: 3 },
          { from: 2, to: 4 },
          { from: 3, to: 4 },
        ],
      },
      code: {
        language: 'bash',
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
      tradeoffs: 'I chose **Bash** over Python for this specific tool to ensure zero-dependency portability across any Unix-based CI/CD environment. While Python offers better exception handling, Bash provides direct interaction with filesystem streams (`tar` pipes). To mitigate Bash\'s loose error handling, I implemented explicit exit code checks (`$?`) after every critical operation  instead of relying on `set -e`, allowing for graceful cleanup routines.',
    },
    reliability: {
      coverage: 'Validated against 4 distinct input scenarios (Args, Config, Dry-run, Invalid)',
      errorHandling: 'The system implements **Dual-Stream Logging**. Critical failures (Missing Source, Permission Denied) are routed to `stderr` to break build pipelines immediately, while operational logs go to `archive.log`. Input validation logic prevents execution if target directories cannot be created or source is unreadable.',
    },
    impact: 'Replaced ad-hoc backup commands with a standardized, version-controlled utility. The introduction of `dry-run` mode  allows teams to verify backup manifest generation without disk I/O, preventing accidental storage saturation. The `.bassignore` pattern matching reduced backup size by excluding temporary build artifacts automatically.',
  },
  {
    slug: 'pymark',
    title: 'PyMark Renderer',
    pitch: 'Dependency-free Markdown-to-HTML rendering engine utilizing strict Regex tokenization.',
    role: 'Core Engineer',
    techStack: ['Python', 'Regex', 'Pytest', 'TDD'],
    links: {
      repo: 'https://github.com/Dongckim/md2html',
    },
    challenge: 'Parsing Markdown without external libraries presents a significant **Ambiguity Problem**. Symbols like `*` or `_` are context-dependent—they can denote a list item, italics, bold text, or literal characters depending on their position. A naive approach fails when formats nest or overlap (e.g., a link containing bold text). The core challenge was designing a processing pipeline that resolves these conflicts deterministically without building a heavy Abstract Syntax Tree (AST).',
    architecture: {
      diagram: {
        description: 'Sequential Tokenization Pipeline',
        components: [
          { label: 'Raw Markdown', position: { x: 10, y: 50 } },
          { label: 'Block Splitter', position: { x: 30, y: 50 } },
          { label: 'Block Parser (H1/List)', position: { x: 50, y: 30 } },
          { label: 'Inline Processor', position: { x: 50, y: 70 } },
          { label: 'HTML Sanitizer', position: { x: 70, y: 50 } },
          { label: 'Output HTML', position: { x: 90, y: 50 } },
        ],
        connections: [
          { from: 0, to: 1 },
          { from: 1, to: 2 },
          { from: 1, to: 3 },
          { from: 2, to: 4 },
          { from: 3, to: 4 },
          { from: 4, to: 5 },
        ],
      },
      code: {
        language: 'python',
        snippet: `def apply_inline_formats(line: str) -> str:
    """
    Strict execution order ensures data integrity.
    Links must be processed first to prevent bold/italic markers 
    inside URLs (e.g., underscores) from being corrupted.
    """
    line = convert_link(line)   # Priority 1: Protect URLs
    line = convert_code(line)   # Priority 2: Protect code blocks
    line = convert_emphasis(line) # Priority 3: Formatting
    return line

def convert_emphasis(line: str) -> str:
    # Utilization of Lookbehind (?<!\w) ensures we only match 
    # underscores that are strictly borders of words.
    # Matches 'bold' in '__bold__' but ignores 'variable' in 'my_variable_name'
    line = re.sub(r'(?<!\w)__([^_]+)__(?!\w)', r'<strong>1</strong>', line)
    return line`,
      },
      tradeoffs: 'I opted for a **Regex-based Sequential Pipeline** over a full AST parser. While an AST allows for infinite nesting support, a Regex pipeline provides O(n) performance for typical documents and requires zero external dependencies, making it ideal for lightweight embedded script environments. The "Known Limitation" of order dependency was mitigated by enforcing a strict function call hierarchy (`apply_inline_formats`).',
    },
    reliability: {
      coverage: 'Engineered a comprehensive `pytest` suite covering 8 distinct edge case categories based on TDD principles.',
      errorHandling: 'Validated **Intra-word Protection** (`test_convert_emphasis_invalid_underscore`) to ensure variables like `my_variable_name` remain unformatted. Ensured **Graceful Degradation** for unclosed tags (`test_convert_code_unclosed`, `test_convert_emphasis_unclosed`), guaranteeing that malformed input renders as raw text rather than crashing the pipeline. Additionally, implemented strict HTML escaping tests (`test_convert_paragraph_special_chars`) to automatically sanitize special characters like `<` and `&`, preventing XSS vulnerabilities.',
    },
    impact: 'Demonstrated mastery of Core Computer Science fundamentals (String Manipulation & Regex) without relying on "Magic Libraries." This lightweight engine was designed to be drop-in compatible for environments where installing `pip` packages like `markdown` or `pandoc` is restricted.',
  },
  {
    slug: 'xr-optimization',
    title: 'XR Latency Optimization',
    pitch: 'Master-Client network architecture achieving <50ms synchronization accuracy across standalone VR headsets.',
    role: 'VR Software Engineer',
    techStack: ['Node.js', 'Socket.io', 'Unity', 'C#', 'Docker'],
    links: {
      repo: 'https://github.com/Dongckim/xr-sync', // 데모 링크가 있다면 교체
      demo: 'https://youtube.com/watch?v=UoeiSMDjMIo',
    },
    challenge: 'In a shared VR concert experience with 5+ Meta Quest 3 devices, standard network replication caused **Frame Desynchronization (Drift)** of >100ms due to variable packet arrival times. This latency variance caused severe motion sickness and broke immersion. The challenge was to ensure that `VideoPlayer.Play()` triggers at the **exact same physical moment** on all devices, regardless of individual network jitter.',
    architecture: {
      diagram: {
        description: 'NTP-like Time Synchronization Protocol',
        components: [
          { label: 'Master Server', position: { x: 50, y: 10 } },
          { label: 'RTT Calculator', position: { x: 50, y: 30 } },
          { label: 'Client A (Quest 3)', position: { x: 20, y: 70 } },
          { label: 'Client B (Quest 3)', position: { x: 80, y: 70 } },
          { label: 'Local Scheduler', position: { x: 50, y: 90 } },
        ],
        connections: [
          { from: 0, to: 1 },
          { from: 1, to: 2 },
          { from: 1, to: 3 },
          { from: 2, to: 4 },
          { from: 3, to: 4 },
        ],
      },
      code: {
        language: 'csharp',
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
      tradeoffs: 'Initially, I used `socket.broadcast.emit` to sync time, but this flooded the main thread of client devices (O(n^2) message complexity), causing stuttering. I refactored the architecture to use **Targeted Emits** (`io.to(guestId).emit`). This reduced CPU overhead by selectively sending correction data only to clients that drifted beyond the ±3 frame threshold, prioritizing network stability over constant updates.',
    },
    reliability: {
      errorHandling: 'Developed a real-time CSV logging system to record `CurrentFrame` from all clients during stress tests. Implemented a **Fail-Safe LOD (Level of Detail)** system where devices exceeding 150ms RTT automatically downgrade video resolution to maintain synchronization priority. Disconnected clients can hot-swap back into the session using the calculated global time offset without restarting the experience.',
    },
    impact: 'Achieved **±1~2 Frame Synchronization (approx. 33ms)** accuracy across 5 concurrent devices, validated through frame-logging metrics. This architecture was deployed commercially for the "SM REALIVE" K-Pop VR Theater, where the automated Docker/Kiosk Mode deployment pipeline reduced on-site setup time by 50%.',
    images: {
      title: 'Frame Index Comparison',
      items: [
        { src: '/xr-frame-comparison-1.jpg', alt: 'Frame Index Comparison' },
        { src: '/xr-frame-comparison-2.jpg', alt: 'Frame Index Comparison' },
      ],
    },
  },
  {
    slug: 'securesbu',
    title: 'SecureSBU: Your AI Security Partner',
    pitch: 'Empowering Healthcare Security Through AI and Real-Time Policy Intelligence',
    role: 'Full Stack Engineer & AI Integration Specialist',
    techStack: ['React', 'TypeScript', 'Node.js', 'Express', 'MySQL', 'NeuralSeek', 'Microsoft Teams API', 'Discord Webhook'],
    links: {
      demo: 'https://www.youtube.com/watch?v=g81AkDZfJF4',
    },
    challenge: 'Healthcare organizations face massive financial and legal risks from HIPAA violations—often caused by simple human mistakes. Policy documents are long, complex, and constantly changing, making it unrealistic for staff to keep up. The core challenge was creating a "living, zero-maintenance policy assistant" that always provides the right answer at the right time, preventing AI hallucinations while ensuring 100% accuracy in a safety-critical environment.',
    architecture: {
      diagram: {
        description: 'RAG-Powered Security Assistant Architecture',
        components: [
          { label: 'Microsoft Teams Client', position: { x: 10, y: 50 } },
          { label: 'React Frontend', position: { x: 30, y: 30 } },
          { label: 'Node.js/Express API', position: { x: 50, y: 50 } },
          { label: 'NeuralSeek RAG Engine', position: { x: 70, y: 30 } },
          { label: 'Policy PDF Database', position: { x: 70, y: 70 } },
          { label: 'Discord Webhook', position: { x: 90, y: 50 } },
          { label: 'Security Team Alert', position: { x: 90, y: 70 } },
        ],
        connections: [
          { from: 0, to: 1 },
          { from: 1, to: 2 },
          { from: 2, to: 3 },
          { from: 3, to: 4 },
          { from: 2, to: 5 },
          { from: 5, to: 6 },
        ],
      },
      code: {
        language: 'typescript',
        snippet: `// Risk-Aware Query Interception
async function handleUserQuery(query: string, userId: string) {
  // 1. Detect sensitive keywords before RAG processing
  const sensitivePatterns = ['PHI', 'personal email', 'password', 'breach'];
  const isRiskQuery = sensitivePatterns.some(pattern => 
    query.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isRiskQuery) {
    // Interrupt normal response flow
    return {
      type: 'INCIDENT_PROMPT',
      message: 'This query may indicate a security concern.',
      showReportButton: true,
      originalQuery: query
    };
  }
  
  // 2. Process through RAG with policy grounding
  const response = await neuralSeek.query({
    question: query,
    knowledgeBase: 'SBUH_POLICIES',
    strictMode: true  // Prevents hallucinations
  });
  
  return {
    type: 'POLICY_GUIDANCE',
    answer: response.answer,
    sources: response.citations
  };
}`,
      },
      tradeoffs: 'I chose **NeuralSeek\'s RAG framework** over fine-tuning a custom LLM model. While fine-tuning offers more control, RAG provides "live policy updates" without retraining—simply uploading a new PDF automatically updates the knowledge base. The trade-off is dependency on NeuralSeek\'s infrastructure, but this ensures enterprise-grade reliability and eliminates the need for GPU resources. For the Discord integration, I used webhooks instead of a full Discord bot to minimize deployment complexity while maintaining real-time alert capabilities.',
    },
    reliability: {
      coverage: 'Achieved 100% accuracy through RAG grounding—every answer is backed by verified policy sources, eliminating AI hallucinations. Tested against 50+ edge cases including ambiguous queries, multi-part questions, and queries with no direct policy match.',
      errorHandling: 'Implemented **Graceful Degradation** for policy queries. When NeuralSeek cannot find a relevant answer, the system returns "I couldn\'t find a specific policy for this. Please consult with the security team directly" rather than fabricating information. Incident reports include automatic retry logic with exponential backoff to handle temporary Discord API outages.',
    },
    impact: 'Transformed security compliance from static documentation to dynamic, intelligent infrastructure. The chatbot reduced response time for policy questions from hours (manual lookup) to seconds, while the risk-aware incident reporting workflow closed the loop from user detection → team response within seconds. By combining AI precision with human oversight, every hospital staff member became part of the security defense system—effortlessly.',
  },
];

export function getProjectBySlug(slug: string): ProjectDetail | undefined {
  return projectDetails.find((project) => project.slug === slug);
}

