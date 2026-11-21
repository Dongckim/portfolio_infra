"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import PhotoCylinder from "@/components/PhotoCylinder";
import DemoReel from "@/components/DemoReel";
import GlassIntro from "@/components/GlassIntro/GlassIntro";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";
import BackToTop from "@/components/BackToTop";
import { highlightImages } from "@/constants/data";
import { useEffect, useState } from "react";

export default function Home() {
  const [showAllNews, setShowAllNews] = useState(false);
  const [showAllExperience, setShowAllExperience] = useState(false);
  // Phones get the light gif + typing intro; the 3D GlassIntro (49 MB model, WebGL) only mounts on md+.
  // null until mounted, so neither intro renders on the server and the wrong one never flashes.
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  // the browser jumps to #hash before the intro mounts (it adds ~35 screens above), so jump again once it has
  useEffect(() => {
    if (mobile === null || !location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" }));
  }, [mobile]);
  // Collapsing removes rows above the button, which would leave the reader far down the page:
  // bring the section's heading back into view when it shrinks.
  const toggle = (open: boolean, set: (v: boolean) => void, id: string) => {
    set(!open);
    if (open) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" }));
  };

  return (
    <main className="relative min-h-screen overflow-x-clip bg-background">
      {mobile === null ? (
        <div className="h-[100dvh]" />
      ) : mobile ? (
        <ScrollExpandMedia mediaType="image" mediaSrc="/smartsight-intro.gif" bgImageSrc="/smartsight-intro.gif" />
      ) : (
        <GlassIntro />
      )}
      <BackToTop />

      {/* Hero Section (includes Highlights + links) */}
      {/* the intro pulls About up under its last screen (--about-pull) and fades it in (--about-in); without the intro both stay neutral */}
      <section id="about" style={{ opacity: "var(--about-in, 1)", marginTop: "var(--about-pull, 0px)" }} className="relative scroll-mt-20 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-2 md:pb-4">
          <div className="mb-8 md:mb-12 relative">
            <div className="relative flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
              <div className="flex-1 min-w-0 max-w-full md:max-w-[calc(100%-28rem)]">
                {/* Main Title - 첫 번째로 나타남 */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="text-4xl md:text-6xl font-bold text-textPrimary tracking-tight mb-10"
                >
                  Hi, I&apos;m Dongchan.
                </motion.h1>

                {/* Profile Image (Mobile) - 모바일에서는 소개 텍스트 위에 표시 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.6,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="md:hidden mb-8 flex justify-center"
                >
                  <div className="w-64 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
                    <Image
                      src="/hero-nyc.jpg"
                      alt="Dongchan Kim in New York City"
                      width={2999}
                      height={3596}
                      className="h-auto w-full rounded-xl"
                      priority
                    />
                  </div>
                </motion.div>
                
                {/* Subtitle and Description - 두 번째로 나타남 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.4,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="mb-6"
                >
                  <h2 className="mb-6 text-2xl md:text-3xl font-semibold tracking-tight text-textPrimary">I build AI glasses, end to end.</h2>
                  <p className="text-base md:text-lg text-textSecondary leading-relaxed">
                    M.S. student at UIUC. I build real-time XR systems and wearable AI, from the sensor to the model and back to your ear.
                  </p>
                  <p className="mt-4 text-base md:text-lg text-textSecondary leading-relaxed">
                    I&apos;ve built real-time XR systems, wearable AI prototypes, and full-stack products. I care about the engineering underneath an experience: latency, reliability, and the details that make interaction feel effortless.
                  </p>
                  <p className="mt-4 text-base md:text-lg text-textSecondary leading-relaxed">
                    Outside of work, I&apos;ve supported <strong className="font-semibold text-textPrimary">Manchester United</strong> for over a decade and rarely miss a Grand Prix weekend cheering for <strong className="font-semibold text-textPrimary">Max Verstappen</strong>.
                  </p>
                  <div className="mt-6 space-y-1 text-sm md:text-base leading-relaxed text-textSecondary">
                    <p>Contact (Affiliation): <a className="transition-colors hover:text-accent" href="mailto:dk76@illinois.edu">dk76 [at] illinois [dot] edu</a></p>
                    <p>Contact (Personal): <a className="transition-colors hover:text-accent" href="mailto:dck.alx@gmail.com">dck.alx [at] gmail [dot] com</a></p>
                  </div>
                  {/* Social Links */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.8,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="mt-6 flex items-center gap-6"
                  >
                    <motion.a
                      href="https://github.com/Dongckim"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 text-textSecondary transition-colors"
                    >
                      <svg className="w-5 h-5 text-textSecondary" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">GitHub</span>
                    </motion.a>
                    <motion.a
                      href="https://www.linkedin.com/in/dongckim99/"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 text-textSecondary transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span className="text-sm">LinkedIn</span>
                    </motion.a>
                    <motion.a
                      href="mailto:dck.alx@gmail.com"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 text-textSecondary transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                      </svg>
                      <span className="text-sm">Email</span>
                    </motion.a>
                  </motion.div>
                </motion.div>
              </div>
              
              {/* Profile Image - 세 번째로 나타남 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.7,
                  delay: 0.6,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="hidden md:block flex-shrink-0 w-[25rem]"
              >
                <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-[0_26px_60px_rgba(0,0,0,0.15)]">
                  <Image
                    src="/hero-nyc.jpg"
                    alt="Dongchan Kim in New York City"
                    width={2999}
                    height={3596}
                    className="h-auto w-full rounded-xl"
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

      </section>

      <section id="experience" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="space-y-20 md:space-y-28">
          <div id="recent-news" className="scroll-mt-24">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-textPrimary">Recent News</h2>
            <div className="mt-8 space-y-6 md:space-y-7">
              <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.11</p>
                <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">Poster accepted at HFES 2027: &ldquo;Smart Glasses for Real-Time Task Support: A Systematic Mapping Review Across Professional Settings.&rdquo;</p>
              </article>
              <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.11</p>
                <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">Submitted Glassistant to the Meta Global AI Developer Hackathon.</p>
              </article>
              <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.10</p>
                <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">Advanced past the first round of the Meta Global AI Developer Hackathon.</p>
              </article>
              <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.09</p>
                <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">Joined the Tech team of the CreatVR research group, an IRB-approved joint study with Cornell University.</p>
              </article>
              {showAllNews && (
                <>
                  <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                    <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.08</p>
                    <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">Starting my M.S. in Systems &amp; Entrepreneurial Engineering at UIUC.</p>
                  </article>
                  <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                    <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.06</p>
                    <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">Joined HXRI Labs as a Research Assistant under the guidance of Avinash Gupta.</p>
                  </article>
                  <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                    <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.06</p>
                    <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">Exhibited SmartSight at the Builder&apos;s Nexus during AWE USA 2026 in Long Beach, California.</p>
                  </article>
                  <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                    <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.05</p>
                    <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">Graduated from Stony Brook University Magna Cum Laude.</p>
                  </article>
                  <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                    <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.04</p>
                    <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">
                      Interviewed by <a className="underline decoration-border underline-offset-4 transition-colors hover:text-accent" target="_blank" rel="noopener noreferrer" href="https://news.stonybrook.edu/university/stony-brook-student-showcases-ai-study-tool-at-mit-reality-hack/">SBU News</a> about building SmartSight at MIT Reality Hack.
                    </p>
                  </article>
                  <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                    <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.04</p>
                    <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">Launched Tryl, an AI-powered fashion try-on experience.</p>
                  </article>
                  <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                    <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.04</p>
                    <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">
                      SmartSight was featured in Meta&apos;s <a className="underline decoration-border underline-offset-4 transition-colors hover:text-accent" href="https://developers.meta.com/blog/explore-whats-possible-with-wearables-device-access-toolkit/" target="_blank" rel="noopener noreferrer">Wearables Device Access Toolkit</a> developer story.
                    </p>
                  </article>
                  <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                    <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.02</p>
                    <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">
                      Featured in a <a className="underline decoration-border underline-offset-4 transition-colors hover:text-accent" target="_blank" rel="noopener noreferrer" href="https://sunykorea.ac.kr/news/html/sub04/04.html?mode=V&amp;mng_no=1321&amp;category=Students">SUNY Korea News Center</a> story on winning the Grand Prize at MIT Reality Hack 2026.
                    </p>
                  </article>
                  <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                    <p className="pt-0.5 text-sm font-semibold text-textSecondary">2026.01</p>
                    <p className="border-l border-border pl-6 text-base md:text-lg leading-relaxed text-textPrimary">SmartSight won both the Gold Prize and Meta&apos;s Best Use of the Wearables Device Access Toolkit award at MIT Reality Hack.</p>
                  </article>
                </>
              )}
            </div>
            <div className="mt-8 ml-[6.5rem] pl-6 md:ml-[11.5rem]">
              <button onClick={() => toggle(showAllNews, setShowAllNews, "recent-news")} className="text-[17px] font-medium text-accent transition-opacity hover:opacity-70">{showAllNews ? "Show less" : "Show all ›"}</button>
            </div>
          </div>

          <div id="education" className="scroll-mt-24">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-textPrimary">Education</h2>
            <div className="mt-8 space-y-8 md:space-y-10">
              <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                <p className="pt-0.5 whitespace-nowrap text-sm font-semibold text-textSecondary">2026.08 — 2028.05</p>
                <div className="border-l border-border pl-6">
                  <h3 className="text-lg font-semibold text-textPrimary">M.S. in Systems &amp; Entrepreneurial Engineering</h3>
                  <p className="mt-1 text-base md:text-lg leading-relaxed text-textSecondary">University of Illinois Urbana-Champaign</p>
                  <p className="mt-2 text-base leading-relaxed text-textSecondary">Research Assistant, HXRI Labs · Advisor: Avinash Gupta</p>
                </div>
              </article>
              <article className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                <p className="pt-0.5 whitespace-nowrap text-sm font-semibold text-textSecondary">2022.08 — 2026.05</p>
                <div className="border-l border-border pl-6">
                  <h3 className="text-lg font-semibold text-textPrimary">B.S. in Technology Systems Management</h3>
                  <p className="mt-1 text-base md:text-lg leading-relaxed text-textSecondary">Stony Brook University</p>
                  <p className="mt-2 text-base leading-relaxed text-textSecondary">Computer Science concentration · Magna Cum Laude</p>
                </div>
              </article>
            </div>
          </div>

          <div id="experience-awards" className="scroll-mt-24">
            <span id="leadership" className="block" aria-hidden />
            <span id="awards" className="block" aria-hidden />
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-textPrimary">Experience &amp; Awards</h2>
            <div className="mt-8 space-y-8 md:space-y-10">
              {[
                ["2026.05", "Magna Cum Laude · Stony Brook University", "Graduated with high honors, with a cumulative GPA of 3.77 / 4.0."],
                ["2026.01", "Gold Prize + Meta Award · MIT Reality Hack", "SmartSight took the Gold Prize and Meta's Best Use award."],
                ["2026", "Host & Speaker · LAMBDA at SUNY Korea Alumni Talk", "Organized an alumni event mentoring Korean international students on early-career development and the U.S. tech ecosystem."],
                ["2025", "Researcher · SBU Blockchain Business Lab", "Built blockchain applications in a university lab."],
                ["2025 — 2026", "SUNY Korea Institutional Scholarship", "Merit-based scholarship recipient, including $2,000 in Spring 2025 and $1,000 in Spring 2026."],
                ["2024.08", "Encouragement Award · SeSAC Google Hackathon", "Awarded by the Seoul Business Agency for developing an innovative software solution."],
                ["2024", "Senior AR Developer & Mentor · SNU XR Association × XREAL", "Led persistent mixed-reality experience development and mentored peers in spatial computing."],
                ["2024", "University Student Mentor · SW Companion Hackathon", "Guided and supported participants at an event hosted by the Korea Foundation for the Advancement of Science and Creativity."],
                ["2023.11", "Grand Prize · Incheon Global Campus Startup Idea Contest", "Awarded first place for pitching an entrepreneurial business model."],
                ["2023.08", "Bronze Prize · OUTTA AI Bootcamp", "Received Excellent Team and Excellent Participant awards for technical performance."],
                ["2023", "Conference Staff · KWDC23", "Supported operations and logistics for the AsyncSwift developer conference."],
                ["2023", "Student Reporter & Video Editor · Ministry of Foreign Affairs", "Created interactive cultural content, including interviews with national Taekwondo athletes."],
              ].slice(0, showAllExperience ? undefined : 4).map(([date, title, detail]) => (
                <article key={title} className="grid grid-cols-[6.5rem_1fr] md:grid-cols-[11.5rem_1fr]">
                  <p className="pt-0.5 text-sm font-semibold text-textSecondary">{date}</p>
                  <div className="border-l border-border pl-6">
                    <h3 className="text-lg font-semibold text-textPrimary">{title}</h3>
                    <p className="mt-1 text-base md:text-lg leading-relaxed text-textSecondary">{detail}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 ml-[6.5rem] pl-6 md:ml-[11.5rem]">
              <button onClick={() => toggle(showAllExperience, setShowAllExperience, "experience-awards")} className="text-[17px] font-medium text-accent transition-opacity hover:opacity-70">{showAllExperience ? "Show less" : "Show all ›"}</button>
            </div>
          </div>
        </div>
      </section>

      {/* the work first (demo films), then the people and places behind it (photos) */}
      <div id="demos" className="scroll-mt-20 bg-surface">
        <DemoReel />
      </div>

      <div id="photo-dumps" className="scroll-mt-20 bg-surface pt-4 md:pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-textSecondary">Beyond the build</p>
          <h2 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight text-textPrimary">Photo Dumps.</h2>
        </div>
        <PhotoCylinder images={highlightImages} />
      </div>

      {/* footer continues the white of the section above, so there is no seam */}
      <div className="bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Footer - 마지막으로 나타남 */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 1.8,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="pt-8 border-t border-border"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-textSecondary">
            <p>© {new Date().getFullYear()} Dongchan Kim. All rights reserved.</p>
            <nav className="flex gap-6">
              <a className="transition-colors hover:text-textPrimary" href="/projects">Projects</a>
              <a className="transition-colors hover:text-textPrimary" href="/contact">Contact</a>
              <a className="transition-colors hover:text-textPrimary" href="https://github.com/Dongckim" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a className="transition-colors hover:text-textPrimary" href="https://www.linkedin.com/in/dongckim99/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </nav>
          </div>
        </motion.footer>
      </div>
      </div>
    </main>
  );
}
