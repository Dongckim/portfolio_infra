"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getProjectBySlug } from "@/data/projects";
import {
  CodeBlock,
  DiagramPlaceholder,
  TechStackIcons,
  ProjectLinks,
  Section,
  renderMarkdownBold,
} from "@/components/ProjectDetailComponents";

interface ProjectPageProps {
  params: { slug: string };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = params;
  const project = getProjectBySlug(slug);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      }
    };

    if (selectedImageIndex !== null) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [selectedImageIndex]);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#000000] text-gray-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 md:pt-42 pb-12 md:pb-20">
        {/* Header Section */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 pb-8 border-b border-[#2D2D30]"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight"
          >
            {project.title}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed"
          >
            {project.pitch}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 uppercase tracking-wider">Role</span>
                <p className="text-lg text-gray-200 mt-1">{project.role}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 uppercase tracking-wider">Tech Stack</span>
                <div className="mt-2">
                  <TechStackIcons techStack={project.techStack} />
                </div>
              </div>
            </div>
            
            <div>
              <ProjectLinks links={project.links} />
            </div>
          </motion.div>
        </motion.header>

        {/* The Challenge Section */}
        <Section title="The Challenge">
          <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
            {renderMarkdownBold(project.challenge)}
          </p>
        </Section>

        {/* Architecture & Deep Dive Section */}
        <Section title="Architecture & Deep Dive">
          <div className="space-y-8">
            {/* System Diagram */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">System Architecture</h3>
              <DiagramPlaceholder
                description={project.architecture.diagram.description}
                components={project.architecture.diagram.components}
                connections={project.architecture.diagram.connections}
              />
            </div>

            {/* Code Snippet(s) */}
            {Array.isArray(project.architecture.code) ? (
              <div className="space-y-6">
                {project.architecture.code.map((block, i) => (
                  <div key={i}>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      {block.label || 'Key Implementation'}
                    </h3>
                    <CodeBlock language={block.language} snippet={block.snippet} />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Key Implementation</h3>
                <CodeBlock
                  language={project.architecture.code.language}
                  snippet={project.architecture.code.snippet}
                />
              </div>
            )}

            {/* Trade-offs */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Technical Trade-offs</h3>
              {Array.isArray(project.architecture.tradeoffs) ? (
                <ul className="space-y-3">
                  {project.architecture.tradeoffs.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-lg text-gray-300 leading-relaxed">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#0A84FF] mt-2.5" aria-hidden />
                      <span>{renderMarkdownBold(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                  {renderMarkdownBold(project.architecture.tradeoffs)}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* Reliability & Validation Section */}
        <Section title="Reliability & Validation">
          <div className="space-y-6">
            {project.reliability.coverage && (
              <div className="bg-[#1C1C1E] border border-[#2D2D30] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Test Coverage</h3>
                <p className="text-gray-300">{project.reliability.coverage}</p>
              </div>
            )}
            {project.reliability.validation && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Validation</h3>
                <p className="text-lg text-gray-300 leading-relaxed mb-4">
                  {renderMarkdownBold(project.reliability.validation)}
                </p>
                {project.reliability.validationEdgeCases && project.reliability.validationEdgeCases.length > 0 && (
                  <div className="rounded-lg overflow-hidden border border-[#2D2D30] bg-[#1E1E1E] shadow-2xl mt-4">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#252526] border-b border-[#2D2D30]">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                        <div className="w-3 h-3 rounded-full bg-[#28CA42]" />
                      </div>
                      <span className="ml-2 text-xs text-gray-400 font-medium">Edge cases validated</span>
                    </div>
                    <div className="p-4">
                      <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-gray-300 leading-relaxed">
                        {project.reliability.validationEdgeCases.map((item, i) => (
                          <li key={i}>{renderMarkdownBold(item)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Error Handling Strategy</h3>
              {Array.isArray(project.reliability.errorHandling) ? (
                <ul className="space-y-3">
                  {project.reliability.errorHandling.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-lg text-gray-300 leading-relaxed">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#FF453A] mt-2.5" aria-hidden />
                      <span>{renderMarkdownBold(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                  {renderMarkdownBold(project.reliability.errorHandling)}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* Impact & Collaboration Section */}
        <Section title="Impact & Collaboration">
          {Array.isArray(project.impact) ? (
            <ul className="space-y-3">
              {project.impact.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-lg text-gray-300 leading-relaxed">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#30D158] mt-2.5" aria-hidden />
                  <span>{renderMarkdownBold(item)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
              {renderMarkdownBold(project.impact)}
            </p>
          )}
        </Section>

        {/* Images Section - Frame Index Comparison */}
        {project.images && project.images.items.length > 0 && (
          <Section title={project.images.title || "Visual Comparison"}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {project.images.items.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative bg-[#1C1C1E] border border-[#2D2D30] rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedImageIndex(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative aspect-video w-full">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg
                          className="w-12 h-12 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-400">{image.alt}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* Image Modal */}
        <AnimatePresence>
          {selectedImageIndex !== null && project.images && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
              onClick={() => setSelectedImageIndex(null)}
            >
              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(null);
                }}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#1C1C1E] border border-[#2D2D30] text-white hover:bg-[#2D2D30] transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </motion.button>

              {/* Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative max-w-[90vw] max-h-[90vh] w-auto h-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={project.images.items[selectedImageIndex].src}
                  alt={project.images.items[selectedImageIndex].alt}
                  width={1920}
                  height={1080}
                  className="object-contain max-w-full max-h-[90vh] rounded-lg"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                  <p className="text-sm text-white text-center">
                    {project.images.items[selectedImageIndex].alt}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 pt-8 border-t border-[#2D2D30]"
        >
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Portfolio</span>
          </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

