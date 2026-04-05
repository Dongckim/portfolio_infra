"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";

interface CodeBlockProps {
  language: string;
  snippet: string;
}

export function CodeBlock({ language, snippet }: CodeBlockProps) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-[#2D2D30] bg-[#1E1E1E] shadow-2xl">
      {/* VS Code-style window header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#252526] border-b border-[#2D2D30]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28CA42]" />
        </div>
        <span className="ml-2 text-xs text-gray-400 font-medium">{language}</span>
      </div>

      {/* Code content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm leading-relaxed font-mono">
          <code className="text-gray-300">{snippet}</code>
        </pre>
      </div>
    </div>
  );
}

interface DiagramPlaceholderProps {
  description: string;
  components: Array<{ label: string; position: { x: number; y: number } }>;
  connections: Array<{ from: number; to: number; label?: string }>;
}

export function DiagramPlaceholder({ description, components, connections }: DiagramPlaceholderProps) {
  const getBoxDimensions = (label: string) => {
    const words = label.split(' ');
    const maxLineLength = Math.max(...words.map(w => w.length));
    const lines = words.length;
    const width = Math.max(20, maxLineLength * 1.8);
    const height = Math.max(8, lines * 3 + 2);
    return { width, height };
  };

  // Scale x from 0-100 → 0-200 so elements spread across the wider viewBox
  const sx = (x: number) => x * 2;

  return (
    <div className="relative bg-[#1C1C1E] border border-[#2D2D30] rounded-2xl p-8 h-[500px] overflow-hidden">
      <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">{description}</p>

      <svg
        viewBox="0 0 200 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {connections.map((conn, idx) => {
          const from = components[conn.from];
          const to = components[conn.to];
          if (!from || !to) return null;

          return (
            <line
              key={idx}
              x1={sx(from.position.x)}
              y1={from.position.y}
              x2={sx(to.position.x)}
              y2={to.position.y}
              stroke="#4A9EFF"
              strokeWidth="0.3"
              strokeDasharray="1.5,1.5"
              opacity={0.45}
            />
          );
        })}

        {components.map((comp, idx) => {
          const { width, height } = getBoxDimensions(comp.label);
          const words = comp.label.split(' ');
          const cx = sx(comp.position.x);
          const boxX = cx - width / 2;
          const boxY = comp.position.y - height / 2;

          return (
            <g key={idx}>
              <rect
                x={boxX}
                y={boxY}
                width={width}
                height={height}
                fill="#2D2D30"
                stroke="#4A9EFF"
                strokeWidth="0.35"
                rx="1.5"
                opacity={0.9}
              />
              {words.map((word, wordIdx) => (
                <text
                  key={wordIdx}
                  x={cx}
                  y={boxY + (wordIdx + 1) * 2.8 + 1}
                  textAnchor="middle"
                  fontSize="2.2"
                  fill="#E0E0E0"
                  className="font-sans"
                  fontWeight="500"
                >
                  {word}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface TechStackIconsProps {
  techStack: string[];
}

export function TechStackIcons({ techStack }: TechStackIconsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {techStack.map((tech) => (
        <span
          key={tech}
          className="px-3 py-1.5 text-xs font-medium bg-[#1C1C1E] border border-[#2D2D30] text-gray-300 rounded-md"
        >
          {tech}
        </span>
      ))}
    </div>
  );
}

interface ProjectLinksProps {
  links: {
    repo?: string;
    demo?: string;
  };
}

export function ProjectLinks({ links }: ProjectLinksProps) {
  return (
    <div className="flex items-center gap-4">
      {links.repo && (
        <motion.a
          href={links.repo}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <Github className="w-5 h-5" />
          <span className="text-sm">Repository</span>
        </motion.a>
      )}
      {links.demo && (
        <motion.a
          href={links.demo}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          <span className="text-sm">Live Demo</span>
        </motion.a>
      )}
    </div>
  );
}

// B: Section — scroll-triggered reveal
interface SectionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
}

const appleEase = [0.25, 0.46, 0.45, 0.94] as const;

export function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="mb-16">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.7, ease: appleEase }}
        className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight"
      >
        {title}
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: appleEase }}
      >
        {children}
      </motion.div>
    </section>
  );
}

// B: StaggeredList — scroll-triggered staggered bullet items
const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: appleEase },
  },
};

interface StaggeredListProps {
  items: string[];
  dotColor: string;
}

export function StaggeredList({ items, dotColor }: StaggeredListProps) {
  return (
    <motion.ul
      className="space-y-3"
      variants={listVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {items.map((item, i) => (
        <motion.li
          key={i}
          variants={itemVariants}
          className="flex items-start gap-3 text-lg text-gray-300 leading-relaxed"
        >
          <span
            className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2.5"
            style={{ backgroundColor: dotColor }}
            aria-hidden
          />
          <span>{renderMarkdownBold(item)}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

// C: TableOfContents — sticky sidebar with active section tracking
interface TocSection {
  id: string;
  label: string;
}

interface TableOfContentsProps {
  sections: TocSection[];
}

export function TableOfContents({ sections }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-40% 0px -55% 0px",
        threshold: 0,
      }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-5 items-end"
      aria-label="Page sections"
    >
      {sections.map(({ id, label }) => {
        const isActive = activeId === id;
        return (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="group flex items-center gap-3 cursor-pointer"
            aria-label={`Go to ${label}`}
          >
            {/* Label — visible on hover */}
            <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors duration-200 opacity-0 group-hover:opacity-100 whitespace-nowrap select-none">
              {label}
            </span>
            {/* Dot */}
            <motion.span
              className="block rounded-full flex-shrink-0"
              animate={{
                width: isActive ? 8 : 5,
                height: isActive ? 8 : 5,
                backgroundColor: isActive ? "#0A84FF" : "#4B5563",
              }}
              transition={{ duration: 0.25, ease: appleEase }}
            />
          </button>
        );
      })}
    </nav>
  );
}

// Inline code styling
const inlineCodeClass =
  "font-mono text-sm text-gray-300 bg-[#1E1E1E] border border-[#2D2D30] rounded px-1.5 py-0.5";

export function renderMarkdownBold(text: string): React.ReactNode {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, lineIndex) => {
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

        return (
          <React.Fragment key={lineIndex}>
            {parts.map((part, partIndex) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                const boldText = part.slice(2, -2);
                return (
                  <strong key={partIndex} className="font-semibold text-white">
                    {boldText}
                  </strong>
                );
              }
              if (part.startsWith("`") && part.endsWith("`")) {
                const codeText = part.slice(1, -1);
                return (
                  <code key={partIndex} className={inlineCodeClass}>
                    {codeText}
                  </code>
                );
              }
              return <span key={partIndex}>{part}</span>;
            })}
            {lineIndex < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </>
  );
}
