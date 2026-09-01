"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Stethoscope,
  History,
  Activity,
  Cpu,
  Zap,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Settings,
  TrendingUp,
} from "lucide-react";
import BrandLogo from "@/components/common/BrandLogo";
import { AuthService } from "@/services/auth.service";
import { useQuantumBackend } from "@/hooks/useQuantumBackend";
import QuantumChatbot from "@/components/chat/QuantumChatbot";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: any;
    description: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Patient Screening",
    items: [
      {
        label: "Dashboard Overview",
        href: "/home",
        icon: LayoutDashboard,
        description: "Summary and quick screening links",
      },
      {
        label: "Patient Diagnosis",
        href: "/predict",
        icon: Stethoscope,
        description: "Run single-patient quantum screening",
      },
      {
        label: "Past Screening History",
        href: "/history",
        icon: History,
        description: "Review previous patient results and reports",
      },
    ],
  },
  {
    title: "System & Science",
    items: [
      {
        label: "Model Analysis",
        href: "/analysis",
        icon: TrendingUp,
        description: "Real-time accuracy, precision, and validation",
      },
      {
        label: "Model Benchmarks",
        href: "/benchmarks",
        icon: Activity,
        description: "Compare quantum vs standard computer models",
      },
      {
        label: "Quantum Hardware",
        href: "/hardware",
        icon: Cpu,
        description: "IBM Quantum computer and simulator status",
      },
    ],
  },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Sidebar toggle state (persisted across refreshes)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Distinct open vs close transitions
  const sidebarTransition = sidebarOpen
    ? {
      type: "spring" as const,
      stiffness: 280,
      damping: 26,
      mass: 0.8,
    } // OPEN ANIMATION: Smooth, elastic spring expansion
    : {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1] as const,
    }; // CLOSE ANIMATION: Crisp, rapid cubic-bezier collapse

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("quantumx_sidebar_open", String(next));
      }
      return next;
    });
  };

  // User state & session verification
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("user@quantumx.io");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Hardware Selector with Global Synchronization
  const { backend: quantumBackend, setBackend: handleBackendChange } = useQuantumBackend();

  // Notifications and Account Modals
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; time: string; message: string; read: boolean }[]>([]);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastActiveRef = useRef<number>(Date.now());

  // Bootstrap session and setup sliding activity keep-alive
  useEffect(() => {
    let isMounted = true;

    // Check cached user synchronously to avoid flashing
    const cachedUser = AuthService.getCachedUser();
    if (cachedUser) {
      const name = cachedUser.fullName || cachedUser.username || "User";
      setUserName(name);
      setUserEmail(cachedUser.email || "user@quantumx.io");
      if (cachedUser.profileImageUrl) {
        setUserAvatar(cachedUser.profileImageUrl);
      }
      setIsAuthChecking(false);
    }

    async function verifyAndLoadSession() {
      try {
        const user = await AuthService.bootstrapSession();
        if (!isMounted) return;

        if (user) {
          const name = user.fullName || user.username || "User";
          setUserName(name);
          setUserEmail(user.email || "user@quantumx.io");
          if (user.profileImageUrl) {
            setUserAvatar(user.profileImageUrl);
          }
          setIsAuthChecking(false);
        } else if (!cachedUser) {
          // If completely unauthenticated, redirect to login
          setIsAuthChecking(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      } catch (err) {
        if (!isMounted) return;
        if (!cachedUser) {
          setIsAuthChecking(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      }
    }

    verifyAndLoadSession();

    if (typeof window !== "undefined") {
      const storedSidebar = localStorage.getItem("quantumx_sidebar_open");
      if (storedSidebar !== null) {
        setSidebarOpen(storedSidebar === "true");
      }

      const storedNotifs = localStorage.getItem("quantumx_notifications");
      if (storedNotifs) {
        try {
          const parsed = JSON.parse(storedNotifs);
          if (Array.isArray(parsed)) {
            setNotifications(parsed);
          }
        } catch (e) {
          console.error("Failed to parse notifications:", e);
        }
      }

      verifyAndLoadSession();
    }

    // Keep session active with 7-day sliding window on user interaction (throttled to 5 mins)
    const handleUserActivity = () => {
      const now = Date.now();
      const FIVE_MINUTES_MS = 5 * 60 * 1000;
      if (now - lastActiveRef.current > FIVE_MINUTES_MS) {
        lastActiveRef.current = now;
        AuthService.getCurrentUser().catch(() => { });
      }
    };

    window.addEventListener("click", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });

    return () => {
      isMounted = false;
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    await AuthService.logout();
    router.push("/login");
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUserAvatar(base64);
        if (typeof window !== "undefined") {
          localStorage.setItem("quantumx_user_avatar", base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen w-full bg-cream text-ink font-sans selection:bg-ink selection:text-parchment flex flex-col">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* FIXED TOP HEADER */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-parchment/95 backdrop-blur-md border-b border-hairline flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: 3-Line Toggle + Brand */}
        <div className="flex items-center gap-3">
          {/* 3-Line Hamburger Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileMenuOpen(!mobileMenuOpen);
              } else {
                toggleSidebar();
              }
            }}
            aria-label="Toggle navigation sidebar"
            title="Toggle Sidebar Menu"
            className="w-8 h-8 rounded-lg bg-cream-deep/60 hover:bg-cream border border-hairline flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer transition-colors"
          >
            <Menu size={16} />
          </motion.button>

          <Link href="/home" className="cursor-pointer hover:opacity-85 transition-opacity flex items-center gap-3">
            <BrandLogo href={false} />
            <div className="hidden sm:block h-4 w-[1px] bg-hairline" />
            <span className="hidden sm:inline text-xs font-serif tracking-tight text-ink font-medium">
              Medical Workbench
            </span>
          </Link>
        </div>

        {/* Right: Quantum System Selector + Notification Icon + Account Icon */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quantum Processing System Selector (Clear, human-readable names) */}
          <div className="flex items-center p-0.5 bg-cream-deep/60 rounded-lg border border-hairline text-xs font-sans">
            <button
              type="button"
              onClick={() => handleBackendChange("ibmq_eagle")}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-[11px] font-medium ${quantumBackend === "ibmq_eagle"
                ? "bg-parchment text-ink shadow-2xs border border-hairline/80 font-semibold"
                : "text-ink-soft hover:text-ink"
                }`}
            >
              <Cpu size={12} className={quantumBackend === "ibmq_eagle" ? "text-quantum animate-pulse" : ""} />
              <span className="hidden sm:inline">IBM Quantum (127-Qubit)</span>
              <span className="sm:hidden">IBM Quantum</span>
            </button>
            <button
              type="button"
              onClick={() => handleBackendChange("gpu_simulator")}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-[11px] font-medium ${quantumBackend === "gpu_simulator"
                ? "bg-parchment text-ink shadow-2xs border border-hairline/80 font-semibold"
                : "text-ink-soft hover:text-ink"
                }`}
            >
              <Zap size={12} />
              <span className="hidden sm:inline">Fast GPU Simulator</span>
              <span className="sm:hidden">Simulator</span>
            </button>
          </div>

          {/* Notification Icon (Left of Account) */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setAccountModalOpen(false);
              }}
              aria-label="Notifications"
              title="Notifications"
              className="w-8 h-8 rounded-full bg-cream-deep/60 hover:bg-cream border border-hairline flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer transition-colors relative"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-quantum text-parchment rounded-full text-[9px] font-mono flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-10 w-80 bg-parchment rounded-2xl border border-hairline shadow-xl z-50 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-hairline pb-2">
                      <span className="text-xs font-serif font-medium text-ink">Notifications</span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsAsRead}
                            className="text-[10px] text-quantum hover:underline cursor-pointer font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                        <Link
                          href="/notifications"
                          onClick={() => setNotificationsOpen(false)}
                          className="text-[10px] text-ink hover:underline cursor-pointer font-medium"
                        >
                          View all
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl text-xs space-y-0.5 transition-colors ${n.read ? "bg-cream/40" : "bg-quantum/10 border border-quantum/20"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-ink text-[11px]">{n.title}</span>
                            <span className="text-[9px] text-ink-soft font-mono">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-ink-soft font-light leading-snug">{n.message}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-hairline text-center">
                      <Link
                        href="/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-medium text-quantum hover:underline"
                      >
                        Open Notification Center →
                      </Link>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Account Icon in Header (Routes to /account) */}
          <Link
            href="/account"
            aria-label="User Account Settings"
            title={`Account Settings: ${userName}`}
            className="w-8 h-8 rounded-full bg-ink text-parchment border border-hairline flex items-center justify-center cursor-pointer overflow-hidden shadow-2xs hover:ring-2 hover:ring-quantum/40 transition-all shrink-0"
          >
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User size={14} className="text-parchment" />
            )}
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* BODY WITH FIXED SIDEBAR AND SCROLLABLE CONTENT */}
      {/* ========================================================================= */}
      <div className="flex flex-1 pt-14 relative">
        {/* FIXED DESKTOP SIDEBAR */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 240 : 64 }}
          transition={sidebarTransition}
          className="hidden md:flex flex-col fixed top-14 bottom-0 left-0 bg-parchment/85 backdrop-blur-md border-r border-hairline z-40 p-3 justify-between overflow-hidden"
        >
          {/* Top Nav Sections */}
          <div className="space-y-4 overflow-y-auto no-scrollbar">
            {(() => {
              let itemCounter = 0;
              return NAV_SECTIONS.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.2, delay: sIdx * 0.12, ease: "easeOut" }}
                        className="px-3 py-1"
                      >
                        <span className="text-[9px] font-mono uppercase tracking-wider text-ink-soft font-semibold">
                          {section.title}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    const animDelay = itemCounter++ * 0.05;

                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: animDelay, ease: "easeOut" }}
                      >
                        <Link
                          href={item.href}
                          title={!sidebarOpen ? item.label : undefined}
                          className={`group flex items-center ${sidebarOpen ? "justify-between px-3 py-2" : "justify-center p-2.5"
                            } rounded-xl text-xs font-medium transition-all ${isActive
                              ? "bg-ink text-parchment shadow-xs font-semibold"
                              : "text-ink-soft hover:text-ink hover:bg-cream-deep/50"
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="relative flex items-center justify-center shrink-0">
                              {isActive && (
                                <div className="absolute -inset-[2px] rounded-full overflow-hidden opacity-95">
                                  <div
                                    className="w-full h-full animate-rainbow-spin"
                                    style={{
                                      background:
                                        "conic-gradient(from 0deg, #ff4545, #00ffcc, #0070f3, #7928ca, #ff007a, #ffbb00, #00ffcc, #ff4545)",
                                    }}
                                  />
                                </div>
                              )}
                              <div className={`relative ${isActive ? "w-6 h-6 rounded-full bg-ink flex items-center justify-center z-10" : ""}`}>
                                <Icon
                                  size={isActive ? 13 : 15}
                                  className={isActive ? "text-white" : "text-ink-soft group-hover:text-ink"}
                                />
                              </div>
                            </div>
                            <AnimatePresence>
                              {sidebarOpen && (
                                <motion.span
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -8 }}
                                  transition={{ duration: 0.22, delay: animDelay + 0.05, ease: "easeOut" }}
                                  className="truncate font-medium"
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>

          {/* Bottom Sidebar: Clean borderless Account row + Settings + Red Sign Out row */}
          <div className="space-y-0.5 pt-2 border-t border-hairline">
            {/* Account Row (Unbordered, sleek) */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.32, ease: "easeOut" }}
            >
              <Link
                href="/account"
                title={!sidebarOpen ? `Account: ${userName}` : undefined}
                className={`w-full flex items-center ${sidebarOpen ? "justify-start gap-2.5 px-3 py-2" : "justify-center p-2.5"
                  } rounded-xl text-xs font-medium ${pathname === "/account"
                    ? "bg-ink text-parchment shadow-xs font-semibold"
                    : "text-ink hover:bg-cream-deep/50"
                  } transition-all cursor-pointer`}
              >
                <div className="relative flex items-center justify-center shrink-0">
                  {pathname === "/account" && (
                    <div className="absolute -inset-[2px] rounded-full overflow-hidden opacity-95">
                      <div
                        className="w-full h-full animate-rainbow-spin"
                        style={{
                          background:
                            "conic-gradient(from 0deg, #ff4545, #00ffcc, #0070f3, #7928ca, #ff007a, #ffbb00, #00ffcc, #ff4545)",
                        }}
                      />
                    </div>
                  )}
                  <div className="relative w-6 h-6 rounded-full bg-parchment text-ink flex items-center justify-center font-serif text-[11px] overflow-hidden shrink-0 z-10">
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      userName.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.22, delay: 0.35, ease: "easeOut" }}
                      className="flex flex-col text-left overflow-hidden"
                    >
                      <span
                        className={`text-xs font-semibold leading-tight truncate ${pathname === "/account" ? "text-parchment" : "text-ink"
                          }`}
                      >
                        {userName}
                      </span>
                      <span
                        className={`text-[10px] truncate ${pathname === "/account" ? "text-parchment/75 font-light" : "text-ink-soft"
                          }`}
                      >
                        {userEmail}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>

            {/* Settings Row (In between User and Sign Out) */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.37, ease: "easeOut" }}
            >
              <Link
                href="/settings"
                title={!sidebarOpen ? "Settings" : undefined}
                className={`w-full flex items-center ${sidebarOpen ? "justify-start gap-2.5 px-3 py-2" : "justify-center p-2.5"
                  } rounded-xl text-xs font-medium ${pathname === "/settings"
                    ? "bg-ink text-parchment shadow-xs font-semibold"
                    : "text-ink-soft hover:text-ink hover:bg-cream-deep/50"
                  } transition-all cursor-pointer`}
              >
                <div className="relative flex items-center justify-center shrink-0">
                  {pathname === "/settings" && (
                    <div className="absolute -inset-[2px] rounded-full overflow-hidden opacity-95">
                      <div
                        className="w-full h-full animate-rainbow-spin"
                        style={{
                          background:
                            "conic-gradient(from 0deg, #ff4545, #00ffcc, #0070f3, #7928ca, #ff007a, #ffbb00, #00ffcc, #ff4545)",
                        }}
                      />
                    </div>
                  )}
                  <div className={`relative ${pathname === "/settings" ? "w-6 h-6 rounded-full bg-ink flex items-center justify-center z-10" : ""}`}>
                    <Settings
                      size={pathname === "/settings" ? 13 : 15}
                      className={pathname === "/settings" ? "text-white" : "text-ink-soft shrink-0"}
                    />
                  </div>
                </div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.22, delay: 0.4, ease: "easeOut" }}
                      className={pathname === "/settings" ? "text-parchment font-semibold" : "text-ink"}
                    >
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>

            {/* Red Sign Out Row (Unbordered, clean red text) */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.42, ease: "easeOut" }}
            >
              <button
                type="button"
                onClick={handleLogout}
                title={!sidebarOpen ? "Sign Out" : undefined}
                className={`w-full flex items-center ${sidebarOpen ? "justify-start gap-2.5 px-3 py-2" : "justify-center p-2.5"
                  } rounded-xl text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50/70 transition-all cursor-pointer`}
              >
                <LogOut size={14} className="shrink-0 text-red-600" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.22, delay: 0.45, ease: "easeOut" }}
                      className="font-semibold"
                    >
                      Sign Out
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          </div>
        </motion.aside>

        {/* MOBILE DRAWER SIDEBAR */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-ink/30 backdrop-blur-xs z-40 md:hidden"
              />

              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="fixed top-14 bottom-0 left-0 w-64 bg-parchment border-r border-hairline z-50 p-4 flex flex-col justify-between md:hidden shadow-xl"
              >
                <div className="space-y-4 overflow-y-auto">
                  {NAV_SECTIONS.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <div className="px-3 py-1">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-ink-soft font-semibold">
                          {section.title}
                        </span>
                      </div>

                      {section.items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive
                              ? "bg-ink text-parchment shadow-xs font-semibold"
                              : "text-ink-soft hover:text-ink hover:bg-cream-deep/40"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative flex items-center justify-center shrink-0">
                                {isActive && (
                                  <div className="absolute -inset-[2px] rounded-full overflow-hidden opacity-95">
                                    <div
                                      className="w-full h-full animate-rainbow-spin"
                                      style={{
                                        background:
                                          "conic-gradient(from 0deg, #ff4545, #00ffcc, #0070f3, #7928ca, #ff007a, #ffbb00, #00ffcc, #ff4545)",
                                      }}
                                    />
                                  </div>
                                )}
                                <div className={`relative ${isActive ? "w-6 h-6 rounded-full bg-ink flex items-center justify-center z-10" : ""}`}>
                                  <Icon size={isActive ? 13 : 16} className={isActive ? "text-white" : "text-ink-soft"} />
                                </div>
                              </div>
                              <span>{item.label}</span>
                            </div>
                            {isActive && <ChevronRight size={14} className="text-quantum" />}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Mobile Bottom: Clean Account & Settings & Red Sign Out */}
                <div className="space-y-1 pt-3 border-t border-hairline">
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors ${pathname === "/account"
                      ? "bg-ink text-parchment shadow-xs font-semibold"
                      : "hover:bg-cream-deep/50 text-ink"
                      }`}
                  >
                    <div className="relative flex items-center justify-center shrink-0">
                      {pathname === "/account" && (
                        <div className="absolute -inset-[2px] rounded-full overflow-hidden opacity-95">
                          <div
                            className="w-full h-full animate-rainbow-spin"
                            style={{
                              background:
                                "conic-gradient(from 0deg, #ff4545, #00ffcc, #0070f3, #7928ca, #ff007a, #ffbb00, #00ffcc, #ff4545)",
                            }}
                          />
                        </div>
                      )}
                      <div className="relative w-8 h-8 rounded-full bg-parchment text-ink flex items-center justify-center font-serif text-xs overflow-hidden shrink-0 z-10">
                        {userAvatar ? (
                          <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                          userName.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <span
                        className={`text-xs font-semibold block truncate ${pathname === "/account" ? "text-parchment" : "text-ink"
                          }`}
                      >
                        {userName}
                      </span>
                      <span
                        className={`text-[10px] block truncate ${pathname === "/account" ? "text-parchment/75" : "text-ink-soft"
                          }`}
                      >
                        {userEmail}
                      </span>
                    </div>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${pathname === "/settings"
                      ? "bg-ink text-parchment shadow-xs font-semibold"
                      : "text-ink-soft hover:text-ink hover:bg-cream-deep/40"
                      }`}
                  >
                    <div className="relative flex items-center justify-center shrink-0">
                      {pathname === "/settings" && (
                        <div className="absolute -inset-[2px] rounded-full overflow-hidden opacity-95">
                          <div
                            className="w-full h-full animate-rainbow-spin"
                            style={{
                              background:
                                "conic-gradient(from 0deg, #ff4545, #00ffcc, #0070f3, #7928ca, #ff007a, #ffbb00, #00ffcc, #ff4545)",
                            }}
                          />
                        </div>
                      )}
                      <div className={`relative ${pathname === "/settings" ? "w-6 h-6 rounded-full bg-ink flex items-center justify-center z-10" : ""}`}>
                        <Settings size={pathname === "/settings" ? 13 : 15} />
                      </div>
                    </div>
                    <span>Settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50/70 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span className="font-semibold">Sign Out</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT CANVAS (Smooth margin offset) */}
        <motion.main
          initial={false}
          animate={{ marginLeft: sidebarOpen ? 240 : 64 }}
          transition={sidebarTransition}
          className="flex-1 min-h-[calc(100vh-3.5rem)] px-4 sm:px-6 lg:px-8 py-5 w-full max-md:!ml-0"
        >
          {children}
        </motion.main>
      </div>

      {/* ========================================================================= */}
      {/* ACCOUNT & PHOTO UPLOAD MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {accountModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAccountModalOpen(false)}
              className="fixed inset-0 bg-ink/30 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-parchment rounded-2xl border border-hairline shadow-2xl z-50 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-quantum" />
                  <h3 className="font-serif text-lg font-medium text-ink">User Account</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-cream-deep/60 border border-hairline flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Avatar with Click to Upload Image */}
                <div className="flex items-center gap-4 p-3.5 rounded-xl bg-cream/50 border border-hairline">
                  <div className="relative group">
                    <div className="w-14 h-14 rounded-full bg-ink text-parchment flex items-center justify-center font-serif text-xl font-light shrink-0 overflow-hidden shadow-xs">
                      {userAvatar ? (
                        <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                      ) : (
                        userName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload Profile Picture"
                      className="absolute inset-0 bg-ink/60 rounded-full flex items-center justify-center text-parchment opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera size={16} />
                    </button>
                  </div>

                  <div className="space-y-1 overflow-hidden flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink text-sm block truncate">{userName}</span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] text-quantum font-medium hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Camera size={11} /> Upload Photo
                      </button>
                    </div>
                    <span className="text-ink-soft block truncate">{userEmail}</span>
                    <span className="text-[10px] font-mono text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} /> Active Account
                    </span>
                  </div>
                </div>

                {/* Account Details Form */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-ink-soft">Display Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("quantumx_user_name", e.target.value);
                      }
                    }}
                    placeholder="Enter your name"
                    className="w-full h-9 px-3 rounded-lg bg-parchment border border-hairline text-xs text-ink focus:outline-none focus:border-quantum font-sans shadow-2xs"
                  />
                </div>

                <div className="p-3 rounded-xl bg-cream-deep/30 border border-hairline space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Processing Mode:</span>
                    <span className="text-quantum font-semibold">
                      {quantumBackend === "ibmq_eagle" ? "IBM Quantum Cloud" : "GPU Simulator"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Access Status:</span>
                    <span className="text-emerald-700 font-semibold">Ready for Screening</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-hairline flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut size={13} /> Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-ink text-parchment text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Save &amp; Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating AI Clinical Assistant Chatbot */}
      <QuantumChatbot />
    </div>
  );
}
