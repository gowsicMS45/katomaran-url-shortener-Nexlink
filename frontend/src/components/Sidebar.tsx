import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Link2, BarChart3, QrCode, Users, Code2,
  Settings, Webhook, Bookmark, Shield, Activity, Sparkles, KeyRound,
  Home
} from "lucide-react";
import { Logo } from "./Logo";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";

const nav = [
  {
    label: "Navigation",
    items: [
      { to: "/", label: "Main Home Page", icon: Home },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { to: "/links", label: "Links", icon: Link2 },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/qr", label: "QR Codes", icon: QrCode },
      { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getMe,
    retry: 1,
  });

  const workspaceName = user?.preferences?.workspaceName || "Acme Inc.";
  const planName = user?.preferences?.plan || "Pro";

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-background/30 backdrop-blur-xl relative z-20">
      <div className="flex h-16 items-center px-5 border-b border-border/60">
        <Logo to="/" />
      </div>

      <div className="px-3 py-3 border-b border-border/60">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-global-search"))}
          className="w-full liquid-glass hover:liquid-glass-hover rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-2 cursor-pointer apple-spring"
        >
          <Sparkles className="h-4 w-4 text-neon" />
          <span className="flex-1">Quick search…</span>
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-5">
        {nav.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{group.label}</div>
            <ul className="space-y-0.5">
              {group.items.map((it) => {
                const active = pathname === it.to || (it.to !== "/dashboard" && it.to !== "/" && pathname.startsWith(it.to));
                const Icon = it.icon;
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm border border-transparent apple-spring select-none
                        ${active ? "bg-accent/60 text-foreground border-border/30 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/20"}`}
                    >
                      {active && <span className="absolute left-0 top-1.5 h-5 w-0.5 rounded-r bg-gradient-to-b from-primary to-neon" />}
                      <Icon className={`h-4 w-4 ${active ? "text-neon" : ""}`} />
                      <span>{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-xl liquid-glass p-3 relative overflow-hidden group">
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-neon-2 shrink-0 animate-pulse" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate text-foreground">{workspaceName}</div>
            <div className="text-xs text-muted-foreground truncate">{planName} · Active</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
