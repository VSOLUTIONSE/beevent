"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, User, Calendar, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@radix-ui/react-alert-dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { PillButton } from "@/design/primitives";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
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
              BeeVent Halls
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="end"
                      sideOffset={8}
                      className="z-[100] w-48 bg-[#1A1A1E] border border-white/10 rounded-xl p-3 shadow-2xl"
                    >
                      <p className="text-sm text-[#B0A8A8] mb-3 text-center">Sign out?</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => logout()}
                          className="w-full py-2 rounded-lg text-sm bg-[#E33539] text-white hover:bg-[#E33539]/90 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
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
              {isAuthenticated && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-2 text-lg text-white/70 hover:text-white">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-md bg-[#1A1A1E] border border-white/10 rounded-2xl p-6 shadow-2xl">
                    <div>
                      <AlertDialogTitle className="text-lg font-serif text-white">Confirm Logout</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm text-[#B0A8A8] mt-1">
                        Are you sure you want to sign out? You'll need to sign in again to manage your bookings.
                      </AlertDialogDescription>
                    </div>
                    <div className="flex gap-3 mt-6 justify-end">
                      <AlertDialogCancel
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                        }}
                        className="px-4 py-2 rounded-lg text-sm bg-[#E33539] text-white hover:bg-[#E33539]/90 transition-colors"
                      >
                        Sign Out
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
