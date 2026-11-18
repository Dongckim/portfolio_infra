import type { Project } from "./types";

export const pymark: Project = {
  slug: "pymark",
  summary: {
    eyebrow: "Developer tooling",
    title: "PyMark Renderer",
    tagline: "A dependency-free Markdown-to-HTML engine built on a strictly ordered regex pipeline.",
    role: "TODO: role",
    team: "TODO: team size",
    duration: "TODO: duration",
    links: { repo: "https://github.com/Dongckim/md2html" },
    stack: {
      Language: ["Python", "Regex"],
      Testing: ["Pytest", "TDD"],
    },
    stats: [
      { value: "0", label: "External dependencies" },
      { value: "8", label: "Edge-case categories in the pytest suite" },
      { value: "90%+", label: "Test coverage" },
    ],
  },

  context: {
    lede: "Markdown symbols like `*` and `_` mean different things depending on position, so naive parsing breaks as soon as formats nest.",
    problem:
      "Without a library, the same symbol can be a list item, italics, bold or a literal, and naive parsing fails when formats overlap (for example a link containing bold text). " +
      "The conflicts had to be resolved deterministically without building a full AST.",
    myScope: "TODO: confirm. I wrote the renderer and its pytest suite test-first.",
  },

  architecture: {
    lede: "Input is split into blocks, each block is parsed, inline formats run in a fixed order, and the result is escaped before output.",
    image: {
      "description": "Sequential Tokenization Pipeline",
      "components": [
        {
          "label": "Raw Markdown",
          "position": {
            "x": 10,
            "y": 50
          }
        },
        {
          "label": "Block Splitter",
          "position": {
            "x": 30,
            "y": 50
          }
        },
        {
          "label": "Block Parser (H1/List)",
          "position": {
            "x": 50,
            "y": 30
          }
        },
        {
          "label": "Inline Processor",
          "position": {
            "x": 50,
            "y": 70
          }
        },
        {
          "label": "HTML Sanitizer",
          "position": {
            "x": 70,
            "y": 50
          }
        },
        {
          "label": "Output HTML",
          "position": {
            "x": 90,
            "y": 50
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
          "from": 1,
          "to": 3
        },
        {
          "from": 2,
          "to": 4
        },
        {
          "from": 3,
          "to": 4
        },
        {
          "from": 4,
          "to": 5
        }
      ]
    },
    caption: "Critical path highlighted: inline formatting order is fixed so earlier passes protect content from later ones.",
    highlightedPath: ["Raw Markdown", "Block Splitter", "Inline Processor", "HTML Sanitizer", "Output HTML"],
  },

  decisions: {
    lede: "Three choices resolve the ambiguity: a sequential regex pipeline, a strict inline order, and word-boundary lookarounds.",
    items: [
      {
        title: "Sequential regex pipeline instead of an AST",
        problem: "A full parser is heavy, and the tool must run where installing packages is restricted.",
        options: ["AST parser with arbitrary nesting", "Regex-based sequential pipeline"],
        decision: "A regex pipeline with zero external dependencies.",
        result: "O(n) on typical documents and drop-in usable where `markdown` or `pandoc` cannot be installed.",
        tradeoff: "No arbitrary nesting, and correctness depends on the order of passes.",
      },
      {
        title: "Fixed inline order: links, then code, then emphasis",
        problem: "Underscores inside URLs or code would be turned into emphasis if emphasis ran first.",
        options: ["Apply inline rules in any order", "Enforce one call order in `apply_inline_formats`"],
        decision: "`convert_link` runs first, then `convert_code`, then `convert_emphasis`.",
        result: "URLs and code spans survive intact.",
        tradeoff: "Adding a new inline rule means reasoning about where it sits in the order.",
      },
      {
        title: "Lookarounds for intra-word underscores",
        problem: "`my_variable_name` must not become emphasis.",
        options: ["Match any `__…__` pair", "Require non-word characters on both sides with `(?<!\\w)` and `(?!\\w)`"],
        decision: "Lookbehind and lookahead so only underscores at word borders match.",
        result: "Identifiers with underscores render unformatted, covered by `test_convert_emphasis_invalid_underscore`.",
        tradeoff: "TODO: confirm. Intentional intra-word emphasis is not supported.",
      },
    ],
  },

  measurement: {
    lede: "TODO: no render time has been measured; the O(n) claim is not backed by a benchmark yet.",
    headline: { label: "TODO: what was measured", before: "TODO: before", after: "TODO: after" },
    method: {
      network: "TODO: n/a (local); state the machine and Python version",
      samples: "TODO: number of documents benchmarked",
      p50: "TODO: p50 render time",
      p95: "TODO: p95 render time",
    },
    before: [{ stage: "TODO: baseline renderer for comparison", ms: "TODO: measure" }],
    after: [
      { stage: "Block split + parse", ms: "TODO: measure" },
      { stage: "Inline passes", ms: "TODO: measure" },
      { stage: "HTML escaping", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "Malformed Markdown degrades to raw text instead of crashing, and special characters are always escaped.",
    bullets: [
      "A test-first **pytest** suite covers **8 edge-case categories**.",
      "**Intra-word protection** keeps identifiers like `my_variable_name` unformatted.",
      "**Graceful degradation** renders unclosed tags as raw text rather than crashing.",
      "**HTML escaping** sanitises `<` and `&` to prevent XSS.",
    ],
    details: [
      "`test_convert_emphasis_invalid_underscore`",
      "`test_convert_code_unclosed`",
      "`test_convert_emphasis_unclosed`",
      "`test_convert_paragraph_special_chars`",
    ],
  },

  limits: {
    lede: "It covers a deliberate subset of Markdown, which is the price of having no dependencies.",
    items: [
      {
        today: "Block parsing handles headings and lists only.",
        atScale: "Add the remaining block types, or adopt a CommonMark-compliant parser when dependencies are allowed.",
      },
      {
        today: "Nested and overlapping inline formats rely on pass order and are a known limitation.",
        atScale: "Move to a tokenizer plus a small AST once nesting matters.",
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
      language: "python",
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
    # Utilization of Lookbehind (?<!w) ensures we only match 
    # underscores that are strictly borders of words.
    # Matches 'bold' in '__bold__' but ignores 'variable' in 'my_variable_name'
    line = re.sub(r'(?<!w)__([^_]+)__(?!w)', r'<strong>1</strong>', line)
    return line`,
    },
  ],
};
