"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/content/projects";
import { isTodo } from "@/content/projects/types";
import { bento, COLS, ROWS, type BentoCell } from "@/content/home-bento";

// Fills the screen with a slim 24–32px margin; capped only on very wide displays.
const WRAP = "mx-auto max-w-[2200px] px-5 lg:px-8";
// White tiles on the #f5f5f7 page (dark surface in dark mode); copy centred, one gradient for every number.
const CELL = "group relative flex overflow-hidden rounded-[24px] bg-surface text-textPrimary transition-transform duration-[400ms] ease-out hover:scale-[1.015]";
const EYEBROW = "text-[14px] font-semibold text-textSecondary";
const LINK = "inline-flex items-center text-[17px] text-accent group-hover:underline";
const GRAD = "bg-gradient-to-r from-[#0071e3] to-[#9b51e0] bg-clip-text text-transparent dark:from-[#2997ff] dark:to-[#c084fc]";

// The board placement only applies from lg up (via CSS vars); below that the cells flow in a simple 2-column stack.
const place = ([x, y, w, h]: BentoCell["at"]) => ({ "--gc": `${x} / span ${w}`, "--gr": `${y} / span ${h}` }) as React.CSSProperties;
const AT = "lg:[grid-column:var(--gc)] lg:[grid-row:var(--gr)]";

function Cell({ c }: { c: BentoCell }) {
  const href = `/projects/${c.slug}`;

  if (c.kind === "hero") {
    return (
      <Link href={href} style={place(c.at)} className={`${CELL} ${AT} col-span-2 h-[520px] flex-col items-center px-6 pt-10 text-center lg:col-span-1 lg:h-auto lg:px-10 lg:pt-12`}>
        <p className={`text-[17px] font-semibold ${GRAD}`}>{c.kicker}</p>
        <p className={`${EYEBROW} mt-1`}>{c.eyebrow}</p>
        <h3 className="mt-2 text-[clamp(44px,4.2vw,72px)] font-semibold leading-none tracking-[-0.035em]">{c.title}</h3>
        <p className="mt-4 max-w-md text-[19px] leading-snug text-textSecondary">{c.tagline}</p>
        <span className={`${LINK} mt-4`}>
          Learn more <ChevronRight className="h-4 w-4" />
        </span>
        <div className="relative mt-8 w-[calc(100%+3rem)] flex-1 lg:w-[calc(100%+5rem)]">
          <Image src={c.image} alt="" fill sizes="(min-width: 1440px) 34vw, 50vw" className="object-cover" />
        </div>
      </Link>
    );
  }

  if (c.kind === "image") {
    const wide = c.at[3] === 1;
    return (
      <Link href={href} style={place(c.at)} className={`${CELL} ${AT} col-span-2 h-[360px] lg:col-span-1 lg:h-auto ${wide ? "flex-col items-center pt-8 text-center lg:flex-row lg:items-stretch lg:pt-0 lg:text-left" : "flex-col items-center pt-10 text-center"}`}>
        <div className={wide ? "px-6 lg:w-[46%] lg:shrink-0 lg:p-7" : "px-8"}>
          <p className={EYEBROW}>{c.eyebrow}</p>
          <h3 className={`mt-1.5 font-semibold leading-[1.05] tracking-[-0.03em] ${wide ? "text-[30px]" : "text-[clamp(36px,3vw,48px)]"}`}>{c.title}</h3>
        </div>
        {/* The shot runs to the card edges: down the right side (wide) or under the copy (tall). */}
        <div className={`relative ${wide ? "mt-6 w-full flex-1 lg:mt-0" : "mt-6 w-full flex-1"}`}>
          <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 34vw, 100vw" className="object-cover" />
        </div>
      </Link>
    );
  }

  if (c.kind === "stat") {
    const todo = isTodo(c.value);
    return (
      <Link href={href} style={place(c.at)} className={`${CELL} ${AT} min-h-[170px] flex-col items-center justify-center p-5 text-center lg:min-h-0 lg:p-6`}>
        {c.label && <p className="text-[15px] font-semibold text-textPrimary">{c.label}</p>}
        <p className={`mt-1 text-[clamp(32px,3.6vw,64px)] font-semibold leading-[1.05] tracking-[-0.035em] tabular-nums ${todo ? "text-textSecondary" : GRAD}`}>
          {todo ? "TODO" : c.value}
        </p>
        <p className="mt-2 line-clamp-2 text-[15px] leading-snug text-textSecondary">{c.caption}</p>
      </Link>
    );
  }

  return (
    <Link href={href} style={place(c.at)} className={`${CELL} ${AT} min-h-[170px] flex-col items-center justify-center p-5 text-center lg:min-h-0 lg:p-6`}>
      <p className={EYEBROW}>{c.eyebrow}</p>
      <p className="mt-1.5 line-clamp-3 text-[19px] font-semibold leading-[1.2] tracking-[-0.015em]">{c.claim}</p>
      <span className={`${LINK} mt-3 text-[15px]`}>
        Learn more <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export default function ProjectIndex() {
  const [open, setOpen] = useState(false);
  const shown = new Set(bento.map((c) => c.slug));
  const rest = projects.filter((p) => !shown.has(p.slug));

  return (
    <section className={WRAP}>
      <div
        className="grid grid-flow-row-dense grid-cols-2 gap-3 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))] lg:[grid-template-rows:repeat(var(--rows),clamp(170px,12.5vw,260px))]"
        style={{ "--cols": COLS, "--rows": ROWS } as React.CSSProperties}
      >
        {bento.map((c, i) => (
          <Cell key={`${c.kind}-${c.slug}-${i}`} c={c} />
        ))}
      </div>

      {rest.length > 0 && (
        <>
          {/* Already on /projects, so the bar reveals the remaining projects instead of linking to itself. */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="group mt-3 flex w-full items-center justify-between rounded-[24px] bg-surface px-8 py-7 text-left text-textPrimary transition-transform duration-[400ms] ease-out hover:scale-[1.005]"
          >
            <span className="text-[21px] font-semibold tracking-[-0.01em]">{rest.length} more projects</span>
            <span className={LINK}>
              {open ? "Show less" : "View all"} <ChevronDown className={`ml-0.5 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </span>
          </button>

          {open && (
            <ul className="mt-6 border-b border-border">
              {rest.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`} className="group grid grid-cols-[1fr_24px] items-center gap-x-6 gap-y-1 border-t border-border px-2 py-5 md:grid-cols-[1fr_1.4fr_24px]">
                    <span className="text-[19px] font-semibold tracking-tight text-textPrimary">{p.summary.title}</span>
                    <span className="col-start-1 row-start-2 text-[15px] text-textSecondary md:col-start-auto md:row-start-auto md:truncate">{p.summary.tagline}</span>
                    <ChevronRight className="h-4 w-4 text-textSecondary transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
