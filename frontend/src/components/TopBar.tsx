import { Bell, Search, Plus, Command, HelpCircle, LogOut, Settings as SettingsIcon, User, X, CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Welcome to NexLink SaaS! Customize your workspace in Settings.", time: "Just now", read: false },
    { id: 2, text: "Real-time click intelligence is active and monitoring.", time: "1 hour ago", read: false },
    { id: 3, text: "System check completed: all services are running at peak performance.", time: "2 hours ago", read: false },
  ]);

  const notificationsRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getMe,
    retry: 1,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-global-search"));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/60 px-4 lg:px-8 backdrop-blur-xl">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Workspace</div>
        <h1 className="text-sm font-semibold leading-tight truncate">{title}</h1>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
      </div>
      <div className="flex-1" />

      {/* Interactive Search Trigger */}
      <button
        onClick={handleOpenSearch}
        className="hidden md:flex items-center gap-2 glass rounded-lg px-3 py-1.5 w-80 text-left text-muted-foreground hover:text-foreground hover:bg-accent/40 transition cursor-pointer"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-sm">Search links, bookmarks, tags...</span>
        <kbd className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground inline-flex items-center gap-1">
          <Command className="h-3 w-3" /> K
        </kbd>
      </button>



      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-help-center"))}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
        title="Help & FAQ Center"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {/* Notifications Button & Dropdown */}
      <div className="relative" ref={notificationsRef}>
        <button
          onClick={() => {
            setIsNotificationsOpen(!isNotificationsOpen);
            setHasNewNotifications(false);
          }}
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {hasNewNotifications && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-neon pulse-glow" />
          )}
        </button>

        <AnimatePresence>
          {isNotificationsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 rounded-xl bg-popover/95 border border-border/80 p-3 ring-soft z-50 text-sm shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                <div className="font-semibold text-xs text-foreground">Notifications</div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setNotifications(notifications.map(n => ({ ...n, read: true })));
                    setHasNewNotifications(false);
                  }}
                  className="text-[10px] text-neon hover:underline cursor-pointer font-medium"
                >
                  Mark all as read
                </button>
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-0.5 font-normal">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: !item.read } : item));
                    }}
                    className={`p-2.5 rounded-lg text-xs leading-normal border transition flex gap-2.5 items-start cursor-pointer select-none ${
                      n.read 
                        ? "bg-muted/10 text-foreground/75 border-border/20 hover:bg-muted/20 hover:border-border/40" 
                        : "bg-accent/20 text-foreground border-border/60 font-semibold hover:bg-accent/30 hover:border-neon/40"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 transition-colors">
                      {n.read ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-neon" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="break-words">{n.text}</p>
                      <span className="text-[9px] text-muted-foreground/80 block mt-1">{n.time}</span>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    No new notifications.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link
        to="/links"
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-neon px-3.5 py-2 text-sm font-medium text-primary-foreground glow-primary transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> New Link
      </Link>

      {/* User Profile / Logout Dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex items-center gap-2 rounded-full glass hover:bg-accent/40 border border-border/60 pl-3 pr-2 py-1 text-xs font-semibold text-foreground transition-all cursor-pointer select-none active:scale-98 apple-spring"
        >
          <span className="max-w-[80px] truncate text-muted-foreground">
            {user?.name?.split(" ")[0] || "Account"}
          </span>
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-neon-2 to-primary flex items-center justify-center font-bold text-[10px] text-white">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/85 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 rounded-xl bg-popover/95 border border-border/80 p-1.5 ring-soft z-50 text-sm shadow-2xl backdrop-blur-xl"
            >
              <div className="px-3 py-2 border-b border-border/60">
                <div className="font-semibold truncate">{user?.name || "User Account"}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email || ""}</div>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent text-left transition"
                >
                  <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-destructive/15 text-destructive text-left transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </header>
  );
}
