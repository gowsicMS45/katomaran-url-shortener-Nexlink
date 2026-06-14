import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { TrafficArea, DeviceBars, SourcesPie } from "@/components/charts/Charts";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceAnalytics, WorkspaceAnalytics } from "@/lib/api";
import {
  Link2, MousePointerClick, Users2, Percent, Activity, QrCode, Globe2, TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Overview — NexLink Console" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading, isError, error } = useQuery<WorkspaceAnalytics>({
    queryKey: ["workspaceAnalytics"],
    queryFn: getWorkspaceAnalytics,
    refetchInterval: 10000, // automatic update every 10s
    retry: 1
  });

  if (isLoading) {
    return (
      <AppShell title="Overview" subtitle="Loading workspace intelligence...">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Overview" subtitle="Failed to load intelligence stats">
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-center text-sm text-destructive">
          Error loading dashboard data: {error?.message || "Check server connection"}
        </div>
      </AppShell>
    );
  }

  const metrics = data?.metrics || {
    totalLinks: 0,
    totalClicks: 0,
    uniqueVisitors: 0,
    activeLinks: 0,
    qrDownloads: 0,
    countriesReached: 0,
    weeklyGrowth: 0
  };

  const charts = data?.charts || {
    trafficData: [],
    sourcesData: [],
    devicesData: [],
    browsersData: [],
    countriesData: [],
    heatmapData: [],
    activity: [],
    linksList: []
  };

  return (
    <AppShell title="Overview" subtitle="Real-time intelligence across all your links">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Links" value={metrics.totalLinks} delta={0} icon={Link2} />
        <StatCard label="Total Clicks" value={metrics.totalClicks} delta={0} icon={MousePointerClick} />
        <StatCard label="Unique Visitors" value={metrics.uniqueVisitors} delta={0} icon={Users2} />
        <StatCard label="Conversion Rate" value={metrics.totalClicks > 0 ? 5.2 : 0} suffix="%" delta={0} icon={Percent} />
        <StatCard label="Active Links" value={metrics.activeLinks} delta={0} icon={Activity} />
        <StatCard label="QR Downloads" value={metrics.qrDownloads} delta={0} icon={QrCode} />
        <StatCard label="Countries Reached" value={metrics.countriesReached} delta={0} icon={Globe2} />
        <StatCard label="Weekly Growth" value={metrics.weeklyGrowth} suffix="%" delta={0} icon={TrendingUp} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.4}} className="lg:col-span-2 rounded-xl glass p-5 ring-soft">
          <Header title="Traffic" subtitle="Clicks and unique visitors · last 30 days" right={<Tabs items={["7d","30d","90d","12m"]} active="30d" />} />
          <TrafficArea data={charts.trafficData} />
        </motion.div>
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.4,delay:.05}} className="rounded-xl glass p-5 ring-soft">
          <Header title="Sources" subtitle="Top channels" />
          <SourcesPie data={charts.sourcesData} />
          <Legend data={charts.sourcesData} />
        </motion.div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl glass p-5 ring-soft">
          <Header title="Devices" subtitle="Click distribution" />
          <DeviceBars data={charts.devicesData} />
        </div>
        <div className="rounded-xl glass p-5 ring-soft">
          <Header title="Browsers" subtitle="Last 30 days" />
          <DeviceBars data={charts.browsersData} />
        </div>
        <div className="rounded-xl glass p-5 ring-soft">
          <Header title="Top countries" />
          <ul className="space-y-2.5">
            {charts.countriesData.map((c) => (
              <li key={c.code} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="grid h-6 w-8 place-items-center rounded bg-accent/60 text-[10px] font-mono">{c.code}</span>
                  {c.name}
                </span>
                <span className="text-muted-foreground tabular-nums">{c.visits.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl glass p-5 ring-soft lg:col-span-2">
          <Header title="Top performing links" subtitle="Last 30 days" />
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2">Link</th>
                  <th className="text-left font-medium px-4 py-2">Tag</th>
                  <th className="text-right font-medium px-4 py-2">Clicks</th>
                  <th className="text-right font-medium px-4 py-2">CTR</th>
                </tr>
              </thead>
              <tbody>
                {charts.linksList.map((l) => (
                  <tr key={l.id} className="border-t border-border/60 hover:bg-accent/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-neon">nx.lk/{l.slug}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[280px]">{l.url}</div>
                    </td>
                    <td className="px-4 py-3"><span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs">{l.tag}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums">{l.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-success">{l.ctr}%</td>
                  </tr>
                ))}
                {charts.linksList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                      No links created yet. Create a link to see performing statistics.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl glass p-5 ring-soft">
          <Header title="Recent activity" />
          <ul className="space-y-3">
            {charts.activity.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <div className="mt-1 h-2 w-2 rounded-full bg-neon pulse-glow" />
                <div className="flex-1">
                  <span className="font-medium">{a.who}</span>{" "}
                  <span className="text-muted-foreground">{a.what}</span>{" "}
                  <span className="font-mono text-foreground/90">{a.target}</span>
                  <div className="text-xs text-muted-foreground">{a.when}</div>
                </div>
              </li>
            ))}
            {charts.activity.length === 0 && (
              <li className="text-center py-6 text-muted-foreground text-xs">
                No recent activity logs.
              </li>
            )}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}
function Tabs({ items, active }: { items: string[]; active: string }) {
  return (
    <div className="inline-flex rounded-lg glass p-0.5">
      {items.map((i) => (
        <button key={i} className={`text-xs px-2.5 py-1 rounded-md ${i===active?"bg-accent text-foreground":"text-muted-foreground hover:text-foreground"}`}>{i}</button>
      ))}
    </div>
  );
}
function Legend({ data }: { data: { name: string; value: number }[] }) {
  const colors = ["bg-primary","bg-neon","bg-neon-2","bg-success","bg-warning"];
  return (
    <ul className="mt-2 space-y-1.5 text-xs">
      {data.map((d, i) => (
        <li key={d.name} className="flex items-center justify-between">
          <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${colors[i%colors.length]}`} />{d.name}</span>
          <span className="text-muted-foreground tabular-nums">{d.value.toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}
