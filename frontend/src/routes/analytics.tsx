import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TrafficArea, DeviceBars, SourcesPie } from "@/components/charts/Charts";
import { StatCard } from "@/components/StatCard";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceAnalytics, WorkspaceAnalytics } from "@/lib/api";
import React from "react";
import {
  Link2, MousePointerClick, Users, Activity, QrCode, Globe, TrendingUp,
  RefreshCw, ExternalLink, Tag
} from "lucide-react";

export const Route = createFileRoute("/analytics")({
  beforeLoad: () => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({ meta: [{ title: "Analytics — NexLink Console" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data, isLoading, isError, error, isFetching, refetch, dataUpdatedAt } = useQuery<WorkspaceAnalytics>({
    queryKey: ["workspaceAnalytics"],
    queryFn: getWorkspaceAnalytics,
    retry: 2,
    staleTime: 30_000,          // 30 seconds
    refetchInterval: 60_000,    // auto-refresh every 60s
    refetchOnWindowFocus: true,
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  if (isLoading) {
    return (
      <AppShell title="Analytics" subtitle="Loading deep traffic insights...">
        <div className="flex h-64 items-center justify-center flex-col gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Aggregating workspace data…</p>
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Analytics" subtitle="Unable to fetch analytics data">
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center space-y-3">
          <p className="text-sm text-destructive font-medium">Failed to load analytics dashboard</p>
          <p className="text-xs text-muted-foreground">{error?.message || "Check network connectivity or backend status"}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary/20 hover:bg-primary/30 px-4 py-2 text-xs font-medium transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </AppShell>
    );
  }

  const metrics = data?.metrics || {
    totalLinks: 0, totalClicks: 0, uniqueVisitors: 0,
    activeLinks: 0, qrDownloads: 0, countriesReached: 0, weeklyGrowth: 0
  };

  const charts = data?.charts || {
    trafficData: [], sourcesData: [], devicesData: [],
    browsersData: [], countriesData: [], heatmapData: [], activity: [], linksList: []
  };

  return (
    <AppShell title="Analytics" subtitle="Deep traffic insights across your workspace">
      {/* Refresh bar */}
      <div className="mb-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {lastUpdated && <>Last updated: <span className="text-foreground/70">{lastUpdated}</span></>}
        </span>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        <StatCard label="Total Links" value={metrics.totalLinks} icon={Link2} />
        <StatCard label="Total Clicks" value={metrics.totalClicks} icon={MousePointerClick} delta={metrics.weeklyGrowth} />
        <StatCard label="Unique Visitors" value={metrics.uniqueVisitors} icon={Users} />
        <StatCard label="Active Links" value={metrics.activeLinks} icon={Activity} />
        <StatCard label="QR Downloads" value={metrics.qrDownloads} icon={QrCode} />
        <StatCard label="Countries Reached" value={metrics.countriesReached} icon={Globe} />
        <StatCard label="Weekly Growth" value={metrics.weeklyGrowth} icon={TrendingUp} suffix="%" delta={metrics.weeklyGrowth} />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card title="Traffic trend" subtitle="Last 30 days — clicks vs unique visitors" className="lg:col-span-2">
          {charts.trafficData.length > 0
            ? <TrafficArea data={charts.trafficData} />
            : <EmptyChart label="No traffic recorded yet" />}
        </Card>
        <Card title="Traffic Sources">
          {charts.sourcesData.some(s => s.value > 0)
            ? <SourcesPie data={charts.sourcesData} />
            : <EmptyChart label="No source data yet" />}
        </Card>
      </div>

      {/* Devices + Browsers + Geography */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card title="Devices">
          {charts.devicesData.some(d => d.value > 0)
            ? <DeviceBars data={charts.devicesData} />
            : <EmptyChart label="No device data yet" />}
        </Card>
        <Card title="Browsers">
          {charts.browsersData.some(b => b.value > 0)
            ? <DeviceBars data={charts.browsersData} />
            : <EmptyChart label="No browser data yet" />}
        </Card>
        <Card title="Top Countries">
          <ul className="space-y-2 text-sm mt-1">
            {charts.countriesData.map((c) => (
              <li key={c.code} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="grid h-6 w-8 shrink-0 place-items-center rounded bg-accent/60 text-[10px] font-mono">{c.code}</span>
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="text-muted-foreground tabular-nums shrink-0">{c.visits.toLocaleString()}</span>
              </li>
            ))}
            {charts.countriesData.length === 0 && (
              <li className="text-center py-4 text-muted-foreground text-xs">No location data yet.</li>
            )}
          </ul>
        </Card>
      </div>

      {/* Heatmap */}
      <div className="mb-6 rounded-xl glass p-5 ring-soft">
        <div className="text-sm font-semibold mb-1">Activity heatmap</div>
        <div className="text-xs text-muted-foreground mb-3">Click distribution by day & hour</div>
        <Heatmap data={charts.heatmapData} />
      </div>

      {/* Bottom: Activity feed + Top links */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent activity */}
        <Card title="Recent Activity">
          {charts.activity.length > 0 ? (
            <ul className="space-y-3 text-sm mt-1">
              {charts.activity.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-2 min-w-0">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-[9px] text-primary font-semibold uppercase">
                      {a.who?.[0] || "?"}
                    </span>
                    <span className="truncate text-muted-foreground">
                      <span className="text-foreground font-medium">{a.who}</span>{" "}
                      {a.what}{" "}
                      <code className="font-mono text-[11px] text-neon">{a.target}</code>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground/60">{a.when}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyChart label="No recent activity" />
          )}
        </Card>

        {/* Top performing links */}
        <Card title="Top Performing Links">
          {charts.linksList.length > 0 ? (
            <div className="overflow-x-auto mt-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-white/5">
                    <th className="text-left pb-2 font-medium">Slug</th>
                    <th className="text-right pb-2 font-medium">Clicks</th>
                    <th className="text-right pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {charts.linksList.map((l) => (
                    <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                          <code className="text-neon font-mono">/{l.slug}</code>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {l.tag && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 mt-0.5">
                            <Tag className="h-2.5 w-2.5" />
                            {l.tag}
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">{l.clicks.toLocaleString()}</td>
                      <td className="py-2 text-right">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          l.status === "active"
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive"
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyChart label="No links created yet" />
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function Card({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl glass p-5 ring-soft ${className}`}>
      <div className="text-sm font-semibold">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground mb-2">{subtitle}</div>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-32 items-center justify-center text-xs text-muted-foreground/60">
      {label}
    </div>
  );
}

function Heatmap({ data }: { data: { day: string; hours: number[] }[] }) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  let maxCount = 1;
  data.forEach(d => {
    d.hours.forEach(h => {
      if (h > maxCount) maxCount = h;
    });
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[60px_repeat(24,minmax(20px,1fr))] gap-1 text-[10px] text-muted-foreground">
          <div />
          {Array.from({length:24}).map((_,h) => <div key={h} className="text-center">{h}</div>)}
          {days.map((d) => {
            const dayRow = data.find(r => r.day === d) || { day: d, hours: Array(24).fill(0) };
            return (
              <React.Fragment key={d}>
                <div className="flex items-center">{d}</div>
                {dayRow.hours.map((val, h) => {
                  const a = val > 0 ? 0.15 + (val / maxCount) * 0.75 : 0.05;
                  return (
                    <div
                      key={`${d}-${h}`}
                      className="aspect-square rounded-sm transition-all hover:scale-110"
                      title={`${val} clicks — ${d} ${h}:00`}
                      style={{ background: `color-mix(in oklab, var(--neon) ${Math.round(a*100)}%, transparent)` }}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
