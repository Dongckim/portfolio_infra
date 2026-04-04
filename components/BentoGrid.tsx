"use client";

import { projects } from "@/constants/data";
import Card from "./Card";

export default function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 grid-flow-dense">
      {projects.map((project, index) => (
        <Card key={project.id} {...project} index={index} />
      ))}
    </div>
  );
}

