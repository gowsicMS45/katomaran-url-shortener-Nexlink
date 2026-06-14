import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const grid = "oklch(1 0 0 / 6%)";
const muted = "oklch(0.68 0.02 260)";

const tooltipStyle: React.CSSProperties = {
  background: "oklch(0.19 0.02 265)",
  border: "1px solid oklch(1 0 0 / 10%)",
  borderRadius: 10,
  fontSize: 12,
  color: "white",
  padding: "8px 10px",
};

export function TrafficArea({ data }: { data: { d: string; clicks: number; uniq: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gClicks" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.18 255)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="oklch(0.72 0.18 255)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gUniq" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="d" stroke={muted} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={muted} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "oklch(1 0 0 / 10%)" }} />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="oklch(0.72 0.18 255)"
          strokeWidth={2}
          fill="url(#gClicks)"
          isAnimationActive={true}
          animationDuration={1500}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="uniq"
          stroke="oklch(0.78 0.18 200)"
          strokeWidth={2}
          fill="url(#gUniq)"
          isAnimationActive={true}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DeviceBars({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={grid} horizontal={false} />
        <XAxis type="number" stroke={muted} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" stroke={muted} fontSize={11} tickLine={false} axisLine={false} width={70} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
        <Bar
          dataKey="value"
          fill="oklch(0.72 0.22 310)"
          radius={[0, 6, 6, 0]}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["oklch(0.72 0.18 255)", "oklch(0.78 0.18 200)", "oklch(0.72 0.22 310)", "oklch(0.75 0.17 155)", "oklch(0.82 0.16 80)"];

export function SourcesPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          stroke="none"
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        >
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
