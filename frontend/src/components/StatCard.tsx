import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const handleMouseMoveGlow = (e: React.MouseEvent<HTMLElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
};

export function StatCard({
  label, value, delta, icon: Icon, suffix = "",
}: { label: string; value: number; delta?: number; icon: LucideIcon; suffix?: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [value, mv]);

  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onMouseMove={handleMouseMoveGlow}
      className="relative overflow-hidden rounded-xl glass p-5 ring-soft hover-glow-spotlight"
    >
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-neon/10 blur-2xl" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <motion.span className="text-3xl font-semibold tracking-tight">{rounded}</motion.span>
            {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
          </div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/60 text-neon">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {delta !== undefined && (
        <div className={`mt-4 inline-flex items-center gap-1 text-xs ${positive ? "text-success" : "text-destructive"}`}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta)}% vs last week
        </div>
      )}
    </motion.div>
  );
}
