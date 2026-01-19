"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Project } from "@/constants/data";

interface CardProps extends Project {
  index: number;
}

export default function Card({ id, title, description, tags, icon: Icon, colSpan, index }: CardProps) {
  const colSpanClass = colSpan === 1 ? "md:col-span-1" : "md:col-span-2";
  
  return (
    <Link href={`/projects/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: 1.4 + index * 0.1,
          ease: [0.22, 1, 0.36, 1]
        }}
        whileHover={{ 
          y: -2,
          transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
        }}
        className={`group relative ${colSpanClass} bg-white rounded-2xl p-6 md:p-8 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md`}
      >
        <div className="flex flex-col h-full">
          {/* Icon */}
          <div className="mb-4 md:mb-5">
            <div className="inline-flex p-2.5 bg-gray-100 rounded-lg">
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-textPrimary" />
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-xl md:text-2xl font-bold text-textPrimary mb-2 md:mb-3 tracking-tight leading-tight">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-sm md:text-base text-textSecondary leading-relaxed mb-4 md:mb-6 flex-1">
            {description}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium bg-gray-100 text-textSecondary rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

