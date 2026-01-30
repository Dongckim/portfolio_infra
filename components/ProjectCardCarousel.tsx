"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useRef } from "react";
import { projects } from "@/constants/data";

export default function ProjectCardCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollProjects = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector("[data-project-card]") as HTMLElement | null;
    const gap = 20;
    const step = firstCard ? firstCard.offsetWidth + gap : el.clientWidth * 0.85;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  }, []);

  return (
    <div className="w-full">
      {/* Full-width scroll: first card aligned with hero via padding-left; content can overflow when scrolling */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
      >
        <div
          className="flex gap-5 pt-10 sm:pt-12 md:pt-14 pb-6 sm:pb-8 min-w-max pl-4 sm:pl-6 lg:pl-[calc((100vw-min(1024px,100vw))/2+2rem)] pr-4 sm:pr-6 lg:pr-[calc((100vw-min(1024px,100vw))/2+2rem)]"
        >
        {projects.map((project, index) => {
          const Icon = project.icon;
          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              data-project-card
              className="group relative flex-shrink-0 w-[85vw] sm:w-[380px] snap-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 * index,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -2 }}
                className="relative flex flex-col h-full min-h-[280px] bg-surface rounded-2xl p-6 shadow-sm border border-border transition-all duration-300 hover:shadow-md"
              >
                {/* Icon */}
                <div className="mb-4">
                  <div className="inline-flex p-2.5 bg-muted rounded-xl">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-textPrimary" />
                  </div>
                </div>
                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-textPrimary mb-2 tracking-tight leading-tight line-clamp-2">
                  {project.title}
                </h3>
                {/* Description */}
                <p className="text-sm text-textSecondary leading-relaxed flex-1 line-clamp-3 mb-6">
                  {project.description}
                </p>
                {/* Bottom: tags + action button */}
                <div className="flex items-end justify-between gap-3 mt-auto">
                  <div className="flex flex-wrap gap-1.5 min-w-0">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs font-medium text-textSecondary bg-muted rounded-md truncate max-w-[100px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {/* + button (Apple-style) */}
                  <span
                    className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-textPrimary text-surface transition-transform group-hover:scale-105"
                    aria-hidden
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </div>
              </motion.div>
            </Link>
          );
        })}
        </div>
      </div>
      {/* Arrow navigation - bottom right, hero-aligned */}
      {projects.length > 1 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end pb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollProjects("left")}
              aria-label="Previous projects"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-textPrimary shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollProjects("right")}
              aria-label="Next projects"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-textPrimary shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
