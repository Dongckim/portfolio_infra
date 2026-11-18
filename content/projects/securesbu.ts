import type { Project } from "./types";

export const securesbu: Project = {
  slug: "securesbu",
  summary: {
    eyebrow: "AI security assistant",
    title: "SecureSBU",
    tagline: "A Teams chatbot that answers HIPAA policy questions from the source documents.",
    role: "Full Stack Engineer & Team Leader",
    team: "4",
    duration: "Hackathon weekend (Nov 8–9, 2025)",
    links: { demo: "https://www.youtube.com/watch?v=g81AkDZfJF4" },
    stack: {
      Frontend: ["React", "TypeScript"],
      Backend: ["Node.js", "Express", "MySQL"],
      AI: ["NeuralSeek (RAG)"],
      Integrations: ["Microsoft Teams API", "Discord Webhook"],
    },
    stats: [
      { value: "Hours → seconds", label: "Time to answer a policy question" },
      { value: "50+", label: "Edge-case queries tested" },
      { value: "100%", label: "Grounded answers across the edge-case test set" },
    ],
    media: [
      { src: "/securesbu-ui.png", alt: "SecureSBU answering a policy question in Teams" },
    ],
  },

  context: {
    lede: "Most HIPAA violations come from simple staff mistakes, and the policies that would prevent them are too long to read on shift.",
    problem:
      "Policy documents are long, complex and constantly changing, so staff cannot realistically keep up with them. " +
      "A policy assistant in this setting must never make up an answer, because a wrong one is a compliance risk.",
    myScope: "I led the team and built the full stack: the React UI, the Express API, the MySQL audit log and the Teams and Discord integrations.",
  },

  architecture: {
    lede: "Every question passes a risk interceptor before it reaches NeuralSeek's RAG over the policy PDFs, and risky queries go to the security team instead.",
    image: {
      "description": "Teams + React → Express → Risk Intercept → RAG → Policy DB → Incident Alert",
      "components": [
        {
          "label": "MS Teams Bot",
          "position": {
            "x": 6,
            "y": 30
          }
        },
        {
          "label": "React Frontend",
          "position": {
            "x": 6,
            "y": 70
          }
        },
        {
          "label": "Express API Server",
          "position": {
            "x": 25,
            "y": 50
          }
        },
        {
          "label": "Risk Interceptor",
          "position": {
            "x": 45,
            "y": 28
          }
        },
        {
          "label": "NeuralSeek RAG",
          "position": {
            "x": 65,
            "y": 28
          }
        },
        {
          "label": "Policy PDF DB",
          "position": {
            "x": 82,
            "y": 22
          }
        },
        {
          "label": "MySQL (audit log)",
          "position": {
            "x": 82,
            "y": 50
          }
        },
        {
          "label": "Discord Webhook",
          "position": {
            "x": 65,
            "y": 72
          }
        },
        {
          "label": "Security Team Alert",
          "position": {
            "x": 82,
            "y": 78
          }
        }
      ],
      "connections": [
        {
          "from": 0,
          "to": 2
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
          "from": 4,
          "to": 6
        },
        {
          "from": 3,
          "to": 7
        },
        {
          "from": 7,
          "to": 8
        }
      ]
    },
    caption: "Highlighted: the normal policy-question path, from Teams through the interceptor to RAG-grounded answers.",
    highlightedPath: ["MS Teams Bot", "Express API Server", "Risk Interceptor", "NeuralSeek RAG", "Policy PDF DB"],
  },

  decisions: {
    lede: "Two choices kept the assistant accurate and cheap to run: retrieval instead of fine-tuning, and webhooks instead of a bot.",
    items: [
      {
        title: "RAG over fine-tuning",
        problem: "Policies change often, and answers must stay grounded in the current documents.",
        options: ["Fine-tune a custom LLM", "NeuralSeek's RAG framework over the policy PDFs"],
        decision: "NeuralSeek RAG in `strictMode` over the `SBUH_POLICIES` knowledge base, returning citations with each answer.",
        result: "Uploading a new PDF updates the knowledge base with no retraining and no GPU resources.",
        tradeoff: "Fine-tuning would give more control, and the system now depends on NeuralSeek's infrastructure.",
      },
      {
        title: "Intercept risky queries before RAG",
        problem: "Some questions (PHI, passwords, breaches) point to a live incident rather than a policy lookup.",
        options: ["TODO: alternatives considered", "Keyword interception ahead of the RAG call"],
        decision: "A pattern check runs first. A match returns an `INCIDENT_PROMPT` with a report button, and reports alert the security team through a Discord webhook.",
        result: "The loop from a user spotting an issue to the team responding closes within seconds.",
        tradeoff: "Webhooks were picked over a full Discord bot to keep deployment simple, so alerts only flow one way.",
      },
    ],
  },

  measurement: {
    lede: "Answering a policy question went from hours of manual lookup to seconds.",
    headline: { label: "Time to answer a policy question", before: "Hours", after: "Seconds" },
    method: {
      network: "TODO: environment measured",
      samples: "TODO: number of queries timed",
      p50: "TODO: p50",
      p95: "TODO: p95",
    },
    before: [{ stage: "Manual policy lookup", ms: "TODO: measure" }],
    after: [
      { stage: "Risk interception", ms: "TODO: measure" },
      { stage: "NeuralSeek RAG answer", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "When no policy matches, the bot says so and points to the security team instead of guessing.",
    bullets: [
      "Every answer is grounded in a verified policy source, and the test set of **50+ edge cases** returned no hallucinated answers.",
      "**Graceful degradation**: with no relevant policy, the reply is \"I couldn't find a specific policy for this. Please consult with the security team directly.\"",
      "Incident reports retry with exponential backoff to ride out temporary Discord API outages.",
    ],
    details: [
      "Ambiguous queries",
      "Multi-part questions",
      "Queries with no direct policy match",
    ],
  },

  limits: {
    lede: "The risk check and the alert channel are deliberately simple and would need hardening before a hospital-wide rollout.",
    items: [
      {
        today: "Risk detection is a case-insensitive substring match on four keywords (`PHI`, `personal email`, `password`, `breach`).",
        atScale: "TODO: confirm. For example, a classifier or a policy-owned rule set with logged false positives and false negatives.",
      },
      {
        today: "Answers depend on NeuralSeek being available, with no fallback.",
        atScale: "TODO: confirm. For example, a health check plus a static \"contact security\" fallback when the provider is down.",
      },
      {
        today: "Alerts go to a Discord webhook, which is one-way and outside the hospital's identity system.",
        atScale: "TODO: confirm. For example, route incidents to the organisation's ticketing or paging system.",
      },
    ],
  },

  learnings: {
    lede: "TODO: one-sentence summary of what this project taught you.",
    items: [
      "TODO: confirm. For example, in safety-critical domains, a grounded \"I don't know\" is better than a fluent guess.",
      "TODO: confirm. For example, combining AI precision with human oversight turned every staff member into part of the security defense.",
    ],
  },

  deepDive: [
    {
      kind: "code",
      label: "Key implementation",
      language: "typescript",
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
    {
      kind: "text",
      label: "Impact",
      body:
        "Transformed security compliance from static documentation into dynamic, intelligent infrastructure. The chatbot reduced response time for policy questions from hours (manual lookup) to seconds, while the risk-aware incident reporting workflow closed the loop from user detection to team response within seconds.",
    },
  ],
};
