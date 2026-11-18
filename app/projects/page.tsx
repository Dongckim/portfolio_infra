import ProjectIndex from "@/components/ProjectIndex";

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-background pb-32 pt-28 md:pt-36">
      <header className="mx-auto mb-14 max-w-7xl px-4 sm:px-6 md:mb-20 lg:px-8">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-textSecondary">Selected work</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-textPrimary md:text-[80px]">
          Built with the system in mind.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-textSecondary md:text-xl">
          Wearable AI, real-time systems and developer tools, each with the decisions, numbers and trade-offs behind it.
        </p>
      </header>
      <ProjectIndex />
    </main>
  );
}
