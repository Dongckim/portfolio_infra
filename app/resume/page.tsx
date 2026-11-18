import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "Resume · Dongchan Kim" };

// The resume as a page of the site: no browser PDF viewer, no file name in the URL or tab.
export default function ResumePage() {
  return (
    <main className="min-h-screen bg-background pt-24 md:pt-28">
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-4xl font-semibold tracking-tight text-textPrimary md:text-5xl">Resume</h1>
        </div>
        {/* view only: a rendered image, no PDF served, no link; dragging and the image context menu are off */}
        <div className="select-none overflow-hidden rounded-2xl border border-border bg-white shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
          <Image src="/resume.jpg" alt="Dongchan Kim's resume" width={1870} height={2420} priority sizes="(max-width: 1024px) 100vw, 1024px" draggable={false} className="pointer-events-none h-auto w-full" />
        </div>
      </section>
    </main>
  );
}
