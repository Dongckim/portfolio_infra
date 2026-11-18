import type { Project } from "./types";

export const unicare: Project = {
  slug: "unicare",
  summary: {
    eyebrow: "Social impact web app · 2024 SeSAC Hackathon",
    title: "UniCare",
    tagline: "A job-matching platform connecting foreign caregivers with Korean care companies.",
    role: "Frontend Lead and Vice Team Lead",
    team: "5 (planning/design, 2 frontend, backend, backend/AI)",
    duration: "TODO: hackathon dates",
    links: { repo: "https://github.com/Dongckim/2024-Sprout-Hackathon-Frontend", demo: "https://sprout-hackathon.vercel.app/" },
    stack: {
      Frontend: ["React 18", "JavaScript", "Vite", "TanStack Query v5", "Zustand", "Tailwind CSS", "WebRTC audio"],
      Backend: ["Spring Boot", "MySQL", "REST API", "Swagger"],
      AI: ["Python", "FastAPI"],
      Infra: ["Docker", "Jenkins", "Amazon EC2", "Vercel"],
    },
    stats: [
      { value: "5", label: "Team members across planning, frontend, backend and AI" },
      { value: "TODO: metric", label: "TODO: a real number (users, screens, API calls)" },
      { value: "TODO: metric", label: "TODO: a real number" },
    ],
    awards: [{ title: "Encouragement Prize", event: "2024 SeSAC Hackathon" }],
    thumbnail: "/projects/unicare-cover.jpg",
    media: [
      { src: "/projects/unicare-cover.jpg", alt: "The UniCare team with the Encouragement Prize at the 2024 SeSAC Hackathon" },
      {
        src: "/projects/unicare-1.jpg",
        alt: "UniCare chatbot screens: chat, photo questions and voice",
        title: "Ask in your own words.",
        body: "An AI helper answers caregiving questions by chat, from a photo of a document, or from a recorded voice, and keeps a dated history.",
      },
      {
        src: "/projects/unicare-2.jpg",
        alt: "UniCare job listings, posting detail and my page",
        title: "Jobs near you, in one tap.",
        body: "Region-filtered listings show experience, hours and pay up front, and my page tracks applications and work history.",
      },
    ],
  },

  context: {
    lede: "Korea's ageing population needs more caregivers, and many foreign job seekers can't find a safe way in.",
    problem:
      "Recruitment is fragmented, employers and job seekers don't share the same information, and language barriers push foreign caregivers toward informal brokers. " +
      "That raises the risk of exploitation and mismatched jobs.",
    myScope:
      "I led the frontend and its architecture as vice team lead, and coordinated scope between planning, backend and AI. " +
      "I also reviewed frontend code for consistent UX and state patterns.",
  },

  architecture: {
    lede: "A React client splits server state, UI state and AI results, talking to a Spring Boot API and a FastAPI AI service.",
    image: {
      description: "React client with TanStack Query + Zustand, Spring Boot API and FastAPI AI service",
      components: [
        { label: "React Client (Vite)", position: { x: 8, y: 50 } },
        { label: "Zustand (UI state)", position: { x: 26, y: 20 } },
        { label: "TanStack Query (server state)", position: { x: 30, y: 50 } },
        { label: "WebRTC Audio", position: { x: 26, y: 80 } },
        { label: "Spring Boot REST API", position: { x: 58, y: 35 } },
        { label: "MySQL", position: { x: 85, y: 20 } },
        { label: "FastAPI AI Service", position: { x: 58, y: 75 } },
        { label: "AI Answers", position: { x: 85, y: 75 } },
      ],
      connections: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 0, to: 3 },
        { from: 2, to: 4 },
        { from: 4, to: 5 },
        { from: 3, to: 6, label: "voice" },
        { from: 2, to: 6 },
        { from: 6, to: 7 },
      ],
    },
    caption: "Highlighted: a chatbot question, from the client to the AI service and back. TODO: confirm how the AI service is reached.",
    highlightedPath: ["React Client (Vite)", "TanStack Query (server state)", "FastAPI AI Service", "AI Answers"],
  },

  decisions: {
    lede: "We treated UX as a system problem: how fast and how predictably data shows up.",
    items: [
      {
        title: "TanStack Query for server state",
        problem: "Listings and AI responses need fetching, caching and syncing without hand-written loading logic everywhere.",
        options: ["Manual fetch and useEffect", "TanStack Query"],
        decision: "All server data goes through TanStack Query.",
        result: "Caching and synchronization come for free, and loading and error states are consistent across screens.",
        tradeoff: "TODO: confirm. For example, the team had to learn its cache-key conventions mid-hackathon.",
      },
      {
        title: "Zustand for client state",
        problem: "Global UI state should not cause wide re-renders or tangle with server data.",
        options: ["React Context", "Zustand"],
        decision: "A small Zustand store holds client-side state, kept separate from server state and AI results.",
        result: "Minimal re-rendering and state flows that are easy to predict.",
        tradeoff: "TODO: confirm.",
      },
      {
        title: "Make async AI feel predictable",
        problem: "AI inference is slow and uneven, and a blank screen makes users hesitate.",
        options: ["Block until the answer arrives", "Loading states, fallbacks and optimistic UI"],
        decision: "Every AI call shows explicit feedback, with fallbacks and optimistic updates.",
        result: "Users always know what the system is doing, even while the model is still answering.",
        tradeoff: "TODO: confirm. For example, optimistic UI has to roll back cleanly on failure.",
      },
    ],
  },

  measurement: {
    lede: "Built in a hackathon. No performance or usage numbers were recorded.",
    headline: { label: "TODO: what was measured", before: "TODO: before", after: "TODO: after" },
    method: {
      network: "TODO: network",
      samples: "TODO: samples",
      p50: "TODO: p50",
      p95: "TODO: p95",
    },
    before: [{ stage: "TODO: baseline stage", ms: "TODO: measure" }],
    after: [
      { stage: "Listing load (TanStack Query)", ms: "TODO: measure" },
      { stage: "Chatbot answer (AI service)", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "Async work never leaves the user guessing.",
    bullets: [
      "Server state, UI state and AI-generated results live in **separate layers**.",
      "AI responses use **loading states, fallbacks and optimistic UI**.",
      "I reviewed frontend code to keep **UX and state patterns consistent** across the team.",
    ],
  },

  limits: {
    lede: "A hackathon build, scoped for a demo.",
    items: [
      {
        today: "TODO: confirm what was mocked or left out for the demo.",
        atScale: "TODO: confirm. For example, multilingual UI and verified employer accounts.",
      },
    ],
  },

  learnings: {
    lede: "User experience is tied to frontend system design, not just interface polish.",
    items: [
      "Async systems such as APIs, AI inference and real-time audio have to behave predictably from the user's side.",
      "Transparent state transitions cut uncertainty and hesitation.",
      "A good interface guides people through a complex process without exposing the complexity underneath.",
    ],
  },

  deepDive: [
    {
      kind: "images",
      label: "Development and tools",
      items: [{ src: "/projects/unicare-3.jpg", alt: "UniCare tools by team: plan, frontend, backend, DevOps and AI" }],
    },
  ],
};
