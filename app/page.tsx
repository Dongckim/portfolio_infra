"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import ProjectCardCarousel from "@/components/ProjectCardCarousel";
import { highlights, highlightImages } from "@/constants/data";
import { useCallback, useEffect, useRef } from "react";

export default function Home() {
  const playerRef = useRef<HTMLDivElement>(null);
  const highlightsScrollRef = useRef<HTMLDivElement>(null);

  const scrollHighlights = useCallback((direction: "left" | "right") => {
    const el = highlightsScrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector("[data-carousel-card]") as HTMLElement | null;
    const gap = 24;
    const step = firstCard ? firstCard.offsetWidth + gap : el.clientWidth;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    // YouTube IFrame Player API 로드
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // API 로드 후 플레이어 초기화
    const loadPlayer = () => {
      const YT = (window as any).YT as any;
      if (YT && YT.Player && playerRef.current) {
        new YT.Player(playerRef.current, {
          videoId: 'PbS7iEWzLyw',
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            start: 0, // 1분 27초
            end: 99, // 3분 42초
            loop: 5,
            playlist: 'PbS7iEWzLyw',
          },
          events: {
            onReady: (event: any) => {
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              // 동영상이 끝나면 다시 시작
              if (event.data === YT.PlayerState.ENDED) {
                event.target.seekTo(87); // 1분 27초로 이동
                event.target.playVideo();
              }
            },
          },
        });
      }
    };

    // API가 이미 로드되어 있는지 확인
    if ((window as any).YT && (window as any).YT.Player) {
      loadPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = loadPlayer;
    }

    return () => {
      // Cleanup
      if ((window as any).onYouTubeIframeAPIReady) {
        delete (window as any).onYouTubeIframeAPIReady;
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Hero Section (includes Highlights + links) */}
      <section id="about" className="pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-2 md:pb-4">
          <div className="mb-8 md:mb-12 relative">
            <div className="relative flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
              <div className="flex-1 min-w-0 max-w-full md:max-w-[calc(100%-20rem)]">
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
                  Engineering Stability.
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
                  <div className="relative w-32 h-32 rounded-full border-2 border-border overflow-hidden bg-surface">
                    <Image
                      src="/profile.jpg"
                      alt="Dongchan Kim"
                      fill
                      className="object-cover"
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
                  <h2 className="text-xl md:text-2xl font-medium text-textPrimary mb-4 tracking-tight">
                    Dongchan Kim | Systems Architect & Fullstack Engineer
                  </h2>
                  <p className="text-base md:text-lg text-textSecondary leading-relaxed">
                    Real-time Systems Engineer with extensive experience in scripting (Js/Python/Bash) and core Computer Science algorithms. Skilled in diagnosing critical performance bottlenecks, evidenced by achieving less than 50ms frame variance in multi-device XR environments through custom drift-correction algorithms. Dedicated to enhancing software quality via automated testing frameworks and rigorous debugging methodologies.
                  </p>
                  <ul className="mt-5 space-y-2 text-textPrimary font-medium tracking-tight">
                    {highlights.map((item) => (
                      <li key={item.title} className="text-base md:text-lg leading-snug flex items-baseline gap-2">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-1.5" aria-hidden />
                        <span>{item.title}</span>
                      </li>
                    ))}
                  </ul>
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
                      <svg className="w-5 h-5" fill="#0077B5" viewBox="0 0 24 24" aria-hidden="true">
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
                className="hidden md:block flex-shrink-0 w-72 h-72"
              >
                <div className="relative w-full h-full rounded-full border-2 border-border overflow-hidden bg-surface">
                  <Image
                    src="/profile.jpg"
                    alt="Dongchan Kim"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Photo section - card row with arrows outside */}
        <motion.div
          id="highlights"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-1 w-full"
        >
          <div
            ref={highlightsScrollRef}
            className="w-full flex overflow-x-auto gap-4 md:gap-6 px-4 sm:px-6 lg:px-8 pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Spacer so first card starts centered */}
            <div
              aria-hidden
              className="flex-shrink-0 w-[calc(5vw-1rem)] sm:w-[calc(7.5vw-1.5rem)] md:w-[max(0px,calc(50vw-min(550px,42.5vw)-1.5rem))]"
            />
            {highlightImages.map((src, i) => (
              <div
                key={src}
                data-carousel-card
                className="relative flex-shrink-0 w-[90vw] sm:w-[85vw] md:w-[min(1100px,85vw)] aspect-[16/10] rounded-2xl overflow-hidden snap-center bg-surface border border-border shadow-sm"
              >
                <Image
                  src={src}
                  alt={`MIT Reality Hack 2026 — ${i + 1}`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 90vw, 1100px"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
          {highlightImages.length > 1 && (
            <div className="flex w-full mt-4 mb-8 md:mb-10 px-4 sm:px-6 lg:px-8 justify-end">
              {/* Right edge of arrow group aligns with center photo right edge (margin from viewport right) */}
              <div
                className="flex items-center gap-2 flex-shrink-0 mr-[5vw] sm:mr-[7.5vw] md:mr-[calc(50vw-min(550px,42.5vw)-0.5rem)]"
              >
                <button
                  type="button"
                  onClick={() => scrollHighlights("left")}
                  aria-label="Previous photo"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-surface text-textPrimary shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => scrollHighlights("right")}
                  aria-label="Next photo"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-surface text-textPrimary shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Projects Section - Apple-style: light gray header + white card strip */}
      <section id="projects" className="bg-background">
        {/* Header area: light gray background */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 1.2,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 1.2,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="text-4xl md:text-6xl font-bold text-textPrimary tracking-tight"
            >
              Projects.
            </motion.h2>
          </motion.div>
        </div>

        {/* YouTube Section - 모바일: 제목·설명 비디오 위 / PC: 비디오 안 하단 오버레이 */}
        <div className="w-full mt-8 sm:mt-10 md:mt-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 1.0,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="relative w-full"
          >
            {/* 모바일 전용: 대제목 + 섹션 설명 (비디오 위) */}
            <div className="md:hidden max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 1.1,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-textPrimary tracking-tight leading-tight mb-2">
                    MIT Reality Hack 2026 — Grand Gold Award & Meta Track Winner
                  </h3>
                  <p className="text-sm sm:text-base text-textSecondary leading-relaxed">
                    World&apos;s premier XR + AI hackathon. Building immersive experiences that push the boundaries of spatial computing and real-time multi-device synchronization.
                  </p>
                </div>
                <motion.a
                  href="/projects/reality-hack"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center self-start px-4 sm:px-6 py-2.5 sm:py-3 bg-surface text-textPrimary rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 shadow-sm border border-border"
                >
                  Learn more
                  <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.a>
              </motion.div>
            </div>

            {/* YouTube 비디오: PC에서는 하단에 오버레이(대제목+설명+Learn more) */}
            <div className="relative w-full aspect-video overflow-hidden">
              <div ref={playerRef} className="absolute inset-0 w-full h-full z-0" />

              {/* PC 전용: 비디오 하단 그라데이션 + 텍스트 오버레이 */}
              <div className="hidden md:block absolute inset-0 pointer-events-none z-5">
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
              </div>
              <div className="hidden md:flex absolute bottom-0 left-0 right-0 z-10 pointer-events-none pb-8 md:pb-10 lg:pb-12">
                <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-row items-end justify-between gap-8"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl md:text-3xl lg:text-4xl text-white font-bold leading-tight mb-2 md:mb-3 tracking-tight">
                        MIT Reality Hack 2026 — Grand Gold Award & Meta Track Winner
                      </p>
                      <p className="text-base md:text-lg text-white/80 leading-relaxed">
                        World&apos;s premier XR + AI hackathon. Building immersive experiences that push the boundaries of spatial computing and real-time multi-device synchronization.
                      </p>
                    </div>
                    <motion.a
                      href="/projects/reality-hack"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-shrink-0 pointer-events-auto inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-white text-textPrimary rounded-full text-base font-medium transition-all duration-200 hover:bg-white/90 shadow-lg"
                    >
                      Learn more
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.a>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Card strip: surface starts exactly where YouTube ends */}
        <div className="bg-surface rounded-t-3xl">
          <ProjectCardCarousel />
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

        {/* Footer - 마지막으로 나타남 */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 1.8,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="mt-20 pt-8 border-t border-border"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-textSecondary">
            <p>© {new Date().getFullYear()} Dongchan Kim. All rights reserved.</p>
          </div>
        </motion.footer>
      </div>
    </main>
  );
}

