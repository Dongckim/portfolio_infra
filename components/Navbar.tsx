"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { projectDetails } from "@/data/projects";
import { useTheme } from "@/components/ThemeProvider";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [prevHoveredItem, setPrevHoveredItem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update prevHoveredItem when hoveredItem changes
  useEffect(() => {
    if (hoveredItem !== null) {
      setPrevHoveredItem(hoveredItem);
    } else {
      setPrevHoveredItem(null);
    }
  }, [hoveredItem]);

  const menuItems = [
    {
      label: "About",
      href: "#about",
      submenu: [
        {
          title: "Explore",
          items: [
            { label: "Overview", href: "https://drive.google.com/file/d/1A_Axi5jiqOgkQX29WL8iK33kjys2O1V7/view?usp=sharing" },
            { label: "Skills", href: "https://drive.google.com/file/d/1A_Axi5jiqOgkQX29WL8iK33kjys2O1V7/view?usp=sharing" },
            { label: "Education", href: "https://drive.google.com/file/d/1A_Axi5jiqOgkQX29WL8iK33kjys2O1V7/view?usp=sharing" },
          ],
        },
        {
          title: "Background",
          items: [
            { label: "Experience", href: "https://drive.google.com/file/d/1A_Axi5jiqOgkQX29WL8iK33kjys2O1V7/view?usp=sharing" },
            { label: "Achievements", href: "https://drive.google.com/file/d/1A_Axi5jiqOgkQX29WL8iK33kjys2O1V7/view?usp=sharing" },
          ],
        },
      ],
    },
    {
      label: "Projects",
      href: "#projects",
      submenu: [
        {
          title: "All Projects",
          items: [
            { label: "View All", href: "#projects" },
          ],
        },
        {
          title: "Projects",
          items: projectDetails.map((project) => ({
            label: project.title,
            href: `/projects/${project.slug}`,
          })),
        },
      ],
    },
    {
      label: "Experience",
      href: "#experience",
      submenu: [
        {
          title: "Professional",
          items: [
            { label: "Work History", href: "https://drive.google.com/file/d/1A_Axi5jiqOgkQX29WL8iK33kjys2O1V7/view?usp=sharing" },
            { label: "Internships", href: "https://drive.google.com/file/d/1A_Axi5jiqOgkQX29WL8iK33kjys2O1V7/view?usp=sharing" },
          ],
        },
        {
          title: "Achievements",
          items: [
            { label: "Notable Work", href: "https://drive.google.com/file/d/1A_Axi5jiqOgkQX29WL8iK33kjys2O1V7/view?usp=sharing" },
            { label: "Contributions", href: "https://drive.google.com/file/d/1A_Axi5jiqOgkQX29WL8iK33kjys2O1V7/view?usp=sharing" },
          ],
        },
      ],
    },
    {
      label: "Contact",
      href: "#contact",
      submenu: [
        {
          title: "Connect",
          items: [
            { label: "Email", href: "mailto:dck.alx@gmail.com" },
            { label: "LinkedIn", href: "https://www.linkedin.com/in/dongckim99/" },
            { label: "GitHub", href: "https://github.com/Dongckim" },
          ],
        },
        {
          title: "Resources",
          items: [
            { label: "Resume", href: "https://drive.google.com/file/d/1A_Axi5jiqOgkQX29WL8iK33kjys2O1V7/view?usp=sharing" },
            { label: "XR Portfolio", href: "https://dongchan.xyz" },
          ],
        },
      ],
    },
  ];

  const activeMenuItem = menuItems.find((item) => item.label === hoveredItem);
  
  const themeSubmenu = {
    label: "Theme",
    submenu: [
      {
        title: "Appearance",
        items: [
          { label: "Light Mode", href: "#", action: () => theme !== "light" && toggleTheme() },
          { label: "Dark Mode", href: "#", action: () => theme !== "dark" && toggleTheme() },
        ],
      },
    ],
  };

  // Get current submenu data based on hoveredItem
  const currentSubmenu = useMemo(() => {
    if (hoveredItem === "Theme") {
      return themeSubmenu.submenu;
    }
    return activeMenuItem?.submenu || null;
  }, [hoveredItem, activeMenuItem]);

  const shouldAnimate = prevHoveredItem === null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50"
      onMouseLeave={() => {
        setHoveredItem(null);
        setPrevHoveredItem(null);
      }}
    >
      <nav
        className="transition-all duration-300 bg-glass backdrop-blur-xl border-b border-glassBorder"
        onMouseEnter={() => {
          // Keep dropdown open when mouse enters nav area
          if (hoveredItem) {
            setPrevHoveredItem(hoveredItem);
          }
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 md:h-14">
            {/* Logo (favicon) */}
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <Image
                src="/favicon.png"
                alt="Home"
                width={24}
                height={24}
                className={`w-[18px] h-[18px] object-contain transition-all duration-300 ${
                  isDark ? "" : "invert"
                }`}
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-7 flex-1 justify-center">
              {menuItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => {
                    const previousItem = hoveredItem;
                    setHoveredItem(item.label);
                    setPrevHoveredItem(previousItem);
                  }}
                >
                  <Link
                    href={item.href}
                    className="text-[13px] text-textPrimary font-normal relative block py-1.5"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-5">
              <div
                className="relative"
                onMouseEnter={() => {
                  const previousItem = hoveredItem;
                  setHoveredItem("Theme");
                  setPrevHoveredItem(previousItem);
                }}
              >
                <button
                  onClick={toggleTheme}
                  className="text-textPrimary font-normal relative block py-1.5 hover:opacity-80 transition-opacity"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? (
                    <Sun className="w-[18px] h-[18px]" />
                  ) : (
                    <Moon className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-textPrimary hover:text-accent transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-[18px] h-[18px]" />
                ) : (
                  <Menu className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Bridge area between nav and dropdown to prevent closing */}
      {((hoveredItem && activeMenuItem?.submenu) || hoveredItem === "Theme") && (
        <div
            className="fixed top-12 md:top-14 left-0 right-0 h-1 z-[45]"
          onMouseEnter={() => {
            if (hoveredItem) {
              setPrevHoveredItem(hoveredItem);
            }
          }}
          style={{ pointerEvents: "auto" }}
        />
      )}

      {/* Blur backdrop when dropdown is open */}
      <AnimatePresence>
        {((hoveredItem && activeMenuItem?.submenu) || hoveredItem === "Theme") && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldAnimate ? { duration: 0.3 } : { duration: 0 }}
            className="fixed top-12 md:top-14 left-0 right-0 bottom-0 z-30 backdrop-blur-sm"
            style={{ pointerEvents: "none" }}
          />
        )}
      </AnimatePresence>

      {/* Full-Width Dropdown Menu */}
      <AnimatePresence>
        {((hoveredItem && activeMenuItem?.submenu) || hoveredItem === "Theme") && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.16, 1, 0.3, 1],
              exit: {
                duration: 0.4,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1]
              }
            }}
            className="fixed top-12 md:top-14 left-0 right-0 z-40 bg-glass backdrop-blur-xl border-b border-glassBorder"
            onMouseEnter={() => {
              // Keep dropdown open when mouse enters dropdown
              if (hoveredItem) {
                setPrevHoveredItem(hoveredItem);
              }
            }}
            style={{ pointerEvents: "auto" }}
          >
            <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[400px] flex items-start ${hoveredItem === "Theme" ? "justify-end" : ""}`}>
              {currentSubmenu && hoveredItem && (
                <div
                  key={hoveredItem}
                  className={`w-full ${hoveredItem === "Theme" ? "md:w-auto" : ""} grid grid-cols-1 ${hoveredItem === "Theme" ? "md:grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"} gap-12 lg:gap-16`}
                >
                  {currentSubmenu.map((column, columnIndex) => (
                    <motion.div
                      key={column.title}
                      initial={shouldAnimate ? { opacity: 0, y: 10 } : { opacity: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={shouldAnimate ? { delay: columnIndex * 0.1, duration: 0.3 } : { duration: 0.2, delay: columnIndex * 0.05 }}
                    >
                    <h3 className="text-[10px] font-medium text-textSecondary mb-6 uppercase tracking-[0.08em]">
                      {column.title}
                    </h3>
                    <ul className="space-y-3">
                      {column.items.map((item, itemIndex) => (
                        <motion.li
                          key={item.label}
                          initial={shouldAnimate ? { opacity: 0, x: -10 } : { opacity: 0 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={shouldAnimate ? {
                            delay: columnIndex * 0.1 + itemIndex * 0.05,
                            duration: 0.2,
                          } : { duration: 0.2, delay: (columnIndex * 0.1 + itemIndex * 0.05) * 0.5 }}
                        >
                          {"action" in item && typeof item.action === "function" ? (
                            <button
                              onClick={() => {
                                if (typeof item.action === "function") {
                                  item.action();
                                }
                                setHoveredItem(null);
                              }}
                              className="block py-1.5 text-lg md:text-xl font-semibold text-textPrimary leading-tight text-left w-full"
                            >
                              {item.label}
                            </button>
                          ) : item.href && (item.href.startsWith('http') || item.href.startsWith('mailto')) ? (
                            <a
                              href={item.href}
                              target={item.href.startsWith('mailto') ? undefined : "_blank"}
                              rel={item.href.startsWith('mailto') ? undefined : "noopener noreferrer"}
                              className="block py-1.5 text-lg md:text-xl font-semibold text-textPrimary leading-tight"
                            >
                              {item.label}
                            </a>
                          ) : (
                            <Link
                              href={item.href || "#"}
                              className="block py-1.5 text-lg md:text-xl font-semibold text-textPrimary leading-tight"
                            >
                              {item.label}
                            </Link>
                          )}
                        </motion.li>
                      ))}
                    </ul>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-glass backdrop-blur-xl overflow-hidden fixed top-12 md:top-14 left-0 right-0 z-40 border-t border-glassBorder"
          >
            <div className="px-4 py-4 space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-textPrimary hover:text-accent transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

