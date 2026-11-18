"use client";

import React from "react";
import { motion } from "framer-motion";

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
  groups?: Array<{ label: string; members: number[]; color?: string }>;
  /** Labels on the critical path; other nodes are dimmed. */
  highlight?: string[];
}

const NODE_COLORS = [
  '#5B8DB8', // steel blue
  '#5A9E78', // sage green
  '#8B7DC4', // dusty purple
  '#5A98B8', // slate teal
  '#B8895A', // warm tan
  '#7A9EB8', // periwinkle
  '#7AB878', // muted sage
  '#B87A8B', // dusty rose
  '#8BA8C4', // light steel
  '#9A8B5A', // muted gold
];

export function DiagramPlaceholder({ description, components, connections, groups, highlight }: DiagramPlaceholderProps) {
  const dim = (label: string) => !!highlight?.length && !highlight.includes(label);
  // Group words into lines of max N characters instead of one word per line
  const wrapWords = (label: string, maxLen = 20): string[] => {
    const tokens = label.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const token of tokens) {
      const next = cur ? `${cur} ${token}` : token;
      if (cur && next.length > maxLen) {
        lines.push(cur);
        cur = token;
      } else {
        cur = next;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const getBoxDimensions = (label: string) => {
    const lines = wrapWords(label);
    const maxLineLength = Math.max(...lines.map(l => l.length));
    const width = Math.max(26, maxLineLength * 2.4);
    const height = Math.max(11, lines.length * 4 + 2);
    return { width, height };
  };

  const sx = (x: number) => x * 3.5;

  // Compute viewBox dynamically from actual element bounds → always centered, never clipped
  const PAD_X = 14;
  const PAD_Y = 12;

  const minLeft = components.reduce((acc, c) => {
    const { width } = getBoxDimensions(c.label);
    return Math.min(acc, sx(c.position.x) - width / 2);
  }, Infinity);
  const maxRight = components.reduce((acc, c) => {
    const { width } = getBoxDimensions(c.label);
    return Math.max(acc, sx(c.position.x) + width / 2);
  }, -Infinity);
  const minTop = components.reduce((acc, c) => {
    const { height } = getBoxDimensions(c.label);
    return Math.min(acc, c.position.y - height / 2);
  }, Infinity);
  const maxBottom = components.reduce((acc, c) => {
    const { height } = getBoxDimensions(c.label);
    return Math.max(acc, c.position.y + height / 2);
  }, -Infinity);

  const vbX = minLeft - PAD_X;
  const vbY = minTop - PAD_Y;
  const vbW = maxRight - minLeft + PAD_X * 2;
  const vbH = maxBottom - minTop + PAD_Y * 2;
  const viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;

  return (
    <div className="relative bg-surface border border-border rounded-2xl p-6 md:p-8 h-[420px] md:h-auto flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <p className="text-xs text-textSecondary uppercase tracking-wider">{description}</p>
        <span className="md:hidden flex items-center gap-1 text-[10px] text-gray-600">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          swipe
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </div>

      {/* Mobile: horizontal scroll so the diagram stays readable */}
      <div className="flex-1 min-h-0 overflow-x-auto md:overflow-visible">
        <div className="h-full min-w-[580px] md:min-w-0">
      <svg
        viewBox={viewBox}
        className="w-full h-full md:h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="arrow" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
            <polygon points="0 0, 5 2, 0 4" fill="#6B8EAE" opacity="0.6" />
          </marker>
        </defs>

        {/* Group bounding boxes (rendered behind everything) */}
        {groups?.map((group, gIdx) => {
          const members = group.members.map(i => components[i]).filter(Boolean);
          if (!members.length) return null;
          const pad = 7;
          const color = group.color ?? '#5AC8FA';
          const bounds = members.map(c => {
            const { width, height } = getBoxDimensions(c.label);
            return { l: sx(c.position.x) - width / 2, r: sx(c.position.x) + width / 2, t: c.position.y - height / 2, b: c.position.y + height / 2 };
          });
          const gL = Math.min(...bounds.map(b => b.l)) - pad;
          const gR = Math.max(...bounds.map(b => b.r)) + pad;
          const gT = Math.min(...bounds.map(b => b.t)) - pad;
          const gB = Math.max(...bounds.map(b => b.b)) + pad;
          return (
            <motion.g key={gIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <rect x={gL} y={gT} width={gR - gL} height={gB - gT}
                fill={color} fillOpacity={0.04}
                stroke={color} strokeOpacity={0.35}
                strokeWidth={0.5} strokeDasharray="3,2" rx={4} />
              <text x={gL + 3} y={gT + 4.5} fontSize="2.8" fill={color} fillOpacity={0.7}
                fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
                {group.label}
              </text>
            </motion.g>
          );
        })}

        {/* Animated connection lines + labels */}
        {connections.map((conn, idx) => {
          const from = components[conn.from];
          const to = components[conn.to];
          if (!from || !to) return null;
          const x1 = sx(from.position.x);
          const y1 = from.position.y;
          const x2 = sx(to.position.x);
          const y2 = to.position.y;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          // Perpendicular offset so label doesn't sit on the line
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          const labelX = mx + nx * 2.5;
          const labelY = my + ny * 2.5;

          return (
            <g key={idx}>
              <motion.line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#6B8EAE"
                strokeWidth="0.4"
                strokeDasharray="2.5,2.5"
                markerEnd="url(#arrow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45, strokeDashoffset: [0, -15] }}
                transition={{
                  opacity: { delay: 0.4 + idx * 0.04, duration: 0.35 },
                  strokeDashoffset: { delay: 0.4 + idx * 0.04, duration: 3, repeat: Infinity, ease: "linear" },
                }}
              />
              {conn.label && (
                <motion.text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="2.6"
                  fill="#8BA8C4"
                  fontWeight="500"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.85 }}
                  transition={{ delay: 0.6 + idx * 0.04, duration: 0.3 }}
                >
                  {conn.label}
                </motion.text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {components.map((comp, idx) => {
          const { width, height } = getBoxDimensions(comp.label);
          const words = wrapWords(comp.label);
          const cx = sx(comp.position.x);
          const cy = comp.position.y;
          const color = NODE_COLORS[idx % NODE_COLORS.length];
          const lineH = 4;

          return (
            <g key={idx} transform={`translate(${cx}, ${cy})`} opacity={dim(comp.label) ? 0.4 : 1}>
              <motion.g
                initial={{ opacity: 0, scale: 0.55 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.08, filter: `drop-shadow(0 0 3px ${color}66)` }}
                transition={{
                  opacity: { delay: idx * 0.07, duration: 0.4, ease: appleEase },
                  scale: { delay: idx * 0.07, duration: 0.4, ease: appleEase },
                }}
                style={{ cursor: 'default' }}
              >
                {/* Subtle halo */}
                <rect
                  x={-width / 2 - 1}
                  y={-height / 2 - 1}
                  width={width + 2}
                  height={height + 2}
                  fill={color}
                  opacity={0.06}
                  rx="3"
                />
                {/* Box */}
                <rect
                  x={-width / 2}
                  y={-height / 2}
                  width={width}
                  height={height}
                  style={{ fill: "var(--surface)" }}
                  stroke={color}
                  strokeWidth={highlight?.includes(comp.label) ? 0.9 : 0.45}
                  strokeOpacity={0.75}
                  rx="2.2"
                />
                {/* Label */}
                {words.map((word, wordIdx) => (
                  <text
                    key={wordIdx}
                    x={0}
                    y={-height / 2 + (wordIdx + 1) * lineH + 0.5}
                    textAnchor="middle"
                    fontSize="3.1"
                    fill={color}
                    fontWeight="600"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {word}
                  </text>
                ))}
              </motion.g>
            </g>
          );
        })}
      </svg>
        </div>
      </div>
    </div>
  );
}

const appleEase = [0.25, 0.46, 0.45, 0.94] as const;

// Inline code styling
const inlineCodeClass =
  "font-mono text-[0.9em] text-textPrimary bg-muted border border-border rounded px-1.5 py-0.5";

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
                  <strong key={partIndex} className="font-semibold text-textPrimary">
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
