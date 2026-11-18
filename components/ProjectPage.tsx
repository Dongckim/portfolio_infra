"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown, Github, Play } from "lucide-react";
import { CodeBlock, DiagramPlaceholder, renderMarkdownBold } from "@/components/ProjectDetailComponents";
import { isTodo, type Decision, type Project, type StageTiming } from "@/content/projects/types";

// Same container as the Navbar so every edge lines up.
const WRAP = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const BODY = "max-w-[680px] text-[17px] leading-[1.65] text-textSecondary";
const EYEBROW = "text-[13px] font-medium uppercase tracking-[0.2em]";
const STAGE_COLORS = ["#0A84FF", "#30D158", "#FF9F0A", "#BF5AF2", "#64D2FF", "#FF375F"];

/** TODO placeholders are never shown to visitors; the owner fills them in content/projects. */
const real = <T,>(v: T): v is Exclude<T, `TODO: ${string}`> => !isTodo(v);
const md = (s: string) => renderMarkdownBold(s);
const firstNumber = (s: string) => Number(s.match(/\d+(\.\d+)?/)?.[0] ?? NaN);

type SectionId = "overview" | "context" | "architecture" | "decisions" | "measurement" | "reliability" | "limits" | "learnings" | "deep-dive";

function Band({ id, label, lede, tone, children }: { id: SectionId; label: string; lede: string; tone: "plain" | "raised"; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-28 py-20 md:py-28 ${tone === "raised" ? "bg-surface" : ""}`}>
      <div className={WRAP}>
        <motion.div
          initial={{ y: 16 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className={`${EYEBROW} mb-4 text-accent`}>{label}</p>
          {real(lede) && (
            <h2 className="mb-12 max-w-4xl text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-textPrimary md:text-[48px]">{lede}</h2>
          )}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function DecisionCard({ d, index }: { d: Decision; index: number }) {
  const rows: Array<[string, React.ReactNode, string]> = [
    ["Problem", md(d.problem), "text-textPrimary"],
    [
      "Options",
      <ul key="o" className="space-y-1.5">
        {d.options.filter(real).map((o) => (
          <li key={o} className="flex gap-2">
            <span className="mt-[9px] h-1 w-1 flex-none rounded-full bg-textSecondary" />
            {md(o)}
          </li>
        ))}
      </ul>,
      "text-textSecondary",
    ],
    ["Decision", md(d.decision), "text-textPrimary"],
    ["Result", md(d.result), "font-medium text-[#248A3D] dark:text-[#30D158]"],
    ["Trade-off", md(d.tradeoff), "text-textSecondary"],
  ];
  return (
    <article className="rounded-[28px] border border-border bg-background p-6 md:p-10">
      <p className={`${EYEBROW} mb-2 text-textSecondary`}>Decision {index + 1}</p>
      <h3 className="mb-6 text-2xl font-semibold tracking-tight text-textPrimary md:text-[28px]">{d.title}</h3>
      <dl className="divide-y divide-border border-t border-border">
        {rows
          .filter(([label]) => label !== "Trade-off" || real(d.tradeoff))
          .map(([label, body, cls]) => (
            <div key={label} className="grid gap-1 py-4 md:grid-cols-[140px_1fr] md:gap-8">
              <dt className="text-sm font-semibold text-textSecondary">{label}</dt>
              <dd className={`text-[16px] leading-relaxed ${cls}`}>{body}</dd>
            </div>
          ))}
      </dl>
    </article>
  );
}

function StageBar({ label, stages, scale }: { label: string; stages: StageTiming[]; scale: number }) {
  const total = stages.reduce((a, s) => a + (s.ms as number), 0);
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-semibold text-textPrimary">{label}</span>
        <span className="font-mono text-textSecondary">{(total / 1000).toFixed(1)} s</span>
      </div>
      <div className="flex h-8 overflow-hidden rounded-lg" style={{ width: `${(total / scale) * 100}%` }}>
        {stages.map((s, i) => (
          <div key={s.stage} title={`${s.stage}: ${s.ms} ms`} style={{ flexGrow: s.ms as number, background: STAGE_COLORS[i % STAGE_COLORS.length] }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-textSecondary">
        {stages.map((s, i) => (
          <li key={s.stage} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: STAGE_COLORS[i % STAGE_COLORS.length] }} />
            {s.stage} · {s.ms} ms
          </li>
        ))}
      </ul>
    </div>
  );
}

export const youtubeId = (url: string) => url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)?.[1];

/** Shows the YouTube thumbnail and loads the player only on click, so the page stays light. */
function YouTube({ url, title }: { url: string; title: string }) {
  const id = youtubeId(url);
  const [play, setPlay] = useState(false);
  if (!id) return null;
  return (
    <div className="relative aspect-video overflow-hidden bg-black">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} aria-label={`Play ${title}`} className="group absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`} alt="" className="h-full w-full scale-[1.04] object-cover opacity-95 transition-opacity group-hover:opacity-100" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/90 shadow-xl backdrop-blur transition-transform group-hover:scale-105">
              <Play className="ml-1 h-8 w-8 fill-black text-black" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

function Media({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  if (src.endsWith(".mp4"))
    return <video src={src} poster={src.replace(/\.mp4$/, "-poster.jpg")} aria-label={alt} autoPlay muted loop playsInline preload={priority ? "auto" : "metadata"} className="h-auto w-full" />;
  return <Image src={src} alt={alt} width={1600} height={900} priority={priority} className="h-auto w-full" sizes="(max-width: 1280px) 100vw, 1216px" />;
}

export default function ProjectPage({ project }: { project: Project }) {
  const { summary: s, context, architecture, decisions, measurement: m, reliability, limits, learnings, deepDive } = project;

  const stagesMeasured = [...m.before, ...m.after].length > 0 && [...m.before, ...m.after].every((x) => real(x.ms));
  const hasHeadline = real(m.headline.before) && real(m.headline.after);
  const method = ([["Network", m.method.network], ["Samples", m.method.samples], ["p50", m.method.p50], ["p95", m.method.p95]] as const).filter(([, v]) => real(v));
  const showMeasurement = hasHeadline || stagesMeasured || method.length > 0;
  const limitRows = limits.items.filter((l) => real(l.today));
  const learningItems = learnings.items.filter(real);

  const sections: Array<{ id: SectionId; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "context", label: "Context" },
    { id: "architecture", label: "Architecture" },
    { id: "decisions", label: "Decisions" },
    ...(showMeasurement ? [{ id: "measurement" as const, label: "Measurement" }] : []),
    { id: "reliability", label: "Reliability" },
    ...(limitRows.length ? [{ id: "limits" as const, label: "Limits" }] : []),
    ...(learningItems.length ? [{ id: "learnings" as const, label: "Learnings" }] : []),
    ...(deepDive ? [{ id: "deep-dive" as const, label: "Deep dive" }] : []),
  ];
  // Alternate band backgrounds by position so hidden sections never leave two of the same tone adjacent.
  const tone = (id: SectionId) => (sections.findIndex((x) => x.id === id) % 2 ? "raised" : "plain");

  const [active, setActive] = useState<SectionId>("overview");
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id as SectionId)), {
      rootMargin: "-35% 0px -60% 0px",
    });
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.slug]);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });

  const meta = [s.role, s.team, s.duration].filter(real);
  const [hero, ...rest] = s.media ?? [];
  const grid = s.mediaLayout === "grid";
  // grid pages: every clip, the first included, sits in one even grid (source clips are small, so no full-width hero)
  const gallery = grid ? [] : rest.filter((m) => !m.title);
  const splits = grid ? (s.media ?? []) : rest.filter((m) => m.title);
  const stats = s.stats.filter((x) => real(x.value));
  const ratio = firstNumber(String(m.headline.after)) / firstNumber(String(m.headline.before));

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      {/* Local nav, Apple product-page style: sits directly under the global Navbar. */}
      <div className="fixed left-0 right-0 top-12 z-40 border-b border-glassBorder bg-glass backdrop-blur-xl md:top-14">
        <div className={`${WRAP} flex h-11 items-center justify-between gap-6`}>
          <a href="#overview" className="truncate text-[15px] font-semibold tracking-tight">
            {s.title}
          </a>
          <nav aria-label="Page sections" className="hidden items-center gap-6 lg:flex">
            {sections.slice(1).map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={active === id ? "location" : undefined}
                className={`text-xs transition-colors ${active === id ? "text-textPrimary" : "text-textSecondary hover:text-textPrimary"}`}
              >
                {label}
              </a>
            ))}
          </nav>
          <span className="text-xs text-textSecondary lg:hidden">{sections.find((x) => x.id === active)?.label}</span>
        </div>
        <motion.div className="h-[2px] origin-left bg-accent" style={{ scaleX: progress }} />
      </div>

      {/* 00 Overview: eyebrow, title, tagline, meta, CTAs and stats fit in 1440×900. */}
      <header id="overview" className="scroll-mt-28 pt-[148px] md:pt-[164px]">
        <div className={WRAP}>
          <div>
            <p className={`${EYEBROW} mb-5 text-textSecondary`}>{s.eyebrow}</p>
            <h1 className="max-w-5xl text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[80px]">{s.title}</h1>
            <p className="mt-5 max-w-3xl text-xl leading-snug text-textSecondary md:text-[26px]">{s.tagline}</p>
            {s.awards?.length ? (
              <ul aria-label="Awards" className="mt-6 space-y-1.5 text-[17px] leading-snug text-textSecondary">
                {s.awards.map((a) => (
                  <li key={a.title}>
                    <span className="font-semibold text-[#B64400] dark:text-[#FF9F0A]">Winner</span>{" "}
                    <span className="font-medium text-textPrimary">{a.title}</span> <span className="whitespace-nowrap">· {a.event}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              {meta.length > 0 && <p className="text-[15px] text-textSecondary">{meta.join("  ·  ")}</p>}
              <div className="flex gap-3">
                {s.links.demo && (
                  <a href={s.links.demo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-[15px] font-medium text-white hover:opacity-90">
                    {/youtube\.com|youtu\.be/.test(s.links.demo) ? "Watch demo" : "Visit"} <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
                {s.links.repo && (
                  <a href={s.links.repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-textPrimary px-5 py-2 text-[15px] font-medium text-background hover:opacity-90">
                    <Github className="h-4 w-4" /> Source
                  </a>
                )}
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <dl
              className="mt-10 grid gap-6 border-t border-border pt-8 sm:mt-14 sm:grid-cols-3 sm:gap-8"
            >
              {stats.map((st) => (
                <div key={st.label}>
                  <dd className="text-[34px] font-semibold leading-none sm:text-[40px] tracking-[-0.03em] md:text-[52px]">{st.value}</dd>
                  <dt className="mt-3 max-w-[260px] text-[15px] leading-snug text-textSecondary">{st.label}</dt>
                </div>
              ))}
            </dl>
          )}

          {/* Media, Apple-style: the demo film first, then the lead image, then a gallery row — all edge-to-edge, no frames. */}
          {s.video && (
            <figure className="mt-16">
              <div className="overflow-hidden rounded-[28px] shadow-[0_40px_100px_-50px_rgba(0,0,0,0.5)]">
                <YouTube url={s.video} title={`${s.title} demo`} />
              </div>
              <figcaption className="mt-4 text-center text-sm text-textSecondary">Watch the {s.title} demo</figcaption>
            </figure>
          )}
          {hero && !grid && (
            <figure className={s.video ? "mt-6" : "mt-16"}>
              <div className="overflow-hidden rounded-[28px] bg-muted">
                <Media src={hero.src} alt={hero.alt} priority={!s.video} />
              </div>
              <figcaption className="mt-3 text-sm text-textSecondary">{hero.alt}</figcaption>
            </figure>
          )}
          {gallery.length > 0 && (
            <div className={`mt-6 grid gap-6 ${gallery.length > 2 ? "md:grid-cols-3" : gallery.length > 1 ? "md:grid-cols-2" : ""}`}>
              {gallery.map((g) => (
                <figure key={g.src}>
                  {/* Equal-ratio tiles so mixed landscape / portrait media line up. */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] bg-muted">
                    {g.src.endsWith(".mp4") ? (
                      <video src={g.src} poster={g.src.replace(/\.mp4$/, "-poster.jpg")} aria-label={g.alt} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      <Image src={g.src} alt={g.alt} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
                    )}
                  </div>
                  <figcaption className="mt-3 text-sm text-textSecondary">{g.alt}</figcaption>
                </figure>
              ))}
            </div>
          )}
          {s.mediaLayout === "grid" && splits.length > 0 && (
            <div className={`mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 ${splits.length >= 5 ? "lg:grid-cols-3" : ""}`}>
              {splits.map((m, i) => (
                <figure key={m.src}>
                  <div className="relative aspect-square overflow-hidden rounded-[20px] bg-muted">
                    {m.src.endsWith(".mp4") ? (
                      <video src={m.src} poster={m.src.replace(/\.mp4$/, "-poster.jpg")} aria-label={m.alt} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      <Image src={m.src} alt={m.alt} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
                    )}
                  </div>
                  <figcaption className="mt-5">
                    <p className="font-mono text-[12px] tabular-nums text-textSecondary">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-2 text-[22px] font-semibold leading-snug tracking-[-0.015em]">{m.title ?? m.alt}</h3>
                    {m.body && <p className="mt-2 text-[15px] leading-relaxed text-textSecondary">{md(m.body)}</p>}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          {s.mediaLayout !== "grid" && splits.map((m) => (
            <figure key={m.src} className="mt-6 grid items-center gap-8 rounded-[28px] bg-surface p-6 md:grid-cols-[7fr_5fr] md:gap-12 md:p-10">
              <div className="overflow-hidden rounded-[20px] bg-muted">
                <Media src={m.src} alt={m.alt} />
              </div>
              <figcaption>
                <h3 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] md:text-[36px]">{m.title}</h3>
                {m.body && <p className="mt-4 text-[17px] leading-relaxed text-textSecondary">{md(m.body)}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="h-20 md:h-28" />
      </header>

      <Band id="context" label="Context" lede={context.lede} tone={tone("context")}>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="mb-3 text-lg font-semibold">The problem</h3>
            <p className={BODY}>{md(context.problem)}</p>
          </div>
          {real(context.myScope) && (
            <div>
              <h3 className="mb-3 text-lg font-semibold">What I owned</h3>
              <p className={BODY}>{md(context.myScope)}</p>
            </div>
          )}
        </div>
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(s.stack).map(([layer, items]) => (
            <div key={layer} className="rounded-[20px] border border-border bg-background p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-textSecondary">{layer}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-[13px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Band>

      <Band id="architecture" label="Architecture" lede={architecture.lede} tone={tone("architecture")}>
        {typeof architecture.image === "string" ? (
          <Media src={architecture.image} alt={architecture.caption} />
        ) : (
          <DiagramPlaceholder {...architecture.image} highlight={architecture.highlightedPath} />
        )}
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
            <li className="mr-1 font-semibold text-textSecondary">Critical path</li>
            {architecture.highlightedPath.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                {i > 0 && <span className="text-textSecondary">→</span>}
                <span className="rounded-full border border-accent px-3 py-1 font-medium text-accent">{step}</span>
              </li>
            ))}
          </ol>
          <p className="max-w-md text-sm text-textSecondary lg:text-right">{md(architecture.caption)}</p>
        </div>
      </Band>

      <Band id="decisions" label="Key decisions" lede={decisions.lede} tone={tone("decisions")}>
        <div className="space-y-6">
          {decisions.items.map((d, i) => (
            <DecisionCard key={d.title} d={d} index={i} />
          ))}
        </div>
      </Band>

      {showMeasurement && (
        <Band id="measurement" label="Measurement" lede={m.lede} tone={tone("measurement")}>
          {hasHeadline && (
            <div className="max-w-4xl">
              <p className="mb-6 text-sm font-semibold text-textSecondary">{m.headline.label}</p>
              {(
                [
                  ["Before", m.headline.before, 1, "bg-[#8E8E93]/50"],
                  ["After", m.headline.after, ratio, "bg-accent"],
                ] as const
              ).map(([k, v, w, bg]) => (
                <div key={k} className="mb-5 grid grid-cols-[72px_1fr] items-center gap-4">
                  <span className="text-sm text-textSecondary">{k}</span>
                  <div className="flex items-center gap-4">
                    {Number.isFinite(ratio) && ratio > 0 && ratio <= 1 && (
                      <motion.div
                        className={`h-10 rounded-lg ${bg}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${w * 75}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                      />
                    )}
                    <span className="whitespace-nowrap text-3xl font-semibold tracking-tight md:text-4xl">{v}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {stagesMeasured && (
            <div className="mt-12 max-w-4xl space-y-6">
              {(() => {
                const scale = Math.max(...[m.before, m.after].map((r) => r.reduce((a, x) => a + (x.ms as number), 0)));
                return (
                  <>
                    <StageBar label="Before, by stage" stages={m.before} scale={scale} />
                    <StageBar label="After, by stage" stages={m.after} scale={scale} />
                  </>
                );
              })()}
            </div>
          )}
          {method.length > 0 && (
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-sm">
              {method.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-textSecondary">{k}</dt>
                  <dd className="mt-1 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </Band>
      )}

      <Band id="reliability" label="Reliability" lede={reliability.lede} tone={tone("reliability")}>
        <ul className="grid gap-4 md:grid-cols-2">
          {reliability.bullets.filter(real).map((b) => (
            <li key={b} className="flex gap-3 rounded-[20px] border border-border bg-background p-5 text-[16px] leading-relaxed text-textSecondary">
              <Check className="mt-1 h-4 w-4 flex-none text-[#248A3D] dark:text-[#30D158]" />
              <span>{md(b)}</span>
            </li>
          ))}
        </ul>
        {reliability.details && (
          <details className="group mt-6 rounded-[20px] border border-border bg-background">
            <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-[15px] font-medium">
              Edge cases covered ({reliability.details.length})
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="grid gap-x-10 gap-y-2 px-5 pb-5 text-[15px] leading-relaxed text-textSecondary md:grid-cols-2">
              {reliability.details.map((d) => (
                <li key={d}>{md(d)}</li>
              ))}
            </ul>
          </details>
        )}
      </Band>

      {limitRows.length > 0 && (
        <Band id="limits" label="Limits and scale" lede={limits.lede} tone={tone("limits")}>
          <div className="overflow-hidden rounded-[22px] border border-border">
            <div className="hidden grid-cols-2 bg-muted text-xs font-semibold uppercase tracking-wider text-textSecondary md:grid">
              <p className="px-6 py-4">Today</p>
              <p className="px-6 py-4">At scale</p>
            </div>
            {limitRows.map((l) => (
              <div key={l.today} className="grid border-t border-border bg-background text-[16px] leading-relaxed first:border-t-0 md:grid-cols-2 md:[&:nth-child(2)]:border-t-0">
                <p className="px-6 pt-5 md:py-5">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-textSecondary md:hidden">Today</span>
                  {md(l.today)}
                </p>
                <p className="px-6 pb-5 pt-3 text-textSecondary md:py-5">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider md:hidden">At scale</span>
                  {real(l.atScale) ? md(l.atScale) : "—"}
                </p>
              </div>
            ))}
          </div>
        </Band>
      )}

      {learningItems.length > 0 && (
        <Band id="learnings" label="Learnings" lede={learnings.lede} tone={tone("learnings")}>
          <ol className="grid gap-6 md:grid-cols-3">
            {learningItems.map((l, i) => (
              <li key={l} className="border-t border-border pt-5">
                <span className="font-mono text-sm text-accent">0{i + 1}</span>
                <p className="mt-2 text-[17px] leading-relaxed">{md(l)}</p>
              </li>
            ))}
          </ol>
        </Band>
      )}

      {deepDive && (
        <section id="deep-dive" className={`scroll-mt-28 py-16 ${tone("deep-dive") === "raised" ? "bg-surface" : ""}`}>
          <div className={WRAP}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-[22px] border border-border bg-background px-6 py-5">
                <span>
                  <span className="block text-xl font-semibold">Engineering deep dive</span>
                  <span className="text-sm text-textSecondary">Pipelines, code flow and implementation notes</span>
                </span>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-10 space-y-12">
                {deepDive.map((b, i) => (
                  <div key={i}>
                    {b.label && <h3 className="mb-4 text-lg font-semibold">{b.label}</h3>}
                    {b.kind === "code" && <CodeBlock language={b.language} snippet={b.snippet} />}
                    {b.kind === "text" && <p className={`${BODY} whitespace-pre-line`}>{md(b.body)}</p>}
                    {b.kind === "images" && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {b.items.map((img) => (
                          <Media key={img.src} src={img.src} alt={img.alt} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </section>
      )}

      <div className={`${WRAP} py-16`}>
        <Link href="/projects" className="text-[15px] text-accent hover:underline">
          ← All projects
        </Link>
      </div>
    </div>
  );
}
