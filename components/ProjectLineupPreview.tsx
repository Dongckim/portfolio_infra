"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Code2 } from "lucide-react";
import { motion } from "framer-motion";
import { projects } from "@/constants/data";

type Work = {
  title: string;
  category: string;
  description: string;
  image: string | null;
  imageClassName?: string;
  href: string;
  stack: string[];
  system: string[];
  featured?: boolean;
};

const presentation: Record<string, Pick<Work, "category" | "image" | "system" | "featured">> = {
  "reality-hack": {
    category: "Wearable AI · MIT Reality Hack 2026",
    image: "/mit-reality-hack-2026-1.jpg",
    system: ["Glasses", "API", "S3", "Vision", "Realtime"],
    featured: true,
  },
  glassistant: {
    category: "Wearable AI agent · Meta hackathon",
    image: "/glassistant-watching-poster.jpg",
    system: ["Glasses", "iPad", "Agent", "SAM", "Robot"],
  },
  arc: {
    category: "CHI 2027 conference companion",
    image: null,
    system: ["Feed", "Build", "Planner", "Venue", "PWA"],
  },
  tryl: {
    category: "AI fashion try-on",
    image: "/tryl-1.png",
    system: ["Extension", "API", "Queue", "Generation"],
  },
  "cortex-sdk": {
    category: "Wearable vision middleware",
    image: "/cortex-demo.gif",
    system: ["Camera", "IMU", "Filter", "VLM"],
  },
  ape: {
    category: "Cloud developer tooling",
    image: "/ape-demo.gif",
    system: ["Desktop", "SSH", "S3", "EC2"],
  },
  pymark: {
    category: "Developer tooling",
    image: null,
    system: ["Markdown", "Parser", "HTML", "Tests"],
  },
  "xr-optimization": {
    category: "Multi-device XR",
    image: "/sm-realive-sync.png",
    system: ["Device A", "Sync", "Device B", "Render"],
  },
  "content-monitor": {
    category: "Web reliability",
    image: null,
    system: ["Source", "Scheduler", "Diff", "Alert"],
  },
  securesbu: {
    category: "AI security assistant",
    image: "/gallery-team-build.jpg",
    system: ["Teams", "Policy", "AI", "Guidance"],
  },
};

const work: Work[] = [
  ...projects.map((project) => {
    const visual = presentation[project.id];
    return {
      title: project.title,
      category: visual.category,
      description: project.description,
      image: visual.image,
      href: `/projects/${project.id}`,
      stack: project.tags,
      system: visual.system,
      featured: visual.featured,
    };
  }),
];

function SystemStrip({ nodes }: { nodes: string[] }) {
  return (
    <div className="mt-8 border-t border-border pt-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-textSecondary sm:gap-2">
        {nodes.map((node, index) => (
          <div key={node} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="rounded-full border border-border bg-background px-2.5 py-1.5 transition-colors group-hover:border-textSecondary/40 group-hover:text-textPrimary">
              {node}
            </span>
            {index < nodes.length - 1 && <span className="h-px w-3 bg-border sm:w-5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function DefaultVisual({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-[linear-gradient(135deg,var(--muted),var(--background))] p-6 sm:p-8">
      <Code2 className="h-8 w-8 text-textSecondary" />
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-textSecondary">Engineering project</p>
        <p className="mt-2 max-w-[13rem] text-xl font-semibold tracking-tight text-textPrimary">{title}</p>
      </div>
      <div className="flex gap-1.5">
        <span className="h-1.5 w-12 rounded-full bg-textPrimary/70" />
        <span className="h-1.5 w-7 rounded-full bg-textSecondary/35" />
        <span className="h-1.5 w-4 rounded-full bg-textSecondary/20" />
      </div>
    </div>
  );
}

function WorkCard({ item, index }: { item: Work; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
      className={item.featured ? "md:col-span-2" : ""}
    >
      <Link href={item.href} className="group block h-full">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border bg-surface p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-textSecondary/30 hover:shadow-xl sm:p-5">
          <div className={`relative overflow-hidden rounded-[1rem] bg-muted ${item.featured ? "aspect-[16/8]" : "aspect-[4/3]"}`}>
            {item.image ? (
              <>
                <Image
                  src={item.image}
                  alt={`${item.title} project preview`}
                  fill
                  sizes={item.featured ? "(min-width: 768px) 1120px, 100vw" : "(min-width: 768px) 560px, 100vw"}
                  className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] ${item.imageClassName ?? ""}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </>
            ) : <DefaultVisual title={item.title} />}
            <span className="absolute bottom-3 left-3 rounded-full border border-white/25 bg-black/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              {item.category}
            </span>
            <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/15 text-white opacity-100 backdrop-blur-md transition-transform duration-300 group-hover:rotate-45 sm:opacity-0 sm:group-hover:opacity-100">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>

          <div className="flex flex-1 flex-col px-1 pt-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className={`${item.featured ? "text-3xl sm:text-4xl" : "text-2xl"} font-semibold tracking-tight text-textPrimary`}>
                {item.title}
              </h2>
              <Code2 className="mt-1 h-4 w-4 shrink-0 text-textSecondary" />
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-textSecondary sm:text-base">{item.description}</p>

            <SystemStrip nodes={item.system} />

            <div className="grid transition-[grid-template-rows,opacity] duration-300 ease-out [grid-template-rows:0fr] group-hover:[grid-template-rows:1fr]">
              <div className="overflow-hidden">
                <div className="flex flex-wrap gap-2 pt-4">
                  {item.stack.map((technology) => (
                    <span key={technology} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-textSecondary">
                      {technology}
                    </span>
                  ))}
                  <span className="ml-auto self-center text-xs font-medium text-accent">View build sheet&nbsp; →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function ProjectLineupPreview() {
  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
      {work.map((item, index) => <WorkCard key={item.title} item={item} index={index} />)}
    </section>
  );
}
