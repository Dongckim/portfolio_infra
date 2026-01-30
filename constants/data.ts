import { Activity, Terminal, FileText, Cpu, Shield, Sparkles } from "lucide-react";

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  icon: React.ComponentType<{ className?: string }>;
  colSpan: 1 | 2;
}

export const projects: Project[] = [
  {
    id: "reality-hack",
    title: "SmartSight: You Learn. We see. We remember.",
    description: "Backend for first-person study images from Ray-Ban Meta glasses: upload, AI analysis (GPT-4 Vision), session/topic tracking, and realtime voice (OpenAI Realtime API).",
    tags: ["Node.js", "OpenAI", "AWS S3", "Prisma"],
    icon: Sparkles,
    colSpan: 1,
  },
  {
    id: "content-monitor",
    title: "Web Content Integrity Monitor",
    description: "Architected an automated pipeline to track historical changes in external documentation, simulating release validation workflows.",
    tags: ["Python", "Cron", "Diff Algorithm", "BeautifulSoup"],
    icon: Activity,
    colSpan: 2,
  },
  {
    id: "xr-optimization",
    title: "XR Latency Optimization",
    description: "Achieved <50ms frame variance and ±10ms sync across multi-device XR environments.",
    tags: ["Unity", "Profiling", "Latency-free"],
    icon: Cpu,
    colSpan: 1,
  },
  {
    id: "pymark",
    title: "PyMark Renderer",
    description: "Developed a dependency-free Markdown-to-HTML engine with 90%+ test coverage.",
    tags: ["Python", "TDD", "Pytest"],
    icon: FileText,
    colSpan: 1,
  },
  {
    id: "autobass",
    title: "AutoBASS CLI",
    description: "Built a robust CLI utility for automated artifact backups with timestamped versioning and error logging.",
    tags: ["Bash", "Rsync", "Linux"],
    icon: Terminal,
    colSpan: 1,
  },
  {
    id: "securesbu",
    title: "SecureSBU: Your AI Security Partner",
    description: "Empowering Healthcare Security Through AI and Real-Time Policy Intelligence. SecureSBU bridges the gap between complex HIPAA regulations and real-world staff workflows by delivering instant, accurate, and actionable policy guidance.",
    tags: ["React", "TypeScript", "NeuralSeek", "Teams API"],
    icon: Shield,
    colSpan: 1,
  },
];

export interface Highlight {
  title: string;
}

export const highlights: Highlight[] = [
  { title: "MIT Reality Hack 2026 - Grand Prize (Gold Award) Winner" },
  { title: "MIT Reality Hack 2026 - Meta Track Winner" },
  { title: "Scheduled to attend AWE USA 2026 (World's #1 XR + AI Event)" },
];

export const highlightImages: string[] = [
  "/mit-reality-hack-2026-1.jpg",
  "/mit-reality-hack-2026-2.jpg",
  "/mit-reality-hack-2026-3.jpg",
  "/mit-reality-hack-2026-4.jpg",
];

