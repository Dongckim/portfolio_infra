"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { projects } from "@/content/projects";
import { youtubeId } from "@/components/ProjectPage";

type Reel = { id: string; slug: string; title: string; eyebrow: string };

/** Every project with a YouTube demo (summary.video, else a YouTube demo link), once per video. */
const reels: Reel[] = projects.flatMap((p) => {
  const url = [p.summary.video, p.summary.links.demo].find((u) => u && youtubeId(u));
  return url ? [{ id: youtubeId(url)!, slug: p.slug, title: p.summary.title, eyebrow: p.summary.eyebrow }] : [];
}).filter((r, i, all) => all.findIndex((x) => x.id === r.id) === i);

// First card lines up with the max-w-7xl column; scroll-pl keeps snapping from pulling it back to the edge.
const PAD =
  "pl-[max(1rem,calc((100vw-80rem)/2+1rem))] scroll-pl-[max(1rem,calc((100vw-80rem)/2+1rem))] " +
  "sm:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] sm:scroll-pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] " +
  "lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:scroll-pl-[max(2rem,calc((100vw-80rem)/2+2rem))]";

function Player({ reel, onClose }: { reel: Reel; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={`${reel.title} demo`} onClick={onClose} className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4 backdrop-blur-sm">
      <button type="button" onClick={onClose} aria-label="Close video" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
        <X className="h-5 w-5" />
      </button>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-6xl">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${reel.id}?autoplay=1&rel=0`}
            title={`${reel.title} demo`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-4 text-white">
          <p className="text-lg font-semibold">{reel.title}</p>
          <Link href={`/projects/${reel.slug}`} className="inline-flex shrink-0 items-center text-[15px] text-[#2997FF] hover:underline">
            Read the case study <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DemoReel() {
  const ref = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<Reel | null>(null);
  if (reels.length === 0) return null;
  const go = (dir: 1 | -1) => {
    const el = ref.current;
    const card = el?.querySelector<HTMLElement>("li");
    if (el && card) el.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: "smooth" });
  };
  const btn = "grid h-9 w-9 place-items-center rounded-full bg-[#d2d2d7]/65 text-textPrimary/80 transition-colors hover:bg-[#d2d2d7] dark:bg-white/15 dark:hover:bg-white/25";
  return (
    <div className="pb-12 pt-16 md:pb-16 md:pt-24">
      {/* title and arrows share one row, like apple.com shelves */}
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <h3 className="text-[28px] font-semibold tracking-[-0.02em] text-textPrimary md:text-[40px]">Watch the demos.</h3>
        <div className="hidden shrink-0 gap-3 sm:flex">
          <button type="button" aria-label="Previous videos" onClick={() => go(-1)} className={btn}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Next videos" onClick={() => go(1)} className={btn}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <ul
        ref={ref}
        className={`mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pr-[max(1rem,calc((100vw-80rem)/2+2rem))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${PAD}`}
      >
        {reels.map((r) => (
          <li key={r.id} className="w-[82vw] shrink-0 snap-start sm:w-[520px]">
            <button type="button" onClick={() => setOpen(r)} aria-label={`Play ${r.title} demo`} className="group block w-full text-left">
              <div className="relative aspect-video overflow-hidden rounded-[20px] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${r.id}/maxresdefault.jpg`}
                  onError={(e) => (e.currentTarget.src = `https://i.ytimg.com/vi/${r.id}/hqdefault.jpg`)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <span className="absolute bottom-4 left-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow-lg backdrop-blur transition-transform group-hover:scale-105">
                  <Play className="ml-0.5 h-4 w-4 fill-black text-black" />
                </span>
              </div>
              <p className="mt-4 text-[13px] text-textSecondary">{r.eyebrow}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-textPrimary">{r.title}</p>
            </button>
          </li>
        ))}
      </ul>
      {open && <Player reel={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
