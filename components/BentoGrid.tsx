"use client";

import { projects } from "@/constants/data";
import Card from "./Card";

export default function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10 auto-rows-fr">
      {projects.map((project, index) => (
        <Card key={project.id} {...project} index={index} />
      ))}
    </div>
  );
}

