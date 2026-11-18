import type { Project } from "./types";

export const village: Project = {
  slug: "village",
  summary: {
    eyebrow: "Location-based web app · Hanghae99 cohort 13",
    title: "Village",
    tagline: "Rent what you need from neighbours instead of buying it.",
    role: "Frontend lead",
    team: "5 (2 frontend, 2 backend, 1 designer)",
    duration: "6 weeks (Mar 31 – May 12, 2023)",
    links: { repo: "https://github.com/Dongckim/Village_FE" },
    stack: {
      Frontend: ["React", "JavaScript", "React Query", "Redux", "styled-components", "React Router", "axios"],
      Realtime: ["WebSocket (STOMP / SockJS)"],
      Infra: ["AWS S3", "CloudFront", "Route 53"],
    },
    stats: [
      { value: "172%", label: "Frontend performance improvement" },
      { value: "6 weeks", label: "From planning to final presentation" },
      { value: "1:1", label: "Real-time chat between renter and lender" },
    ],
    video: "https://www.youtube.com/watch?v=P52dD59hvxI",
    thumbnail: "/projects/village-cover.jpg",
    media: [{ src: "/projects/village-cover.jpg", alt: "Village, the neighbourhood item rental service, on tablet" }],
  },

  context: {
    lede: "Why buy a tool you'll use once, when someone down the street already owns it?",
    problem:
      "Village lives on endless browsing of image-heavy listings, and that feed was slow. " +
      "A large initial bundle, heavy images, layout shifts and offset pagination breaks all hurt browsing continuity.",
    myScope:
      "I led the frontend and its core UI architecture, including the infinite scroll and real-time chat flows. " +
      "I worked with the backend engineers to align API contracts and pagination.",
  },

  architecture: {
    lede: "A React client on S3 and CloudFront talks to a Spring Boot API over HTTPS for data and STOMP for chat.",
    image: "/projects/village-1.png",
    caption: "System architecture: the React frontend on S3 + CloudFront, and the Spring Boot backend on EC2 with RDS, Redis and S3.",
    highlightedPath: ["Client", "CloudFront + Route 53", "React on S3", "axios / STOMP over HTTPS", "Spring Boot on EC2"],
  },

  decisions: {
    lede: "Most of the work went into how and when content appears in the feed.",
    items: [
      {
        title: "No-offset infinite scroll",
        problem: "Offset pagination duplicated or skipped items when users scrolled fast and new data arrived.",
        options: ["Offset-based pages", "Hand-written no-offset scroll logic"],
        decision: "A manual infinite scroll that does not rely on offsets, agreed with the backend's pagination.",
        result: "No duplicated or skipped items, and the scroll position stays stable as data loads.",
        tradeoff: "TODO: confirm. For example, jumping straight to page N is no longer possible.",
      },
      {
        title: "Compress images before upload",
        problem: "Large listing photos made pages slow to load.",
        options: ["Upload originals", "Compress on the client, serve from S3 + CloudFront"],
        decision: "A custom compression step runs before upload, and assets are served through CloudFront.",
        result: "Smaller image payloads with no noticeable loss in quality, delivered from the CDN.",
        tradeoff: "TODO: confirm. For example, compression costs time on slow devices.",
      },
      {
        title: "Lazy loading and re-render cleanup",
        problem: "The initial bundle was too large and deep component trees re-rendered too often.",
        options: ["Ship one bundle", "Route- and component-level lazy loading"],
        decision: "Lazy-load routes and components, and flatten nested structures that re-rendered for no reason.",
        result: "Less JavaScript runs on first load.",
        tradeoff: "Lazy loading is not free: on the listing detail page it slowed the image slider, so those components went back to regular imports.",
      },
    ],
  },

  measurement: {
    lede: "Together, these changes improved frontend performance by 172%, shown in the demo video.",
    headline: {
      label: "Frontend performance, before and after optimization",
      before: "TODO: baseline value",
      after: "TODO: optimized value (172% improvement)",
    },
    method: {
      network: "TODO: network and device",
      samples: "TODO: number of runs",
      p50: "TODO: p50",
      p95: "TODO: p95",
    },
    before: [
      { stage: "Initial page load", ms: "TODO: measure" },
      { stage: "Listing images", ms: "TODO: measure" },
    ],
    after: [
      { stage: "Initial page load (lazy loading)", ms: "TODO: measure" },
      { stage: "Listing images (compressed, CloudFront)", ms: "TODO: measure" },
    ],
  },

  reliability: {
    lede: "The main browsing flow stays smooth under fast scrolling and high-volume image feeds.",
    bullets: [
      "**No-offset scroll** prevents duplicated or skipped items during rapid scrolling.",
      "Scroll position stays **stable** while new data loads.",
      "**React Query** caches server state, and **Redux** keeps list and real-time updates predictable.",
    ],
  },

  limits: {
    lede: "TODO: confirm what you would change now.",
    items: [
      {
        today: "TODO: confirm what you would change now.",
        atScale: "TODO: confirm. For example, track Core Web Vitals per release.",
      },
    ],
  },

  learnings: {
    lede: "Frontend performance is inseparable from user experience.",
    items: [
      "UX is a function of rendering predictability, scroll stability and perceived responsiveness.",
      "Small architectural decisions compound into large UX gains.",
    ],
  },
};
