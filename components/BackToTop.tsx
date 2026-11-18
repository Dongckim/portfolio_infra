"use client";

import { useEffect, useState } from "react";

// Appears once the intro is behind you; jumps straight to the top (a smooth scroll would replay the whole intro).
export default function BackToTop() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => { const a = document.getElementById("about"); setOn(!!a && a.getBoundingClientRect().top < window.innerHeight * 0.5); };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })}
      className={`fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/75 text-[#1d1d1f] shadow-[0_6px_20px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[opacity,transform] duration-300 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white ${on ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /></svg>
    </button>
  );
}
