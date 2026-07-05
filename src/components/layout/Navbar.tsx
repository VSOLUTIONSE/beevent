"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, User, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PillButton } from "@/design/primitives";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Explore", href: "#venue" },
    { label: "Packages", href: "#packages" },
    { label: "Availability", href: "#calendar" },
  ];

  const scrollToSection = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-gradient-to-b from-white/[0.12] to-white/[0.05] backdrop-blur-[6px] saturate-[140%] border-b border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="font-serif text-xl lg:text-2xl text-white tracking-tight hover:opacity-80 transition-opacity"
            >
              BeeVelt Halls
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <PillButton onClick={() => router.push("/book")}>
                    <Calendar className="w-4 h-4" />
                    Book Now
                  </PillButton>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Account
                  </Link>
                  <Link
                    href="/book"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 bg-[#E33539] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-[#E33539]/25"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Now
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-white"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#030305]/95 backdrop-blur-xl pt-20"
          >
            <div className="flex flex-col items-center gap-8 p-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="text-2xl font-serif text-white/80 hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="w-16 h-px bg-white/20" />
              <Link
                href="/book"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 bg-[#E33539] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-[#E33539]/25 text-lg"
              >
                Book Now
              </Link>
              {isAuthenticated && (
                <button
                  onClick={() => {
                    router.push("/book");
                    setMenuOpen(false);
                  }}
                  className="text-lg text-white/70 hover:text-white"
                >
                  My Bookings
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
