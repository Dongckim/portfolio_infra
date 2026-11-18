"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/content/projects";
import type { Project } from "@/content/projects/types";

const FEATURED = ["arc", "glassistant", "reality-hack"];
// Wider than the navbar (1280) but capped, like apple.com tiles.
const WRAP = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"; // same gutter as the homepage and navbar

/** Apple's orange "New" eyebrow, reused for awards. */
const KICKER = "text-[15px] font-semibold text-[#B64400] dark:text-[#FF9F0A]";

const cover = (p: Project) => p.summary.thumbnail ?? p.summary.media?.[0]?.src;
const poster = (src: string) => src.replace(/\.mp4$/, "-poster.jpg");
/** Stable hue per project so a missing image still gets its own default cover. */
const hue = (slug: string) => slug.split("").reduce((h, c) => (h * 131 + c.charCodeAt(0)) % 360, 7);

/** Plays only while on screen, so a page of tiles never decodes every video at once. */
function TileVideo({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={poster(src)} aria-label={alt} muted loop playsInline preload="metadata" className="h-full w-full object-cover" />;
}

function Cover({ p, sizes, label = true }: { p: Project; sizes: string; label?: boolean }) {
  const src = cover(p);
  if (!src) {
    const h = hue(p.slug);
    const s = p.summary;
    return (
      <div
        aria-hidden
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        style={{
          background: `radial-gradient(120% 90% at 15% 10%, hsl(${h} 70% 62%), transparent 60%), radial-gradient(100% 80% at 90% 90%, hsl(${(h + 50) % 360} 65% 45%), transparent 65%), hsl(${(h + 20) % 360} 35% 22%)`,
        }}
      >
        {label && <span className="absolute inset-0 grid place-items-center p-8 text-center text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] text-white/90 md:text-[44px]">
          {s.title.split(":")[0]}
        </span>}
      </div>
    );
  }
  const alt = p.summary.media?.[0]?.alt ?? p.summary.title;
  if (src.endsWith(".mp4")) return <TileVideo src={src} alt={alt} />;
  return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />;
}

/** apple.com home-tile layout: centered copy and one link on top, the image below. */
function FeaturedTile({ p }: { p: Project }) {
  const s = p.summary;
  return (
    <Link href={`/projects/${p.slug}`} className="group block overflow-hidden rounded-[28px] bg-surface text-center">
      <div className="mx-auto max-w-3xl px-6 pt-12 md:pt-16">
        {s.awards?.length ? <p className={`${KICKER} mb-1`}>{s.awards.length > 1 ? `${s.awards.length}× ` : ""}Award Winner</p> : null}
        <p className="text-[15px] text-textSecondary">{s.eyebrow}</p>
        <h2 className="mt-2 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[56px]">{s.title}</h2>
        <p className="mt-3 text-lg leading-snug text-textSecondary md:text-[21px]">{s.tagline}</p>
        {s.awards?.length ? (
          <ul className="mt-5 space-y-1 text-[16px] font-medium leading-snug text-textPrimary">
            {s.awards.map((a) => (
              <li key={a.title}>
                <span className={KICKER}>Winner</span> {a.title}
              </li>
            ))}
          </ul>
        ) : null}
        <span className="mt-6 inline-flex items-center gap-0.5 text-[17px] text-accent group-hover:underline">
          Read the case study <ChevronRight className="h-4 w-4" />
        </span>
      </div>
      <div className="relative mt-10 aspect-[16/10] overflow-hidden bg-muted md:aspect-[21/9]">
        <Cover p={p} sizes="(min-width: 1440px) 1416px, 100vw" />
      </div>
    </Link>
  );
}

/** apple.com "Get to know" shelf card: copy on top, image filling the rest. */
function ShelfCard({ p }: { p: Project }) {
  const s = p.summary;
  const plain = !cover(p);
  return (
    <li data-card className="w-[82vw] shrink-0 snap-start sm:w-[380px]">
      <Link href={`/projects/${p.slug}`} className="group relative flex h-[520px] flex-col overflow-hidden rounded-[28px] bg-surface">
        {plain && <Cover p={p} sizes="380px" label={false} />}
        <div className={`relative p-8 ${plain ? "text-white" : ""}`}>
          <p className={`text-[13px] font-semibold ${plain ? "text-white/75" : "text-textSecondary"}`}>{s.eyebrow}</p>
          <h3 className="mt-2 text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]">{s.title}</h3>
          <p className={`mt-2 line-clamp-3 text-[15px] leading-snug ${plain ? "text-white/80" : "text-textSecondary"}`}>{s.tagline}</p>
        </div>
        {!plain && (
          <div className="relative mt-auto h-[260px] overflow-hidden">
            <Cover p={p} sizes="380px" />
          </div>
        )}
      </Link>
    </li>
  );
}

function Shelf({ items }: { items: Project[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const go = (dir: 1 | -1) => {
    const el = ref.current;
    const card = el?.querySelector<HTMLElement>("[data-card]");
    if (el && card) el.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: "smooth" });
  };
  const btn = "grid h-9 w-9 place-items-center rounded-full bg-[#d2d2d7]/65 text-textPrimary/80 transition-colors hover:bg-[#d2d2d7] dark:bg-white/15 dark:hover:bg-white/25";
  return (
    <>
      {/* Left padding lines the first card up with the 1440px column; the row still bleeds to the right edge. */}
      <ul
        ref={ref}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pl-[max(1rem,calc((100vw-1440px)/2+1rem))] pr-4 [scrollbar-width:none] [scroll-padding-left:max(1rem,calc((100vw-1440px)/2+1rem))] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p) => (
          <ShelfCard key={p.slug} p={p} />
        ))}
      </ul>
      <div className={`${WRAP} mt-4 flex justify-end gap-3`}>
        <button type="button" aria-label="Previous projects" onClick={() => go(-1)} className={btn}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Next projects" onClick={() => go(1)} className={btn}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}

export default function ProjectIndex() {
  const featured = FEATURED.map((slug) => projects.find((p) => p.slug === slug)).filter((p): p is Project => !!p);
  // Image cards lead the shelf; gradient-only cards follow (sort is stable, so content order holds otherwise).
  const rest = projects.filter((p) => !FEATURED.includes(p.slug)).sort((a, b) => Number(!cover(a)) - Number(!cover(b)));
  return (
    <>
      <section className={`${WRAP} space-y-3 md:space-y-4`}>
        {featured.map((p) => (
          <FeaturedTile key={p.slug} p={p} />
        ))}
      </section>

      <section className="mt-24 md:mt-32">
        <h2 className={`${WRAP} mb-8 text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]`}>More projects.</h2>
        <Shelf items={rest} />
      </section>
    </>
  );
}
