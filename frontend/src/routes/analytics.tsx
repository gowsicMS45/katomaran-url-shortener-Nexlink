import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TrafficArea, DeviceBars, SourcesPie } from "@/components/charts/Charts";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceAnalytics, WorkspaceAnalytics } from "@/lib/api";
import React from "react";

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
  const { data, isLoading, isError, error } = useQuery<WorkspaceAnalytics>({
    queryKey: ["workspaceAnalytics"],
    queryFn: getWorkspaceAnalytics,
    retry: 1
  });

  if (isLoading) {
    return (
      <AppShell title="Analytics" subtitle="Loading deep traffic insights...">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Analytics" subtitle="Unable to fetch analytics data">
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-center text-sm text-destructive">
          Error loading analytics dashboard: {error?.message || "Check network connectivity"}
        </div>
      </AppShell>
    );
  }

  const charts = data?.charts || {
    trafficData: [],
    sourcesData: [],
    devicesData: [],
    browsersData: [],
    countriesData: [],
    heatmapData: []
  };

  return (
    <AppShell title="Analytics" subtitle="Deep traffic insights across your workspace">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Traffic trend" subtitle="Last 30 days" className="lg:col-span-2">
          <TrafficArea data={charts.trafficData}/>
        </Card>
        <Card title="Sources">
          <SourcesPie data={charts.sourcesData}/>
        </Card>
        <Card title="Devices">
          <DeviceBars data={charts.devicesData}/>
        </Card>
        <Card title="Browsers">
          <DeviceBars data={charts.browsersData}/>
        </Card>
        <Card title="Geography">
          <ul className="space-y-2 text-sm">
            {charts.countriesData.map((c) => (
              <li key={c.code} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="grid h-6 w-8 place-items-center rounded bg-accent/60 text-[10px] font-mono">{c.code}</span>
                  {c.name}
                </span>
                <span className="text-muted-foreground tabular-nums">{c.visits.toLocaleString()}</span>
              </li>
            ))}
            {charts.countriesData.length === 0 && (
              <li className="text-center py-4 text-muted-foreground text-xs">
                No location data registered.
              </li>
            )}
          </ul>
        </Card>
      </div>

      <div className="mt-6 rounded-xl glass p-5 ring-soft">
        <div className="text-sm font-semibold mb-3">Activity heatmap · click distribution by hour</div>
        <Heatmap data={charts.heatmapData} />
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

function Heatmap({ data }: { data: { day: string; hours: number[] }[] }) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  // Find maximum click count across all hour cells to normalize colors
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
                  // Calculate opacity based on relative weight
                  const a = val > 0 ? 0.15 + (val / maxCount) * 0.75 : 0.05;
                  return (
                    <div
                      key={`${d}-${h}`}
                      className="aspect-square rounded-sm transition-all"
                      title={`${val} clicks at ${d} ${h}:00`}
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
