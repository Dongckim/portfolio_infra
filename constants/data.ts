import { Activity, Terminal, FileText, Cpu, Shield, Server, Camera, ShoppingBag } from "lucide-react";

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
    id: "tryl",
    title: "Tryl: AI Fashion Try-On",
    description: "Monorepo product with a Chrome extension for in-page product detection, FastAPI backend, and async Redis worker queue for AI-powered virtual try-on image generation.",
    tags: ["FastAPI", "React", "TypeScript", "Redis", "PostgreSQL", "Python"],
    icon: ShoppingBag,
    colSpan: 1,
  },
  {
    id: "cortex-sdk",
    title: "CORTEX: Battery-Aware VLM Middleware",
    description: "A 4-layer SDK sitting between wearable cameras and VLM APIs. Filters redundant frames via SSIM, Laplacian blur, and IMU gating — targeting 60%+ payload reduction and 2× battery extension.",
    tags: ["Python", "OpenCV", "scikit-image", "SSIM", "VLM"],
    icon: Camera,
    colSpan: 1,
  },
  {
    id: "ape",
    title: "A.P.E: AWS Platform Explorer",
    description: "A Finder-style browser GUI for EC2 file management and S3 browsing — drag & drop uploads, Monaco editor, and multi-server connections, all shipped as a single 16MB Go binary.",
    tags: ["Go", "React", "TypeScript", "AWS SDK", "SFTP", "SSH"],
    icon: Server,
    colSpan: 2,
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
    id: "pymark",
    title: "PyMark Renderer",
    description: "Developed a dependency-free Markdown-to-HTML engine with 90%+ test coverage.",
    tags: ["Python", "TDD", "Pytest"],
    icon: FileText,
    colSpan: 1,
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
    id: "content-monitor",
    title: "Web Content Integrity Monitor",
    description: "Architected an automated pipeline to track historical changes in external documentation, simulating release validation workflows.",
    tags: ["Python", "Cron", "Diff Algorithm", "BeautifulSoup"],
    icon: Activity,
    colSpan: 2,
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
  href?: string;
  linkText?: string;
}

export const highlights: Highlight[] = [
  { title: "Founder of Tryl: AI Fashion Try-On (tryl.me)", href: "https://tryl.me", linkText: "tryl.me" },
  { title: "MIT Reality Hack 2026 - Grand Prize (Gold Award) Winner" },
  { title: "MIT Reality Hack 2026 - Meta Track Winner" },
  { title: "Scheduled to attend AWE USA 2026 Conference (World's #1 XR + AI Event)", href: "https://www.awexr.com/blog/1288-road-to-awe-2026-i-spatial", linkText: "AWE USA 2026 Conference" },
];

export const highlightImages: string[] = [
  "/mit-reality-hack-2026-1.jpg",
  "/mit-reality-hack-2026-2.jpg",
  "/mit-reality-hack-2026-3.jpg",
  "/mit-reality-hack-2026-4.jpg",
  "/tryl-1.png",
  "/tryl-2.png",
  "/tryl-3.png",
];

