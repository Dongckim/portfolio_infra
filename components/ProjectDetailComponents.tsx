"use client";

import React from "react";
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
  connections: Array<{ from: number; to: number }>;
}

export function DiagramPlaceholder({ description, components, connections }: DiagramPlaceholderProps) {
  // Calculate dynamic box sizes based on text length
  const getBoxDimensions = (label: string) => {
    const words = label.split(' ');
    const maxLineLength = Math.max(...words.map(w => w.length));
    const lines = words.length;
    const width = Math.max(20, maxLineLength * 1.8);
    const height = Math.max(8, lines * 3 + 2);
    return { width, height };
  };

  return (
    <div className="relative bg-[#1C1C1E] border border-[#2D2D30] rounded-lg p-8 min-h-[500px] overflow-hidden">
      <p className="text-xs text-gray-400 mb-6 uppercase tracking-wider">{description}</p>
      
      {/* SVG for diagram */}
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Connections - render behind boxes */}
        {connections.map((conn, idx) => {
          const from = components[conn.from];
          const to = components[conn.to];
          if (!from || !to) return null;
          
          return (
            <line
              key={idx}
              x1={from.position.x}
              y1={from.position.y}
              x2={to.position.x}
              y2={to.position.y}
              stroke="#4A9EFF"
              strokeWidth="0.4"
              strokeDasharray="2,2"
              opacity={0.5}
            />
          );
        })}
        
        {/* Components - render on top */}
        {components.map((comp, idx) => {
          const { width, height } = getBoxDimensions(comp.label);
          const words = comp.label.split(' ');
          const boxX = comp.position.x - width / 2;
          const boxY = comp.position.y - height / 2;
          
          return (
            <g key={idx}>
              {/* Box background */}
              <rect
                x={boxX}
                y={boxY}
                width={width}
                height={height}
                fill="#2D2D30"
                stroke="#4A9EFF"
                strokeWidth="0.4"
                rx="1.5"
                opacity={0.9}
              />
              {/* Text - handle multi-line */}
              {words.map((word, wordIdx) => (
                <text
                  key={wordIdx}
                  x={comp.position.x}
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
  // Simple badge representation for tech stack
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

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className="mb-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight"
      >
        {title}
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {children}
      </motion.div>
    </section>
  );
}

// Utility function to convert markdown bold (**text**) to HTML bold
export function renderMarkdownBold(text: string): React.ReactNode {
  // Split by lines to preserve line breaks
  const lines = text.split('\n');
  
  return (
    <>
      {lines.map((line, lineIndex) => {
        // Split each line by bold markers
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        
        return (
          <React.Fragment key={lineIndex}>
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                const boldText = part.slice(2, -2);
                return <strong key={partIndex} className="font-semibold text-white">{boldText}</strong>;
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

